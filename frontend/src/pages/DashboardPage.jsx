import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CloudRain, ShieldAlert, Radio, Plus, CheckCircle2, ArrowRight, Loader2, Sparkles, Thermometer, Wind, Droplets, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import FarmWeatherWidget from '../components/FarmWeatherWidget';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [farms, setFarms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulatedAlert, setSimulatedAlert] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [farmsRes, alertsRes] = await Promise.all([
        api.getFarms(currentUser.id).catch(() => ({ farms: [] })),
        api.getAlerts(currentUser.id).catch(() => ({ alerts: [] }))
      ]);
      setFarms(farmsRes.farms || []);
      setAlerts(alertsRes.alerts || []);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateAlert = async () => {
    if (!currentUser) return;
    setSimulating(true);
    setSimulatedAlert(null);
    try {
      const res = await api.simulateTestAlert(currentUser.id, currentUser.phone);
      if (res && res.alert) {
        setSimulatedAlert({
          ...res.alert,
          sms_status: res.sms_status,
          email_status: res.email_status
        });
        // Refresh alerts list
        const updatedAlerts = await api.getAlerts(currentUser.id).catch(() => ({ alerts: [] }));
        setAlerts(updatedAlerts.alerts || []);
      }
    } catch (err) {
      console.error('Failed to simulate alert', err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 380, gap: '1.25rem' }}>
        <Loader2 className="animate-spin" size={36} color="var(--forest-700)" />
        <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem', fontWeight: 500 }}>Connecting to IMD deterministic engine & Doppler radar...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      
      {/* Aesthetic Nature-Tech Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #05241B 0%, #083D2E 50%, #0E5C46 100%)',
        borderRadius: 22,
        padding: '2.25rem 2.5rem',
        marginBottom: '2.5rem',
        color: '#FFFFFF',
        boxShadow: '0 16px 36px -8px rgba(5, 36, 27, 0.35)',
        border: '1px solid rgba(52, 211, 153, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Falling Rain Shimmer Overlay */}
        <div className="hero-rain-overlay" />

        {/* Decorative Atmospheric Lighting Glow Orbs */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.22) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: -80,
          left: '30%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.16) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.75rem' }}>
          <div style={{ maxWidth: 680 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#A7F3D0',
                padding: '0.35rem 0.95rem',
                borderRadius: 9999,
                fontSize: '0.875rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span className="live-dot" style={{ width: 9, height: 9 }}></span>
                <span>Doppler Radar Live</span>
              </span>

              <span style={{ fontSize: '0.925rem', color: '#D1FAE5', fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.1rem, 4vw, 2.85rem)',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              marginBottom: '0.65rem'
            }}>
              Good day, {currentUser?.full_name ? currentUser.full_name.split(' ')[0] : 'Farmer'} 🌾
            </h1>

            <p style={{
              color: '#D1FAE5',
              fontSize: '1.1rem',
              lineHeight: 1.6,
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              IMD deterministic radar models are continuously scanning your monitored plots for early precipitation warnings.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={handleSimulateAlert}
              disabled={simulating}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                boxShadow: '0 8px 20px -2px rgba(245, 158, 11, 0.45)',
                border: '1px solid rgba(254, 243, 199, 0.3)',
                fontSize: '1.025rem',
                minHeight: 52,
                borderRadius: 14
              }}
            >
              {simulating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              <span>Simulate IMD Alert</span>
            </button>

            <Link
              to="/farms"
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #84CC16 0%, #10B981 100%)',
                color: '#05241B',
                boxShadow: '0 8px 20px -2px rgba(16, 185, 129, 0.45)',
                border: '1px solid rgba(236, 252, 203, 0.4)',
                fontSize: '1.025rem',
                minHeight: 52,
                borderRadius: 14,
                fontWeight: 800
              }}
            >
              <Plus size={20} />
              <span>Add New Farm</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Simulated Alert Notification Banner with Pulse Glow */}
      {simulatedAlert && (
        <div className="animate-warning-glow" style={{
          backgroundColor: '#FFFBEB',
          border: '2px solid #FCD34D',
          borderRadius: 18,
          padding: '1.85rem',
          marginBottom: '2.5rem',
          boxShadow: '0 14px 28px -5px rgba(245, 158, 11, 0.22)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)' }}>
                <ShieldAlert size={32} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <h4 style={{ fontWeight: 900, color: '#92400E', fontSize: '1.35rem' }}>
                    {simulatedAlert.title || 'IMD Rainfall Warning Triggered'}
                  </h4>
                  <span className="badge badge-amber" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                    {simulatedAlert.rainfall_category || 'Moderate Rain'}
                  </span>
                </div>
                <p style={{ color: '#92400E', fontSize: '1.1rem', marginTop: 8, lineHeight: 1.6, fontWeight: 500 }}>
                  {simulatedAlert.alert_message || simulatedAlert.message}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: 14, fontSize: '0.975rem', color: '#78350F' }}>
                  <span>Precipitation Rate: <strong>{simulatedAlert.precipitation_rate || 4.8} mm/h</strong></span>
                  <span>•</span>
                  <span>Observation: <strong>Reflectivity Core SW</strong></span>
                  <span>•</span>
                  <span>Email Advisory: <strong style={{ color: simulatedAlert.email_status?.startsWith('delivered') ? '#047857' : '#2563EB' }}>
                    {simulatedAlert.email_status?.startsWith('delivered')
                      ? '✓ Delivered to Inbox (Free)'
                      : (simulatedAlert.email_status ? `Status: ${simulatedAlert.email_status}` : 'Dispatched')}
                  </strong></span>
                  <span>•</span>
                  <span>Mobile SMS: <strong style={{ color: '#047857' }}>Disabled (₹0 Saved)</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSimulatedAlert(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#92400E',
                padding: '0.4rem',
                borderRadius: '8px'
              }}
              title="Dismiss warning"
            >
              <X size={26} />
            </button>
          </div>
        </div>
      )}

      {/* Aesthetic Colored Metric Stats Cards */}
      <div className="grid-cards" style={{ marginBottom: '2.5rem' }}>
        
        {/* Monitored Fields Card - Luminous Emerald */}
        <div className="card card-interactive" style={{
          background: 'linear-gradient(145deg, #FFFFFF 0%, #F0FDF4 100%)',
          border: '1.5px solid #A7F3D0',
          borderTop: '5px solid #10B981',
          padding: '1.85rem',
          borderRadius: 20,
          boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.025rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Monitored Fields
            </span>
            <div style={{
              padding: '0.75rem',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              boxShadow: '0 6px 16px -2px rgba(16, 185, 129, 0.35)'
            }}>
              <MapPin size={24} />
            </div>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#022C22', marginTop: '0.5rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {farms.length}
          </div>
          <div style={{ fontSize: '1.025rem', color: '#047857', marginTop: '0.45rem', fontWeight: 600 }}>
            Active coordinate feeds
          </div>
        </div>

        {/* Rain Alerts Active Card - Sunset Amber Glow */}
        <div className="card card-interactive" style={{
          background: 'linear-gradient(145deg, #FFFFFF 0%, #FFFBEB 100%)',
          border: '1.5px solid #FDE68A',
          borderTop: '5px solid #F59E0B',
          padding: '1.85rem',
          borderRadius: 20,
          boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.14)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.025rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rain Alerts Active
            </span>
            <div style={{
              padding: '0.75rem',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              boxShadow: '0 6px 16px -2px rgba(245, 158, 11, 0.4)'
            }}>
              <ShieldAlert size={24} />
            </div>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: alerts.length > 0 ? '#B45309' : '#78350F', marginTop: '0.5rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {alerts.length}
          </div>
          <div style={{ fontSize: '1.025rem', color: '#B45309', marginTop: '0.45rem', fontWeight: 600 }}>
            Threshold triggers in last 24h
          </div>
        </div>

        {/* IMD Rule Engine Card - Atmospheric Sky Blue Glow */}
        <div className="card card-interactive" style={{
          background: 'linear-gradient(145deg, #FFFFFF 0%, #F0F9FF 100%)',
          border: '1.5px solid #BAE6FD',
          borderTop: '5px solid #0284C7',
          padding: '1.85rem',
          borderRadius: 20,
          boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.14)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.025rem', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              IMD Rule Engine
            </span>
            <div style={{
              padding: '0.75rem',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
              color: '#FFFFFF',
              boxShadow: '0 6px 16px -2px rgba(2, 132, 199, 0.35)'
            }}>
              <Radio size={24} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0C4A6E', marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="live-dot" style={{ width: 12, height: 12 }}></span>
            <span>Deterministic Active</span>
          </div>
          <div style={{ fontSize: '1.025rem', color: '#0284C7', marginTop: '0.45rem', fontWeight: 600 }}>
            15-minute Doppler polling
          </div>
        </div>

      </div>

      {/* Monitored Farms Section */}
      <div className="card" style={{ marginBottom: '2.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--forest-950)' }}>
              My Monitored Farms & Plots
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--slate-600)', marginTop: 4 }}>
              High-resolution satellite pinned coordinates & real-time observations
            </p>
          </div>
          <Link to="/farms" style={{ fontSize: '1rem', color: 'var(--forest-700)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Manage All Farms</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {farms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--slate-50)', borderRadius: 16, border: '1.5px dashed var(--slate-300)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--emerald-50)', color: 'var(--forest-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <MapPin size={32} />
            </div>
            <h4 style={{ fontWeight: 800, color: 'var(--slate-900)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              No farm fields registered yet
            </h4>
            <p style={{ color: 'var(--slate-600)', fontSize: '1.025rem', maxWidth: 480, margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
              Pin your agricultural field on our high-resolution Esri satellite map to activate live Doppler radar alerts.
            </p>
            <Link to="/farms" className="btn btn-primary">
              <Plus size={18} /> Add Your First Farm
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="card card-interactive"
                style={{
                  border: '1px solid var(--slate-200)',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.5rem',
                  borderRadius: 16
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.15rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--forest-950)' }}>{farm.name}</h3>
                      <p style={{ fontSize: '1.05rem', color: 'var(--slate-600)', marginTop: 4 }}>
                        Village: <strong style={{ color: 'var(--slate-800)' }}>{farm.village || 'Rampur'}</strong>
                      </p>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '0.4rem 0.95rem' }}>{farm.crop_type || 'Rice (Paddy)'}</span>
                  </div>

                  {/* Field Area & Coordinates Box */}
                  <div style={{
                    background: 'var(--slate-50)',
                    padding: '1rem 1.25rem',
                    borderRadius: 14,
                    margin: '0.85rem 0 0.5rem',
                    border: '1px solid var(--slate-200)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>Field Area</span>
                      <strong style={{ color: 'var(--slate-900)', fontSize: '1.15rem' }}>{farm.area_acres || 1} Acres</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>Coordinates</span>
                      <strong style={{ color: 'var(--forest-800)', fontFamily: 'monospace', fontSize: '1.05rem' }}>
                        {parseFloat(farm.latitude).toFixed(3)}°N, {parseFloat(farm.longitude).toFixed(3)}°E
                      </strong>
                    </div>
                  </div>

                  {/* Live Weather Station & Microclimate Interface */}
                  <FarmWeatherWidget farm={farm} />
                </div>

                <div style={{ marginTop: '1.35rem', paddingTop: '1.15rem', borderTop: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.975rem', color: 'var(--forest-700)', fontWeight: 800 }}>
                    <span className="live-dot" style={{ width: 10, height: 10 }}></span>
                    <span>Radar Active</span>
                  </div>
                  <Link to={`/alerts?farm_id=${farm.id}`} className="btn btn-outline" style={{ fontSize: '0.975rem', padding: '0.6rem 1.25rem', minHeight: 44, borderRadius: 12 }}>
                    <CloudRain size={18} color="#0284C7" />
                    <span>View Doppler Radar</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
