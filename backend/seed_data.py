import os
import sys
import django
import dj_database_url
from django.conf import settings

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "axon_backend.settings")
django.setup()

from django.db import connections
from api.models import Brand, MobileModel

indian_touch_mobile_history = {
    "Samsung": [
        # Early Touch & Feature Touch (2008 - 2012)
        "Star 3G", "Corby TXT", "Corby Touch", "Wave S8500 (Bada OS)", "Galaxy Pop", "Galaxy Y", "Galaxy Ace",
        # Early Flagships & Note Series
        "Galaxy S (GT-I9000)", "Galaxy S II", "Galaxy S3", "Galaxy S4", "Galaxy S5", "Galaxy S6", "Galaxy S6 Edge",
        "Galaxy S7", "Galaxy S7 Edge", "Galaxy S8", "Galaxy S8+", "Galaxy S9", "Galaxy S9+", "Galaxy S10", "Galaxy S10+",
        "Galaxy Note", "Galaxy Note II", "Galaxy Note 3", "Galaxy Note 4", "Galaxy Note 5", "Galaxy Note 8", "Galaxy Note 9",
        "Galaxy Note 10", "Galaxy Note 20 Ultra",
        # Mega-popular India Budget Series (J & On Series)
        "Galaxy J2", "Galaxy J5", "Galaxy J7", "Galaxy J7 Prime", "Galaxy On7", "Galaxy On8",
        # 5G & Recent Era (S20 to S24)
        "Galaxy S20 FE 5G", "Galaxy S21 Ultra", "Galaxy S21 FE", "Galaxy S22 Ultra", "Galaxy S23 Ultra", "Galaxy S24 Ultra",
        "Galaxy S24+", "Galaxy S24", 
        # Foldables
        "Galaxy Fold (1st Gen)", "Galaxy Z Fold 3", "Galaxy Z Fold 4", "Galaxy Z Fold 5", "Galaxy Z Fold 6",
        "Galaxy Z Flip 3", "Galaxy Z Flip 4", "Galaxy Z Flip 5", "Galaxy Z Flip 6",
        # Mid-range (A, M & F Series)
        "Galaxy A50", "Galaxy A51", "Galaxy A52s 5G", "Galaxy A53 5G", "Galaxy A54 5G", "Galaxy A55 5G",
        "Galaxy M31", "Galaxy M51", "Galaxy M34 5G", "Galaxy M55 5G", "Galaxy F15 5G", "Galaxy F55 5G",
        # Projected 2025/2026 Generation
        "Galaxy S25 Ultra", "Galaxy S25+", "Galaxy S25", "Galaxy Z Fold 7", "Galaxy Z Flip 7"
    ],
    "Apple": [
        # Legacy Models (India Releases)
        "iPhone 3G", "iPhone 3GS", "iPhone 4", "iPhone 4S", "iPhone 5", "iPhone 5C", "iPhone 5S",
        # Thin-Bezel & Home Button Era
        "iPhone 6", "iPhone 6 Plus", "iPhone 6S", "iPhone 6S Plus", "iPhone 7", "iPhone 7 Plus", "iPhone 8", "iPhone 8 Plus",
        # Notch & FaceID Era
        "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
        # 5G Era
        "iPhone 12 Mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
        "iPhone 13 Mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
        "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
        "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
        "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
        # Budget/Special Editions
        "iPhone SE (1st Gen)", "iPhone SE (2020)", "iPhone SE (3rd Gen)",
        # Projected 2025/2026 Generation
        "iPhone SE (4th Gen)", "iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max", "iPhone 17 Slim/Air"
    ],
    "Nokia": [
        # Early Touchscreen Symbian & Meego
        "Nokia 5800 XpressMusic", "Nokia 5230", "Nokia N97", "Nokia N9", "Nokia C6",
        # Windows Phone Era (Lumia)
        "Lumia 510", "Lumia 520", "Lumia 620", "Lumia 720", "Lumia 820", "Lumia 920", "Lumia 1020", "Lumia 1520", "Lumia 535", "Lumia 640 XL",
        # Android Era (HMD Global)
        "Nokia 6", "Nokia 5", "Nokia 3", "Nokia 8", "Nokia 7 Plus", "Nokia 8.1", "Nokia 9 PureView",
        "Nokia G11", "Nokia G21", "Nokia G42 5G", "Nokia XR20", "Nokia C32"
    ],
    "Xiaomi": [
        # Early India Entrants
        "Mi 3", "Mi 4", "Mi 4i", "Mi 5", "Redmi 1S", "Redmi 2", "Redmi Note 3G", "Redmi Note 4G",
        # The Bestsellers (4G Era)
        "Redmi Note 3", "Redmi Note 4", "Redmi Note 5 Pro", "Redmi Note 6 Pro", "Redmi Note 7 Pro",
        "Redmi Note 8 Pro", "Redmi Note 9 Pro Max", "Redmi Note 10 Pro Max", "Redmi Note 11 Pro+",
        # 5G & Premium Series
        "Xiaomi 11 Lite NE 5G", "Xiaomi 12 Pro", "Xiaomi 13 Pro", "Xiaomi 14 Ultra", "Xiaomi 14", "Xiaomi 14 Civi",
        "Redmi Note 12 Pro+", "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi 13 5G", "Redmi 13C 5G",
        # Projected 2025/2026 Generation
        "Xiaomi 15 Ultra", "Xiaomi 15", "Redmi Note 14 Pro+", "Redmi Note 14 Pro", "Redmi Note 15 Series"
    ],
    "OnePlus": [
        # The Flagship Killers
        "OnePlus One", "OnePlus 2", "OnePlus X", "OnePlus 3", "OnePlus 3T", "OnePlus 5", "OnePlus 5T",
        # Premium Evolution
        "OnePlus 6", "OnePlus 6T", "OnePlus 7", "OnePlus 7 Pro", "OnePlus 7T", "OnePlus 7T Pro",
        "OnePlus 8", "OnePlus 8 Pro", "OnePlus 8T", "OnePlus 9", "OnePlus 9 Pro", "OnePlus 9R", "OnePlus 9RT",
        "OnePlus 10 Pro", "OnePlus 10R", "OnePlus 10T", "OnePlus 11 5G", "OnePlus 11R 5G", "OnePlus 12", "OnePlus 12R",
        # Foldables & Nord Series
        "OnePlus Open", "OnePlus Nord", "OnePlus Nord 2", "OnePlus Nord 2T", "OnePlus Nord CE 3", "OnePlus Nord 4", "OnePlus Nord CE4",
        # Projected 2025/2026 Generation
        "OnePlus 13", "OnePlus 13R", "OnePlus Nord 5", "OnePlus Open 2"
    ],
    "Micromax": [
        # Early Indian Touchscreen Pioneers (Feature & Android)
        "X450 Van Gogh", "Canvas 2 A110", "Canvas HD A116", "Canvas 4", "Canvas Knight", "Canvas Gold", "Canvas Fire",
        # Android One Collaborations
        "Canvas A1",
        # Sub-brand
        "Yu Yureka", "Yu Yuphoria", "Yu Yutopia",
        # Comeback Attempt (In Series)
        "In Note 1", "In 1b", "In Note 2", "In 2c"
    ],
    "HTC": [
        # Early Windows Mobile Touch & Android Pioneers
        "Touch Diamond", "Touch Pro", "HTC Hero", "Desire", "Desire HD", "Wildfire", "Sensation",
        # One Series Era
        "One X", "One M7", "One M8", "One M9+", "HTC 10", "U11", "U11+", "U12+"
    ],
    "Sony": [
        # Sony Ericsson Touch Era
        "Xperia X10", "Xperia Arc", "Xperia Play", "Xperia Active",
        # Sony Xperia Z Era (Waterproof pioneers in India)
        "Xperia S", "Xperia Z", "Xperia Z1", "Xperia Z2", "Xperia Z3", "Xperia Z5 Premium", "Xperia XZ Premium", "Xperia XZ3"
    ],
    "LG": [
        # Early Touch
        "Cookie KP500", "Optimus One", "Optimus 2X (First dual-core)", "Optimus G",
        # Flagship G & V Series
        "LG G2", "LG G3", "LG G4", "LG G5", "LG G6", "LG G7 ThinQ", "LG G8X ThinQ (Dual Screen)",
        "LG V20", "LG V30+", "LG V40 ThinQ", "LG Wing", "LG Velvet"
    ],
    "Motorola": [
        # Classic Touch & Early Android
        "Milestone", "Defy", "Razr XT910",
        # Google-Owned Era (The massive Moto G reboot in India)
        "Moto G (1st Gen)", "Moto G (2nd Gen)", "Moto G (3rd Gen)", "Moto X (1st Gen)", "Moto X Play", "Moto E (1st Gen)",
        # Moto Mods Era
        "Moto Z", "Moto Z Play", "Moto Z2 Play",
        # Modern Edge & Foldable Era
        "Motorola Edge 20 Pro", "Motorola Edge 30 Ultra", "Motorola Edge 40", "Motorola Edge 50 Pro", "Motorola Edge 50 Ultra",
        "Razr 40 Ultra", "Razr 50 Ultra", "Moto G64 5G", "Moto G85 5G",
        # Projected 2025/2026 Generation
        "Motorola Edge 60 Series", "Razr 60 Ultra"
    ],
    "Realme": [
        # Early Series
        "Realme 1", "Realme 2 Pro", "Realme 3 Pro", "Realme 5 Pro", "Realme 6 Pro", "Realme 7 Pro", "Realme 8 Pro",
        # X & GT Series
        "Realme X", "Realme X2 Pro", "Realme X7 Pro", "Realme GT Neo 2", "Realme GT 2 Pro", "Realme GT 6", "Realme GT 6T",
        # Mid-range and Budget
        "Realme 11 Pro+", "Realme 12 Pro+", "Realme 13 Pro+", "Realme Narzo 30", "Realme Narzo 70 Pro", "Realme C55", "Realme C65",
        # Projected 2025/2026 Generation
        "Realme 14 Pro+", "Realme 15 Pro+", "Realme GT 7 Pro"
    ],
    "Vivo": [
        # Early Slim Phones
        "Vivo X5Max", "Vivo V1", "Vivo V3", "Vivo V5", "Vivo V7+", "Vivo V9", "Vivo V15 Pro",
        # X Series & V Series
        "Vivo X21 (First In-display fingerprint in India)", "Vivo Nex", "Vivo X50 Pro", "Vivo X70 Pro+", "Vivo X80 Pro",
        "Vivo X90 Pro", "Vivo X100 Pro", "Vivo X Fold 3 Pro",
        "Vivo V20", "Vivo V23 Pro", "Vivo V27 Pro", "Vivo V29 Pro", "Vivo V30 Pro", "Vivo V40 Pro",
        # T Series & Y Series
        "Vivo T1 5G", "Vivo T2 Pro", "Vivo T3 Ultra", "Vivo Y200", "Vivo Y28",
        # Projected 2025/2026 Generation
        "Vivo X110 Pro", "Vivo V50 Pro", "Vivo X Fold 4 Pro"
    ],
    "Oppo": [
        # Legacy & Camera-focused
        "Oppo N1 (Rotating Camera)", "Oppo Find 7", "Oppo F1 Plus", "Oppo F3 Plus", "Oppo F5", "Oppo F7", "Oppo F9 Pro",
        # Reno & Find Series
        "Oppo Find X (Motorized Camera)", "Oppo Reno 10x Zoom", "Oppo Reno 3 Pro", "Oppo Reno 5 Pro", "Oppo Reno 8 Pro",
        "Oppo Reno 10 Pro+", "Oppo Reno 11 Pro", "Oppo Reno 12 Pro", "Oppo Find N2 Flip",
        # Budget K & A Series
        "Oppo K10 5G", "Oppo A78 5G", "Oppo F25 Pro 5G", "Oppo F27 Pro+ 5G",
        # Projected 2025/2026 Generation
        "Oppo Reno 13 Pro", "Oppo Reno 14 Pro", "Oppo Find N4 Flip"
    ],
    "Lava": [
        # Early Touch & Iris Series
        "Iris N350", "Iris 504q", "Iris Pro 30", "Lava Pixel V1 (Android One)", "Lava Z60", "Lava Z90",
        # Re-entry and Modern Portfolios
        "Lava Agni 5G", "Lava Agni 2 5G", "Lava Agni 3", "Lava Blaze 5G", "Lava Blaze Curve 5G",
        "Lava Yuva 3 Pro", "Lava Storm 5G",
        # Projected 2025/2026 Generation
        "Lava Agni 4", "Lava Blaze 4 Curve"
    ],
    "Google": [
        # Nexus Era (Manufactured with HTC/Samsung/LG/Huawei but sold in India)
        "Nexus One", "Nexus S", "Galaxy Nexus", "Nexus 4", "Nexus 5", "Nexus 6", "Nexus 5X", "Nexus 6P",
        # Pixel Era
        "Pixel (1st Gen)", "Pixel XL", "Pixel 2", "Pixel 2 XL", "Pixel 3", "Pixel 3 XL", "Pixel 3a XL",
        "Pixel 4a", "Pixel 6a", "Pixel 7", "Pixel 7 Pro", "Pixel 7a", "Pixel 8", "Pixel 8 Pro", "Pixel 8a",
        "Pixel 9", "Pixel 9 Pro", "Pixel 9 Pro XL", "Pixel 9 Pro Fold",
        # Projected 2025/2026 Generation
        "Pixel 9a", "Pixel 10", "Pixel 10 Pro", "Pixel 10 Pro XL"
    ]
}

