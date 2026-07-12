/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../theme';
import { Mail, Lock, User } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.username || formData.username.length < 3 || formData.username.length > 30) {
      setError('Username must be 3-30 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#])/.test(formData.password)) {
      setError('Password must include uppercase, lowercase, number, and special character');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.toLowerCase(),
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password,
          isCreator: true
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.errors?.[0]?.msg || 'Signup failed');
      }

      setSuccess('✓ Account created! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.gradPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 800, color: '#fff' }}>V</div>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>VENTURE Studio</h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>Create your creator account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
          {error && (
            <div style={{ background: '#EF444420', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', color: '#EF4444', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#22C55E20', border: '1px solid #22C55E', borderRadius: 8, padding: '10px 14px', color: '#22C55E', fontSize: 13, marginBottom: 20 }}>
              {success}
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Username</label>
            <div style={{ display: 'flex', alignItems: 'center', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, paddingLeft: 10 }}>
              <User size={16} style={{ color: C.muted }} />
              <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="username"
                style={{ flex: 1, padding: '10px 10px', background: 'transparent', border: 'none', color: C.text, fontSize: 14, outline: 'none' }} required />
            </div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>3-30 chars, letters/numbers/underscore</div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Display Name</label>
            <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} placeholder="Your name"
              style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} required />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Email</label>
            <div style={{ display: 'flex', alignItems: 'center', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, paddingLeft: 10 }}>
              <Mail size={16} style={{ color: C.muted }} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com"
                style={{ flex: 1, padding: '10px 10px', background: 'transparent', border: 'none', color: C.text, fontSize: 14, outline: 'none' }} required />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Password</label>
            <div style={{ display: 'flex', alignItems: 'center', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, paddingLeft: 10 }}>
              <Lock size={16} style={{ color: C.muted }} />
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••"
                style={{ flex: 1, padding: '10px 10px', background: 'transparent', border: 'none', color: C.text, fontSize: 14, outline: 'none' }} required />
            </div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>8+ chars: uppercase, lowercase, number, special char (@$!%*?&_#)</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Confirm Password</label>
            <div style={{ display: 'flex', alignItems: 'center', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, paddingLeft: 10 }}>
              <Lock size={16} style={{ color: C.muted }} />
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
                style={{ flex: 1, padding: '10px 10px', background: 'transparent', border: 'none', color: C.text, fontSize: 14, outline: 'none' }} required />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: C.gradPrimary, border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ color: C.muted, fontSize: 13 }}>Already have an account? </span>
          <a href="/login" style={{ color: C.accent, fontSize: 13, textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}

