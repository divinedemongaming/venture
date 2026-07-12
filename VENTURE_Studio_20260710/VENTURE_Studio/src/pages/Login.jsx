/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../theme';
import useAuthStore from '../store/authStore';
import { Smartphone, Shield } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError, seedMockUser } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login(identifier, password, requires2FA ? totp : undefined);
    if (result?.requires2FA) {
      setRequires2FA(true);
    } else if (result?.success) {
      navigate('/dashboard');
    } else if (result?.attemptsRemaining !== undefined) {
      setAttemptsLeft(result.attemptsRemaining);
    }
  };

  const devLogin = () => { seedMockUser(); navigate('/dashboard'); };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.gradPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 800, color: '#fff' }}>V</div>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>VENTURE Studio</h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>
            {requires2FA ? 'Enter your 2FA code to continue' : 'Sign in to your creator dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
          {error && (
            <div style={{ background: '#EF444420', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', color: '#EF4444', fontSize: 13, marginBottom: 20 }}>
              {error}{attemptsLeft !== null && attemptsLeft > 0 && ` (${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining)`}
            </div>
          )}

          {!requires2FA ? (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6 }}>Email or Username</label>
                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com" required
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6 }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.accent, marginBottom: 16 }}>
                <Shield size={16} /> Two-Factor Authentication
              </div>
              <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6 }}>Authenticator Code</label>
              <input type="text" value={totp} onChange={(e) => setTotp(e.target.value)} placeholder="000000" maxLength={6} required autoFocus
                style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 18, outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 6 }} />
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: C.gradPrimary, border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : requires2FA ? 'Verify' : 'Sign In'}
          </button>

          {requires2FA && (
            <button type="button" onClick={() => { setRequires2FA(false); clearError(); }} style={{ width: '100%', padding: '10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 13, cursor: 'pointer', marginTop: 10 }}>
              ← Back to Login
            </button>
          )}

          <button type="button" onClick={devLogin} style={{ width: '100%', padding: '10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 13, cursor: 'pointer', marginTop: 10 }}>
            Dev Mode (skip auth)
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ color: C.muted, fontSize: 13 }}>Don't have an account? </span>
          <a href="/signup" style={{ color: C.accent, fontSize: 13, textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}>Sign up</a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <a href="venture://" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.accent, fontSize: 13, textDecoration: 'none' }}>
            <Smartphone size={16} /> Open VENTURE Mobile App
          </a>
        </div>
      </div>
    </div>
  );
}

