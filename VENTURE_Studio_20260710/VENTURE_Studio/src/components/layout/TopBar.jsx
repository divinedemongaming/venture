/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { C } from '../../theme';
import useAuthStore from '../../store/authStore';
import useStreamStore from '../../store/streamStore';
import { Search, Bell, LogOut, User, Radio } from 'lucide-react';

function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TopBar({ onMenuPress }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isLive, duration, viewerCount } = useStreamStore();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      {/* Live status bar */}
      {isLive && (
        <div style={{
          background: 'linear-gradient(90deg, #EF4444, #DC2626)',
          height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 24, fontSize: 13, color: '#fff', fontWeight: 600,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#fff',
              animation: 'livePulse 1.2s ease-in-out infinite',
            }} />
            LIVE
          </span>
          <span>{formatDuration(duration)}</span>
          <span>{viewerCount.toLocaleString()} viewers</span>
        </div>
      )}

      {/* Main top bar */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        {/* Search */}
        <div style={{
          flex: 1, maxWidth: 400, position: 'relative',
        }}>
          {onMenuPress && (
          <button
            onClick={onMenuPress}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 8px 0 0' }}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        <Search size={16} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: C.dim,
          }} />
          <input
            placeholder="Search content, analytics…"
            style={{
              width: '100%', padding: '8px 12px 8px 36px',
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ flex: 1 }} />

        {/* Notifications */}
        <button style={{
          background: 'transparent', border: `1px solid ${C.border}`,
          borderRadius: 8, padding: 8, color: C.muted, cursor: 'pointer',
          position: 'relative',
        }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%', background: C.primary,
          }} />
        </button>

        {/* Live indicator chip */}
        {isLive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#EF444420', border: '1px solid #EF4444',
            borderRadius: 99, padding: '4px 12px',
            color: '#EF4444', fontSize: 12, fontWeight: 700,
          }}>
            <Radio size={12} />
            BROADCASTING
          </div>
        )}

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '6px 12px',
              color: C.text, cursor: 'pointer', fontSize: 14,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: C.gradPrimary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              {user?.displayName?.[0] || 'D'}
            </div>
            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName || 'Creator'}
            </span>
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute', top: '110%', right: 0,
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, minWidth: 160, zIndex: 100,
              overflow: 'hidden',
            }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', width: '100%',
                background: 'transparent', border: 'none',
                color: C.text, fontSize: 14, cursor: 'pointer',
              }} onClick={() => setShowMenu(false)}>
                <User size={16} /> Profile
              </button>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', width: '100%',
                background: 'transparent', border: 'none',
                color: '#EF4444', fontSize: 14, cursor: 'pointer',
                borderTop: `1px solid ${C.border}`,
              }} onClick={logout}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
