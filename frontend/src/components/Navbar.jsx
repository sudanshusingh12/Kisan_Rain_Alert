import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloudRain, Menu, X, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemo = async () => {
    await loginDemo();
    navigate('/dashboard');
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" className="brand-logo">
          <div className="brand-icon-box">
            <CloudRain size={22} />
          </div>
          <span>Kisan Rain Alert</span>
        </Link>

        {/* Desktop links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '1.75rem' }} className="desktop-nav">
          <a href="#features" style={{ color: 'var(--slate-700)', fontSize: '1rem', fontWeight: 600 }}>Features</a>
          <a href="#how-it-works" style={{ color: 'var(--slate-700)', fontSize: '1rem', fontWeight: 600 }}>How It Works</a>
          <a href="#radar-preview" style={{ color: 'var(--slate-700)', fontSize: '1rem', fontWeight: 600 }}>Live Radar</a>
        </nav>
      </div>

      {/* Desktop Auth Actions */}
      <div style={{ display: 'none', alignItems: 'center', gap: '0.85rem' }} className="desktop-auth">
        {currentUser ? (
          <>
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard <ArrowRight size={18} />
            </Link>
            <button onClick={logout} className="btn btn-outline btn-sm">Sign Out</button>
          </>
        ) : (
          <>
            <button onClick={handleDemo} className="btn btn-outline btn-sm">
              Demo Access
            </button>
            <Link to="/login" className="btn btn-outline btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Create Account
            </Link>
          </>
        )}
      </div>

      {/* Mobile Hamburger Button */}
      <button
        type="button"
        className="mobile-toggle-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation menu"
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.6rem',
          color: 'var(--slate-900)',
          borderRadius: '8px'
        }}
      >
        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: 'var(--header-height)',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderBottom: '1px solid var(--slate-200)',
          padding: '1.5rem',
          boxShadow: '0 12px 24px -4px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.15rem',
          zIndex: 60,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.75rem 0', fontWeight: 600, fontSize: '1.1rem', color: 'var(--slate-800)' }}>Features</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.75rem 0', fontWeight: 600, fontSize: '1.1rem', color: 'var(--slate-800)' }}>How It Works</a>
          <a href="#radar-preview" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.75rem 0', fontWeight: 600, fontSize: '1.1rem', color: 'var(--slate-800)' }}>Live Radar</a>
          <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentUser ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn btn-outline" style={{ width: '100%' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { handleDemo(); setMobileMenuOpen(false); }} className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--amber-border)', color: '#B45309', backgroundColor: 'var(--amber-50)' }}>
                  Demo Farmer Access
                </button>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline" style={{ width: '100%' }}>
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-auth { display: flex !important; }
        }
        @media (max-width: 767px) {
          .mobile-toggle-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}

