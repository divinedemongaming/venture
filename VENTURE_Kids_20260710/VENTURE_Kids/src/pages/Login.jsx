/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Kids — Login / Setup
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useKidsStore from '../store/authStore';

const STEPS = ['account', 'pin', 'profile'];

export default function Login() {
  const navigate = useNavigate();
  const { login, setPin, setKidsProfile, pinHash } = useKidsStore();

  const [step, setStep]         = useState('account');    // account | pin | profile | pinEntry
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin_]          = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [childName, setChildName]   = useState('');
  const [ageGroup, setAgeGroup]     = useState('6-9');
  const [timeLimit, setTimeLimit]   = useState(60);
  const [pinInput, setPinInput]     = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // If PIN already set: show PIN entry gate first
  const [gatePin, setGatePin]   = useState(pinHash ? '' : null);
  const { verifyPin } = useKidsStore();

  const handleGateSubmit = async () => {
    const ok = await verifyPin(gatePin);
    if (ok) {
      setGatePin(null); // pass through
    } else {
      setError('Incorrect PIN');
      setGatePin('');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true); setError('');
    try {
      await login(email, password);
      if (!pinHash) setStep('pin'); else navigate('/home');
    } catch (e) {
      setError(e?.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) { setError('PIN must be 4 digits'); return; }
    if (pin !== pinConfirm) { setError('PINs do not match'); return; }
    await setPin(pin);
    setStep('profile');
  };

  const handleProfileSubmit = () => {
    if (!childName.trim()) { setError('Enter a name'); return; }
    setKidsProfile({
      childName: childName.trim(),
      ageGroup,
      dailyLimitMinutes: timeLimit,
      allowedCategories: ['EDUCATIONAL','ANIMATION','MUSIC','ARTS_CRAFTS','SCIENCE','STORIES','NATURE','SPORTS','GAMING_FAMILY'],
      sessionStartTime: null,
    });
    navigate('/home');
  };

  // PIN gate (returning visit before account step)
  if (gatePin !== null) {
    return (
      <div style={S.screen}>
        <div style={S.card} className="bounce-in">
          <div style={S.logo}>🔐</div>
          <h2 style={S.title}>Parent Check</h2>
          <p style={S.sub}>Enter your 4-digit PIN to access VENTURE Kids</p>
          <input
            style={S.pinInput} type="password" inputMode="numeric"
            maxLength={4} placeholder="••••"
            value={gatePin} onChange={e => { setGatePin(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleGateSubmit()}
            autoFocus
          />
          {error && <p style={S.error}>{error}</p>}
          <button style={S.btn} onClick={handleGateSubmit}>Enter →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <div style={S.card} className="bounce-in">
        {/* Logo */}
        <div style={S.logo}>🎮</div>
        <h1 style={{ ...S.title, fontSize: 26 }}>VENTURE <span style={{ color: 'var(--orange)' }}>Kids</span></h1>

        {/* Step: account */}
        {step === 'account' && (
          <>
            <p style={S.sub}>Parent or guardian — sign in to set up your child's account</p>
            <input style={S.input} type="email" placeholder="Email address"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
            <input style={S.input} type="password" placeholder="Password"
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            {error && <p style={S.error}>{error}</p>}
            <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </>
        )}

        {/* Step: PIN setup */}
        {step === 'pin' && (
          <>
            <p style={S.sub}>Create a 4-digit parent PIN to control Kids Mode</p>
            <input style={S.pinInput} type="password" inputMode="numeric"
              maxLength={4} placeholder="PIN (4 digits)"
              value={pin} onChange={e => { setPin_(e.target.value); setError(''); }} />
            <input style={{ ...S.pinInput, marginTop: 12 }} type="password" inputMode="numeric"
              maxLength={4} placeholder="Confirm PIN"
              value={pinConfirm} onChange={e => { setPinConfirm(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handlePinSubmit()} />
            {error && <p style={S.error}>{error}</p>}
            <button style={S.btn} onClick={handlePinSubmit}>Set PIN →</button>
          </>
        )}

        {/* Step: child profile */}
        {step === 'profile' && (
          <>
            <p style={S.sub}>Set up your child's profile</p>
            <input style={S.input} placeholder="Child's name" maxLength={30}
              value={childName} onChange={e => { setChildName(e.target.value); setError(''); }} />
            <div style={S.row}>
              <span style={S.label}>Age group</span>
              <select style={S.select} value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                <option value="3-5">3–5</option>
                <option value="6-9">6–9</option>
                <option value="10-12">10–12</option>
              </select>
            </div>
            <div style={S.row}>
              <span style={S.label}>Daily limit</span>
              <select style={S.select} value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))}>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>90 min</option>
                <option value={120}>2 hours</option>
                <option value={0}>Unlimited</option>
              </select>
            </div>
            {error && <p style={S.error}>{error}</p>}
            <button style={S.btn} onClick={handleProfileSubmit}>Start Watching! 🎉</button>
          </>
        )}

        <p style={{ ...S.sub, marginTop: 16, fontSize: 11 }}>
          COPPA compliant · No ads · No data sold · © 2024 DivineDemonGaming Inc.
        </p>
      </div>
    </div>
  );
}

const S = {
  screen: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' },
  card:   { width: '100%', maxWidth: 400, background: 'var(--card)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: '1px solid var(--border)' },
  logo:   { fontSize: 48, lineHeight: 1 },
  title:  { color: 'var(--text)', fontWeight: 800, textAlign: 'center', margin: 0 },
  sub:    { color: 'var(--muted)', fontSize: 13, textAlign: 'center', lineHeight: 1.5, margin: 0 },
  input:  { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 15, outline: 'none' },
  pinInput: { width: 160, padding: '14px 16px', background: 'rgba(255,255,255,0.06)', border: '2px solid var(--orange)', borderRadius: 12, color: 'var(--text)', fontSize: 24, textAlign: 'center', letterSpacing: 8, outline: 'none' },
  btn:    { width: '100%', padding: '14px', background: 'var(--orange)', color: '#fff', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  error:  { color: '#f87171', fontSize: 13, margin: 0 },
  row:    { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' },
  label:  { color: 'var(--muted)', fontSize: 14 },
  select: { padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none' },
};
