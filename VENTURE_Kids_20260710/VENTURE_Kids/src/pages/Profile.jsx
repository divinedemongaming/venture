/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Kids — Profile & Badges
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useKidsStore from '../store/authStore';

const BADGES = [
  { id: 'first_video',   label: 'First Watch',   emoji: '▶️',  desc: 'Watch your first video',    threshold: 1  },
  { id: 'five_videos',   label: 'Getting Comfy', emoji: '😊',  desc: 'Watch 5 videos',            threshold: 5  },
  { id: 'explorer',      label: 'Explorer',      emoji: '🗺️',  desc: 'Watch 10 videos',           threshold: 10 },
  { id: 'movie_buff',    label: 'Movie Buff',    emoji: '🎬',  desc: 'Watch 25 videos',           threshold: 25 },
  { id: 'super_fan',     label: 'Super Fan',     emoji: '⭐',   desc: 'Watch 50 videos',           threshold: 50 },
  { id: 'learner',       label: 'Learner',       emoji: '📚',  desc: 'Watch an educational video', threshold: 1  },
  { id: 'music_lover',   label: 'Music Lover',   emoji: '🎵',  desc: '5 music videos',            threshold: 5  },
];

function Badge({ badge, earned }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: 16, borderRadius: 16,
      background: earned ? 'rgba(255,107,53,0.15)' : 'var(--card)',
      border: `1px solid ${earned ? 'var(--orange)' : 'var(--border)'}`,
      opacity: earned ? 1 : 0.45,
      transition: 'all 0.2s',
    }}>
      <span style={{ fontSize: 32, filter: earned ? 'none' : 'grayscale(1)' }}>{badge.emoji}</span>
      <span style={{ color: earned ? 'var(--text)' : 'var(--muted)', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{badge.label}</span>
      {earned && <span style={{ fontSize: 9, color: 'var(--orange)', fontWeight: 700 }}>EARNED</span>}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { kidsProfile, minutesUsed } = useKidsStore();
  const [watchCount, setWatchCount] = useState(0);
  const [history, setHistory]       = useState([]);

  useEffect(() => {
    const count = parseInt(localStorage.getItem('venture_kids_videos_watched') || '0', 10);
    const hist  = JSON.parse(localStorage.getItem('venture_kids_watch_history') || '[]');
    setWatchCount(count);
    setHistory(hist);
  }, []);

  const earnedIds = new Set(
    BADGES.filter(b => watchCount >= b.threshold).map(b => b.id)
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 16, position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 50 }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
        <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>My Profile ⭐</span>
      </header>

      <div style={{ padding: 16 }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 12 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            {kidsProfile?.childName?.[0]?.toUpperCase() || '🌟'}
          </div>
          <h2 style={{ color: 'var(--text)', fontWeight: 800, fontSize: 20, margin: 0 }}>
            {kidsProfile?.childName || 'Explorer'}
          </h2>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Age group: {kidsProfile?.ageGroup || '—'}</span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Videos Watched', value: watchCount, emoji: '▶️' },
            { label: 'Watch Time',     value: minutesUsed + ' min', emoji: '⏱' },
            { label: 'Badges',         value: earnedIds.size, emoji: '🏅' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--card)', borderRadius: 14, padding: '14px 10px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22 }}>{s.emoji}</div>
              <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: 20, marginTop: 4 }}>{s.value}</div>
              <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <h3 style={{ color: 'var(--text)', fontWeight: 800, marginBottom: 12 }}>🏅 Badges</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, marginBottom: 24 }}>
          {BADGES.map(b => <Badge key={b.id} badge={b} earned={earnedIds.has(b.id)} />)}
        </div>

        {/* Recent watches */}
        {history.length > 0 && (
          <>
            <h3 style={{ color: 'var(--text)', fontWeight: 800, marginBottom: 12 }}>🕐 Recently Watched</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.slice(0, 8).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card)', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)' }}>
                  {item.thumbnailUrl
                    ? <img src={item.thumbnailUrl} alt="" style={{ width: 56, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                    : <div style={{ width: 56, height: 40, borderRadius: 8, background: 'rgba(255,107,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>▶️</div>
                  }
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title || 'Video'}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 11, margin: '2px 0 0' }}>
                      {item.creatorName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)', borderTop: '1px solid var(--border)', display: 'flex', height: 60, zIndex: 50 }}>
        <button onClick={() => navigate('/home')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'var(--muted)', fontWeight: 700, fontSize: 10, cursor: 'pointer', border: 'none', background: 'none' }}>
          <span style={{ fontSize: 22 }}>🏠</span> Home
        </button>
        <button onClick={() => {}} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'var(--orange)', fontWeight: 700, fontSize: 10, cursor: 'pointer', border: 'none', background: 'none' }}>
          <span style={{ fontSize: 22 }}>⭐</span> My Profile
        </button>
      </nav>
    </div>
  );
}
