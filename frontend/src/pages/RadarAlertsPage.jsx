import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CloudRain, Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Thermometer, Wind, Droplets, Loader2, Info, Compass, Radio, Maximize2 } from 'lucide-react';
import L from 'leaflet';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function RadarAlertsPage() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const farmIdParam = searchParams.get('farm_id');

  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [radarFrames, setRadarFrames] = useState([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const radarLayerRef = useRef(null);
  const markerRef = useRef(null);
  const playTimerRef = useRef(null);

  // Load farms on mount
  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const res = await api.getFarms(currentUser.id);
        const farmList = res.farms || [];
        setFarms(farmList);

        if (farmList.length > 0) {
          const matched = farmIdParam ? farmList.find((f) => f.id === farmIdParam) : null;
          setSelectedFarm(matched || farmList[0]);
        } else {
          // Fallback demo farm
          setSelectedFarm({
            id: 'default',
            name: 'Central Agricultural Zone',
            village: 'Rampur',
            crop_type: 'Paddy',
            latitude: 28.6139,
            longitude: 77.2090
          });
        }
      } catch (err) {
        console.error('Failed to load farms:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser, farmIdParam]);

  // Load weather and RainViewer frames
  useEffect(() => {
    if (!selectedFarm) return;

    async function fetchWeatherAndRadar() {
      const lat = parseFloat(selectedFarm.latitude) || 28.6139;
      const lon = parseFloat(selectedFarm.longitude) || 77.2090;

      // 1. Fetch live Open-Meteo weather
      try {
        const weather = await api.getFarmWeather(selectedFarm.id, lat, lon);
        setWeatherData(weather);
      } catch (err) {
        console.warn('Weather fetch error:', err);
      }

      // 2. Fetch RainViewer radar timestamps
      try {
        const rvRes = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const rvData = await rvRes.json();
        const past = (rvData.radar && rvData.radar.past) || [];
        const nowcast = (rvData.radar && rvData.radar.nowcast) || [];
        const allFrames = [...past, ...nowcast];
        setRadarFrames(allFrames);
        if (allFrames.length > 0) {
          setCurrentFrameIdx(past.length > 0 ? past.length - 1 : 0);
        }
      } catch (err) {
        console.warn('RainViewer API error:', err);
      }
    }

    fetchWeatherAndRadar();
  }, [selectedFarm]);

  // Initialize Leaflet Map with Esri Satellite Basemap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const initialLat = selectedFarm ? parseFloat(selectedFarm.latitude) : 28.6139;
      const initialLon = selectedFarm ? parseFloat(selectedFarm.longitude) : 77.2090;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLon], 9);
      mapRef.current = map;

      // High-resolution Esri Satellite Basemap
      const esri = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri World Imagery',
          maxZoom: 18
        }
      ).addTo(map);

      // OpenStreetMap street layer
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      });

      L.control.layers({ 'Satellite (Esri)': esri, 'Streets (OSM)': osm }, null, { position: 'topright' }).addTo(map);

      // Farm Marker
      const marker = L.marker([initialLat, initialLon])
        .addTo(map)
        .bindPopup(`<b>${selectedFarm?.name || 'Selected Farm'}</b><br>Village: ${selectedFarm?.village || 'Rampur'}`);
      markerRef.current = marker;
    } else if (selectedFarm) {
      const newLat = parseFloat(selectedFarm.latitude) || 28.6139;
      const newLon = parseFloat(selectedFarm.longitude) || 77.2090;
      mapRef.current.setView([newLat, newLon], 9);
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLon]);
        markerRef.current.getPopup().setContent(`<b>${selectedFarm.name}</b><br>Village: ${selectedFarm.village || 'Rampur'}`);
      }
    }
  }, [selectedFarm]);

  // Update radar overlay layer on index change
  useEffect(() => {
    if (!mapRef.current || radarFrames.length === 0) return;

    const currentFrame = radarFrames[currentFrameIdx];
    if (!currentFrame) return;

    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current);
    }

    const radarTileUrl = `https://tilecache.rainviewer.com/v2/radar/${currentFrame.time}/256/{z}/{x}/{y}/2/1_1.png`;
    const radarLayer = L.tileLayer(radarTileUrl, {
      opacity: 0.8,
      zIndex: 10,
      maxZoom: 18
    }).addTo(mapRef.current);

    radarLayerRef.current = radarLayer;
  }, [currentFrameIdx, radarFrames]);

  // Play / Pause loop
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % radarFrames.length);
      }, 700);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, radarFrames.length]);

  const getFormattedFrameTime = () => {
    if (radarFrames.length === 0 || !radarFrames[currentFrameIdx]) return 'Loading radar frames...';
    const timestamp = radarFrames[currentFrameIdx].time;
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Chart.js configuration
  const hourlyTimes = weatherData?.hourly?.time ? weatherData.hourly.time.slice(0, 24).map((t) => {
    const d = new Date(t);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }) : [];

  const hourlyPrecip = weatherData?.hourly?.precipitation ? weatherData.hourly.precipitation.slice(0, 24) : [];

  const chartData = {
    labels: hourlyTimes,
    datasets: [
      {
        label: 'Precipitation (mm/hour)',
        data: hourlyPrecip,
        borderColor: '#0284C7',
        backgroundColor: 'rgba(2, 132, 199, 0.25)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#0284C7'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: (context) => ` Predicted Rain: ${context.parsed.y} mm/h`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Precipitation (mm/h)', color: '#64748B', font: { weight: 'bold' } },
        grid: { color: '#F1F5F9' }
      },
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 8, color: '#64748B' }
      }
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      
      {/* Page Header with Farm Selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.4rem)', fontWeight: 900, color: 'var(--forest-950)', letterSpacing: '-0.02em' }}>
              Live Doppler Radar & Weather Forecast
            </h1>
            <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
              <span className="live-dot"></span>
              <span>Doppler Loop Active</span>
            </span>
          </div>
          <p style={{ color: 'var(--slate-600)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            RainViewer cloud reflection loop and Open-Meteo hourly numerical precipitation curve
          </p>
        </div>

        {farms.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--slate-800)' }}>Focused Field:</label>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 220, fontWeight: 600, fontSize: '0.975rem', minHeight: 44 }}
              value={selectedFarm?.id || ''}
              onChange={(e) => {
                const found = farms.find((f) => f.id === e.target.value);
                if (found) setSelectedFarm(found);
              }}
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.village})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Real-time Weather Observation Chips */}
      {weatherData?.current && (
        <div className="grid-cards" style={{ marginBottom: '2.5rem' }}>
          
          <div className="card card-interactive" style={{ padding: '1.5rem', borderLeft: '5px solid #EA580C', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--slate-600)', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Thermometer size={18} color="#EA580C" /> Temperature
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--forest-950)', marginTop: 6 }}>
              {weatherData.current.temperature_2m}°C
            </div>
            <div style={{ fontSize: '0.925rem', color: 'var(--slate-500)', marginTop: 4 }}>
              Relative Humidity: <strong style={{ color: 'var(--slate-800)' }}>{weatherData.current.relative_humidity_2m}%</strong>
            </div>
          </div>

          <div className="card card-interactive" style={{ padding: '1.5rem', borderLeft: '5px solid #0284C7', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--slate-600)', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Wind size={18} color="#0284C7" /> Surface Wind
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--forest-950)', marginTop: 6 }}>
              {weatherData.current.wind_speed_10m} km/h
            </div>
            <div style={{ fontSize: '0.925rem', color: 'var(--slate-500)', marginTop: 4 }}>
              Direction: <strong style={{ color: 'var(--slate-800)' }}>{weatherData.current.wind_direction_10m || 180}° (SW gusts)</strong>
            </div>
          </div>

          <div className="card card-interactive" style={{ padding: '1.5rem', borderLeft: '5px solid #0D9488', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--slate-600)', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Droplets size={18} color="#0D9488" /> Rain Probability
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--forest-950)', marginTop: 6 }}>
              {weatherData.current.precipitation_probability || 0}%
            </div>
            <div style={{ fontSize: '0.925rem', color: 'var(--slate-500)', marginTop: 4 }}>
              Upcoming 60-min window
            </div>
          </div>

          <div className="card card-interactive" style={{ padding: '1.5rem', borderLeft: '5px solid #10B981', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--slate-600)', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <ShieldCheck size={18} color="var(--forest-600)" /> IMD 24h Category
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--forest-800)', marginTop: 8 }}>
              {weatherData.imd_category || 'No Significant Rain'}
            </div>
            <div style={{ fontSize: '0.925rem', color: 'var(--slate-500)', marginTop: 4 }}>
              Deterministic threshold check
            </div>
          </div>

        </div>
      )}

      {/* Live Radar Map Card with Controls */}
      <div className="card" style={{ marginBottom: '2.5rem', padding: '1.85rem', borderRadius: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--forest-950)' }}>
              Live Doppler Radar Reflectivity
            </h2>
            <p style={{ fontSize: '0.975rem', color: 'var(--slate-600)', marginTop: 4 }}>
              RainViewer storm clouds composite overlaid on high-resolution Esri World Imagery
            </p>
          </div>

          {/* Interactive Player Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn btn-primary btn-sm"
              style={{ minWidth: 120, fontWeight: 700 }}
            >
              {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Play Loop</>}
            </button>

            <button
              onClick={() => { setIsPlaying(false); setCurrentFrameIdx(0); }}
              className="btn btn-outline btn-sm"
              title="Reset to earliest frame"
            >
              <RotateCcw size={18} />
            </button>

            <div className="badge badge-slate" style={{ fontSize: '0.9rem', padding: '0.5rem 0.95rem' }}>
              Radar Time: <strong style={{ color: 'var(--forest-900)', marginLeft: 6 }}>{getFormattedFrameTime()}</strong>
            </div>
          </div>
        </div>

        {/* Leaflet Radar Map Viewport */}
        <div style={{ position: 'relative' }}>
          <div ref={mapContainerRef} className="radar-map-container" />

          {/* Compass & Distance HUD Badge */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            color: '#FFFFFF',
            borderRadius: 8,
            padding: '0.5rem 0.85rem',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}>
            <Compass size={14} color="#34D399" />
            <span>SW ➔ NE VECTOR • 14 km/h</span>
          </div>

          {/* Doppler Reflectivity Legend Pill */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            borderRadius: 8,
            padding: '0.45rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            zIndex: 30,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ color: '#64748B' }}>Intensity:</span>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ width: 12, height: 10, background: '#38BDF8', borderRadius: 2 }} title="Light (<2.5mm)"></span>
              <span style={{ width: 12, height: 10, background: '#10B981', borderRadius: 2 }} title="Moderate (2.5-7.5mm)"></span>
              <span style={{ width: 12, height: 10, background: '#F59E0B', borderRadius: 2 }} title="Heavy (7.6-15mm)"></span>
              <span style={{ width: 12, height: 10, background: '#EF4444', borderRadius: 2 }} title="Very Heavy (>15mm)"></span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#10B981' }}>Live</span>
          </div>
        </div>

        {/* Frame Timeline Slider */}
        {radarFrames.length > 0 && (
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--slate-200)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Earlier (-120m)</span>
            <input
              type="range"
              min={0}
              max={radarFrames.length - 1}
              value={currentFrameIdx}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrameIdx(parseInt(e.target.value, 10));
              }}
              style={{ flex: 1, accentColor: 'var(--forest-700)', cursor: 'pointer', height: 6 }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Nowcast (+30m)</span>
          </div>
        )}
      </div>

      {/* 24-Hour Precipitation Chart */}
      <div className="card" style={{ marginBottom: '2.25rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--forest-950)' }}>
              Next 24-Hour Precipitation Forecast (mm)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: 2 }}>
              High-resolution hourly numerical weather prediction for {selectedFarm?.name || 'Selected Field'}
            </p>
          </div>
          <span className="badge badge-blue">Open-Meteo High-Res</span>
        </div>

        <div style={{ height: 280, width: '100%' }}>
          {hourlyPrecip.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--slate-400)', fontSize: '0.95rem' }}>
              No precipitation forecasted in the upcoming 24 hours.
            </div>
          )}
        </div>
      </div>

      {/* Official IMD Rainfall Classification Reference */}
      <div className="card" style={{ borderLeft: '5px solid var(--forest-600)', padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <Info size={20} color="var(--forest-700)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-950)' }}>
            Official IMD Rainfall Classification Scale
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '1.25rem' }}>
          Deterministic alert thresholds are strictly aligned with standard criteria formulated by the India Meteorological Department:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem', fontSize: '0.85rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: 8, border: '1px solid var(--slate-200)' }}>
            <strong style={{ color: 'var(--slate-700)', display: 'block', marginBottom: 2 }}>Very Light Rain:</strong>
            <span>0.1 – 2.4 mm / 24h</span>
          </div>
          <div style={{ padding: '0.75rem', background: '#ECFDF5', borderRadius: 8, border: '1px solid var(--emerald-border)' }}>
            <strong style={{ color: 'var(--forest-700)', display: 'block', marginBottom: 2 }}>Light Rain:</strong>
            <span>2.5 – 15.5 mm / 24h</span>
          </div>
          <div style={{ padding: '0.75rem', background: '#FFFBEB', borderRadius: 8, border: '1px solid var(--amber-border)' }}>
            <strong style={{ color: '#B45309', display: 'block', marginBottom: 2 }}>Moderate Rain:</strong>
            <span>15.6 – 64.4 mm / 24h</span>
          </div>
          <div style={{ padding: '0.75rem', background: '#FEF2F2', borderRadius: 8, border: '1px solid var(--red-border)' }}>
            <strong style={{ color: '#B91C1C', display: 'block', marginBottom: 2 }}>Heavy Rain:</strong>
            <span>64.5 – 115.5 mm / 24h</span>
          </div>
          <div style={{ padding: '0.75rem', background: '#450A0A', color: '#FFFFFF', borderRadius: 8 }}>
            <strong style={{ color: '#FECACA', display: 'block', marginBottom: 2 }}>Very / Extremely Heavy:</strong>
            <span>&gt;115.6 mm / 24h</span>
          </div>
        </div>
      </div>

    </div>
  );
}