def seed_db(db_name, db_url):
    print(f"Seeding {db_name}...")
    db_config = dj_database_url.parse(db_url)
    if db_config.get('ENGINE') == 'django.db.backends.sqlite3':
        db_name_file = db_config.get('NAME')
        if db_name_file and not os.path.isabs(db_name_file):
            from pathlib import Path
            base_dir = Path(__file__).resolve().parent
            db_config['NAME'] = str(base_dir / db_name_file)
    
    settings.DATABASES['default'] = db_config
    connections['default'].close()
    
    from django.db import transaction
    try:
        with transaction.atomic():
            for brand_name, models in indian_touch_mobile_history.items():
                brand, created = Brand.objects.get_or_create(name=brand_name)
                if created:
                    print(f"Created Brand: {brand_name}")
                for model_name in models:
                    obj, m_created = MobileModel.objects.get_or_create(brand=brand, model_name=model_name)
                    if m_created:
                        print(f"  Created Model: {model_name}")
        print(f"Successfully seeded {db_name}!\n")
    except Exception as e:
        print(f"Error seeding {db_name}: {e}")

if __name__ == "__main__":
    # 1. Local Database URL
    local_db_url = None
    if os.path.exists(".env"):
        with open(".env") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    local_db_url = line.strip().split("=", 1)[1]
    if not local_db_url:
        local_db_url = "sqlite:///db.sqlite3"
    
    # seed_db("Local Database", local_db_url)
    
    # 2. Production Database URL
    prod_db_url = None
    if os.path.exists(".env.production"):
        with open(".env.production") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    prod_db_url = line.strip().split("=", 1)[1]
    
    if prod_db_url:
        seed_db("Production Database", prod_db_url)
    else:
        print("Warning: DATABASE_URL not found in .env.production, skipping production seeding.")
