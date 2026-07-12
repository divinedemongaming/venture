/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Kids — Home feed
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useKidsStore from '../store/authStore';
import { kidsAPI } from '../services/api';

const CATS = [
  { key: 'ALL',          label: 'All',        emoji: '🌟' },
  { key: 'EDUCATIONAL',  label: 'Learn',      emoji: '📚' },
  { key: 'ANIMATION',    label: 'Cartoons',   emoji: '🎨' },
  { key: 'MUSIC',        label: 'Music',      emoji: '🎵' },
  { key: 'SCIENCE',      label: 'Science',    emoji: '🔬' },
  { key: 'NATURE',       label: 'Nature',     emoji: '🌿' },
  { key: 'SPORTS',       label: 'Sports',     emoji: '⚽' },
  { key: 'STORIES',      label: 'Stories',    emoji: '📖' },
];

const CAT_COLORS = {
  EDUCATIONAL: '#4FACFE', ANIMATION: '#A78BFA', MUSIC: '#F472B6',
  SCIENCE: '#3ECFB0', NATURE: '#7EC850', SPORTS: '#FF6584',
  STORIES: '#FFD23F', GAMING_FAMILY: '#FF6B35', ALL: '#FF6B35',
};

function formatDuration(s) {
  if (!s) return '';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

function ContentCard({ item, onPress }) {
  const cat  = item.tags?.[0] || 'EDUCATIONAL';
  const color = CAT_COLORS[cat] || '#FF6B35';
  return (
    <button
      onClick={() => onPress(item)}
      style={{
        background: 'var(--card)', borderRadius: 16, overflow: 'hidden',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        transition: 'transform 0.15s', width: '100%',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ position: 'relative', paddingTop: '60%', background: color + '22' }}>
        {item.thumbnailUrl
          ? <img src={item.thumbnailUrl} alt={item.title || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
              {CATS.find(c => c.key === cat)?.emoji || '🎉'}
            </div>
        }
        {item.duration && (
          <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '2px 6px' }}>
            {formatDuration(item.duration)}
          </span>
        )}
        <span style={{ position: 'absolute', top: 8, left: 8, background: color, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>
          {CATS.find(c => c.key === cat)?.label || cat}
        </span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, margin: '0 0 4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {item.title || item.content?.slice(0, 80) || 'Watch Now'}
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 11, margin: 0 }}>
          {item.creator?.displayName || item.creator?.username || 'Creator'}
        </p>
      </div>
    </button>
  );
}

function TimesUpWall({ minutesUsed, onExtend }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 64 }}>⏰</div>
      <h2 style={{ color: 'var(--text)', fontSize: 28, fontWeight: 800, textAlign: 'center', margin: 0 }}>Time's Up!</h2>
      <p style={{ color: 'var(--muted)', fontSize: 15, textAlign: 'center', maxWidth: 300, margin: 0 }}>
        You've watched for {minutesUsed} minute{minutesUsed !== 1 ? 's' : ''} today. Ask a grown-up to give you more time!
      </p>
      <button onClick={onExtend} style={{ background: 'var(--orange)', color: '#fff', padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer', border: 'none', marginTop: 8 }}>
        🔓 Ask Parent to Extend
      </button>
    </div>
  );
}

