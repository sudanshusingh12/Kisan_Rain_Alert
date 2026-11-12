/**
 * Kisan Rain Alert - Unified API Client
 */

const API_BASE_URL = '/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => fetchApi('/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => fetchApi('/login', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: (userId) => fetchApi(`/profile?user_id=${userId}`),
  getConfig: () => fetchApi('/config'),

  // Farms
  getFarms: (userId) => fetchApi(`/farms${userId ? `?user_id=${userId}` : ''}`),
  getFarm: (farmId) => fetchApi(`/farms/${farmId}`),
  createFarm: (payload) => fetchApi('/farms', { method: 'POST', body: JSON.stringify(payload) }),
  deleteFarm: (farmId, userId) => fetchApi(`/farms/${farmId}${userId ? `?user_id=${userId}` : ''}`, { method: 'DELETE' }),
  getFarmWeather: (farmId, lat, lon) => fetchApi(`/farms/${farmId}/weather?lat=${lat}&lon=${lon}`),

  // Alerts & Monitoring
  getAlerts: (userId) => fetchApi(`/alerts${userId ? `?user_id=${userId}` : ''}`),
  simulateTestAlert: (userId, phone) => fetchApi('/alerts/test', { method: 'POST', body: JSON.stringify({ user_id: userId, phone }) }),

  // Notifications
  getNotifications: (userId) => fetchApi(`/notifications${userId ? `?user_id=${userId}` : ''}`),
  getPreferences: (userId) => fetchApi(`/notification-preferences?user_id=${userId}`),
  updatePreferences: (payload) => fetchApi('/notification-preferences', { method: 'PUT', body: JSON.stringify(payload) })
};

