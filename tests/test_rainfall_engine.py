"""
Unit Tests for Kisan Rain Alert - Rainfall Engine & IMD Classification
"""

import pytest
import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from rainfall_engine import RainfallEngine
from config import Config

def test_imd_rainfall_classification():
    """Verify deterministic IMD intensity classification."""
    assert RainfallEngine.classify_rainfall(0.0) == "No Rain"
    assert RainfallEngine.classify_rainfall(0.05) == "No Rain"
    assert RainfallEngine.classify_rainfall(0.5) == "Light Rain"
    assert RainfallEngine.classify_rainfall(2.4) == "Light Rain"
    assert RainfallEngine.classify_rainfall(2.5) == "Moderate Rain"
    assert RainfallEngine.classify_rainfall(5.0) == "Moderate Rain"
    assert RainfallEngine.classify_rainfall(7.5) == "Moderate Rain"
    assert RainfallEngine.classify_rainfall(7.6) == "Heavy Rain"
    assert RainfallEngine.classify_rainfall(12.0) == "Heavy Rain"
    assert RainfallEngine.classify_rainfall(15.0) == "Very Heavy Rain"
    assert RainfallEngine.classify_rainfall(35.0) == "Very Heavy Rain"

def test_no_alert_for_dry_weather():
    """Verify dry weather produces no alerts."""
    farm = {
        "id": "test-farm-1",
        "user_id": "test-user-1",
        "farm_name": "Dry Plot",
        "village": "Samrala"
    }
    dry_weather = {
        "is_valid": True,
        "precipitation": 0.0,
        "precipitation_probability": 10,
        "wind_speed": 5.0,
        "wind_direction": 180
    }
    alert = RainfallEngine.evaluate_farm_weather(farm, dry_weather)
    assert alert is None

def test_alert_generation_and_cooldown():
    """Verify alert generation for moderate rain and subsequent cooldown suppression."""
    farm = {
        "id": "test-farm-cooldown-unique-1",
        "user_id": "test-user-1",
        "farm_name": "Nashik Vineyard",
        "village": "Dindori",
        "crop_type": "Grapes"
    }
    rainy_weather = {
        "is_valid": True,
        "precipitation": 4.5,
        "precipitation_probability": 80,
        "wind_speed": 14.0,
        "wind_direction": 220
    }

    # First event should trigger an alert
    alert1 = RainfallEngine.evaluate_farm_weather(farm, rainy_weather)
    assert alert1 is not None
    assert alert1["rainfall_category"] == "Moderate Rain"
    assert alert1["alert_type"] == "detected"
    assert "Dindori" in alert1["alert_message"]

    # Immediate second check should be suppressed by cooldown deduplication
    alert2 = RainfallEngine.evaluate_farm_weather(farm, rainy_weather)
    assert alert2 is None, "Duplicate alert was not suppressed by cooldown"

def test_farmer_intensity_preference_filtering():
    """Verify farmer requesting min Moderate Rain is not alerted for Light Rain."""
    RainfallEngine.reset_farm_event_state()
    farm = {
        "id": "test-farm-pref-1",
        "user_id": "test-user-pref",
        "farm_name": "Punjab Field",
        "village": "Samrala"
    }
    light_rain = {
        "is_valid": True,
        "precipitation": 1.2, # Light Rain
        "precipitation_probability": 75, # Meets >= 70% probability threshold
        "wind_speed": 8.0,
        "wind_direction": 160
    }

    # Preference set to Moderate Rain only
    prefs = {"min_rainfall_intensity": "Moderate Rain"}
    alert = RainfallEngine.evaluate_farm_weather(farm, light_rain, user_preferences=prefs)
    assert alert is None

    # If preference permits Light Rain, it should trigger
    prefs_light = {"min_rainfall_intensity": "Light Rain"}
    farm["id"] = "test-farm-pref-2"
    alert_light = RainfallEngine.evaluate_farm_weather(farm, light_rain, user_preferences=prefs_light)
    assert alert_light is not None
    assert alert_light["rainfall_category"] == "Light Rain"

