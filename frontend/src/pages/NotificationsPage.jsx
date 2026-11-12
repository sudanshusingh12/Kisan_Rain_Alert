import React, { useState, useEffect } from 'react';
import { Bell, Check, Save, Smartphone, MessageSquare, ShieldAlert, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState({
    sms_enabled: false,
    whatsapp_enabled: true,
    min_severity: 'moderate',
    language: 'English'
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const [prefRes, notifRes] = await Promise.all([
          api.getPreferences(currentUser.id).catch(() => ({ preferences: null })),
          api.getNotifications(currentUser.id).catch(() => ({ notifications: [] }))
        ]);

        if (prefRes.preferences) {
          setPreferences({
            sms_enabled: prefRes.preferences.sms_enabled ?? false,
            whatsapp_enabled: prefRes.preferences.whatsapp_enabled ?? true,
            min_severity: prefRes.preferences.min_severity || 'moderate',
            language: prefRes.preferences.language || 'English'
          });
        }
        setNotifications(notifRes.logs || notifRes.notifications || []);
      } catch (err) {
        console.error('Error loading notification data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.updatePreferences({
        user_id: currentUser.id,
        ...preferences
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.4rem)', fontWeight: 900, color: 'var(--forest-950)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Notification Settings & Alert Logs
        </h1>
        <p style={{ color: 'var(--slate-600)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Configure SMS/WhatsApp channels and review all delivered meteorological advisories
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Preferences Form */}
        <div className="card" style={{ padding: '1.85rem', borderRadius: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'var(--emerald-50)', color: 'var(--forest-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={22} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--forest-950)' }}>Alert Channels</h2>
          </div>

          {savedSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem', background: 'var(--emerald-50)', border: '1px solid var(--emerald-border)', borderRadius: 12, color: 'var(--forest-800)', fontSize: '0.975rem', marginBottom: '1.5rem', fontWeight: 600 }}>
              <CheckCircle2 size={20} color="#10B981" /> Preferences successfully updated!
            </div>
          )}

          <form onSubmit={handleSavePreferences}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', padding: '0.85rem 1rem', background: 'var(--slate-50)', borderRadius: 12, border: '1px solid var(--slate-200)' }}>
                <input
                  type="checkbox"
                  checked={preferences.sms_enabled}
                  onChange={(e) => setPreferences({ ...preferences, sms_enabled: e.target.checked })}
                  style={{ width: 20, height: 20, accentColor: 'var(--forest-700)' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.025rem', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Smartphone size={18} color="var(--forest-700)" /> SMS Text Alerts (Fast2SMS)
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginTop: 2 }}>Instant text delivery to {currentUser?.phone || 'registered mobile'}</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', padding: '0.85rem 1rem', background: 'var(--slate-50)', borderRadius: 12, border: '1px solid var(--slate-200)' }}>
                <input
                  type="checkbox"
                  checked={preferences.whatsapp_enabled}
                  onChange={(e) => setPreferences({ ...preferences, whatsapp_enabled: e.target.checked })}
                  style={{ width: 20, height: 20, accentColor: 'var(--forest-700)' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.025rem', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} color="#059669" /> WhatsApp Messages
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginTop: 2 }}>Rich advisory cards with radar map previews</div>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Rainfall Severity to Trigger Alert</label>
              <select
                className="form-control"
                value={preferences.min_severity}
                onChange={(e) => setPreferences({ ...preferences, min_severity: e.target.value })}
              >
                <option value="light">Light Rain (≥ 2.5 mm) & above</option>
                <option value="moderate">Moderate Rain (≥ 15.6 mm) & above (Recommended)</option>
                <option value="heavy">Heavy Rain (≥ 64.5 mm) only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Advisory Language</label>
              <select
                className="form-control"
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="Marathi">मराठी (Marathi)</option>
                <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                <option value="Telugu">తెలుగు (Telugu)</option>
              </select>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', fontSize: '1.025rem' }}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Save Preferences</span>
            </button>
          </form>
        </div>

        {/* Audit Log / Delivered Alerts */}
        <div className="card" style={{ padding: '1.85rem', borderRadius: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'var(--sky-50)', color: 'var(--sky-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--forest-950)' }}>Dispatched Alerts History</h2>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 size={30} className="animate-spin" color="var(--forest-700)" />
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'var(--slate-50)', borderRadius: 14, border: '1.5px dashed var(--slate-300)' }}>
              <ShieldAlert size={40} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--slate-800)', fontSize: '1.05rem', fontWeight: 700 }}>No alerts triggered in your area yet.</p>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: 4, lineHeight: 1.5 }}>
                When precipitation meets official IMD criteria, notification dispatch audits will record here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 480, overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ padding: '1.15rem', border: '1px solid var(--slate-200)', borderRadius: 14, background: '#FFFFFF', boxShadow: 'var(--card-shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--forest-950)' }}>{n.title || 'Rainfall Advisory'}</strong>
                    <span className="badge badge-amber" style={{ fontSize: '0.8rem' }}>{n.channel || 'SMS'}</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--slate-700)', marginBottom: 8, lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>Status: <strong style={{ color: 'var(--forest-700)' }}>{n.status || 'Delivered'}</strong></span>
                    <span>{new Date(n.created_at || Date.now()).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

