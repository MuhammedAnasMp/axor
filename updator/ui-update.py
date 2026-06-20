import os
import sys
import json
import subprocess
from pathlib import Path

def get_current_version(updator_dir):
    package_json_path = updator_dir.parent / 'frontend' / 'package.json'
    if not package_json_path.exists():
        print("Error: frontend/package.json not found.")
        sys.exit(1)
    with open(package_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('version')

def main():
    updator_dir = Path(__file__).resolve().parent
    version = get_current_version(updator_dir)
    
    # Process arguments
    args = sys.argv[1:]
    remove_mode = False
    if '--remove' in args:
        remove_mode = True
        args.remove('--remove')
        
    # Locate virtual environment python
    python_cmd = 'python'
    venv_python = updator_dir.parent / 'backend' / 'venv' / 'Scripts' / 'python.exe'
    if venv_python.exists():
        python_cmd = str(venv_python)
        
    if remove_mode:
        print(f"Removing OTA version {version} from databases...")
        
        # Local
        local_cmd = [python_cmd, str(updator_dir / 'remove_ota.py'), version]
        subprocess.run(local_cmd)
        
        # Production
        prod_cmd = [python_cmd, str(updator_dir / 'remove_ota.py'), version, '--prod']
        subprocess.run(prod_cmd)
        
    else:
        print(f"Releasing OTA version {version} to everyone (Production and Local)...")
        
        # Local
        local_cmd = [python_cmd, str(updator_dir / 'approve_ota.py'), version]
        subprocess.run(local_cmd)
        
        # Production
        prod_cmd = [python_cmd, str(updator_dir / 'approve_ota.py'), version, '--prod']
        subprocess.run(prod_cmd)

if __name__ == '__main__':
    main()
