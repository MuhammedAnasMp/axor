import os
import sys

def main():
    # Process custom arguments
    args = sys.argv[1:]
    is_prod = False
    is_testing = True
    
    if '--prod' in args:
        is_prod = True
        args.remove('--prod')
    if '--production' in args:
        is_prod = True
        args.remove('--production')
    if '--active' in args:
        is_testing = False
        args.remove('--active')

    if len(args) < 2:
        print("Usage: python register_ota.py <version> <path_to_zip> [native_version_required] [--prod] [--active]")
        print("Options:")
        print("  --prod     Upload and register in the PRODUCTION database")
        print("  --active   Make the update immediately active for all users (bypasses testing mode)")
        sys.exit(1)
        
    version = args[0]
    zip_path = args[1]
    native_version = args[2] if len(args) > 2 else "1.0.0"
    
    if not os.path.exists(zip_path):
        print(f"Error: Zip file not found at {zip_path}")
        sys.exit(1)
        
    # Set up Django environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'axon_backend.settings')
    
    if is_prod:
        from pathlib import Path
        from dotenv import load_dotenv
        base_dir = Path(__file__).resolve().parent
        load_dotenv(base_dir / '.env.production', override=True)
        print("🔌 Connecting to PRODUCTION Neon database...")
    else:
        print("🔌 Connecting to LOCAL database...")

    import django
    django.setup()
    
    from api.models import OTAUpdateBundle
    from django.core.files import File
    import hashlib
    
    # Calculate checksum of the new zip file
    sha256 = hashlib.sha256()
    with open(zip_path, 'rb') as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            sha256.update(chunk)
    checksum = sha256.hexdigest()
    
    # Check if a bundle with this version already exists
    existing_bundle = OTAUpdateBundle.objects.filter(version=version).first()
    if existing_bundle:
        print(f"Removing existing update bundle for version {version}...")
        if existing_bundle.zip_file:
            try:
                existing_bundle.zip_file.delete(save=False)
            except Exception as e:
                print(f"Warning: Could not delete old file from disk: {e}")
        existing_bundle.delete()
        
    # Open and register the new zip file
    with open(zip_path, 'rb') as f:
        django_file = File(f, name=f"update_v{version}.zip")
        bundle = OTAUpdateBundle(
            version=version,
            native_version_required=native_version,
            zip_file=django_file,
            checksum=checksum,
            is_active=True,
            is_testing=is_testing,
            release_notes=f"Release version {version} (Testing: {is_testing})"
        )
        bundle.save()
        
    mode = "TESTING ONLY" if is_testing else "ALL USERS"
    print(f"🎉 Successfully registered OTA Update Bundle v{version} (Native Req: >=v{native_version})")
    print(f"Mode: {mode}")
    print(f"Checksum: {checksum}")

if __name__ == "__main__":
    main()
