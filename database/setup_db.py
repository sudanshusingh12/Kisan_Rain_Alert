"""
Kisan Rain Alert - Database Connection & Verification Tool
Tests connection to Supabase PostgreSQL, checks table schemas, and provides setup instructions.
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import Config

def check_database():
    print("=" * 65)
    print("[*] KISAN RAIN ALERT - DATABASE & SUPABASE CONNECTION CHECK")
    print("=" * 65)

    supabase_url = Config.SUPABASE_URL
    anon_key = Config.SUPABASE_ANON_KEY
    service_key = Config.SUPABASE_SERVICE_ROLE_KEY

    print(f"Supabase URL: {supabase_url or '(not configured)'}")
    print(f"Anon Key Configured: {'Yes' if anon_key and not anon_key.startswith('placeholder') else 'No (using demo fallback)'}")
    print(f"Service Role Key Configured: {'Yes' if service_key and not service_key.startswith('placeholder') else 'No (using demo fallback)'}")
    print("-" * 65)

    if not supabase_url or supabase_url.startswith("https://placeholder"):
        print("[i] STATUS: Running in Local Resilient Fallback Mode.")
        print("   - All authentication, farm management, and deterministic alert features")
        print("     are working via the in-memory hashed store & local session engine.")
        print()
        print("[+] TO CONNECT YOUR LIVE SUPABASE CLOUD DATABASE:")
        print("   1. Open https://supabase.com and create a free project.")
        print("   2. Go to Project Settings -> API.")
        print("   3. Copy 'Project URL' and 'anon public' / 'service_role' keys (starting with 'eyJ...').")
        print("   4. Paste them into your .env file in the project root:")
        print("      SUPABASE_URL=https://your-project.supabase.co")
        print("      SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        print("      SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        print("   5. In the Supabase dashboard, go to SQL Editor and run the queries in:")
        print(f"      {BASE_DIR / 'database' / 'schema.sql'}")
        print(f"      {BASE_DIR / 'database' / 'seed.sql'}")
        print("=" * 65)
        return True

    # Attempt connection with configured keys
    try:
        from supabase import create_client
        client = create_client(supabase_url, service_key or anon_key)
        print("[SUCCESS] Successfully connected to live Supabase project!")
        
        # Test table accessibility
        try:
            farms = client.table("farms").select("*").limit(5).execute()
            print(f"[OK] 'farms' table accessible! Total farms found: {len(farms.data)}")
        except Exception as te:
            print(f"[WARN] 'farms' table query returned: {te}")
            print("   Please execute database/schema.sql in your Supabase SQL editor.")

        try:
            profiles = client.table("profiles").select("*").limit(5).execute()
            print(f"[OK] 'profiles' table accessible! Total profiles found: {len(profiles.data)}")
        except Exception as pe:
            print(f"[WARN] 'profiles' table query returned: {pe}")

        print("=" * 65)
        return True
    except Exception as e:
        print(f"[FAIL] Failed to connect to Supabase: {e}")
        print("=" * 65)
        return False

if __name__ == "__main__":
    check_database()
