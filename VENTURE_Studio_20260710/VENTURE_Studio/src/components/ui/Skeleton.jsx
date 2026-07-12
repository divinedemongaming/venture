/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React from 'react';
import { C } from '../../theme';

export function Skeleton({ width = '100%', height = 20, borderRadius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: `linear-gradient(90deg, ${C.border} 25%, ${C.card} 50%, ${C.border} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 24,
    }}>
      <Skeleton height={18} width="60%" style={{ marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={14} width={`${70 + Math.random() * 30}%`} style={{ marginBottom: 10 }} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 24px', background: `${C.border}40`, display: 'flex', gap: 40 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={12} width={60 + i * 20} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 40 }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={12} width={50 + c * 15} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
