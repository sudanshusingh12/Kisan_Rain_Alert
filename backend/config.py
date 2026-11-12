"""
Kisan Rain Alert - Backend Configuration
Handles environment variables, threshold constants, and service credentials.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Config:
    # Flask settings
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"
    SECRET_KEY = os.getenv("SECRET_KEY", "kisan_rain_alert_dev_key_2026")

    # Supabase credentials
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://placeholder-project.supabase.co")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "placeholder-anon-key")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "placeholder-service-role-key")

    # Fast2SMS (Indian Gateway)
    FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")

    # Gmail SMTP Email API
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

    # Telegram Bot Alerts (100% Free Mobile Alerts)
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

    # Scheduler & Periodic Monitoring
    WEATHER_POLL_INTERVAL_MINUTES = int(os.getenv("WEATHER_POLL_INTERVAL_MINUTES", "15"))
    ALERT_COOLDOWN_HOURS = int(os.getenv("ALERT_COOLDOWN_HOURS", "3"))
    SIMULATION_MODE = os.getenv("SIMULATION_MODE", "true").lower() == "true"

    # Rain Probability Alert Threshold (Configurable, default 70%)
    # Only trigger an email alert when rainfall probability >= 70%
    MIN_RAIN_PROBABILITY_THRESHOLD = int(os.getenv("MIN_RAIN_PROBABILITY_THRESHOLD", "70"))

    # Approaching Rain & Confidence Thresholds
    MIN_APPROACHING_RAIN_PROBABILITY = int(os.getenv("MIN_APPROACHING_RAIN_PROBABILITY", "70"))
    MIN_RAIN_CONFIDENCE_PROBABILITY = int(os.getenv("MIN_RAIN_CONFIDENCE_PROBABILITY", "70"))
    MIN_RAIN_RATE_THRESHOLD = float(os.getenv("MIN_RAIN_RATE_THRESHOLD", "0.1"))

    # Deterministic IMD Rainfall Intensity Thresholds (mm/hour)
    # Based on India Meteorological Department standard definitions
    RAINFALL_THRESHOLDS = {
        "NO_RAIN": 0.0,
        "LIGHT_RAIN": 0.1,      # 0.1 mm/h to 2.4 mm/h
        "MODERATE_RAIN": 2.5,   # 2.5 mm/h to 7.5 mm/h
        "HEAVY_RAIN": 7.6,      # 7.6 mm/h to 15.0 mm/h
        "VERY_HEAVY_RAIN": 15.0 # > 15.0 mm/h
    }

    # Bounding Box for Indian Territorial Coordinates
    INDIA_BOUNDS = {
        "LAT_MIN": 6.0,
        "LAT_MAX": 38.0,
        "LON_MIN": 67.0,
        "LON_MAX": 98.0
    }

