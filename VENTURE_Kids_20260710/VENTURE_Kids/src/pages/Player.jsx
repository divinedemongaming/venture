/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Kids — Video Player page
 */
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export default function Player() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const { state } = useLocation();

  const videoRef  = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [muted,   setMuted]     = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef(null);

  const { videoUrl, title, creator, thumbnailUrl } = state || {};

  const resetHide = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => playing && setShowControls(false), 3000);
  };

  useEffect(() => { return () => clearTimeout(hideTimer.current); }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else         { videoRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
    resetHide();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration: dur } = videoRef.current;
    setProgress(dur ? currentTime / dur : 0);
    setDuration(dur || 0);
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pct * duration;
    setProgress(pct);
    resetHide();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
    resetHide();
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2,'0')}`;
  };

  if (!videoUrl) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <span style={{ fontSize: 48 }}>😔</span>
        <p style={{ color: '#fff', fontWeight: 700 }}>Video not available</p>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--orange)', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', border: 'none' }}>← Go Back</button>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer' }}
      onClick={handleScreenTap}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        style={{ width: '100%', flex: 1, maxHeight: fullscreen ? '100vh' : '70vh', objectFit: 'contain', background: '#000' }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
        muted={muted}
        playsInline
      />

      {/* Controls overlay */}
      {showControls && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)' }}
          onClick={e => e.stopPropagation()}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 8px', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: 20, width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <div style={{ flex: 1 }}>
              {title   && <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>{title}</p>}
              {creator && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '2px 0 0' }}>{creator}</p>}
            </div>
          </div>

          {/* Center play/pause */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={togglePlay} style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 64, height: 64, fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {playing ? '⏸' : '▶'}
            </button>
          </div>

          {/* Bottom bar */}
          <div style={{ padding: '8px 16px 16px' }}>
            {/* Progress bar */}
            <div
              style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2, cursor: 'pointer', marginBottom: 10, position: 'relative' }}
              onClick={handleSeek}
            >
              <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--orange)', borderRadius: 2 }} />
              <div style={{ position: 'absolute', top: -6, left: `${progress * 100}%`, transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.5)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                {fmt(progress * duration)} / {fmt(duration)}
              </span>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setMuted(m => !m); resetHide(); }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: 4 }}>
                  {muted ? '🔇' : '🔊'}
                </button>
                <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: 4 }}>
                  {fullscreen ? '⛶' : '⛶'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info panel below video */}
      {title && (
        <div style={{ background: 'var(--bg)', padding: '16px 16px 80px' }}>
          <h2 style={{ color: 'var(--text)', fontWeight: 800, fontSize: 18, margin: '0 0 4px' }}>{title}</h2>
          {creator && <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>{creator}</p>}
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,107,53,0.15)', padding: '6px 12px', borderRadius: 20 }}>
            <span>🛡️</span>
            <span style={{ color: 'var(--orange)', fontSize: 12, fontWeight: 700 }}>Safe for Kids</span>
          </div>
        </div>
      )}
    </div>
  );

  function handleScreenTap() { resetHide(); }
}
