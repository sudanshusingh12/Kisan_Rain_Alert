import React, { useState, useEffect } from 'react';
import { 
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, 
  Droplets, Wind, Umbrella, Gauge, RefreshCw, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';

export default function FarmWeatherWidget({ farm }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = async (isManual = false) => {
    if (!farm || farm.latitude == null || farm.longitude == null) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await api.getFarmWeather(farm.id, farm.latitude, farm.longitude);
      setWeather(data);
    } catch (err) {
      console.error('Failed to fetch farm weather:', err);
      setError('Weather feed unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [farm.id, farm.latitude, farm.longitude]);

  // Weather icon selector based on WMO code & precipitation
  const getWeatherIcon = (code = 0, precip = 0) => {
    if (precip >= 7.5 || code >= 95) {
      return <CloudLightning size={28} color="#DC2626" />;
    }
    if (precip > 0.1 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return <CloudRain size={28} color="#0284C7" />;
    }
    if (code >= 1 && code <= 3) {
      return <CloudSun size={28} color="#F59E0B" />;
    }
    if (code >= 45 && code <= 48) {
      return <Cloud size={28} color="#64748B" />;
    }
    return <Sun size={28} color="#EA580C" />;
  };

  // Farmer-specific agricultural advice based on live weather
  const getFarmingAdvisory = (w) => {
    if (!w) return null;
    const precip = w.precipitation || 0;
    const rainChance = w.precipitation_probability || 0;
    const wind = w.wind_speed || 0;

    if (precip >= 2.5 || rainChance >= 70) {
      return {
        type: 'danger',
        text: 'Rain Active / Imminent: Postpone irrigation & spraying. Protect harvested crops.',
        icon: <AlertTriangle size={15} color="#DC2626" />
      };
    }
    if (wind > 20) {
      return {
        type: 'warning',
        text: `High Wind (${wind.toFixed(1)} km/h): Avoid spraying pesticides (high spray drift).`,
        icon: <Wind size={15} color="#D97706" />
      };
    }
    return {
      type: 'success',
      text: 'Favorable Field Conditions: Safe for irrigation, weeding, and spraying operations.',
      icon: <CheckCircle2 size={15} color="#059669" />
    };
  };

  if (loading) {
    return (
      <div style={{
        background: 'var(--slate-50, #F8FAFC)',
        border: '1px solid var(--slate-200, #E2E8F0)',
        borderRadius: 14,
        padding: '1.25rem',
        margin: '1rem 0',
        minHeight: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        color: 'var(--slate-500, #64748B)'
      }}>
        <RefreshCw size={18} className="animate-spin" />
        <span style={{ fontSize: '0.925rem', fontWeight: 600 }}>Loading microclimate sensors...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div style={{
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 14,
        padding: '0.85rem 1rem',
        margin: '1rem 0',
        fontSize: '0.875rem',
        color: '#991B1B',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{error || 'Unable to load weather station'}</span>
        <button 
          onClick={() => fetchWeather(true)} 
          style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 700 }}
        >
          Retry
        </button>
      </div>
    );
  }

  const advisory = getFarmingAdvisory(weather);
  const isRaining = (weather.precipitation || 0) > 0.1;

  return (
    <div style={{
      background: isRaining 
        ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' 
        : 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 100%)',
      border: `1.5px solid ${isRaining ? '#93C5FD' : '#A7F3D0'}`,
      borderRadius: 16,
      padding: '1.4rem',
      margin: '1.15rem 0',
      boxShadow: '0 4px 14px rgba(8, 59, 43, 0.04)',
      transition: 'all 0.2s ease'
    }}>
      
      {/* Top Header: Condition + Temperature + Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            {getWeatherIcon(weather.weather_code, weather.precipitation)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2.15rem', fontWeight: 900, color: 'var(--forest-950, #06201A)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {Math.round(weather.temperature ?? 24)}°C
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--slate-700, #334155)' }}>
                {weather.condition_description || 'Clear sky'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500, #64748B)', marginTop: 3, fontWeight: 600 }}>
              Live Station Feed • <strong style={{ color: isRaining ? '#DC2626' : '#059669' }}>{weather.rainfall_category || 'No Rain'}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchWeather(true)}
          disabled={refreshing}
          title="Refresh farm weather"
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--slate-300, #CBD5E1)',
            borderRadius: 10,
            padding: '0.55rem 0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.875rem',
            fontWeight: 800,
            color: 'var(--forest-800, #0B3D2E)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* Microclimate 4-Stat Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.65rem',
        marginBottom: '1rem'
      }}>
        
        {/* Humidity - Aesthetic Sky Tint */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)',
          padding: '0.75rem 0.5rem',
          borderRadius: 14,
          textAlign: 'center',
          border: '1.5px solid #BAE6FD',
          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#0284C7', marginBottom: 3 }}>
            <Droplets size={14} />
            <span style={{ fontSize: '0.785rem', fontWeight: 800, textTransform: 'uppercase', color: '#0369A1' }}>Humidity</span>
          </div>
          <strong style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0C4A6E' }}>
            {Math.round(weather.humidity ?? 50)}%
          </strong>
        </div>

        {/* Rain Chance - Aesthetic Indigo Tint */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 100%)',
          padding: '0.75rem 0.5rem',
          borderRadius: 14,
          textAlign: 'center',
          border: '1.5px solid #C7D2FE',
          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#4F46E5', marginBottom: 3 }}>
            <Umbrella size={14} />
            <span style={{ fontSize: '0.785rem', fontWeight: 800, textTransform: 'uppercase', color: '#4338CA' }}>Chance</span>
          </div>
          <strong style={{ fontSize: '1.2rem', fontWeight: 900, color: '#312E81' }}>
            {weather.precipitation_probability ?? 0}%
          </strong>
        </div>

        {/* Rain Rate - Luminous Emerald or Alert Coral */}
        <div style={{
          background: isRaining 
            ? 'linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 100%)' 
            : 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)',
          padding: '0.75rem 0.5rem',
          borderRadius: 14,
          textAlign: 'center',
          border: `1.5px solid ${isRaining ? '#FECACA' : '#A7F3D0'}`,
          boxShadow: isRaining ? '0 2px 8px rgba(220, 38, 38, 0.12)' : '0 2px 6px rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: isRaining ? '#DC2626' : '#059669', marginBottom: 3 }}>
            <CloudRain size={14} />
            <span style={{ fontSize: '0.785rem', fontWeight: 800, textTransform: 'uppercase', color: isRaining ? '#B91C1C' : '#047857' }}>Rain</span>
          </div>
          <strong style={{ fontSize: '1.2rem', fontWeight: 900, color: isRaining ? '#991B1B' : '#064E3B' }}>
            {(weather.precipitation ?? 0).toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>mm/h</span>
          </strong>
        </div>

        {/* Wind Speed - Warm Honey Amber */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)',
          padding: '0.75rem 0.5rem',
          borderRadius: 14,
          textAlign: 'center',
          border: '1.5px solid #FDE68A',
          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#D97706', marginBottom: 3 }}>
            <Wind size={14} />
            <span style={{ fontSize: '0.785rem', fontWeight: 800, textTransform: 'uppercase', color: '#B45309' }}>Wind</span>
          </div>
          <strong style={{ fontSize: '1.2rem', fontWeight: 900, color: '#78350F' }}>
            {(weather.wind_speed ?? 0).toFixed(0)} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>km/h</span>
          </strong>
        </div>

      </div>

      {/* Live Agricultural Advisory Pill */}
      {advisory && (
        <div style={{
          backgroundColor: advisory.type === 'danger' ? '#FEE2E2' : advisory.type === 'warning' ? '#FEF3C7' : '#DCFCE7',
          border: `1.5px solid ${advisory.type === 'danger' ? '#FCA5A5' : advisory.type === 'warning' ? '#FDE68A' : '#86EFAC'}`,
          borderRadius: 10,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.925rem',
          fontWeight: 700,
          color: advisory.type === 'danger' ? '#991B1B' : advisory.type === 'warning' ? '#92400E' : '#14532D',
          lineHeight: 1.5
        }}>
          <span style={{ flexShrink: 0 }}>{advisory.icon}</span>
          <span>{advisory.text}</span>
        </div>
      )}

    </div>
  );
}

