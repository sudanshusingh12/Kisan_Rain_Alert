import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloudRain, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials or login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: 'var(--slate-50)'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div className="brand-icon-box">
              <CloudRain size={24} />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--forest-900)' }}>
              Kisan Rain Alert
            </span>
          </Link>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Sign in to monitor your farm weather & radar
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backgroundColor: 'var(--red-50)',
              border: '1px solid var(--red-border)',
              color: 'var(--red-500)',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="form-control"
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--slate-200)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--slate-200)' }}></div>
          </div>

          {/* Instant Demo Login Button */}
          <button
            type="button"
            onClick={handleDemo}
            disabled={submitting}
            className="btn btn-outline"
            style={{ width: '100%', borderColor: 'var(--emerald-border)', color: 'var(--forest-700)', backgroundColor: 'var(--emerald-light)' }}
          >
            <Sparkles size={16} /> Instant Demo Farmer Login
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
            Don't have an account yet?{' '}
            <Link to="/register" style={{ color: 'var(--forest-700)', fontWeight: 600 }}>
              Register Farm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

