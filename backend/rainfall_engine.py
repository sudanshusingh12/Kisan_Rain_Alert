"""
Kisan Rain Alert - Deterministic Rainfall Rule Engine
Analyzes precipitation observations against IMD standard thresholds,
enforces cooldown deduplication, and generates explainable farmer alerts without machine learning.
"""

import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple
from config import Config
from database import Database

logger = logging.getLogger(__name__)

class RainfallEngine:
    """
    Deterministic rule engine for rainfall classification, 
    threshold evaluation, cooldown deduplication, and advisory generation.
    """

    # Active ongoing rainfall events registry keyed by farm_id:
    # Tracks the lifecycle of rainfall events per farm to ensure only 1 email alert is sent per event.
    _ACTIVE_RAIN_EVENTS: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def reset_farm_event_state(cls, farm_id: Optional[str] = None):
        """Reset ongoing rainfall event tracking (for all farms or a specific farm)."""
        if farm_id:
            cls._ACTIVE_RAIN_EVENTS.pop(farm_id, None)
        else:
            cls._ACTIVE_RAIN_EVENTS.clear()

    @classmethod
    def _check_and_reset_event_if_ended(cls, farm_id: str, current_prob: int, current_rate: float):
        """
        Reset the active alert state when the previous rainfall event has ended.
        Event is ended when rain probability drops below the threshold and precipitation ceases.
        """
        active_event = cls._ACTIVE_RAIN_EVENTS.get(farm_id)
        if not active_event or not active_event.get("is_active"):
            return

        min_threshold = getattr(Config, "MIN_RAIN_PROBABILITY_THRESHOLD", 70)
        # Event has ended when probability drops below threshold and no significant precipitation is falling
        if current_prob < min_threshold and current_rate < 0.1:
            logger.info(f"Rainfall event ended for farm {farm_id} (prob: {current_prob}%, rate: {current_rate} mm/h). Resetting alert state.")
            cls._ACTIVE_RAIN_EVENTS[farm_id] = {
                "is_active": False,
                "ended_at": datetime.now(timezone.utc).isoformat()
            }

    @classmethod
    def classify_rainfall(cls, precipitation_rate_mm_hr: float) -> str:
        """
        Classifies rainfall intensity based on India Meteorological Department (IMD) standards.
        - No Rain: 0.0 mm/h
        - Light Rain: 0.1 mm/h to 2.4 mm/h
        - Moderate Rain: 2.5 mm/h to 7.5 mm/h
        - Heavy Rain: 7.6 mm/h to 15.0 mm/h
        - Very Heavy Rain: > 15.0 mm/h
        """
        rate = float(precipitation_rate_mm_hr or 0.0)
        t = Config.RAINFALL_THRESHOLDS

        if rate < t["LIGHT_RAIN"]:
            return "No Rain"
        elif rate < t["MODERATE_RAIN"]:
            return "Light Rain"
        elif rate < t["HEAVY_RAIN"]:
            return "Moderate Rain"
        elif rate < t["VERY_HEAVY_RAIN"]:
            return "Heavy Rain"
        else:
            return "Very Heavy Rain"

    @classmethod
    def evaluate_farm_weather(
        cls, 
        farm: Dict[str, Any], 
        weather_data: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluate meteorological data for a registered farm and determine if an alert must be issued.
        Returns an Alert dictionary if conditions are satisfied, else None.

        Strict Rules:
        - Rain probability threshold: >= 70% (configurable).
        - 69% probability = NO EMAIL.
        - 70% probability = EMAIL ALERT.
        - 85% probability = EMAIL ALERT.
        - Missing or unavailable probability data = NO ALERT.
        - Stale weather data (> 2 hours old or marked is_stale) = NO ALERT.
        - Duplicate prevention: Only 1 email per rainfall event at a particular farm.
        """
        # 1. Missing or invalid weather data check
        if not weather_data or not weather_data.get("is_valid", False):
            logger.info(f"Skipping evaluation for farm {farm.get('id')}: Weather data is missing or invalid.")
            return None

        # 2. Stale weather data check (marked is_stale or older than 2 hours)
        if weather_data.get("is_stale", False):
            logger.info(f"Skipping evaluation for farm {farm.get('id')}: Weather data is marked stale.")
            return None

        obs_time_str = weather_data.get("observation_timestamp")
        if obs_time_str:
            try:
                obs_dt = datetime.fromisoformat(str(obs_time_str).replace("Z", "+00:00"))
                if obs_dt.tzinfo is None:
                    obs_dt = obs_dt.replace(tzinfo=timezone.utc)
                now_utc = datetime.now(timezone.utc)
                if (now_utc - obs_dt) > timedelta(hours=2):
                    logger.warning(f"Skipping evaluation for farm {farm.get('id')}: Stale weather observation ({obs_time_str}).")
                    return None
            except Exception as e:
                logger.debug(f"Timestamp parse error for {obs_time_str}: {e}")

        # 3. Missing or unavailable probability data check
        raw_prob = weather_data.get("precipitation_probability")
        if raw_prob is None:
            logger.info(f"Skipping evaluation for farm {farm.get('id')}: Missing or unavailable rainfall probability data.")
            return None

        try:
            precip_prob = int(raw_prob)
        except (ValueError, TypeError):
            logger.info(f"Skipping evaluation for farm {farm.get('id')}: Invalid rainfall probability value ({raw_prob}).")
            return None

        precip_rate = float(weather_data.get("precipitation", 0.0) or 0.0)
        category = cls.classify_rainfall(precip_rate)

        # 4. Strict Rain Probability Threshold Check (Default 70%, Configurable)
        # 69% = NO EMAIL, 70% = EMAIL ALERT, 85% = EMAIL ALERT
        min_prob_threshold = getattr(Config, "MIN_RAIN_PROBABILITY_THRESHOLD", 70)
        if precip_prob < min_prob_threshold:
            logger.info(
                f"No alert for farm {farm.get('id')}: Rain probability ({precip_prob}%) is below {min_prob_threshold}% threshold."
            )
            # Reset event state if the previous event has ended
            cls._check_and_reset_event_if_ended(farm["id"], precip_prob, precip_rate)
            return None

        # 5. Check farmer's minimum intensity preference if specified
        min_pref = (user_preferences or {}).get("min_rainfall_intensity", "Light Rain")
        if not cls._meets_minimum_intensity(category, min_pref):
            return None

        # 6. Prevent Duplicate Alerts for Same Rainfall Event
        # Do not send another email every time the weather API refreshes during the same event.
        active_event = cls._ACTIVE_RAIN_EVENTS.get(farm["id"])
        if active_event and active_event.get("is_active"):
            active_event["last_refreshed_at"] = datetime.now(timezone.utc).isoformat()
            active_event["highest_probability"] = max(active_event.get("highest_probability", 0), precip_prob)
            logger.info(
                f"Duplicate email prevented for farm {farm.get('id')}: Rainfall event already active and notified."
            )
            return None

        # Determine alert type & triggering rule
        if precip_rate >= Config.RAINFALL_THRESHOLDS["LIGHT_RAIN"]:
            alert_type = "detected"
            alert_reason = (
                f"Rainfall ({precip_rate} mm/h, {category}) verified with {precip_prob}% probability (threshold: {min_prob_threshold}%) "
                f"over {farm.get('farm_name')}."
            )
        else:
            alert_type = "forecast_warning"
            category = "Rain Expected"
            alert_reason = (
                f"Rainfall probability ({precip_prob}%) reached threshold ({min_prob_threshold}%). "
                f"Rain approaching farm coordinates '{farm.get('farm_name')}'."
            )

        # Build stable event identifier
        event_identifier = cls._generate_event_identifier(farm["id"], category)

        # Cooldown check: Has this farm received an alert for this event in the last N hours?
        if cls._is_in_cooldown(farm["id"], event_identifier):
            logger.info(f"Alert suppressed by cooldown for farm {farm.get('id')}: {category}")
            cls._ACTIVE_RAIN_EVENTS[farm["id"]] = {
                "is_active": True,
                "first_notified_at": datetime.now(timezone.utc).isoformat(),
                "event_identifier": event_identifier,
                "highest_probability": precip_prob,
                "category": category
            }
            return None

        # Format transparent, farmer-friendly advisory message
        alert_message = cls._format_alert_message(farm, category, precip_rate, precip_prob, alert_type)

        alert_data = {
            "farm_id": farm["id"],
            "user_id": farm["user_id"],
            "alert_type": alert_type,
            "rainfall_category": category,
            "precipitation_rate": precip_rate,
            "alert_message": alert_message,
            "alert_reason": alert_reason,
            "confidence_or_data_quality": f"Verified Probability: {precip_prob}% (Threshold: {min_prob_threshold}%)",
            "event_identifier": event_identifier
        }

        # Store alert in database (Supabase rain_alerts)
        saved_alert = Database.create_rain_alert(alert_data)

        # Register active rainfall event state to prevent duplicate emails on API refreshes
        cls._ACTIVE_RAIN_EVENTS[farm["id"]] = {
            "is_active": True,
            "first_notified_at": datetime.now(timezone.utc).isoformat(),
            "event_identifier": event_identifier,
            "highest_probability": precip_prob,
            "category": category,
            "alert_id": saved_alert.get("id")
        }

        return saved_alert

    @classmethod
    def _meets_minimum_intensity(cls, current_cat: str, min_pref: str) -> bool:
        """Check if current rainfall meets or exceeds farmer's minimum preference."""
        hierarchy = {
            "No Rain": 0,
            "Rain Expected": 1,
            "Approaching Rain": 1,
            "Light Rain": 2,
            "Moderate Rain": 3,
            "Heavy Rain": 4,
            "Very Heavy Rain": 5
        }
        pref_str = str(min_pref or "Light Rain").strip()
        if pref_str.lower() == "light":
            pref_norm = "Light Rain"
        elif pref_str.lower() == "moderate":
            pref_norm = "Moderate Rain"
        elif pref_str.lower() == "heavy":
            pref_norm = "Heavy Rain"
        else:
            pref_norm = pref_str

        return hierarchy.get(current_cat, 0) >= hierarchy.get(pref_norm, 2)

    @classmethod
    def _is_in_cooldown(cls, farm_id: str, event_identifier: str) -> bool:
        """Returns True if a matching alert was logged within ALERT_COOLDOWN_HOURS."""
        recent_alerts = Database.get_recent_alerts(farm_id=farm_id, hours=Config.ALERT_COOLDOWN_HOURS)
        for a in recent_alerts:
            if a.get("event_identifier") == event_identifier:
                return True
        return False

    @classmethod
    def _generate_event_identifier(cls, farm_id: str, category: str) -> str:
        """Create a stable identifier keyed to farm, rainfall category, and 3-hour time block."""
        now = datetime.now(timezone.utc)
        # 3-hour time slot
        time_slot = f"{now.strftime('%Y%m%d')}-{now.hour // Config.ALERT_COOLDOWN_HOURS}"
        raw = f"{farm_id}:{category}:{time_slot}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    @classmethod
    def _format_alert_message(
        cls, 
        farm: Dict[str, Any], 
        category: str, 
        precip_rate: float, 
        probability: int,
        alert_type: str
    ) -> str:
        """Format honest, human-readable alert for Indian farmers."""
        farm_name = farm.get("farm_name", "Your Farm")
        village = farm.get("village", "")
        crop = farm.get("crop_type", "Produce")

        if alert_type == "detected":
            return (
                f"Kisan Rain Alert: {category} ({precip_rate} mm/h) has reached your farm "
                f"'{farm_name}' in {village}. "
                f"Please cover harvested {crop}, secure threshing grounds, and pause chemical spraying."
            )
        else:
            return (
                f"Kisan Rain Alert: Very high rain probability ({probability}%) approaching your farm "
                f"'{farm_name}', {village}. "
                f"Rainfall is expected to reach your fields within the upcoming window. Please review tarpaulins and prepare storage."
            )