function PinModal({ visible, title, onConfirm, onCancel }) {
  const [pin, setPin]   = useState('');
  const [err, setErr]   = useState('');
  const { verifyPin }   = useKidsStore();
  if (!visible) return null;
  const submit = async () => {
    const ok = await verifyPin(pin);
    if (ok) { setPin(''); setErr(''); onConfirm(); }
    else    { setErr('Incorrect PIN'); setPin(''); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--card)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, border: '1px solid var(--border)' }}>
        <span style={{ fontSize: 40 }}>🔐</span>
        <h3 style={{ color: 'var(--text)', fontWeight: 800, margin: 0 }}>{title}</h3>
        <input
          type="password" inputMode="numeric" maxLength={4} placeholder="••••"
          value={pin} onChange={e => { setPin(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
          style={{ width: 140, padding: '14px', background: 'rgba(255,255,255,0.06)', border: '2px solid var(--orange)', borderRadius: 12, color: 'var(--text)', fontSize: 24, textAlign: 'center', letterSpacing: 8, outline: 'none' }}
        />
        {err && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border)' }}>Cancel</button>
          <button onClick={submit}   style={{ flex: 1, padding: 12, borderRadius: 10, background: 'var(--orange)', color: '#fff', fontWeight: 700, cursor: 'pointer', border: 'none' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { kidsProfile, minutesUsed, timesUp, tickMinute, extendTime, logout } = useKidsStore();

  const [feed, setFeed]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [category, setCategory] = useState('ALL');
  const [cursor, setCursor]     = useState(null);
  const [hasMore, setHasMore]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showExtend, setShowExtend]   = useState(false);
  const [showExit, setShowExit]       = useState(false);
  const timerRef = useRef(null);

  // Screen time ticker — 1 tick per minute
  useEffect(() => {
    timerRef.current = setInterval(() => tickMinute(), 60_000);
    return () => clearInterval(timerRef.current);
  }, [tickMinute]);

  const loadFeed = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const cats = category === 'ALL'
        ? (kidsProfile?.allowedCategories || [])
        : [category];
      const { data } = await kidsAPI.getFeed(cats, reset ? null : cursor, 20);
      if (reset) setFeed(data.items || []);
      else setFeed(prev => [...prev, ...(data.items || [])]);
      setCursor(data.nextCursor || null);
      setHasMore(!!data.hasMore);
    } catch {
      setError('Could not load videos. Check your connection!');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, cursor, kidsProfile]);

  useEffect(() => { loadFeed(true); }, [category]);

  const handleVideoPress = (item) => {
    navigate('/player/' + item.id, {
      state: {
        videoUrl:     item.mediaUrls?.[0] || item.videoUrl,
        title:        item.title || item.content?.slice(0, 60) || 'Watch Now',
        creator:      item.creator?.displayName || item.creator?.username || 'Creator',
        thumbnailUrl: item.thumbnailUrl,
        duration:     item.duration,
      },
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🎮</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
            VENTURE <span style={{ color: 'var(--orange)' }}>Kids</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {kidsProfile?.dailyLimitMinutes > 0 && (
            <span style={{ color: minutesUsed > kidsProfile.dailyLimitMinutes * 0.8 ? '#f87171' : 'var(--muted)', fontSize: 12, fontWeight: 600 }}>
              ⏱ {minutesUsed}/{kidsProfile.dailyLimitMinutes}m
            </span>
          )}
          <button onClick={() => setShowExit(true)} style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)' }}>
            Exit
          </button>
        </div>
      </header>

      {/* Greeting */}
      {kidsProfile?.childName && (
        <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>👋</span>
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>
            Hey, {kidsProfile.childName}!
          </span>
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATS.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)} style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: category === c.key ? 'var(--orange)' : 'var(--card)',
            color:      category === c.key ? '#fff' : 'var(--muted)',
            border:     category === c.key ? 'none' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            <span>{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ flex: 1, padding: '0 12px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            <div style={{ fontSize: 40 }}>😔</div>
            <p style={{ marginTop: 12 }}>{error}</p>
            <button onClick={() => loadFeed(true)} style={{ marginTop: 16, background: 'var(--orange)', color: '#fff', padding: '10px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', border: 'none' }}>Try Again</button>
          </div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <p style={{ marginTop: 12 }}>No videos here yet!</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, paddingTop: 8 }}>
              {feed.map((item, i) => <ContentCard key={item.id || i} item={item} onPress={handleVideoPress} />)}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <button onClick={() => loadFeed(false)} disabled={loadingMore}
                  style={{ background: 'var(--card)', color: 'var(--orange)', padding: '12px 32px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--orange)' }}>
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)', borderTop: '1px solid var(--border)', display: 'flex', height: 60, zIndex: 50 }}>
        <button onClick={() => {}} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'var(--orange)', fontWeight: 700, fontSize: 10, cursor: 'pointer', border: 'none', background: 'none' }}>
          <span style={{ fontSize: 22 }}>🏠</span> Home
        </button>
        <button onClick={() => navigate('/profile')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'var(--muted)', fontWeight: 700, fontSize: 10, cursor: 'pointer', border: 'none', background: 'none' }}>
          <span style={{ fontSize: 22 }}>⭐</span> My Profile
        </button>
      </nav>

      {/* Times Up Wall */}
      {timesUp && <TimesUpWall minutesUsed={minutesUsed} onExtend={() => setShowExtend(true)} />}

      {/* Extend time PIN */}
      <PinModal visible={showExtend} title="Extend Time?" onConfirm={() => { extendTime(30); setShowExtend(false); }} onCancel={() => setShowExtend(false)} />

      {/* Exit PIN */}
      <PinModal visible={showExit} title="Exit Kids Mode?" onConfirm={() => { logout(); navigate('/'); }} onCancel={() => setShowExit(false)} />
    </div>
  );
}
