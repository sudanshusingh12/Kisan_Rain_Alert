import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FarmsPage from './pages/FarmsPage';
import RadarAlertsPage from './pages/RadarAlertsPage';
import NotificationsPage from './pages/NotificationsPage';
import AppLayout from './components/AppLayout';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/index.html" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login.html" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register.html" element={<RegisterPage />} />

          {/* Protected Routes wrapped in AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard.html" element={<DashboardPage />} />
            <Route path="/farms" element={<FarmsPage />} />
            <Route path="/farms.html" element={<FarmsPage />} />
            <Route path="/alerts" element={<RadarAlertsPage />} />
            <Route path="/alerts.html" element={<RadarAlertsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/notifications.html" element={<NotificationsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

