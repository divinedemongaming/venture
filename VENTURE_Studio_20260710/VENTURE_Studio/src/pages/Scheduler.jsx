/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { C } from '../theme';
import { useScheduler } from '../hooks/useScheduler';
import { CardSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { Calendar, Clock, Film, Radio, Plus, Trash2 } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getScheduledDaysForMonth(scheduled, year, month) {
  return (scheduled || [])
    .map((s) => new Date(s.date))
    .filter((d) => d.getFullYear() === year && d.getMonth() === month)
    .map((d) => d.getDate());
}

function CalendarGrid({ year, month, scheduledDates }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const today = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : -1;
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', color: C.dim, fontSize: 12, fontWeight: 600, padding: '6px 0' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => (
          <div key={i} style={{
            height: 52, borderRadius: 8, padding: '6px 8px',
            background: day === today ? `${C.primary}30` : day ? C.bg : 'transparent',
            border: day === today ? `1px solid ${C.primary}` : '1px solid transparent',
            cursor: day ? 'pointer' : 'default', position: 'relative',
          }}>
            {day && (
              <>
                <span style={{ color: day === today ? C.primary : C.muted, fontSize: 13 }}>{day}</span>
                {scheduledDates.includes(day) && (
                  <span style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: C.primary, display: 'block' }} />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Scheduler() {
  const { data: scheduled, loading, error, refetch, remove } = useScheduler();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year] = useState(now.getFullYear());

  if (loading) return <div style={{ padding: 32 }}><CardSkeleton rows={8} /></div>;
  if (error) return <div style={{ padding: 32 }}><ErrorState message={error} onRetry={refetch} /></div>;

  const scheduledDates = getScheduledDaysForMonth(scheduled, year, month);
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>Content Scheduler</h1>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.gradPrimary, border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          <Plus size={16} /> Schedule Post
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 340, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>{monthName}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMonth(m => m - 1)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', color: C.muted, cursor: 'pointer' }}>‹</button>
              <button onClick={() => setMonth(m => m + 1)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', color: C.muted, cursor: 'pointer' }}>›</button>
            </div>
          </div>
          <CalendarGrid year={year} month={month} scheduledDates={scheduledDates} />
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Upcoming Drops</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(scheduled || []).map((item) => (
              <div key={item.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {item.type === 'stream' ? <Radio size={14} color={C.primary} /> : <Film size={14} color={C.accent} />}
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 600, flex: 1 }}>{item.title}</span>
                  <button onClick={() => remove(item.id)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', padding: 2 }}><Trash2 size={13} /></button>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.dim, fontSize: 12 }}><Calendar size={12} />{item.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.dim, fontSize: 12 }}><Clock size={12} />{item.time}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span style={{ background: `${C.primary}20`, color: C.primary, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{item.status}</span>
                </div>
              </div>
            ))}
            {(!scheduled || scheduled.length === 0) && (
              <p style={{ color: C.dim, fontSize: 14 }}>No upcoming scheduled posts.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
