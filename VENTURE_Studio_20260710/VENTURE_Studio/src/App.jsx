/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Studio — App with responsive layout
 */
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Sidebar from './components/layout/Sidebar';
import TopBar  from './components/layout/TopBar';
import MobileNav from './components/layout/MobileNav';
import Dashboard    from './pages/Dashboard';
import Upload       from './pages/Upload';
import ContentLibrary from './pages/ContentLibrary';
import Analytics    from './pages/Analytics';
import Monetization from './pages/Monetization';
import Comments     from './pages/Comments';
import Scheduler    from './pages/Scheduler';
import StreamStudio from './pages/StreamStudio';
import Settings     from './pages/Settings';
import Login        from './pages/Login';
import Signup       from './pages/Signup';

function LoadingScreen() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 auto 16px' }}>V</div>
        <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>Loading VENTURE Studio…</p>
      </div>
    </div>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

function Layout({ children }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0A0A0F' }}>
      {/* Desktop sidebar — hidden on mobile */}
      {!isMobile && <Sidebar />}

      {/* Mobile sidebar drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }}
          />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 101, width: 240 }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar onMenuPress={isMobile ? () => setSidebarOpen(true) : undefined} />
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: isMobile ? 72 : 0 }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <MobileNav />}
    </div>
  );
}

export default function App() {
  const { user, token, loading, checkAuth } = useAuthStore();

  useEffect(() => { checkAuth(); }, []);

  if (loading) return <LoadingScreen />;
  if (!user && !token) return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>;
  if (token && !user)  return <LoadingScreen />;

  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload"    element={<Upload />} />
        <Route path="/library"   element={<ContentLibrary />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/monetize"  element={<Monetization />} />
        <Route path="/comments"  element={<Comments />} />
        <Route path="/scheduler" element={<Scheduler />} />
        <Route path="/stream"    element={<StreamStudio />} />
        <Route path="/settings"  element={<Settings />} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

