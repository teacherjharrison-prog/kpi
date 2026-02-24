#!/usr/bin/env python3
import os
from pathlib import Path
import json

def scan_directory(start_path="."):
    """Quick scan of your project structure"""
    
    structure = {
        "python_files": [],
        "js_files": [],
        "json_files": [],
        "env_files": [],
        "duplicate_names": {},
        "suspicious": []
    }
    
    seen_names = {}
    
    for root, dirs, files in os.walk(start_path):
        # Skip node_modules and venvs
        dirs[:] = [d for d in dirs if d not in ["node_modules", "venv", "__pycache__", ".git", "build"]]
        
        level = root.replace(start_path, "").count(os.sep)
        indent = " " * 2 * level
        
        print(f"{indent}📁 {os.path.basename(root)}/")
        
        for file in files:
            filepath = os.path.join(root, file)
            print(f"{indent}  📄 {file}")
            
            # Track by extension
            if file.endswith(".py"):
                structure["python_files"].append(filepath)
            elif file.endswith((".js", ".jsx")):
                structure["js_files"].append(filepath)
            elif file == "package.json":
                structure["json_files"].append(filepath)
            elif ".env" in file:
                structure["env_files"].append(filepath)
            
            # Check for duplicates
            if file in seen_names:
                if file not in structure["duplicate_names"]:
                    structure["duplicate_names"][file] = [seen_names[file]]
                structure["duplicate_names"][file].append(filepath)
            else:
                seen_names[file] = filepath
    
    # Check for common issues
    if structure["duplicate_names"]:
        print("\n⚠️  DUPLICATE FILES FOUND:")
        for name, paths in structure["duplicate_names"].items():
            print(f"\n  {name} appears in:")
            for p in paths:
                print(f"    - {p}")
    
    # Check for multiple package.json (indicates nested projects)
    if len(structure["json_files"]) > 1:
        print(f"\n⚠️  MULTIPLE package.json found ({len(structure['json_files'])}):")
        for p in structure["json_files"]:
            print(f"    - {p}")
    
    # Check for server.py vs main.py
    py_basenames = [os.path.basename(p) for p in structure["python_files"]]
    if "server.py" in py_basenames and "main.py" in py_basenames:
        print("\n⚠️  BOTH server.py and main.py exist - need to consolidate")
    
    # Save report
    with open("structure_report.json", "w") as f:
        json.dump(structure, f, indent=2)
    
    print(f"\n📊 Report saved to structure_report.json")
    return structure

if __name__ == "__main__":
    scan_directory()