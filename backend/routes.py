"""
Kisan Rain Alert - REST API Endpoints
Provides clean, structured JSON routes for farm management, weather, alerts, and notification preferences.
"""

import uuid
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from config import Config
from database import Database
from weather_service import weather_service
from rainfall_engine import RainfallEngine
from notification_service import notification_service

logger = logging.getLogger(__name__)
api_bp = Blueprint("api", __name__, url_prefix="/api")

# ----------------------------------------------------------------------------
# SYSTEM HEALTH
# ----------------------------------------------------------------------------
@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Kisan Rain Alert Engine",
        "version": "1.0.0",
        "simulation_mode": Config.SIMULATION_MODE,
        "poll_interval_mins": Config.WEATHER_POLL_INTERVAL_MINUTES
    }), 200


@api_bp.route("/config", methods=["GET"])
def get_public_config():
    """Exposes public Supabase endpoint & anon key for frontend clients."""
    return jsonify({
        "supabase_url": Config.SUPABASE_URL if not Config.SUPABASE_URL.startswith("https://placeholder") else "",
        "supabase_anon_key": Config.SUPABASE_ANON_KEY if not Config.SUPABASE_ANON_KEY.startswith("placeholder") else "",
        "simulation_mode": Config.SIMULATION_MODE
    }), 200


