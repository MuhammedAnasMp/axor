import os
import sys

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
        print("Usage: python approve_ota.py <version> [--prod]")
        print("Options:")
        print("  --prod    Approve the version on the PRODUCTION database")
        sys.exit(1)
        
    version = args[0]
    
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
    
    try:
        bundle = OTAUpdateBundle.objects.get(version=version)
        bundle.is_testing = False
        bundle.is_active = True
        bundle.save()
        print(f"🎉 Success! OTA Update Bundle v{version} is now approved and visible to all users.")
    except OTAUpdateBundle.DoesNotExist:
        print(f"❌ Error: OTA Update Bundle v{version} not found in database.")
        sys.exit(1)

if __name__ == "__main__":
    main()
