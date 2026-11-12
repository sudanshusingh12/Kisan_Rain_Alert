"""
Kisan Rain Alert - Automated Background Weather & Rainfall Monitoring Scheduler
Periodically checks registered farms, analyzes precipitation against deterministic rules,
and triggers farmer notifications.
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from config import Config
from database import Database
from weather_service import weather_service
from rainfall_engine import RainfallEngine
from notification_service import notification_service

logger = logging.getLogger(__name__)

scheduler = None

def run_rainfall_monitoring_cycle():
    """
    Core monitoring cycle:
    1. Fetch all active registered farms
    2. Retrieve latest meteorological data for each coordinate
    3. Save weather observation
    4. Evaluate rainfall rules
    5. Dispatch SMS/Email if thresholds are exceeded
    """
    logger.info("Executing periodic rainfall monitoring cycle...")
    farms = Database.get_farms()

    if not farms:
        logger.info("No active farms registered. Monitoring cycle idle.")
        return

    for farm in farms:
        farm_id = farm.get("id")
        lat = farm.get("latitude")
        lon = farm.get("longitude")
        user_id = farm.get("user_id")

        if lat is None or lon is None:
            continue

        try:
            # 1. Fetch live weather & precipitation
            weather_data = weather_service.get_current_weather(float(lat), float(lon))

            # 2. Record observation in database
            obs_entry = {
                "farm_id": farm_id,
                "source": weather_data.get("source", "Open-Meteo"),
                "observation_type": weather_data.get("observation_type", "model_precipitation"),
                "temperature": weather_data.get("temperature"),
                "humidity": weather_data.get("humidity"),
                "precipitation": weather_data.get("precipitation"),
                "precipitation_probability": weather_data.get("precipitation_probability"),
                "weather_code": weather_data.get("weather_code"),
                "wind_speed": weather_data.get("wind_speed"),
                "wind_direction": weather_data.get("wind_direction"),
                "observation_timestamp": weather_data.get("observation_timestamp")
            }
            Database.save_weather_observation(obs_entry)

            # 3. Fetch farmer preferences
            preferences = Database.get_farmer_preferences(user_id) if user_id else {}

            # 4. Evaluate deterministic rainfall rules
            alert = RainfallEngine.evaluate_farm_weather(farm, weather_data, preferences)

            # 5. Dispatch notifications if alert triggered
            if alert:
                logger.info(f"Rain alert triggered for farm {farm.get('farm_name')}: {alert.get('rainfall_category')}")
                user = Database.get_user_by_id(user_id) if user_id else None
                recipient_phone = (user and user.get("phone")) or farm.get("phone") or "+919876543210"
                recipient_email = (user and user.get("email")) or farm.get("email") or Config.SMTP_EMAIL or os.getenv("DEFAULT_ALERT_EMAIL", "")

                notification_service.dispatch_alert(
                    alert=alert,
                    farm=farm,
                    recipient_phone=recipient_phone,
                    recipient_email=recipient_email
                )

        except Exception as e:
            logger.error(f"Error monitoring farm {farm_id} ({farm.get('farm_name')}): {e}")

    logger.info("Rainfall monitoring cycle completed successfully.")


def start_scheduler():
    """Start background scheduler singleton."""
    global scheduler
    if scheduler is not None and scheduler.running:
        return scheduler

    scheduler = BackgroundScheduler(daemon=True)
    interval = max(Config.WEATHER_POLL_INTERVAL_MINUTES, 5)

    scheduler.add_job(
        func=run_rainfall_monitoring_cycle,
        trigger="interval",
        minutes=interval,
        id="kisan_rain_monitor_job",
        name="Kisan Rain Alert Weather Poller",
        replace_existing=True
    )

    scheduler.start()
    logger.info(f"Background rainfall monitoring scheduler started (Interval: {interval} mins).")
    return scheduler


def stop_scheduler():
    """Gracefully stop scheduler."""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        logger.info("Background scheduler stopped.")

