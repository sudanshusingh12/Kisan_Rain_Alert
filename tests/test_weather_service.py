"""
Unit Tests for Weather Service Layer
"""

import pytest
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from weather_service import OpenMeteoAndRainViewerProvider

def test_wmo_weathercode_interpretation():
    """Verify standard WMO codes map to clear text."""
    provider = OpenMeteoAndRainViewerProvider()
    assert provider._interpret_wmo_code(0) == "Clear sky"
    assert provider._interpret_wmo_code(3) == "Overcast"
    assert provider._interpret_wmo_code(61) == "Moderate Rain"
    assert provider._interpret_wmo_code(65) == "Heavy Rain"
    assert provider._interpret_wmo_code(95) == "Thunderstorm"

def test_validation_and_normalization():
    """Verify raw API structure normalizes to standard units."""
    provider = OpenMeteoAndRainViewerProvider()
    sample_raw = {
        "current": {
            "temperature_2m": 29.4,
            "relative_humidity_2m": 72.0,
            "precipitation": 3.8,
            "wind_speed_10m": 12.5,
            "wind_direction_10m": 190,
            "weather_code": 61,
            "time": "2026-11-04T10:00:00Z"
        },
        "hourly": {
            "precipitation_probability": [80, 75, 40]
        }
    }

    norm = provider._validate_and_normalize(sample_raw, 20.0059, 73.7898)
    assert norm["is_valid"] is True
    assert norm["temperature"] == 29.4
    assert norm["precipitation"] == 3.8
    assert norm["precipitation_probability"] == 80
    assert norm["condition_description"] == "Moderate Rain"

def test_safe_fallback():
    """Verify fallback structure when network fails."""
    provider = OpenMeteoAndRainViewerProvider()
    fallback = provider._build_safe_fallback(20.0, 73.0, "Connection timeout")
    assert fallback["is_valid"] is False
    assert fallback["precipitation"] == 0.0
    assert "timeout" in fallback["error"]

