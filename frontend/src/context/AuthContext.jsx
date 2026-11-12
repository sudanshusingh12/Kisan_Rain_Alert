import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const SESSION_KEY = 'kisan_rain_session';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse stored session', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveUserSession = (user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res && res.user) {
      saveUserSession(res.user);
      return res.user;
    }
    throw new Error(res?.error || res?.message || 'Login failed');
  };

  const register = async ({ fullName, email, phone, password }) => {
    const res = await api.register({
      full_name: fullName,
      email,
      phone,
      password
    });
    if (res && res.user) {
      saveUserSession(res.user);
      return res.user;
    }
    throw new Error(res?.error || res?.message || 'Registration failed');
  };

  const loginDemo = async () => {
    try {
      // Try logging in with demo credentials against API first
      const res = await api.login({
        email: 'suresh@kisanrain.org',
        password: 'DemoPassword123!'
      });
      if (res && res.user) {
        saveUserSession(res.user);
        return res.user;
      }
    } catch (err) {
      console.warn('Backend demo login fell back to default demo profile:', err);
    }

    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Suresh Kumar (Demo Farmer)',
      email: 'suresh@kisanrain.org',
      phone: '+919876543210'
    };
    saveUserSession(demoUser);
    return demoUser;
  };

  const logout = () => {
    saveUserSession(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

