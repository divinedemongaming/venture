/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { C } from '../theme';
import useAuthStore from '../store/authStore';
import { useDashboard } from '../hooks/useDashboard';
import { CardSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, Users, DollarSign, Star, UploadCloud, Radio, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';

function StatCard({ icon: Icon, label, value, change, color }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '20px 24px',
      display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 180,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>{label}</div>
        <div style={{ color: C.text, fontSize: 24, fontWeight: 700 }}>{value}</div>
        {change && <div style={{ color: '#10B981', fontSize: 12, marginTop: 4 }}>↑ {change} this week</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, loading, error, refetch } = useDashboard();

  if (loading) return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ height: 32, marginBottom: 28 }} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        {[1,2,3,4].map(i => <CardSkeleton key={i} rows={2} />)}
      </div>
      <CardSkeleton rows={5} />
    </div>
  );

  if (error) return <div style={{ padding: 32 }}><ErrorState message={error} onRetry={refetch} /></div>;

  const stats = data?.stats || {};
  const viewsChart = data?.viewsChart || [];
  const topContent = data?.topContent || [];
  const pending = data?.pending || {};

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>
          Welcome back, {user?.displayName || 'Creator'} 👋
        </h1>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Here's what's happening with your channel today.</p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Go Live', icon: Radio, to: '/stream', color: '#EF4444' },
          { label: 'Upload Video', icon: UploadCloud, to: '/upload', color: C.primary },
          { label: 'View Analytics', icon: TrendingUp, to: '/analytics', color: C.accent },
          { label: 'Comments', icon: MessageSquare, to: '/comments', color: '#F59E0B' },
        ].map(({ label, icon: Icon, to, color }) => (
          <Link key={label} to={to} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: C.card,
            border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}>
            <Icon size={16} color={color} />{label}
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard icon={Eye} label="Total Views" value={stats.views ? (stats.views / 1000).toFixed(0) + 'K' : '847K'} change="12.4K" color={C.accent} />
        <StatCard icon={Users} label="Subscribers" value={stats.subscribers ? stats.subscribers.toLocaleString() : '14.2K'} change="412" color={C.primary} />
        <StatCard icon={DollarSign} label="Est. Earnings" value={stats.earnings ? `$${stats.earnings.toLocaleString()}` : '$2,840'} change="$284" color="#10B981" />
        <StatCard icon={Star} label="Avg Rating" value={stats.avgRating || '4.8'} color="#F59E0B" />
      </div>

      {/* Chart + pending */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
        <div style={{ flex: 2, minWidth: 320, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>Views — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={viewsChart}>
              <defs>
                <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: C.dim, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Area type="monotone" dataKey="views" stroke={C.primary} fill="url(#vg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 220, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Needs Attention</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { color: '#F59E0B', text: `${pending.comments || 3} comments awaiting review`, icon: AlertCircle },
              { color: C.accent, text: `${pending.processing || 1} video processing`, icon: UploadCloud },
              { color: C.primary, text: `${pending.newSubs || 12} new subscribers today`, icon: Star },
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 8 }}>
                <Icon size={16} color={color} />
                <span style={{ color: C.text, fontSize: 13 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top content */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: 0 }}>Top Content</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `${C.border}40` }}>
              {['Title', 'Views', 'Earnings', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 24px', textAlign: 'left', color: C.dim, fontSize: 12, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topContent.map((row) => (
              <tr key={row.title} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: '12px 24px', color: C.text, fontSize: 14 }}>{row.title}</td>
                <td style={{ padding: '12px 24px', color: C.muted, fontSize: 14 }}>{row.views}</td>
                <td style={{ padding: '12px 24px', color: '#10B981', fontSize: 14 }}>{row.earnings}</td>
                <td style={{ padding: '12px 24px' }}>
                  <span style={{ background: row.status === 'Published' ? '#10B98120' : `${C.amber}20`, color: row.status === 'Published' ? '#10B981' : C.amber, padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
