import os
import sys
import django
import hashlib

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'axon_backend.settings')
django.setup()

from api.models import OTAUpdateBundle
from django.core.files import File

def main():
    if len(sys.argv) < 3:
        print("Usage: python register_ota.py <version> <path_to_zip> [native_version_required]")
        sys.exit(1)
        
    version = sys.argv[1]
    zip_path = sys.argv[2]
    native_version = sys.argv[3] if len(sys.argv) > 3 else "1.0.0"
    
    if not os.path.exists(zip_path):
        print(f"Error: Zip file not found at {zip_path}")
        sys.exit(1)
        
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
                # This deletes the file from disk
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
            is_mandatory=False,
            release_notes=f"Automated release for version {version}"
        )
        bundle.save()
        
    print(f"Successfully registered OTA Update Bundle v{version} (Native Req: >=v{native_version})")
    print(f"Checksum: {checksum}")

if __name__ == "__main__":
    main()
