/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Kids — App router
 */
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useKidsStore from './store/authStore';
import Login   from './pages/Login';
import Home    from './pages/Home';
import Player  from './pages/Player';
import Profile from './pages/Profile';

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🎮</div>
      <div style={{ width: 36, height: 36, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, token } = useKidsStore();
  if (!user && !token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { loading, checkAuth } = useKidsStore();

  useEffect(() => { checkAuth(); }, []);

  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/home"  element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/player/:id" element={<ProtectedRoute><Player /></ProtectedRoute>} />
      <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/"           element={<Navigate to="/home" replace />} />
      <Route path="*"           element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