def test_strict_probability_thresholds_69_70_85():
    """Verify: 69% probability = NO EMAIL, 70% probability = EMAIL ALERT, 85% probability = EMAIL ALERT."""
    RainfallEngine.reset_farm_event_state()

    # 1. 69% Probability = NO EMAIL
    farm_69 = {"id": "farm-prob-69", "user_id": "u1", "farm_name": "Plot 69"}
    weather_69 = {"is_valid": True, "precipitation": 2.0, "precipitation_probability": 69}
    assert RainfallEngine.evaluate_farm_weather(farm_69, weather_69) is None, "69% probability must produce NO ALERT"

    # 2. 70% Probability = EMAIL ALERT
    farm_70 = {"id": "farm-prob-70", "user_id": "u1", "farm_name": "Plot 70"}
    weather_70 = {"is_valid": True, "precipitation": 2.5, "precipitation_probability": 70}
    alert_70 = RainfallEngine.evaluate_farm_weather(farm_70, weather_70)
    assert alert_70 is not None, "70% probability must trigger an EMAIL ALERT"

    # 3. 85% Probability = EMAIL ALERT
    farm_85 = {"id": "farm-prob-85", "user_id": "u1", "farm_name": "Plot 85"}
    weather_85 = {"is_valid": True, "precipitation": 4.5, "precipitation_probability": 85}
    alert_85 = RainfallEngine.evaluate_farm_weather(farm_85, weather_85)
    assert alert_85 is not None, "85% probability must trigger an EMAIL ALERT"

def test_missing_or_unavailable_probability_no_alert():
    """Verify: Missing or unavailable probability data = NO ALERT."""
    RainfallEngine.reset_farm_event_state()
    farm = {"id": "farm-missing-prob", "user_id": "u1", "farm_name": "Plot Prob"}

    # Missing probability key entirely
    weather_missing = {"is_valid": True, "precipitation": 5.0}
    assert RainfallEngine.evaluate_farm_weather(farm, weather_missing) is None

    # Probability is None
    weather_none = {"is_valid": True, "precipitation": 5.0, "precipitation_probability": None}
    assert RainfallEngine.evaluate_farm_weather(farm, weather_none) is None

    # Weather is invalid
    weather_invalid = {"is_valid": False, "precipitation_probability": 90}
    assert RainfallEngine.evaluate_farm_weather(farm, weather_invalid) is None

def test_stale_weather_data_no_alert():
    """Verify: Stale weather data = NO ALERT."""
    from datetime import datetime, timezone, timedelta
    RainfallEngine.reset_farm_event_state()
    farm = {"id": "farm-stale-check", "user_id": "u1", "farm_name": "Plot Stale"}

    # Explicitly marked is_stale
    stale_flag = {"is_valid": True, "is_stale": True, "precipitation_probability": 85, "precipitation": 3.0}
    assert RainfallEngine.evaluate_farm_weather(farm, stale_flag) is None

    # Observation timestamp older than 2 hours
    four_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat()
    stale_time = {"is_valid": True, "observation_timestamp": four_hours_ago, "precipitation_probability": 85, "precipitation": 3.0}
    assert RainfallEngine.evaluate_farm_weather(farm, stale_time) is None

def test_duplicate_prevention_on_api_refreshes():
    """Verify: Send only one email for the same rainfall event; do not send repeated emails on API refreshes."""
    RainfallEngine.reset_farm_event_state()
    farm = {"id": "farm-dup-test", "user_id": "u1", "farm_name": "Dup Plot"}

    # 1. First API read: 75% probability -> Triggers email alert
    refresh_1 = {"is_valid": True, "precipitation": 3.0, "precipitation_probability": 75}
    alert_1 = RainfallEngine.evaluate_farm_weather(farm, refresh_1)
    assert alert_1 is not None, "First detection must trigger alert"

    # 2. Second API refresh (15 mins later): 80% probability -> Must be suppressed (no duplicate email)
    refresh_2 = {"is_valid": True, "precipitation": 4.0, "precipitation_probability": 80}
    alert_2 = RainfallEngine.evaluate_farm_weather(farm, refresh_2)
    assert alert_2 is None, "API refresh during same event must NOT send duplicate alert"

    # 3. Third API refresh: 85% probability -> Still suppressed
    refresh_3 = {"is_valid": True, "precipitation": 4.5, "precipitation_probability": 85}
    alert_3 = RainfallEngine.evaluate_farm_weather(farm, refresh_3)
    assert alert_3 is None, "Ongoing event must remain suppressed"

    # 4. Weather clears up (event ends): probability drops to 10%, no rain
    clear_weather = {"is_valid": True, "precipitation": 0.0, "precipitation_probability": 10}
    assert RainfallEngine.evaluate_farm_weather(farm, clear_weather) is None

    # 5. Genuinely new event arrives later: 72% probability -> New alert triggers!
    new_event = {"is_valid": True, "precipitation": 2.0, "precipitation_probability": 72}
    alert_new = RainfallEngine.evaluate_farm_weather(farm, new_event)
    assert alert_new is not None, "Genuinely new rainfall event must trigger new alert"


