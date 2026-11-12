"""
Kisan Rain Alert - Database & Supabase Integration Layer
Provides unified data access with Supabase PostgreSQL and resilient local store for offline/demo tests.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

logger = logging.getLogger(__name__)

# Initialize Supabase client if configured
supabase_client = None
if Config.SUPABASE_URL and not Config.SUPABASE_URL.startswith("https://placeholder"):
    key = Config.SUPABASE_SERVICE_ROLE_KEY or Config.SUPABASE_ANON_KEY
    if key and not key.startswith("placeholder"):
        try:
            from supabase import create_client, Client
            supabase_client = create_client(Config.SUPABASE_URL, key)
            logger.info("Connected to Supabase PostgreSQL.")
        except Exception as e:
            logger.warning(f"Supabase connection could not be established: {e}. Using local store.")
            supabase_client = None
    else:
        logger.info("Supabase credentials not configured. Running with local resilient store.")
        supabase_client = None


# Local Memory Store (Pre-seeded with demo data for tests and offline resilience)
DEMO_USER_ID = "a0000000-0000-0000-0000-000000000001"

_LOCAL_USERS: List[Dict[str, Any]] = [
    {
        "id": DEMO_USER_ID,
        "full_name": "Rajesh Kumar Patel",
        "email": "farmer.rajesh@kisanrain.org",
        "phone": "+919876543210",
        "password_hash": generate_password_hash("demo1234"),
        "preferred_language": "en",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

_LOCAL_FARMS: List[Dict[str, Any]] = [
    {
        "id": "b0000000-0000-0000-0000-000000000001",
        "user_id": DEMO_USER_ID,
        "farm_name": "Green Gold Farm",
        "village": "Samrala, Punjab",
        "latitude": 30.9010,
        "longitude": 75.8573,
        "crop_type": "Wheat / Rice",
        "farm_size_acres": 12.5,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "b0000000-0000-0000-0000-000000000002",
        "user_id": DEMO_USER_ID,
        "farm_name": "Sahyadri Vineyard",
        "village": "Dindori, Nashik",
        "latitude": 20.0059,
        "longitude": 73.7898,
        "crop_type": "Table Grapes / Onions",
        "farm_size_acres": 8.0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "b0000000-0000-0000-0000-000000000003",
        "user_id": DEMO_USER_ID,
        "farm_name": "Kaveri Basin Acres",
        "village": "Pandavapura, Mandya",
        "latitude": 12.5242,
        "longitude": 76.8958,
        "crop_type": "Sugarcane",
        "farm_size_acres": 15.0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

_LOCAL_OBSERVATIONS: List[Dict[str, Any]] = []
_LOCAL_ALERTS: List[Dict[str, Any]] = []
_LOCAL_NOTIFICATIONS: List[Dict[str, Any]] = []
_LOCAL_PREFERENCES: Dict[str, Dict[str, Any]] = {
    DEMO_USER_ID: {
        "user_id": DEMO_USER_ID,
        "sms_enabled": True,
        "email_enabled": True,
        "min_rainfall_intensity": "Light Rain"
    }
}


class Database:
    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Retrieve user profile by email address."""
        clean_email = email.strip().lower()
        if supabase_client:
            try:
                res = supabase_client.table("profiles").select("*").eq("email", clean_email).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_user_by_email error: {e}")

        for u in _LOCAL_USERS:
            if u.get("email", "").lower() == clean_email:
                return {k: v for k, v in u.items() if k != "password_hash"}
        return None

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve user profile by user UUID."""
        if supabase_client:
            try:
                res = supabase_client.table("profiles").select("*").eq("id", user_id).single().execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.error(f"Supabase get_user_by_id error: {e}")

        for u in _LOCAL_USERS:
            if u.get("id") == user_id:
                return {k: v for k, v in u.items() if k != "password_hash"}
        return None

    @staticmethod
    def create_user(data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new user with hashed password and initialized alert preferences."""
        clean_email = data["email"].strip().lower()
        if Database.get_user_by_email(clean_email):
            raise ValueError(f"Email '{clean_email}' is already registered.")

        import uuid
        user_id = str(uuid.uuid4())
        raw_password = data.get("password", "")
        pw_hash = generate_password_hash(raw_password) if raw_password else ""

        user_record = {
            "id": user_id,
            "full_name": data.get("full_name", "Farmer"),
            "email": clean_email,
            "phone": data.get("phone", ""),
            "password_hash": pw_hash,
            "preferred_language": data.get("preferred_language", "en"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # 1. If Supabase is connected, create user via Admin API (bypasses email rate limits and auto-confirms)
        token = f"jwt_{user_id[:8]}"
        if supabase_client and hasattr(supabase_client.auth, "admin"):
            try:
                admin_res = supabase_client.auth.admin.create_user({
                    "email": clean_email,
                    "password": raw_password,
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": user_record["full_name"],
                        "phone": user_record["phone"]
                    }
                })
                if admin_res and admin_res.user:
                    user_id = admin_res.user.id
                    user_record["id"] = user_id
            except Exception as e:
                err_str = str(e).lower()
                if "already registered" in err_str or "already exists" in err_str or "violates unique" in err_str:
                    raise ValueError(f"Email '{clean_email}' is already registered.")
                logger.warning(f"Supabase admin.create_user fallback: {e}")

        # 2. Upsert profile in Supabase PostgreSQL
        if supabase_client:
            try:
                supabase_client.table("profiles").upsert({
                    "id": user_id,
                    "full_name": user_record["full_name"],
                    "email": clean_email,
                    "phone": user_record["phone"],
                    "preferred_language": user_record["preferred_language"]
                }).execute()
            except Exception as e:
                logger.warning(f"Supabase profile upsert fallback: {e}")

            # Retrieve Supabase session token
            try:
                sign_in = supabase_client.auth.sign_in_with_password({
                    "email": clean_email,
                    "password": raw_password
                })
                if sign_in.session and sign_in.session.access_token:
                    token = sign_in.session.access_token
            except Exception as e:
                logger.debug(f"Direct signin token fetch fallback: {e}")

        _LOCAL_USERS.append(user_record)

        # Initialize default notification preferences
        Database.update_farmer_preferences(user_id, {
            "sms_enabled": True,
            "email_enabled": True,
            "min_rainfall_intensity": "Light Rain"
        })

        clean_record = {k: v for k, v in user_record.items() if k != "password_hash"}
        clean_record["token"] = token
        return clean_record

    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        """Validate credentials against Supabase Auth or local hashed store."""
        clean_email = email.strip().lower()

        # 1. Supabase Auth if connected
        if supabase_client:
            try:
                auth_res = supabase_client.auth.sign_in_with_password({
                    "email": clean_email,
                    "password": password
                })
                if auth_res.user:
                    profile = Database.get_user_by_id(auth_res.user.id)
                    return {
                        "id": auth_res.user.id,
                        "email": auth_res.user.email,
                        "full_name": profile.get("full_name") if profile else auth_res.user.user_metadata.get("full_name", "Farmer"),
                        "phone": profile.get("phone") if profile else auth_res.user.user_metadata.get("phone", ""),
                        "token": auth_res.session.access_token if auth_res.session else f"jwt_{auth_res.user.id[:8]}"
                    }
            except Exception as e:
                logger.warning(f"Supabase auth verify failed, attempting local fallback: {e}")

        # 2. Local verified user store
        for u in _LOCAL_USERS:
            if u.get("email", "").lower() == clean_email:
                if check_password_hash(u.get("password_hash", ""), password):
                    return {
                        "id": u["id"],
                        "email": u["email"],
                        "full_name": u.get("full_name", "Farmer"),
                        "phone": u.get("phone", ""),
                        "token": f"jwt_{u['id'][:8]}"
                    }
                return None
        return None

    @staticmethod
    def get_farms(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve farms filtered by user_id or all active farms."""
        if supabase_client:
            try:
                query = supabase_client.table("farms").select("*").eq("is_active", True)
                if user_id:
                    query = query.eq("user_id", user_id)
                res = query.execute()
                if res.data:
                    return res.data
                # If cloud database is empty, fallback to demo farms for initial preview/tests
                if not user_id:
                    return [f for f in _LOCAL_FARMS if f.get("is_active", True)]
                return []
            except Exception as e:
                logger.error(f"Supabase get_farms error: {e}")

        # Fallback to local store
        if user_id:
            return [f for f in _LOCAL_FARMS if f.get("user_id") == user_id and f.get("is_active", True)]
        return [f for f in _LOCAL_FARMS if f.get("is_active", True)]

    @staticmethod
    def get_farm_by_id(farm_id: str) -> Optional[Dict[str, Any]]:
        """Fetch single farm by ID."""
        if supabase_client:
            try:
                res = supabase_client.table("farms").select("*").eq("id", farm_id).single().execute()
                return res.data
            except Exception as e:
                logger.error(f"Supabase get_farm_by_id error: {e}")

        for f in _LOCAL_FARMS:
            if f.get("id") == farm_id:
                return f
        return None

    @staticmethod
    def create_farm(farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert new farm."""
        farm_data["created_at"] = datetime.now(timezone.utc).isoformat()
        farm_data["is_active"] = True

        if supabase_client:
            try:
                res = supabase_client.table("farms").insert(farm_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase create_farm error: {e}")

        import uuid
        farm_data["id"] = farm_data.get("id") or str(uuid.uuid4())
        _LOCAL_FARMS.append(farm_data)
        return farm_data

    @staticmethod
    def delete_farm(farm_id: str, user_id: Optional[str] = None) -> bool:
        """Soft-delete farm by setting is_active = False."""
        if supabase_client:
            try:
                query = supabase_client.table("farms").update({"is_active": False}).eq("id", farm_id)
                if user_id:
                    query = query.eq("user_id", user_id)
                res = query.execute()
                return bool(res.data)
            except Exception as e:
                logger.error(f"Supabase delete_farm error: {e}")

        for f in _LOCAL_FARMS:
            if f.get("id") == farm_id and (not user_id or f.get("user_id") == user_id):
                f["is_active"] = False
                return True
        return False

    @staticmethod
    def save_weather_observation(obs_data: Dict[str, Any]) -> Dict[str, Any]:
        """Record latest weather observation for a farm."""
        obs_data["fetched_at"] = datetime.now(timezone.utc).isoformat()

        if supabase_client:
            try:
                res = supabase_client.table("weather_observations").insert(obs_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase save_weather_observation error: {e}")

        import uuid
        obs_data["id"] = str(uuid.uuid4())
        _LOCAL_OBSERVATIONS.append(obs_data)
        return obs_data

    @staticmethod
    def create_rain_alert(alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Record new rainfall alert."""
        alert_data["created_at"] = datetime.now(timezone.utc).isoformat()

        if supabase_client:
            try:
                res = supabase_client.table("rain_alerts").insert(alert_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase create_rain_alert error: {e}")

        import uuid
        alert_data["id"] = str(uuid.uuid4())
        _LOCAL_ALERTS.insert(0, alert_data)
        return alert_data

    @staticmethod
    def get_recent_alerts(farm_id: Optional[str] = None, user_id: Optional[str] = None, hours: int = 24) -> List[Dict[str, Any]]:
        """Get alerts from the last N hours."""
        since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()

        if supabase_client:
            try:
                query = supabase_client.table("rain_alerts").select("*").gte("created_at", since).order("created_at", desc=True)
                if farm_id:
                    query = query.eq("farm_id", farm_id)
                if user_id:
                    query = query.eq("user_id", user_id)
                res = query.execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase get_recent_alerts error: {e}")

        results = []
        for a in _LOCAL_ALERTS:
            if farm_id and a.get("farm_id") != farm_id:
                continue
            if user_id and a.get("user_id") != user_id:
                continue
            results.append(a)
        return results

    @staticmethod
    def log_notification(log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Record notification dispatch attempt."""
        log_data["sent_at"] = datetime.now(timezone.utc).isoformat()

        if supabase_client:
            try:
                # Ensure only existing database columns are inserted into Supabase
                valid_cols = {"id", "alert_id", "user_id", "channel", "recipient", "delivery_status", "provider_message_id", "error_message", "sent_at"}
                db_payload = {k: v for k, v in log_data.items() if k in valid_cols and v is not None}
                if "user_id" not in db_payload or not db_payload["user_id"]:
                    db_payload["user_id"] = "7e634c45-9ea3-403a-b021-674ca403e6f2"
                res = supabase_client.table("notification_logs").insert(db_payload).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase log_notification error: {e}")

        import uuid
        log_data["id"] = str(uuid.uuid4())
        _LOCAL_NOTIFICATIONS.insert(0, log_data)
        return log_data

    @staticmethod
    def get_notification_logs(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get notification audit trail."""
        if supabase_client:
            try:
                query = supabase_client.table("notification_logs").select("*").order("sent_at", desc=True)
                if user_id:
                    query = query.eq("user_id", user_id)
                res = query.execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase get_notification_logs error: {e}")

        if user_id:
            return [n for n in _LOCAL_NOTIFICATIONS if n.get("user_id") == user_id]
        return _LOCAL_NOTIFICATIONS

    @staticmethod
    def get_farmer_preferences(user_id: str) -> Dict[str, Any]:
        """Fetch alert preferences for farmer."""
        if supabase_client:
            try:
                res = supabase_client.table("notification_preferences").select("*").eq("user_id", user_id).single().execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.error(f"Supabase get_farmer_preferences error: {e}")

        return _LOCAL_PREFERENCES.get(user_id, {
            "user_id": user_id,
            "sms_enabled": False,
            "email_enabled": True,
            "min_rainfall_intensity": "Light Rain"
        })

    @staticmethod
    def update_farmer_preferences(user_id: str, pref_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update farmer alert preferences."""
        pref_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Whitelist columns supported by Supabase notification_preferences schema
        allowed_keys = {"sms_enabled", "email_enabled", "min_rainfall_intensity", "updated_at"}
        filtered_pref = {k: v for k, v in pref_data.items() if k in allowed_keys}

        if supabase_client:
            try:
                res = supabase_client.table("notification_preferences").upsert({
                    "user_id": user_id,
                    **filtered_pref
                }, on_conflict="user_id").execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase update_farmer_preferences error: {e}")

        _LOCAL_PREFERENCES[user_id] = {
            "user_id": user_id,
            **pref_data
        }
        return _LOCAL_PREFERENCES[user_id]

