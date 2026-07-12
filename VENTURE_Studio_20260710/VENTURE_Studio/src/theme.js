/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import {
  LayoutDashboard, UploadCloud, Library, BarChart3,
  DollarSign, MessageSquare, CalendarDays, Radio, Settings
} from 'lucide-react';

export const C = {
  bg: '#0A0A0F',
  card: '#111118',
  cardHover: '#161622',
  border: '#1E293B',
  borderLight: '#2D3748',
  primary: '#7C3AED',
  primaryDim: 'rgba(124,58,237,0.15)',
  accent: '#06B6D4',
  accentDim: 'rgba(6,182,212,0.15)',
  amber: '#F59E0B',
  amberDim: 'rgba(245,158,11,0.15)',
  success: '#10B981',
  successDim: 'rgba(16,185,129,0.15)',
  danger: '#EF4444',
  dangerDim: 'rgba(239,68,68,0.15)',
  text: '#F8FAFC',
  muted: '#94A3B8',
  dim: '#64748B',
  gradPrimary: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
  gradFire: 'linear-gradient(135deg, #F59E0B, #EF4444)',
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',       path: '/dashboard', icon: LayoutDashboard },
  { id: 'upload',    label: 'Upload',           path: '/upload',    icon: UploadCloud },
  { id: 'library',   label: 'Content Library',  path: '/library',   icon: Library },
  { id: 'analytics', label: 'Analytics',        path: '/analytics', icon: BarChart3 },
  { id: 'monetize',  label: 'Monetization',     path: '/monetize',  icon: DollarSign },
  { id: 'comments',  label: 'Comments',         path: '/comments',  icon: MessageSquare },
  { id: 'scheduler', label: 'Scheduler',        path: '/scheduler', icon: CalendarDays },
  { id: 'stream',    label: 'Stream Studio',    path: '/stream',    icon: Radio },
  { id: 'settings',  label: 'Settings',         path: '/settings',  icon: Settings },
];
