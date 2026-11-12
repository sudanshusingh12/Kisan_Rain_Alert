import React from 'react';
import { Link } from 'react-router-dom';
import { CloudRain, Radio, ShieldCheck, PhoneCall, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(180deg, #021811 0%, #04241A 100%)',
      color: '#FFFFFF',
      borderTop: '1px solid rgba(16, 185, 129, 0.25)',
      marginTop: 'auto',
      padding: '3rem 1.75rem 2rem 1.75rem',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        
        {/* Main 4-Column Footer Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}>
          
          {/* Col 1: Brand & Purpose */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}>
                <CloudRain size={22} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                Kisan Rain Alert
              </span>
            </div>

            <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Autonomous meteorological intelligence and live Doppler radar monitoring designed for Indian farmers. Real-time SMS alerts protect crops from unseasonal rains.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.35rem 0.85rem', borderRadius: 9999, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#6EE7B7', fontSize: '0.825rem', fontWeight: 700 }}>
              <span className="live-dot" style={{ width: 8, height: 8 }} />
              <span>IMD Deterministic Engine Active</span>
            </div>
          </div>

          {/* Col 2: Farmer Navigation */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Farmer Portals
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.975rem' }}>
              <li>
                <Link to="/dashboard" style={{ color: '#CBD5E1', transition: 'color 0.15s ease' }} onMouseEnter={(e) => e.target.style.color = '#34D399'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                  • Farmer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/farms" style={{ color: '#CBD5E1', transition: 'color 0.15s ease' }} onMouseEnter={(e) => e.target.style.color = '#34D399'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                  • My Monitored Fields
                </Link>
              </li>
              <li>
                <Link to="/alerts" style={{ color: '#CBD5E1', transition: 'color 0.15s ease' }} onMouseEnter={(e) => e.target.style.color = '#34D399'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                  • Live Doppler Radar & Forecasts
                </Link>
              </li>
              <li>
                <Link to="/notifications" style={{ color: '#CBD5E1', transition: 'color 0.15s ease' }} onMouseEnter={(e) => e.target.style.color = '#34D399'} onMouseLeave={(e) => e.target.style.color = '#CBD5E1'}>
                  • SMS Logs & Alert Thresholds
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Government Agri Helplines */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Farmer Helplines & Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#CBD5E1' }}>
                <PhoneCall size={16} color="#34D399" />
                <span>Kisan Call Centre: <strong>1800-180-1551</strong> (Toll Free)</span>
              </li>
              <li>
                <a href="https://mausam.imd.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#93C5FD', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>IMD Mausam Official Portal</span>
                  <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a href="https://pmfby.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#93C5FD', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Pradhan Mantri Fasal Bima Yojana</span>
                  <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a href="https://agricoop.nic.in" target="_blank" rel="noopener noreferrer" style={{ color: '#93C5FD', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Ministry of Agriculture & Farmers Welfare</span>
                  <ExternalLink size={14} />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Telemetry & Technology Stack */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Telemetry Pipeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: '#94A3B8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>Radar Source</span>
                <strong style={{ color: '#38BDF8' }}>RainViewer / IMD DWR</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>NWP Model</span>
                <strong style={{ color: '#34D399' }}>Open-Meteo High-Res</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>Mobile Gateway</span>
                <strong style={{ color: '#FCD34D' }}>Fast2SMS (India Bulk V2)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cloud PostgreSQL</span>
                <strong style={{ color: '#A78BFA' }}>Supabase Encrypted</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Sub-Footer Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.9rem',
          color: '#94A3B8'
        }}>
          <div>
            © {new Date().getFullYear()} <strong>Kisan Rain Alert</strong> • Precision Agrometeorological Intelligence.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#A7F3D0', fontWeight: 600 }}>
            <span>Built with dedication for Indian Farmers</span>
            <span style={{ fontSize: '1.1rem' }}>🇮🇳</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

