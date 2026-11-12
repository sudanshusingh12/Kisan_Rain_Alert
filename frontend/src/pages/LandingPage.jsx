import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloudRain, ShieldCheck, MapPin, Bell, Radio, BarChart3, ArrowRight, CheckCircle2, Sparkles, Navigation, Droplets, Wind, Thermometer, Layers } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { currentUser, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemo = async () => {
    await loginDemo();
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <Navbar />

      {/* Hero Section with Ambient Glow */}
      <section style={{
        position: 'relative',
        background: 'radial-gradient(ellipse at 20% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(2, 132, 199, 0.12) 0%, transparent 55%), linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
        padding: '5rem 1.75rem 6rem 1.75rem',
        borderBottom: '1px solid var(--slate-200)',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
          
          {/* Left Hero Content */}
          <div>
            <div className="badge badge-green" style={{ marginBottom: '1.5rem', padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}>
              <span className="live-dot"></span>
              <span>Official IMD Deterministic Rainfall Scale</span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 4.8vw, 4rem)', fontWeight: 900, color: 'var(--forest-950)', lineHeight: 1.18, letterSpacing: '-0.03em', marginBottom: '1.75rem' }}>
              Precision Rainfall Warnings for Every Acre
            </h1>

            <p style={{ fontSize: '1.2rem', color: 'var(--slate-600)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 580 }}>
              Protect harvested produce, drying grains, and scheduled pesticide sprays. Live RainViewer Doppler radar reflections and Open-Meteo forecasts calibrated for Indian agriculture.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              {currentUser ? (
                <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.95rem 2.2rem', fontSize: '1.05rem' }}>
                  Open Farmer Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary" style={{ padding: '0.95rem 2.2rem', fontSize: '1.05rem' }}>
                    Register Your Farm Free <ArrowRight size={20} />
                  </Link>
                  <button onClick={handleDemo} className="btn btn-outline" style={{ padding: '0.95rem 1.85rem', fontSize: '1.05rem', borderColor: 'var(--amber-border)', backgroundColor: 'var(--amber-50)', color: '#B45309' }}>
                    <Sparkles size={20} color="#D97706" /> Try Instant Demo
                  </button>
                </>
              )}
            </div>

            <div style={{ marginTop: '3.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', color: 'var(--slate-700)', fontSize: '0.975rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <CheckCircle2 size={20} color="var(--forest-600)" /> Zero IoT Hardware
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <CheckCircle2 size={20} color="var(--forest-600)" /> Esri Satellite Field Zoom
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <CheckCircle2 size={20} color="var(--forest-600)" /> Direct SMS via Fast2SMS
              </div>
            </div>
          </div>

          {/* Right Hero Interactive Radar Card */}
          <div style={{ position: 'relative' }}>
            {/* Ambient Background Blur Orb */}
            <div style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              right: '10%',
              bottom: '10%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(2, 132, 199, 0.15) 50%, transparent 70%)',
              filter: 'blur(40px)',
              zIndex: 0
            }}></div>

            {/* Main Interactive Radar HUD Card */}
            <div className="card glass-card" style={{ position: 'relative', zIndex: 1, padding: '2rem', border: '1px solid rgba(16, 185, 129, 0.35)', boxShadow: '0 25px 40px -10px rgba(8, 59, 43, 0.12)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                    <span className="live-dot"></span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--forest-700)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Live Field Monitor</span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--forest-950)' }}>Green Valley Plot #4</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Village Rampur • Rice (Paddy)</p>
                </div>
                <span className="badge badge-amber" style={{ animation: 'warningGlow 2.5s infinite' }}>
                  IMD Moderate Rain
                </span>
              </div>

              {/* Simulated High-Tech Radar HUD Graphic */}
              <div style={{
                position: 'relative',
                height: 190,
                borderRadius: 12,
                background: 'radial-gradient(circle, #0B192C 0%, #040D1A 100%)',
                overflow: 'hidden',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Rotating Conic Sweep Beam */}
                <div style={{
                  position: 'absolute',
                  width: '280px',
                  height: '280px',
                  borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.35) 0deg, rgba(16, 185, 129, 0.05) 60deg, transparent 90deg)',
                  animation: 'radarSweep 4s linear infinite',
                  pointerEvents: 'none'
                }}></div>

                {/* Radar Concentric Distance Rings */}
                <div style={{ position: 'absolute', width: 70, height: 70, borderRadius: '50%', border: '1px dashed rgba(16, 185, 129, 0.4)' }}></div>
                <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', border: '1px dashed rgba(16, 185, 129, 0.3)' }}></div>
                <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: '1px dashed rgba(16, 185, 129, 0.2)' }}></div>

                {/* Simulated Rain Cloud Reflectivity Patch */}
                <div style={{
                  position: 'absolute',
                  top: '32%',
                  right: '28%',
                  width: 55,
                  height: 45,
                  borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.85) 0%, rgba(16, 185, 129, 0.7) 60%, transparent 100%)',
                  filter: 'blur(3px)',
                  animation: 'floatSlow 3s ease-in-out infinite'
                }}></div>

                {/* Center Farm Field Pin */}
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#EF4444', border: '2px solid #FFFFFF', boxShadow: '0 0 10px #EF4444' }}></div>
                  <span style={{ fontSize: '0.7rem', color: '#FFFFFF', fontWeight: 700, marginTop: 4, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>My Field</span>
                </div>

                {/* Radar HUD Corner Tags */}
                <div style={{ position: 'absolute', top: 8, left: 10, fontSize: '0.7rem', color: '#34D399', fontFamily: 'monospace' }}>
                  DOPPLER RADAR • 14 km/h NE
                </div>
                <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                  RANGE: 25 KM
                </div>
              </div>

              {/* Rain Accumulation Meter */}
              <div style={{ background: 'var(--slate-50)', padding: '1.15rem', borderRadius: 10, marginBottom: '1.25rem', border: '1px solid var(--slate-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)', fontWeight: 600 }}>Next 24h Rain Accumulation:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--forest-800)' }}>18.4 mm</span>
                </div>
                <div style={{ width: '100%', height: 9, background: 'var(--slate-200)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', background: 'linear-gradient(90deg, #10B981, #F59E0B)', borderRadius: 6 }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                  <span>Light Rain &lt;15.5mm</span>
                  <span>Threshold: Moderate (15.6 – 64.4mm)</span>
                </div>
              </div>

              {/* Action Advisories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.85rem', background: '#F0FDF4', borderRadius: 8, fontSize: '0.85rem', color: 'var(--forest-800)', border: '1px solid var(--emerald-border)' }}>
                  <Radio size={16} color="var(--forest-600)" />
                  <span>RainViewer Doppler: Storm cluster detected 12 km SW</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.85rem', background: '#FFFBEB', borderRadius: 8, fontSize: '0.85rem', color: '#92400E', border: '1px solid var(--amber-border)' }}>
                  <Bell size={16} color="#D97706" />
                  <span>Advisory: Pause pesticide spray. Clear drainage channels.</span>
                </div>
              </div>
            </div>

            {/* Floating Weather Micro Card (Top Right) */}
            <div className="card glass-card animate-float" style={{
              position: 'absolute',
              top: '-20px',
              right: '-15px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              borderRadius: 12,
              boxShadow: '0 12px 25px rgba(0,0,0,0.1)',
              zIndex: 2
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                <CloudRain size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 700, textTransform: 'uppercase' }}>Rain Rate</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--slate-900)' }}>4.8 mm/h</p>
              </div>
            </div>

            {/* Floating Weather Micro Card (Bottom Left) */}
            <div className="card glass-card animate-float-reverse" style={{
              position: 'absolute',
              bottom: '-25px',
              left: '-20px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              borderRadius: 12,
              boxShadow: '0 12px 25px rgba(0,0,0,0.1)',
              zIndex: 2
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 700, textTransform: 'uppercase' }}>IMD Status</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--forest-800)' }}>Active Advisory</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid with Aesthetic Cards */}
      <section id="features" style={{ padding: '5.5rem 1.75rem', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="badge badge-green" style={{ marginBottom: '1rem' }}>Key Capabilities</div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--forest-950)', marginBottom: '0.85rem', letterSpacing: '-0.02em' }}>
            Built Specifically for Indian Agriculture
          </h2>
          <p style={{ color: 'var(--slate-600)', maxWidth: 640, margin: '0 auto', fontSize: '1.05rem' }}>
            Combines satellite remote sensing, global numerical forecast models, and official national weather criteria to protect every harvest.
          </p>
        </div>

        <div className="grid-cards">
          
          <div className="card card-interactive">
            <div className="brand-icon-box" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, #0D5C3A, #10B981)' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-950)', marginBottom: '0.5rem' }}>
              IMD Deterministic Rules
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
              No black-box machine learning. Alerts strictly adhere to India Meteorological Department categories: Very Light, Light, Moderate, Heavy, and Very Heavy.
            </p>
          </div>

          <div className="card card-interactive">
            <div className="brand-icon-box" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, #0369A1, #0EA5E9)' }}>
              <Radio size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-950)', marginBottom: '0.5rem' }}>
              Live Doppler Radar Loop
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
              Watch rain clouds moving towards your coordinates in real-time. RainViewer continuous Doppler playback allows you to gauge storm direction and intensity.
            </p>
          </div>

          <div className="card card-interactive">
            <div className="brand-icon-box" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, #0D5C3A, #127A4E)' }}>
              <MapPin size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-950)', marginBottom: '0.5rem' }}>
              Esri World Imagery
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
              Pinpoint your exact agricultural field on high-resolution satellite imagery or use your phone's GPS for one-tap location detection.
            </p>
          </div>

          <div className="card card-interactive">
            <div className="brand-icon-box" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, #0369A1, #38BDF8)' }}>
              <BarChart3 size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-950)', marginBottom: '0.5rem' }}>
              24-Hour Precipitation Curve
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
              Interactive Chart.js graphs displaying exact millimeters predicted per hour from Open-Meteo so you can plan fertilizer and harvesting windows.
            </p>
          </div>

          <div className="card card-interactive">
            <div className="brand-icon-box" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
              <Bell size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-950)', marginBottom: '0.5rem' }}>
              Fast2SMS & WhatsApp
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
              High-speed Indian mobile text alerts delivered directly to your pocket with 3-hour alert deduplication so you're warned without notification spam.
            </p>
          </div>

          <div className="card card-interactive">
            <div className="brand-icon-box" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, #0D5C3A, #059669)' }}>
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-950)', marginBottom: '0.5rem' }}>
              Multi-Plot Registry
            </h3>
            <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
              Register and monitor multiple plots across different villages. Independent coordinate tracking and crop-specific guidance for every field.
            </p>
          </div>

        </div>
      </section>

      {/* How it works with visual steps */}
      <section id="how-it-works" style={{ background: 'var(--slate-50)', padding: '5.5rem 1.75rem', borderTop: '1px solid var(--slate-200)' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--forest-950)', marginBottom: '0.85rem' }}>
              How Kisan Rain Alert Operates
            </h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '1.05rem' }}>Automated meteorological intelligence designed for any smartphone or browser.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            
            <div className="card" style={{ textAlign: 'center', padding: '2.25rem 1.5rem' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest-800), var(--forest-600))', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', margin: '0 auto 1.5rem', boxShadow: '0 8px 16px rgba(8, 59, 43, 0.25)' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-950)', marginBottom: '0.65rem' }}>Pin Your Field</h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                Drop a pin on your field using our Esri satellite basemap or click 'Use My Current GPS' on your smartphone.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2.25rem 1.5rem' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest-800), var(--forest-600))', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', margin: '0 auto 1.5rem', boxShadow: '0 8px 16px rgba(8, 59, 43, 0.25)' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-950)', marginBottom: '0.65rem' }}>Continuous Polling</h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                Our backend worker continuously evaluates incoming Open-Meteo forecasts and RainViewer Doppler radar reflections.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2.25rem 1.5rem' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest-800), var(--forest-600))', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', margin: '0 auto 1.5rem', boxShadow: '0 8px 16px rgba(8, 59, 43, 0.25)' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest-950)', marginBottom: '0.65rem' }}>Advance Farm Alerts</h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                Receive timely advance SMS warnings and actionable farming tips to cover harvested crops and halt chemical spraying.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Production Agri-Tech Footer */}
      <Footer />
    </div>
  );
}
