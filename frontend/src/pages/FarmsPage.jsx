import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Trash2, Crosshair, CloudRain, AlertCircle, Loader2, X, Check, Globe, Layers, Navigation } from 'lucide-react';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import FarmWeatherWidget from '../components/FarmWeatherWidget';

// Fix Leaflet's default icon paths in bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function FarmsPage() {
  const { currentUser } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [locatingGps, setLocatingGps] = useState(false);

  // Form states (NO state or district fields!)
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [cropType, setCropType] = useState('Rice (Paddy)');
  const [areaAcres, setAreaAcres] = useState('2.5');
  const [lat, setLat] = useState('28.6139');
  const [lon, setLon] = useState('77.2090');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    loadFarms();
  }, [currentUser]);

  const loadFarms = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await api.getFarms(currentUser.id);
      setFarms(res.farms || []);
    } catch (err) {
      console.error('Error fetching farms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (farmId) => {
    if (!window.confirm('Are you sure you want to remove this farm from radar monitoring?')) return;
    setDeletingId(farmId);
    try {
      await api.deleteFarm(farmId, currentUser.id);
      setFarms(farms.filter((f) => f.id !== farmId));
    } catch (err) {
      alert(err.message || 'Failed to delete farm');
    } finally {
      setDeletingId(null);
    }
  };

  // Initialize satellite map picker when modal opens
  useEffect(() => {
    if (!showModal) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const initialLat = parseFloat(lat) || 28.6139;
      const initialLon = parseFloat(lon) || 77.2090;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLon], 14);
      mapInstanceRef.current = map;

      // High-resolution Esri World Imagery Satellite basemap
      const esriSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri World Imagery',
          maxZoom: 18
        }
      ).addTo(map);

      const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      });

      L.control.layers(
        { 'Satellite (Esri)': esriSatellite, 'Street Map (OSM)': osmStandard },
        null,
        { position: 'topright' }
      ).addTo(map);

      // Draggable marker
      const marker = L.marker([initialLat, initialLon], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        setLat(position.lat.toFixed(6));
        setLon(position.lng.toFixed(6));
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat.toFixed(6));
        setLon(e.latlng.lng.toFixed(6));
      });

      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [showModal]);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingGps(false);
        const newLat = position.coords.latitude.toFixed(6);
        const newLon = position.coords.longitude.toFixed(6);
        setLat(newLat);
        setLon(newLon);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLon], 16);
          markerRef.current.setLatLng([newLat, newLon]);
        }
      },
      (err) => {
        setLocatingGps(false);
        alert('Could not detect GPS location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveFarm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a farm name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: currentUser.id,
        farm_name: name.trim(),
        name: name.trim(),
        village: village.trim() || 'Unspecified Village',
        crop_type: cropType,
        area_acres: parseFloat(areaAcres) || 1.0,
        farm_size_acres: parseFloat(areaAcres) || 1.0,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      };

      const res = await api.createFarm(payload);
      if (res && res.farm) {
        setFarms([res.farm, ...farms]);
        setShowModal(false);
        setName('');
        setVillage('');
      } else {
        throw new Error(res?.error || res?.message || 'Failed to create farm');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save farm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.4rem)', fontWeight: 900, color: 'var(--forest-950)', letterSpacing: '-0.02em' }}>
              My Agricultural Farms
            </h1>
            <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
              <span>{farms.length} Plots Monitored</span>
            </span>
          </div>
          <p style={{ color: 'var(--slate-600)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Pinpoint field boundaries on high-resolution Esri satellite imagery for precision radar warnings
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ fontSize: '0.975rem' }}>
          <Plus size={18} />
          <span>Add New Farm</span>
        </button>
      </div>

      {/* Farms Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={36} className="animate-spin" color="var(--forest-700)" />
        </div>
      ) : farms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4.5rem 1.75rem', border: '1.5px dashed var(--slate-300)', borderRadius: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--emerald-50)', color: 'var(--forest-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <MapPin size={32} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--forest-950)', marginBottom: '0.5rem' }}>
            No agricultural fields registered yet
          </h2>
          <p style={{ color: 'var(--slate-600)', maxWidth: 480, margin: '0 auto 1.75rem', fontSize: '1.025rem', lineHeight: 1.6 }}>
            Drop a pin on your field using our Esri World Imagery satellite map or phone GPS to start receiving automated IMD rainfall warnings.
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} /> Register Your First Field
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {farms.map((farm) => (
            <div key={farm.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.85rem', borderRadius: 18 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.15rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--forest-950)' }}>{farm.name}</h3>
                    <p style={{ fontSize: '1.05rem', color: 'var(--slate-600)', marginTop: 4 }}>
                      Village: <strong style={{ color: 'var(--slate-800)' }}>{farm.village || 'Rampur'}</strong>
                    </p>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.4rem 0.95rem' }}>
                    {farm.crop_type || 'Field Crop'}
                  </span>
                </div>

                {/* Field Details Box */}
                <div style={{ background: 'var(--slate-50)', padding: '1.15rem 1.35rem', borderRadius: 14, margin: '1rem 0 0.5rem', border: '1px solid var(--slate-200)', fontSize: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--slate-500)', fontWeight: 700 }}>Field Area:</span>
                    <strong style={{ color: 'var(--slate-900)', fontSize: '1.15rem' }}>{farm.area_acres || 1} Acres</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--slate-500)', fontWeight: 700 }}>Coordinates:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--forest-900)', backgroundColor: '#ECFDF5', padding: '5px 12px', borderRadius: 10, border: '1px solid var(--emerald-border)', fontSize: '1.025rem' }}>
                      {parseFloat(farm.latitude).toFixed(4)}° N, {parseFloat(farm.longitude).toFixed(4)}° E
                    </span>
                  </div>
                </div>

                {/* Live Weather & Microclimate Station */}
                <FarmWeatherWidget farm={farm} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--slate-200)', gap: '0.85rem' }}>
                <Link to={`/alerts?farm_id=${farm.id}`} className="btn btn-outline" style={{ flex: 1, minHeight: 46, fontSize: '1rem' }}>
                  <CloudRain size={18} color="#0284C7" />
                  <span>Doppler Radar</span>
                </Link>

                <button
                  onClick={() => handleDelete(farm.id)}
                  disabled={deletingId === farm.id}
                  className="btn btn-danger"
                  title="Remove farm from monitoring"
                  style={{ minWidth: 46, minHeight: 46, padding: '0.5rem 0.85rem' }}
                >
                  {deletingId === farm.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Farm Modal with Esri Satellite Map */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--forest-800), var(--forest-600))', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--forest-950)' }}>Add New Agricultural Field</h3>
                  <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', marginTop: 2 }}>Drop a pin directly onto your plot boundaries</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', padding: '0.4rem', borderRadius: '8px' }}>
                <X size={26} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '1rem', background: 'var(--red-50)', border: '1px solid var(--red-border)', borderRadius: 12, color: 'var(--red-600)', fontSize: '0.95rem', marginBottom: '1.5rem', fontWeight: 500 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveFarm}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Farm Plot Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. North Acre #2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Village Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Rampur"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Primary Crop</label>
                  <select className="form-control" value={cropType} onChange={(e) => setCropType(e.target.value)}>
                    <option value="Rice (Paddy)">Rice (Paddy)</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Maize">Maize</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Pulses">Pulses</option>
                    <option value="Mustard / Oilseeds">Mustard / Oilseeds</option>
                    <option value="Other">Other Crops</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Field Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-control"
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                  />
                </div>
              </div>

              {/* Satellite Map Picker */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Pin Field on Satellite Imagery
                  </label>
                  <button
                    type="button"
                    onClick={handleUseGPS}
                    disabled={locatingGps}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    {locatingGps ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} color="#0D5C3A" />}
                    <span>Use My Current GPS</span>
                  </button>
                </div>

                <div ref={mapContainerRef} className="map-picker-container" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>Latitude (North)</label>
                    <input
                      type="text"
                      readOnly
                      className="form-control"
                      style={{ backgroundColor: 'var(--slate-100)', fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 700 }}
                      value={lat}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>Longitude (East)</label>
                    <input
                      type="text"
                      readOnly
                      className="form-control"
                      style={{ backgroundColor: 'var(--slate-100)', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600 }}
                      value={lon}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', borderTop: '1px solid var(--slate-100)', paddingTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Save Agricultural Field</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
