import os
import json

def scan_directory(start_path="."):
    structure = {
        "python_files": [],
        "json_files": [],
        "env_files": [],
        "duplicate_names": {},
    }
    
    seen_names = {}
    
    for root, dirs, files in os.walk(start_path):
        # Skip these folders
        skip_dirs = ["node_modules", "venv", "__pycache__", ".git", "build", ".emergent", "memory"]
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            filepath = os.path.join(root, file)
            
            if file.endswith(".py"):
                structure["python_files"].append(filepath)
            elif file == "package.json":
                structure["json_files"].append(filepath)
            elif ".env" in file:
                structure["env_files"].append(filepath)
            
            # Track duplicates
            if file in seen_names:
                if file not in structure["duplicate_names"]:
                    structure["duplicate_names"][file] = [seen_names[file]]
                structure["duplicate_names"][file].append(filepath)
            else:
                seen_names[file] = filepath
    
    print("=" * 50)
    print("PROJECT SCAN RESULTS")
    print("=" * 50)
    
    print(f"\nPython files: {len(structure['python_files'])}")
    for f in structure["python_files"]:
        print(f"  {f}")
    
    print(f"\npackage.json files: {len(structure['json_files'])}")
    for f in structure["json_files"]:
        print(f"  {f}")
    
    if structure["duplicate_names"]:
        print(f"\n*** DUPLICATES FOUND ***")
        for name, paths in structure["duplicate_names"].items():
            print(f"\n{name}:")
            for p in paths:
                print(f"  {p}")
    
    # Save report
    with open("structure_report.json", "w") as f:
        json.dump(structure, f, indent=2)
    print(f"\nReport saved!")

if __name__ == "__main__":
    scan_directory()