import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def main():
    # Process custom arguments
    args = sys.argv[1:]
    is_prod = False
    
    if '--prod' in args:
        is_prod = True
        args.remove('--prod')
    if '--production' in args:
        is_prod = True
        args.remove('--production')
        
    if len(args) < 1:
        print("Usage: python remove_ota.py <version> [--prod]")
        sys.exit(1)
        
    version = args[0]
    
    # Set up Django environment and sys.path
    base_dir = Path(__file__).resolve().parent
    backend_dir = base_dir.parent / 'backend'
    sys.path.append(str(backend_dir))
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'axon_backend.settings')
    
    if is_prod:
        load_dotenv(backend_dir / '.env.production', override=True)
        print("Connecting to PRODUCTION Neon database...")
    else:
        load_dotenv(backend_dir / '.env', override=True)
        print("Connecting to LOCAL database...")
        
    import django
    django.setup()
    
    from api.models import OTAUpdateBundle
    
    try:
        bundle = OTAUpdateBundle.objects.get(version=version)
        if bundle.zip_file:
            try:
                bundle.zip_file.delete(save=False)
            except Exception as e:
                print(f"Warning: Could not delete file: {e}")
        bundle.delete()
        print(f"Success! Removed OTA Update Bundle v{version} from database.")
    except OTAUpdateBundle.DoesNotExist:
        print(f"OTA Update Bundle v{version} not found in database.")

if __name__ == "__main__":
    main()
