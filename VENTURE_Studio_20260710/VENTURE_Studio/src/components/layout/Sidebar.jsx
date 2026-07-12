/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { C, NAV_ITEMS } from '../../theme';
import useStreamStore from '../../store/streamStore';
import { ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';

export default function Sidebar({ onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobileDrawer = !!onClose;
  const isLive = useStreamStore((s) => s.isLive);

  return (
    <div style={{
      width: collapsed ? 64 : 220,
      minHeight: '100vh',
      background: C.card,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 16px' : '0 20px',
        borderBottom: `1px solid ${C.border}`,
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: C.gradPrimary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: '#fff', fontSize: 14, flexShrink: 0,
        }}>V</div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text, letterSpacing: '-0.3px' }}>
            VENTURE Studio
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const showLive = item.id === 'stream' && isLive;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 16px' : '10px 20px',
                color: isActive ? C.primary : C.muted,
                background: isActive ? `${C.primary}18` : 'transparent',
                borderLeft: isActive ? `2px solid ${C.primary}` : '2px solid transparent',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                position: 'relative',
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {showLive && (
                    <span style={{
                      background: '#EF4444', color: '#fff', fontSize: 10,
                      padding: '1px 6px', borderRadius: 99, fontWeight: 700, letterSpacing: 0.5,
                    }}>LIVE</span>
                  )}
                </>
              )}
              {collapsed && showLive && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, borderRadius: '50%', background: '#EF4444',
                }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: 12 }}>
        {/* Mobile app switcher */}
        <a
          href="venture://"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '8px 4px' : '8px 12px',
            borderRadius: 8,
            background: `${C.accent}15`,
            color: C.accent,
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <Smartphone size={16} />
          {!collapsed && 'Open Mobile App'}
        </a>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: 8, borderRadius: 8,
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.dim, cursor: 'pointer',
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span style={{ marginLeft: 8, fontSize: 12 }}>Collapse</span>}
        </button>
      </div>
    </div>
  );
}
