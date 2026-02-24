import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field
import jwt
from passlib.context import CryptContext
from pathlib import Path

# Import your forecasting engine
from forecasting import calculate_period_window  # add other forecast imports as needed


# =============================================================================
# ENV + CONFIG
# =============================================================================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "kpi_tracker")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecret")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

if not MONGO_URL:
    raise ValueError("MONGO_URL not set")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


# =============================================================================
# PLAN + FEATURE STRUCTURE
# =============================================================================

PLAN_HIERARCHY = {"free": 0, "pro": 1, "group": 2}

FEATURES = {
    "advanced_analytics": "group",
    "forecasting": "group",
    "export_data": "pro",
}


def require_feature(feature_key: str):
    async def dependency(user=Depends(get_current_user)):
        required_plan = FEATURES.get(feature_key)

        if not required_plan:
            raise HTTPException(status_code=400, detail="Feature not defined")

        if PLAN_HIERARCHY[user["plan"]] < PLAN_HIERARCHY[required_plan]:
            raise HTTPException(
                status_code=403,
                detail="Upgrade required for this feature"
            )

        return user

    return dependency


# =============================================================================
# AUTH MODELS
# =============================================================================

class UserCreate(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


# =============================================================================
# AUTH HELPERS
# =============================================================================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user

    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# =============================================================================
# AUTH ROUTES
# =============================================================================

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = pwd_context.hash(user.password)

    new_user = {
        "_id": user.email,
        "email": user.email,
        "password": hashed,
        "plan": "free",
        "created_at": datetime.utcnow(),
    }

    await db.users.insert_one(new_user)

    token = create_access_token({"sub": user.email})
    return {"access_token": token}


@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return {"access_token": token}


# =============================================================================
# DASHBOARD ROUTE
# =============================================================================

@api_router.get("/dashboard")
async def get_dashboard(user=Depends(get_current_user)):
    entries = await db.entries.find({"user_id": user["_id"]}).to_list(None)

    total_calls = sum(e.get("calls_received", 0) for e in entries)

    return {
        "calls": total_calls,
        "entries": len(entries),
    }


# =============================================================================
# FORECAST ROUTES
# =============================================================================

@api_router.get("/team/forecast")
async def team_forecast(
    user=Depends(require_feature("forecasting"))
):
    entries = await db.entries.find({"user_id": user["_id"]}).to_list(None)

    # Example stub – replace with real forecast logic
    period_window = calculate_period_window(
        entries,
        "2024-01-01",
        "2024-01-14"
    )

    return {
        "team_current_reservations": 100,
        "team_projected_reservations": 150,
        "team_gap": 10,
        "percent_of_goal": 85,
        "required_daily_rate": 12,
        "confidence": "medium",
        "days_remaining": period_window.days_remaining,
    }


@api_router.get("/team/top-signals")
async def top_signals(
    user=Depends(require_feature("forecasting"))
):
    return [
        {
            "user_id": "rep_1",
            "projected_reservations": 45,
            "gap": -10,
            "trend": "down",
            "risk_level": "red",
            "risk_score": 82,
        }
    ]


# =============================================================================
# ENTRY CREATION (MULTI-TENANT SAFE)
# =============================================================================

class EntryCreate(BaseModel):
    calls_received: int = 0


@api_router.post("/entries")
async def create_entry(
    entry: EntryCreate,
    user=Depends(get_current_user)
):
    doc = {
        "user_id": user["_id"],
        "calls_received": entry.calls_received,
        "created_at": datetime.utcnow(),
    }

    await db.entries.insert_one(doc)
    return {"status": "created"}


# =============================================================================
# REGISTER ROUTER
# =============================================================================

app.include_router(api_router)