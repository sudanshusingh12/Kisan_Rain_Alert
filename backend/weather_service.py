"""
Kisan Rain Alert - Weather & Radar Integration Service
Provider-independent layer retrieving high-resolution precipitation and radar mosaics for India.
"""

import time
import logging
import requests
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class BaseWeatherProvider(ABC):
    """Abstract base provider ensuring weather source independence."""
    
    @abstractmethod
    def get_current_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_forecast(self, latitude: float, longitude: float, days: int = 2) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_radar_metadata(self) -> Dict[str, Any]:
        pass


class OpenMeteoAndRainViewerProvider(BaseWeatherProvider):
    """
    Primary weather and precipitation integration:
    - Open-Meteo High-Resolution (ECMWF IFS / DWD ICON global models) for precise mm/h precipitation rates
    - RainViewer API for live composite Doppler weather radar tiles and timestamps across India
    """

    OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
    RAINVIEWER_MAPS_URL = "https://api.rainviewer.com/public/weather-maps.json"

    def __init__(self, cache_ttl_seconds: int = 300):
        self.cache_ttl = cache_ttl_seconds
        self._weather_cache: Dict[str, Dict[str, Any]] = {}
        self._radar_cache: Optional[Dict[str, Any]] = None
        self._radar_cache_time: float = 0

    def get_current_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch real-time weather and precipitation observations."""
        cache_key = f"{round(latitude, 4)},{round(longitude, 4)}"
        now = time.time()

        if cache_key in self._weather_cache:
            entry = self._weather_cache[cache_key]
            if now - entry["timestamp"] < self.cache_ttl:
                return entry["data"]

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m,wind_direction_10m",
            "hourly": "precipitation_probability,precipitation",
            "forecast_days": 1,
            "timezone": "auto"
        }

        try:
            resp = requests.get(self.OPEN_METEO_URL, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            validated = self._validate_and_normalize(data, latitude, longitude)

            self._weather_cache[cache_key] = {
                "timestamp": now,
                "data": validated
            }
            return validated
        except Exception as e:
            logger.error(f"Failed to fetch weather for ({latitude}, {longitude}): {e}")
            return self._build_safe_fallback(latitude, longitude, error_msg=str(e))

    def get_forecast(self, latitude: float, longitude: float, days: int = 2) -> Dict[str, Any]:
        """Fetch 48-hour precipitation and rain probability forecast."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,weather_code",
            "forecast_days": min(days, 7),
            "timezone": "auto"
        }
        try:
            resp = requests.get(self.OPEN_METEO_URL, params=params, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch forecast for ({latitude}, {longitude}): {e}")
            return {"hourly": {"time": [], "precipitation": [], "precipitation_probability": []}, "error": str(e)}

    def get_radar_metadata(self) -> Dict[str, Any]:
        """Fetch RainViewer Doppler radar frames and timestamps."""
        now = time.time()
        if self._radar_cache and (now - self._radar_cache_time < 300):
            return self._radar_cache

        try:
            resp = requests.get(self.RAINVIEWER_MAPS_URL, timeout=8)
            resp.raise_for_status()
            self._radar_cache = resp.json()
            self._radar_cache_time = now
            return self._radar_cache
        except Exception as e:
            logger.warning(f"Could not fetch RainViewer radar metadata: {e}")
            return {"radar": {"past": [], "nowcast": []}, "error": str(e)}

    def _validate_and_normalize(self, raw_data: Dict[str, Any], lat: float, lon: float) -> Dict[str, Any]:
        """Validate structure and normalize meteorological units."""
        current = raw_data.get("current", {})
        hourly = raw_data.get("hourly", {})

        precip_rate = float(current.get("precipitation", 0.0) or 0.0)
        temp = float(current.get("temperature_2m", 25.0) or 25.0)
        humidity = float(current.get("relative_humidity_2m", 60.0) or 60.0)
        wind_speed = float(current.get("wind_speed_10m", 0.0) or 0.0)
        wind_dir = int(current.get("wind_direction_10m", 0) or 0)
        weather_code = int(current.get("weather_code", 0) or 0)

        # Precipitation probability for the current hour
        prob_list = hourly.get("precipitation_probability", [])
        prob = int(prob_list[0]) if prob_list else 0

        # WMO Weathercode interpretation
        condition_text = self._interpret_wmo_code(weather_code)

        return {
            "source": "Open-Meteo High-Resolution NWP (ECMWF/DWD)",
            "observation_type": "model_precipitation",
            "latitude": lat,
            "longitude": lon,
            "temperature": temp,
            "humidity": humidity,
            "precipitation": round(precip_rate, 2), # mm/hour
            "precipitation_probability": prob,      # percentage
            "wind_speed": wind_speed,               # km/h
            "wind_direction": wind_dir,             # degrees
            "weather_code": weather_code,
            "condition_description": condition_text,
            "observation_timestamp": current.get("time", datetime.now(timezone.utc).isoformat()),
            "is_valid": True,
            "raw_available": True
        }

    def _build_safe_fallback(self, lat: float, lon: float, error_msg: str) -> Dict[str, Any]:
        """Safe fallback response when network API is unreachable."""
        return {
            "source": "Local Fallback Sensor Layer",
            "observation_type": "uncertain_offline",
            "latitude": lat,
            "longitude": lon,
            "temperature": 27.0,
            "humidity": 65.0,
            "precipitation": 0.0,
            "precipitation_probability": 0,
            "wind_speed": 10.0,
            "wind_direction": 180,
            "weather_code": 0,
            "condition_description": "Clear / No precipitation data",
            "observation_timestamp": datetime.now(timezone.utc).isoformat(),
            "is_valid": False,
            "error": error_msg
        }

    @staticmethod
    def _interpret_wmo_code(code: int) -> str:
        """Map standard WMO Weather interpretation codes."""
        if code == 0: return "Clear sky"
        if code in (1, 2): return "Mainly clear, partly cloudy"
        if code == 3: return "Overcast"
        if code in (45, 48): return "Fog"
        if code in (51, 53, 55): return "Drizzle"
        if code in (61, 63): return "Moderate Rain"
        if code == 65: return "Heavy Rain"
        if code in (80, 81, 82): return "Rain showers"
        if code in (95, 96, 99): return "Thunderstorm"
        return "Precipitation observed"


# Singleton instance of weather service
weather_service = OpenMeteoAndRainViewerProvider()

