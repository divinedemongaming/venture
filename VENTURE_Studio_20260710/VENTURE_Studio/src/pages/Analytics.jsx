/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { C } from '../theme';
import { useAnalytics } from '../hooks/useAnalytics';
import { CardSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [range, setRange] = useState('30d');
  const { data, loading, error, refetch } = useAnalytics(range);
  const ttStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text };

  if (loading) return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ width: 150, height: 32, background: C.card, borderRadius: 8 }} />
        <div style={{ width: 180, height: 32, background: C.card, borderRadius: 8 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[1,2,3,4].map(i => <CardSkeleton key={i} rows={2} />)}
      </div>
      <CardSkeleton rows={6} />
    </div>
  );

  if (error) return <div style={{ padding: 32 }}><ErrorState message={error} onRetry={refetch} /></div>;

  const { stats = [], viewsData = [], revenueData = [], topContent = [], trafficSources = [] } = data || {};

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>Analytics</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {['7d', '30d', '90d', '1y'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: range === r ? C.primary : C.card, color: range === r ? '#fff' : C.muted, cursor: 'pointer', fontSize: 13 }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, value, change }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{label}</div>
            <div style={{ color: C.text, fontSize: 22, fontWeight: 700 }}>{value}</div>
            <div style={{ color: '#10B981', fontSize: 12, marginTop: 4 }}>↑ {change}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>Views Over Time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={viewsData}>
            <defs>
              <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} /><stop offset="95%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: C.dim, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={ttStyle} />
            <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
            <Area type="monotone" dataKey="views" name="Total Views" stroke={C.primary} fill="url(#gv)" strokeWidth={2} />
            <Area type="monotone" dataKey="unique" name="Unique Viewers" stroke={C.accent} fill="url(#gu)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: 2, minWidth: 300, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fill: C.dim, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={ttStyle} />
              <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
              <Bar dataKey="ads" name="Ad Revenue" fill={C.accent} stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="subs" name="Subscriptions" fill={C.primary} stackId="a" />
              <Bar dataKey="tips" name="Tips" fill="#F59E0B" stackId="a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 240, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={trafficSources} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                {trafficSources.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={ttStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {trafficSources.map(({ name, value, color }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />{name}
                </span>
                <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
        <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>Top Content Performance</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topContent.map(({ name, views }) => {
            const pct = topContent[0]?.views ? Math.round((views / topContent[0].views) * 100) : 0;
            return (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: C.text, fontSize: 14 }}>{name}</span>
                  <span style={{ color: C.muted, fontSize: 13 }}>{(views / 1000).toFixed(0)}K views</span>
                </div>
                <div style={{ height: 6, background: C.border, borderRadius: 99 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: C.gradPrimary, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
