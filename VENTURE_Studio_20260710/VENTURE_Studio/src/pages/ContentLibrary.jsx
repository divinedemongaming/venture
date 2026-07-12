/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { C } from '../theme';
import {
  Grid, List, Search, MoreVertical, Edit, Trash2,
  Film, Image, Radio, Eye
} from 'lucide-react';

const CONTENT = [
  { id: 1, title: 'Epic Warzone Solo Win', type: 'video', status: 'Published', views: '142K', date: '2024-06-15', duration: '18:42' },
  { id: 2, title: 'Ranked Grind — Diamond Push', type: 'video', status: 'Published', views: '98K', date: '2024-06-12', duration: '2:14:08' },
  { id: 3, title: 'Weekend Tournament Highlights', type: 'reel', status: 'Published', views: '67K', date: '2024-06-10', duration: '0:58' },
  { id: 4, title: 'New Map First Look', type: 'video', status: 'Draft', views: '—', date: '2024-06-08', duration: '22:15' },
  { id: 5, title: 'Setup Tour 2024', type: 'video', status: 'Processing', views: '—', date: '2024-06-07', duration: '12:30' },
  { id: 6, title: 'Clutch Clips Vol.3', type: 'reel', status: 'Scheduled', views: '—', date: '2024-06-20', duration: '1:12' },
  { id: 7, title: 'Stream Promo Banner', type: 'image', status: 'Published', views: '8.4K', date: '2024-06-05', duration: '—' },
  { id: 8, title: 'Season 5 Teaser', type: 'video', status: 'Unlisted', views: '2.1K', date: '2024-06-01', duration: '0:45' },
];

const statusColor = {
  Published: '#10B981', Draft: '#F59E0B', Processing: '#06B6D4',
  Scheduled: '#7C3AED', Unlisted: '#64748B',
};

const TypeIcon = ({ type }) => {
  if (type === 'video') return <Film size={14} />;
  if (type === 'image') return <Image size={14} />;
  if (type === 'reel') return <Radio size={14} />;
  return <Film size={14} />;
};

export default function ContentLibrary() {
  const [viewMode, setViewMode] = useState('list');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);

  const tabs = ['All', 'Published', 'Draft', 'Scheduled', 'Processing'];
  const filtered = CONTENT.filter((c) => {
    const matchTab = filter === 'All' || c.status === filter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const toggleSelect = (id) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>Content Library</h1>
        <button style={{
          background: C.gradPrimary, border: 'none', borderRadius: 8,
          padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14,
        }}>+ Upload</button>
      </div>

      {/* Tabs + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 13,
              fontWeight: filter === t ? 600 : 400,
              background: filter === t ? C.primary : C.card,
              color: filter === t ? '#fff' : C.muted,
              cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.dim }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search content…"
            style={{
              padding: '7px 12px 7px 30px',
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 13, outline: 'none',
            }}
          />
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {[['list', List], ['grid', Grid]].map(([mode, Icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '7px 10px', border: 'none', cursor: 'pointer',
              background: viewMode === mode ? C.primary : C.card,
              color: viewMode === mode ? '#fff' : C.muted,
            }}>
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', background: `${C.primary}20`,
          border: `1px solid ${C.primary}`, borderRadius: 8, marginBottom: 16,
        }}>
          <span style={{ color: C.text, fontSize: 14 }}>{selected.length} selected</span>
          <button style={{ background: '#EF444420', border: '1px solid #EF4444', borderRadius: 6, padding: '4px 12px', color: '#EF4444', cursor: 'pointer', fontSize: 13 }}>
            Delete
          </button>
          <button style={{ background: `${C.amber}20`, border: `1px solid ${C.amber}`, borderRadius: 6, padding: '4px 12px', color: C.amber, cursor: 'pointer', fontSize: 13 }}>
            Unpublish
          </button>
          <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: `${C.border}40` }}>
                <th style={{ padding: '10px 16px', width: 36 }}>
                  <input type="checkbox" onChange={(e) => setSelected(e.target.checked ? filtered.map((c) => c.id) : [])} />
                </th>
                {['Title', 'Type', 'Status', 'Views', 'Duration', 'Date', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: C.dim, fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderTop: `1px solid ${C.border}`, background: selected.includes(item.id) ? `${C.primary}10` : 'transparent' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
                  <td style={{ padding: '12px 16px', color: C.text, fontSize: 14, fontWeight: 500 }}>{item.title}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, fontSize: 13 }}>
                      <TypeIcon type={item.type} />{item.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: `${statusColor[item.status]}20`,
                      color: statusColor[item.status],
                      padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    }}>{item.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: C.muted, fontSize: 13 }}>{item.views}</td>
                  <td style={{ padding: '12px 16px', color: C.muted, fontSize: 13 }}>{item.duration}</td>
                  <td style={{ padding: '12px 16px', color: C.dim, fontSize: 13 }}>{item.date}</td>
                  <td style={{ padding: '12px 16px', position: 'relative' }}>
                    <button onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === item.id && (
                      <div style={{ position: 'absolute', right: 8, top: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 50, minWidth: 140, overflow: 'hidden' }}>
                        {[['Edit', Edit, C.text], ['Unpublish', Eye, C.amber], ['Delete', Trash2, '#EF4444']].map(([label, Icon, color]) => (
                          <button key={label} onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', background: 'transparent', border: 'none', color, cursor: 'pointer', fontSize: 13 }}>
                            <Icon size={14} />{label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ height: 130, background: `${C.border}60`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TypeIcon type={item.type} />
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{item.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: `${statusColor[item.status]}20`, color: statusColor[item.status], padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{item.status}</span>
                  <span style={{ color: C.dim, fontSize: 12 }}>{item.views} views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
