/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React from 'react';
import { C } from '../../theme';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 32px', textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: '#EF444420', border: '1px solid #EF4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <AlertCircle size={24} color="#EF4444" />
      </div>
      <p style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>
        Failed to load data
      </p>
      <p style={{ color: C.muted, fontSize: 14, margin: '0 0 20px', maxWidth: 320 }}>
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.text, cursor: 'pointer', fontSize: 14,
        }}>
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
}