# ----------------------------------------------------------------------------
# AUTHENTICATION & PROFILE
# ----------------------------------------------------------------------------
@api_bp.route("/register", methods=["POST"])
def register_user():
    data = request.get_json() or {}
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")

    if not full_name or not email or not password:
        return jsonify({"error": "Full name, email, and password are required"}), 400

    if "@" not in email or "." not in email:
        return jsonify({"error": "Please provide a valid email address"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    try:
        user_record = Database.create_user({
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "password": password
        })
        token = user_record.get("token") or f"jwt_{user_record['id'][:8]}_{uuid.uuid4().hex[:6]}"
        return jsonify({
            "message": "User registered successfully",
            "user": user_record,
            "token": token
        }), 201
    except ValueError as val_err:
        return jsonify({"error": str(val_err)}), 409
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({"error": "Failed to register account"}), 500


@api_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user_record = Database.authenticate_user(email, password)
    if not user_record:
        return jsonify({"error": "Invalid email or password. Please check your credentials."}), 401

    return jsonify({
        "message": "Login successful",
        "user": user_record,
        "token": user_record.get("token") or f"jwt_{user_record['id'][:8]}_{uuid.uuid4().hex[:6]}"
    }), 200


@api_bp.route("/profile", methods=["GET"])
def get_user_profile():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id parameter is required"}), 400

    user = Database.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User profile not found"}), 404

    return jsonify({"profile": user}), 200


# ----------------------------------------------------------------------------
# FARM MANAGEMENT
# ----------------------------------------------------------------------------
@api_bp.route("/farms", methods=["GET"])
def get_farms():
    user_id = request.args.get("user_id")
    farms = Database.get_farms(user_id=user_id)
    return jsonify({"farms": farms}), 200


@api_bp.route("/farms", methods=["POST"])
def add_farm():
    data = request.get_json() or {}
    farm_name = data.get("farm_name") or data.get("name")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    user_id = data.get("user_id")

    if not farm_name or latitude is None or longitude is None or not user_id:
        return jsonify({"error": "farm_name, latitude, longitude, and user_id are required"}), 400

    try:
        lat = float(latitude)
        lon = float(longitude)
    except ValueError:
        return jsonify({"error": "Coordinates must be numeric"}), 400

    # Geographical boundary check for India
    b = Config.INDIA_BOUNDS
    if not (b["LAT_MIN"] <= lat <= b["LAT_MAX"] and b["LON_MIN"] <= lon <= b["LON_MAX"]):
        return jsonify({
            "error": f"Coordinates ({lat}, {lon}) are outside Indian boundaries (Lat 6-38° N, Lon 67-98° E)"
        }), 400

    new_farm = Database.create_farm({
        "user_id": user_id,
        "farm_name": farm_name,
        "village": data.get("village", ""),
        "crop_type": data.get("crop_type", ""),
        "farm_size_acres": data.get("farm_size_acres") or data.get("area_acres", 5.0),
        "latitude": lat,
        "longitude": lon
    })
    return jsonify({"message": "Farm registered successfully", "farm": new_farm}), 201


@api_bp.route("/farms/<farm_id>", methods=["GET"])
def get_single_farm(farm_id):
    farm = Database.get_farm_by_id(farm_id)
    if not farm:
        return jsonify({"error": "Farm not found"}), 404
    return jsonify({"farm": farm}), 200


@api_bp.route("/farms/<farm_id>", methods=["DELETE"])
def delete_farm(farm_id):
    user_id = request.args.get("user_id")
    success = Database.delete_farm(farm_id, user_id=user_id)
    if not success:
        return jsonify({"error": "Farm not found or unauthorized"}), 404
    return jsonify({"message": "Farm removed from monitoring"}), 200


# ----------------------------------------------------------------------------
# WEATHER & RADAR
# ----------------------------------------------------------------------------
@api_bp.route("/farms/<farm_id>/weather", methods=["GET"])
def get_farm_weather(farm_id):
    farm = Database.get_farm_by_id(farm_id)
    lat = request.args.get("lat") or (farm.get("latitude") if farm else None)
    lon = request.args.get("lon") or (farm.get("longitude") if farm else None)

    if lat is None or lon is None:
        return jsonify({"error": "Coordinates not available for this farm"}), 400

    weather_data = weather_service.get_current_weather(float(lat), float(lon))
    precip_rate = weather_data.get("precipitation", 0.0)
    weather_data["rainfall_category"] = RainfallEngine.classify_rainfall(precip_rate)

    return jsonify(weather_data), 200


@api_bp.route("/farms/<farm_id>/forecast", methods=["GET"])
def get_farm_forecast(farm_id):
    farm = Database.get_farm_by_id(farm_id)
    lat = request.args.get("lat") or (farm.get("latitude") if farm else None)
    lon = request.args.get("lon") or (farm.get("longitude") if farm else None)

    if lat is None or lon is None:
        return jsonify({"error": "Coordinates not available"}), 400

    forecast = weather_service.get_forecast(float(lat), float(lon), days=2)
    return jsonify(forecast), 200


@api_bp.route("/radar/metadata", methods=["GET"])
def get_radar_metadata():
    metadata = weather_service.get_radar_metadata()
    return jsonify(metadata), 200


# ----------------------------------------------------------------------------
# ALERTS & NOTIFICATIONS
# ----------------------------------------------------------------------------
@api_bp.route("/alerts", methods=["GET"])
def get_alerts():
    farm_id = request.args.get("farm_id")
    user_id = request.args.get("user_id")
    alerts = Database.get_recent_alerts(farm_id=farm_id, user_id=user_id, hours=168)
    return jsonify({"alerts": alerts}), 200


@api_bp.route("/alerts/test", methods=["POST"])
def simulate_test_alert():
    """
    Test mode: Safely simulate rainfall detection for a farmer's plot to test
    the entire pipeline: IMD classification, alert generation, Fast2SMS, and Gmail SMTP.
    """
    data = request.get_json() or {}
    user_id = data.get("user_id") or "a0000000-0000-0000-0000-000000000001"

    farms = Database.get_farms(user_id=user_id)
    farm = farms[0] if farms else {
        "id": "b0000000-0000-0000-0000-000000000001",
        "user_id": user_id,
        "farm_name": "Sample Agri Plot",
        "village": "Samrala",
        "district": "Ludhiana",
        "state": "Punjab"
    }

    # Simulated moderate rainfall: 4.8 mm/h with 85% probability
    simulated_weather = {
        "is_valid": True,
        "precipitation": 4.8,
        "precipitation_probability": 85,
        "temperature": 27.5,
        "humidity": 82.0,
        "wind_speed": 16.5,
        "wind_direction": 190,
        "observation_timestamp": datetime.now(timezone.utc).isoformat()
    }

    # Evaluate rules
    alert = RainfallEngine.evaluate_farm_weather(farm, simulated_weather)

    if not alert:
        # If cooldown previously caught it, create a direct test alert object
        alert = Database.create_rain_alert({
            "farm_id": farm["id"],
            "user_id": user_id,
            "alert_type": "detected",
            "rainfall_category": "Moderate Rain",
            "precipitation_rate": 4.8,
            "alert_message": f"Kisan Rain Alert (Test): Moderate rainfall (4.8 mm/h) detected over {farm['farm_name']}. Please secure crops.",
            "alert_reason": "Simulated precipitation test rate (4.8 mm/h) exceeded moderate rainfall threshold (2.5 mm/h).",
            "confidence_or_data_quality": "Test Simulation Run",
            "event_identifier": f"test-{uuid.uuid4().hex[:8]}"
        })

    # Lookup user profile for phone and email
    user = Database.get_user_by_id(user_id) if user_id else None
    phone_to_use = data.get("phone") or (user and user.get("phone")) or "+919876543210"
    email_to_use = data.get("email") or (user and user.get("email")) or Config.SMTP_EMAIL or os.getenv("DEFAULT_ALERT_EMAIL", "")

    # Dispatch notification
    delivery = notification_service.dispatch_alert(
        alert=alert,
        farm=farm,
        recipient_phone=phone_to_use,
        recipient_email=email_to_use
    )

    return jsonify({
        "message": "Simulated rainfall alert evaluated and dispatched successfully.",
        "alert": alert,
        "sms_status": delivery.get("sms"),
        "email_status": delivery.get("email"),
        "telegram_status": delivery.get("telegram")
    }), 200


@api_bp.route("/notifications", methods=["GET"])
def get_notifications():
    user_id = request.args.get("user_id")
    logs = Database.get_notification_logs(user_id=user_id)
    return jsonify({"logs": logs}), 200


@api_bp.route("/notification-preferences", methods=["GET"])
def get_preferences():
    user_id = request.args.get("user_id", "a0000000-0000-0000-0000-000000000001")
    prefs = Database.get_farmer_preferences(user_id)
    return jsonify({"preferences": prefs}), 200


@api_bp.route("/notification-preferences", methods=["PUT"])
def update_preferences():
    data = request.get_json() or {}
    user_id = data.get("user_id", "a0000000-0000-0000-0000-000000000001")
    updated = Database.update_farmer_preferences(user_id, data)
    return jsonify({"message": "Preferences updated", "preferences": updated}), 200

