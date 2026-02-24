import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ForecastDashboard from './components/ForecastDashboard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Existing dashboard state (keep whatever you already had)
  const [dashboardData, setDashboardData] = useState(null);

  // 🔮 Forecast State
  const [teamForecast, setTeamForecast] = useState(null);
  const [topSignals, setTopSignals] = useState([]);

  const fetchAllData = async () => {
    try {
      const [
        dashboardRes,
        forecastRes,
        signalsRes
      ] = await Promise.all([
        fetch(`${API_URL}/api/dashboard`),
        fetch(`${API_URL}/api/team/forecast`),
        fetch(`${API_URL}/api/team/top-signals`)
      ]);

      if (dashboardRes.ok) {
        const dashData = await dashboardRes.json();
        setDashboardData(dashData);
      }

      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        setTeamForecast(forecastData);
      }

      if (signalsRes.ok) {
        const signalsData = await signalsRes.json();
        setTopSignals(signalsData);
      }

    } catch (error) {
      console.error('Data fetch error:', error);
    }
  };

  useEffect(() => {
    fetchAllData();

    // 🔁 Real-time refresh every 60 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'forecast':
        return (
          <ForecastDashboard
            forecast={teamForecast}
            signals={topSignals}
          />
        );

      case 'dashboard':
      default:
        return (
          <Dashboard data={dashboardData} />
        );
    }
  };

  return (
    <div style={{ padding: '2rem' }}>

      {/* NAVIGATION */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{ marginRight: '1rem' }}
        >
          Dashboard
        </button>

        <button
          onClick={() => setActiveTab('forecast')}
        >
          Forecast
        </button>
      </div>

      {/* CONTENT */}
      {renderContent()}

    </div>
  );
}

export default App;