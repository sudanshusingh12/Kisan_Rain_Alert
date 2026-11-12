import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, CloudRain, Bell, LogOut, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Farms', path: '/farms', icon: MapPin },
    { name: 'Radar & Weather', path: '/alerts', icon: CloudRain },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--slate-500)' }}>
            Farmer Portal
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--slate-600)',
              padding: '0.4rem',
              borderRadius: '8px',
              display: isOpen ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ fontSize: '1.05rem', padding: '0.85rem 1.15rem' }}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile card at bottom */}
        <div style={{
          borderTop: '1px solid var(--slate-200)',
          paddingTop: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--forest-800) 0%, var(--forest-600) 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.05rem',
              boxShadow: '0 3px 6px rgba(8, 59, 43, 0.2)'
            }}>
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'F'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.full_name || 'Farmer'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.phone || currentUser?.email || 'Active Session'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-outline btn-sm"
            style={{ width: '100%', justifyContent: 'center', color: 'var(--red-600)', borderColor: 'var(--red-border)', fontSize: '0.925rem', minHeight: '42px' }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

