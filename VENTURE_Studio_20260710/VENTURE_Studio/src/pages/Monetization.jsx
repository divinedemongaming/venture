/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { C } from '../theme';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { DollarSign, Star, Zap, CreditCard, TrendingUp } from 'lucide-react';

const revenueChart = [
  { month: 'Jan', total: 1440 }, { month: 'Feb', total: 1540 },
  { month: 'Mar', total: 1910 }, { month: 'Apr', total: 2000 },
  { month: 'May', total: 2540 }, { month: 'Jun', total: 2840 },
];

const transactions = [
  { id: 'TXN-001', type: 'Ad Revenue', amount: '+$284.00', date: 'Jun 30', status: 'Paid' },
  { id: 'TXN-002', type: 'Subscription', amount: '+$720.00', date: 'Jun 28', status: 'Paid' },
  { id: 'TXN-003', type: 'Tip', amount: '+$50.00', date: 'Jun 25', status: 'Paid' },
  { id: 'TXN-004', type: 'Ad Revenue', amount: '+$162.00', date: 'Jun 20', status: 'Paid' },
  { id: 'TXN-005', type: 'Payout', amount: '-$1,800.00', date: 'Jun 15', status: 'Processed' },
];

const tiers = [
  { name: 'Fan', price: '$4.99/mo', perks: ['Ad-free viewing', 'Fan badge', 'Monthly shoutout'], color: '#64748B' },
  { name: 'Supporter', price: '$9.99/mo', perks: ['All Fan perks', 'Exclusive content', 'Early access', 'Discord role'], color: C.primary, popular: true },
  { name: 'Legend', price: '$24.99/mo', perks: ['All Supporter perks', '1-on-1 game sessions', 'Custom emotes', 'Priority chat'], color: '#F59E0B' },
];

const statusColor = { Paid: '#10B981', Processed: C.accent, Pending: '#F59E0B' };

export default function Monetization() {
  const [tab, setTab] = useState('overview');

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Monetization</h1>
      <p style={{ color: C.muted, fontSize: 14, margin: '0 0 28px' }}>Manage your revenue streams and payouts.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {['overview', 'transactions', 'subscriptions', 'payouts'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', background: 'transparent', border: 'none',
            borderBottom: tab === t ? `2px solid ${C.primary}` : '2px solid transparent',
            color: tab === t ? C.primary : C.muted,
            fontSize: 14, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'June Earnings', value: '$2,840', icon: DollarSign, color: '#10B981' },
              { label: 'Subscribers', value: '148', icon: Star, color: C.primary },
              { label: 'Tips Received', value: '$380', icon: Zap, color: '#F59E0B' },
              { label: 'Ad Revenue', value: '$740', icon: TrendingUp, color: C.accent },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Icon size={16} color={color} />
                  <span style={{ color: C.muted, fontSize: 12 }}>{label}</span>
                </div>
                <div style={{ color: C.text, fontSize: 22, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: C.dim, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8 }} formatter={(v) => [`$${v}`, 'Revenue']} />
                <Area type="monotone" dataKey="total" stroke="#10B981" fill="url(#rg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue split */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
            <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Revenue Split</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Subscriptions', pct: 61, color: C.primary },
                { label: 'Ad Revenue', pct: 26, color: C.accent },
                { label: 'Tips & Donations', pct: 13, color: '#F59E0B' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: C.text, fontSize: 14 }}>{label}</span>
                    <span style={{ color: C.muted, fontSize: 13 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 8, background: C.border, borderRadius: 99 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Transactions */}
      {tab === 'transactions' && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: `${C.border}40` }}>
                {['ID', 'Type', 'Amount', 'Date', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '10px 24px', textAlign: 'left', color: C.dim, fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 24px', color: C.dim, fontSize: 13 }}>{tx.id}</td>
                  <td style={{ padding: '12px 24px', color: C.text, fontSize: 14 }}>{tx.type}</td>
                  <td style={{ padding: '12px 24px', color: tx.amount.startsWith('+') ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 600 }}>{tx.amount}</td>
                  <td style={{ padding: '12px 24px', color: C.muted, fontSize: 13 }}>{tx.date}</td>
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{ background: `${statusColor[tx.status]}20`, color: statusColor[tx.status], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subscriptions */}
      {tab === 'subscriptions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {tiers.map((tier) => (
            <div key={tier.name} style={{
              background: C.card, border: `2px solid ${tier.popular ? tier.color : C.border}`,
              borderRadius: 16, padding: 24, position: 'relative',
            }}>
              {tier.popular && (
                <span style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: C.gradPrimary, color: '#fff', padding: '3px 14px',
                  borderRadius: 99, fontSize: 11, fontWeight: 700,
                }}>MOST POPULAR</span>
              )}
              <div style={{ color: tier.color, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{tier.name}</div>
              <div style={{ color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{tier.price}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {tier.perks.map((p) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 13 }}>
                    <span style={{ color: '#10B981' }}>✓</span> {p}
                  </div>
                ))}
              </div>
              <button style={{
                width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${tier.color}`,
                background: tier.popular ? tier.color : 'transparent',
                color: tier.popular ? '#fff' : tier.color, cursor: 'pointer', fontWeight: 600, fontSize: 14,
              }}>Edit Tier</button>
            </div>
          ))}
        </div>
      )}

      {/* Payouts */}
      {tab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>Available Balance</h3>
            <div style={{ color: '#10B981', fontSize: 36, fontWeight: 800, margin: '12px 0' }}>$1,040.00</div>
            <p style={{ color: C.muted, fontSize: 13, margin: '0 0 20px' }}>Minimum payout: $50 · Next scheduled: Jul 15</p>
            <button style={{ background: C.gradPrimary, border: 'none', borderRadius: 8, padding: '12px 28px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
              Request Payout
            </button>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Payment Method</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.text, fontSize: 14 }}>
              <CreditCard size={20} color={C.accent} />
              Stripe Connect · •••• •••• •••• 4242
              <button style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 14px', color: C.muted, cursor: 'pointer', fontSize: 13 }}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
