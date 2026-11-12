import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { CloudRain, Menu, Bell, ShieldCheck, LayoutDashboard, MapPin, User, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="mobile-sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: 'var(--slate-800)',
              borderRadius: '8px'
            }}
          >
            <Menu size={26} />
          </button>

          <Link to="/dashboard" className="brand-logo">
            <div className="brand-icon-box">
              <CloudRain size={24} />
            </div>
            <span>Kisan Rain Alert</span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="badge badge-green" style={{ display: 'none' }} id="live-badge">
            <span className="live-dot" style={{ width: 8, height: 8 }}></span>
            <span style={{ fontWeight: 700 }}>IMD Rules Active</span>
          </div>

          {/* Farmer Profile Status Pill */}
          {currentUser && (
            <div className="farmer-header-pill" style={{
              display: 'none',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 9999,
              background: 'rgba(240, 253, 244, 0.9)',
              border: '1.5px solid #A7F3D0',
              fontSize: '0.9rem',
              color: '#064E3B'
            }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'F'}
              </div>
              <span style={{ fontWeight: 800 }}>{currentUser.full_name?.split(' ')[0] || 'Farmer'}</span>
            </div>
          )}

          <Link to="/notifications" className="btn btn-outline btn-sm" title="Notifications" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minHeight: 42 }}>
            <Bell size={18} />
            <span style={{ display: 'none' }} className="header-notif-text">Alerts</span>
          </Link>

          <button
            onClick={handleLogout}
            className="btn btn-outline btn-sm"
            title="Log out of session"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minHeight: 42, color: '#991B1B' }}
          >
            <LogOut size={16} />
            <span style={{ display: 'none' }} className="header-logout-text">Exit</span>
          </button>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .mobile-sidebar-toggle { display: block !important; }
          }
          @media (min-width: 640px) {
            #live-badge { display: inline-flex !important; }
            .header-notif-text { display: inline !important; }
            .header-logout-text { display: inline !important; }
          }
          @media (min-width: 768px) {
            .farmer-header-pill { display: inline-flex !important; }
          }
        `}</style>
      </header>

      {/* Main Body */}
      <div className="app-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-content">
          <div key={location.pathname} className="route-page-container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Full Agri Portal Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar for High-Accessibility App Experience */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon-wrapper">
            <LayoutDashboard size={20} />
          </div>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/farms"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon-wrapper">
            <MapPin size={20} />
          </div>
          <span>My Farms</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon-wrapper">
            <CloudRain size={20} />
          </div>
          <span>Radar</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon-wrapper">
            <Bell size={20} />
          </div>
          <span>Alerts</span>
        </NavLink>
      </nav>
    </div>
  );
}

