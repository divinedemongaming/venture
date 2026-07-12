/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { C } from '../theme';
import { useComments } from '../hooks/useComments';
import { TableSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { CheckCircle, XCircle, Flag, MessageSquare, AlertTriangle } from 'lucide-react';

export default function Comments() {
  const { data: rawComments, loading, error, refetch, approve, reject, flag, bulkModerate } = useComments();
  const [comments, setComments] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState([]);

  // Merge API data into local state for optimistic updates
  const activeComments = comments || rawComments || [];

  React.useEffect(() => {
    if (rawComments) setComments(rawComments);
  }, [rawComments]);

  const act = async (id, action) => {
    // Optimistic update
    setComments((cs) => cs.map((c) => {
      if (c.id !== id) return c;
      if (action === 'approve') return { ...c, status: 'approved', flagged: false };
      if (action === 'reject') return { ...c, status: 'rejected' };
      if (action === 'flag') return { ...c, flagged: true };
      return c;
    }));
    // API call
    if (action === 'approve') await approve(id);
    else if (action === 'reject') await reject(id);
    else if (action === 'flag') await flag(id);
  };

  const bulkAct = async (action) => {
    await bulkModerate(selected, action);
    setSelected([]);
    refetch();
  };

  const filtered = activeComments.filter((c) => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'approved') return c.status === 'approved';
    if (filter === 'flagged') return c.flagged;
    return true;
  });

  const toggleSelect = (id) => setSelected((s) => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const counts = {
    pending: activeComments.filter(c => c.status === 'pending').length,
    flagged: activeComments.filter(c => c.flagged).length,
  };

  if (loading) return <div style={{ padding: 32 }}><TableSkeleton rows={6} cols={4} /></div>;
  if (error) return <div style={{ padding: 32 }}><ErrorState message={error} onRetry={refetch} /></div>;

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>Comments</h1>
      <p style={{ color: C.muted, fontSize: 14, margin: '0 0 24px' }}>Review and moderate comments across all your content.</p>

      {counts.flagged > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#EF444420', border: '1px solid #EF4444', borderRadius: 8, marginBottom: 20, color: '#EF4444', fontSize: 14 }}>
          <AlertTriangle size={16} />
          {counts.flagged} flagged comment{counts.flagged > 1 ? 's' : ''} need review
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[['all', 'All'], ['pending', `Pending (${counts.pending})`], ['approved', 'Approved'], ['flagged', `Flagged (${counts.flagged})`]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: filter === val ? C.primary : C.card, color: filter === val ? '#fff' : C.muted, cursor: 'pointer', fontSize: 13 }}>{label}</button>
        ))}
      </div>

      {selected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: `${C.primary}20`, border: `1px solid ${C.primary}`, borderRadius: 8, marginBottom: 16 }}>
          <span style={{ color: C.text, fontSize: 14 }}>{selected.length} selected</span>
          <button onClick={() => bulkAct('approve')} style={{ background: '#10B98120', border: '1px solid #10B981', borderRadius: 6, padding: '4px 12px', color: '#10B981', cursor: 'pointer', fontSize: 13 }}>Approve All</button>
          <button onClick={() => bulkAct('reject')} style={{ background: '#EF444420', border: '1px solid #EF4444', borderRadius: 6, padding: '4px 12px', color: '#EF4444', cursor: 'pointer', fontSize: 13 }}>Reject All</button>
          <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13 }}>Clear</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((c) => (
          <div key={c.id} style={{ background: C.card, border: `1px solid ${c.flagged ? '#EF4444' : C.border}`, borderRadius: 12, padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} style={{ marginTop: 4 }} />
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.gradPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{c.avatar || c.user?.[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{c.user}</span>
                <span style={{ color: C.dim, fontSize: 12 }}>{c.time}</span>
                <span style={{ color: C.dim, fontSize: 12 }}>on <span style={{ color: C.muted }}>{c.video}</span></span>
                {c.flagged && <span style={{ background: '#EF444420', color: '#EF4444', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>FLAGGED</span>}
                {c.status === 'approved' && <span style={{ background: '#10B98120', color: '#10B981', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>APPROVED</span>}
              </div>
              <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>{c.comment}</p>
            </div>
            {c.status !== 'rejected' && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {c.status === 'pending' && (
                  <button onClick={() => act(c.id, 'approve')} title="Approve" style={{ background: '#10B98120', border: '1px solid #10B981', borderRadius: 6, padding: '6px 8px', color: '#10B981', cursor: 'pointer' }}><CheckCircle size={16} /></button>
                )}
                <button onClick={() => act(c.id, 'reject')} title="Reject" style={{ background: '#EF444420', border: '1px solid #EF4444', borderRadius: 6, padding: '6px 8px', color: '#EF4444', cursor: 'pointer' }}><XCircle size={16} /></button>
                {!c.flagged && (
                  <button onClick={() => act(c.id, 'flag')} title="Flag" style={{ background: `${C.amber}20`, border: `1px solid ${C.amber}`, borderRadius: 6, padding: '6px 8px', color: C.amber, cursor: 'pointer' }}><Flag size={16} /></button>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: C.dim }}>
            <MessageSquare size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No comments to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
