/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import { C } from '../theme';
import useAuthStore from '../store/authStore';
import userService from '../services/userService';
import uploadService from '../services/uploadService';
import { Eye, EyeOff, Smartphone, RefreshCw, Shield, Bell, User, Radio, CheckCircle, AlertCircle } from 'lucide-react';

const MOCK_TOKEN = 'venture_mock_dev';

function Section({ title, icon: Icon, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={16} color={C.primary} />
        <h3 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ color: C.text, fontSize: 14 }}>{label}</div>
        {desc && <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 99, background: value ? C.primary : C.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, accessToken, updateUser } = useAuthStore();
  const isMock = accessToken === MOCK_TOKEN;

  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'ok' | 'error'

  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
  });

  const [settings, setSettings] = useState({
    twoFA: false, loginAlerts: true,
    emailNotifs: true, streamAlerts: true, commentAlerts: true, subAlerts: true,
    autoRecord: false, lowLatency: true, chatFilter: true, defaultPublic: true,
  });

  const tog = (k) => setSettings(s => ({ ...s, [k]: !s[k] }));

  const saveProfile = async () => {
    setSaving(true); setSaveStatus(null);
    try {
      if (!isMock) {
        const { data } = await userService.updateProfile(profile);
        updateUser(data);
      } else {
        updateUser(profile);
      }
      setSaveStatus('ok');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 760 }}>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: '0 0 28px' }}>Settings</h1>

      <Section title="Channel Profile" icon={User}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.gradPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', cursor: 'pointer' }} onClick={() => document.getElementById('avatar-input')?.click()}>
              {user?.displayName?.[0] || 'D'}
            </div>
            <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
              if (e.target.files[0] && !isMock) {
                try { const { data } = await uploadService.uploadAvatar(e.target.files[0]); updateUser({ avatarUrl: data.url }); } catch {}
              }
            }} />
            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, cursor: 'pointer' }}>✎</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
            {[
              { label: 'Display Name', key: 'displayName' },
              { label: 'Channel Username', key: 'username' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 4 }}>{label}</label>
                <input value={profile[key]} onChange={(e) => setProfile(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 4 }}>Bio</label>
              <textarea rows={3} value={profile.bio} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell your audience about yourself…"
                style={{ width: '100%', padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={saveProfile} disabled={saving} style={{ padding: '8px 20px', background: C.gradPrimary, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
              {saveStatus === 'ok' && <span style={{ color: '#10B981', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Saved</span>}
              {saveStatus === 'error' && <span style={{ color: '#EF4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={14} /> Failed</span>}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Stream Settings" icon={Radio}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6 }}>Stream Key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type={showKey ? 'text' : 'password'} readOnly value={user?.streamKey || 'live_sk_abc123xyz_dev'}
              style={{ flex: 1, padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', fontFamily: 'monospace' }} />
            <button onClick={() => setShowKey(!showKey)} style={{ padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer' }}>
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button onClick={async () => { if (!isMock) { try { const { data } = await streamService.regenerateKey(); updateUser({ streamKey: data.streamKey }); } catch {} } }} title="Regenerate"
              style={{ padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: '#F59E0B', cursor: 'pointer' }}>
              <RefreshCw size={16} />
            </button>
          </div>
          <p style={{ color: C.dim, fontSize: 12, margin: '6px 0 0' }}>RTMP URL: rtmp://live.venture.app/stream</p>
        </div>
        <Toggle label="Auto-Record Streams" desc="Save VODs automatically when you end a stream" value={settings.autoRecord} onChange={() => tog('autoRecord')} />
        <Toggle label="Low Latency Mode" desc="Reduces delay to ~2s for interactive streams" value={settings.lowLatency} onChange={() => tog('lowLatency')} />
        <Toggle label="Profanity Filter" desc="Auto-remove flagged words from live chat" value={settings.chatFilter} onChange={() => tog('chatFilter')} />
        <Toggle label="Default New Content to Public" value={settings.defaultPublic} onChange={() => tog('defaultPublic')} />
      </Section>

      <Section title="Notifications" icon={Bell}>
        <Toggle label="Email Digest" desc="Weekly performance summary to your inbox" value={settings.emailNotifs} onChange={() => tog('emailNotifs')} />
        <Toggle label="Stream Alerts" desc="Notify when your stream goes live" value={settings.streamAlerts} onChange={() => tog('streamAlerts')} />
        <Toggle label="New Comments" value={settings.commentAlerts} onChange={() => tog('commentAlerts')} />
        <Toggle label="New Subscribers" value={settings.subAlerts} onChange={() => tog('subAlerts')} />
      </Section>

      <Section title="Security" icon={Shield}>
        <Toggle label="Two-Factor Authentication" desc="Secure your account with an authenticator app" value={settings.twoFA} onChange={() => tog('twoFA')} />
        <Toggle label="Login Alerts" desc="Email me when a new device signs in" value={settings.loginAlerts} onChange={() => tog('loginAlerts')} />
        <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: C.text, fontSize: 14 }}>Active Sessions</div>
            <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>Manage where you're signed in</div>
          </div>
          <button style={{ padding: '6px 16px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer', fontSize: 13 }}>View</button>
        </div>
      </Section>

      <Section title="VENTURE Mobile App" icon={Smartphone}>
        <p style={{ color: C.muted, fontSize: 14, margin: '0 0 16px' }}>Switch between VENTURE Studio and the mobile creator app seamlessly.</p>
        <a href="venture://" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, background: `${C.accent}20`, border: `1px solid ${C.accent}`, color: C.accent, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          <Smartphone size={16} /> Open VENTURE Mobile App
        </a>
        <p style={{ color: C.dim, fontSize: 12, margin: '12px 0 0' }}>Mobile app deep link: <code style={{ color: C.muted }}>venture://</code></p>
      </Section>
    </div>
  );
}
