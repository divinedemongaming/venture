/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Studio — Mobile bottom navigation bar
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, Library, BarChart2, DollarSign, Settings } from 'lucide-react';
import { C } from '../../theme';

const ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home'      },
  { path: '/upload',    icon: Upload,          label: 'Upload'    },
  { path: '/library',   icon: Library,         label: 'Library'   },
  { path: '/analytics', icon: BarChart2,        label: 'Analytics' },
  { path: '/settings',  icon: Settings,         label: 'Settings'  },
];

export default function MobileNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', height: 64,
      background: C.card,
      borderTop: `1px solid ${C.border}`,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {ITEMS.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path} to={path}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, textDecoration: 'none',
            color: isActive ? C.primary : C.textMuted,
            transition: 'color 0.15s',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, letterSpacing: 0.3 }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
