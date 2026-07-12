/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState, useRef } from 'react';
import { C } from '../theme';
import uploadService from '../services/uploadService';
import useAuthStore from '../store/authStore';
import { UploadCloud, Film, X, CheckCircle, Globe, Lock, Users, AlertCircle } from 'lucide-react';

const MOCK_TOKEN = 'venture_mock_dev';

export default function Upload() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isMock = accessToken === MOCK_TOKEN;

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: '', description: '', tags: '',
    visibility: 'public', category: 'gaming',
    allowComments: true, ageRestrict: false,
    monetize: true, scheduledDate: '',
    kidsSafe: false,   // VENTURE Kids — marks content as reviewed/approved for under-13 audiences
  });

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = (f) => { if (!f) return; setFile(f); setDone(false); setUploadError(null); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(0); setUploadError(null);

    if (isMock) {
      // Simulate upload in dev mode
      let p = 0;
      const t = setInterval(() => {
        p += Math.random() * 8 + 2;
        if (p >= 100) { clearInterval(t); setProgress(100); setUploading(false); setDone(true); }
        else setProgress(Math.round(p));
      }, 200);
      return;
    }

    try {
      await uploadService.upload(file, {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }, (pct) => setProgress(pct));
      setDone(true);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const visIcons = { public: Globe, unlisted: Lock, private: Users };

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Upload Content</h1>
      <p style={{ color: C.muted, fontSize: 14, margin: '0 0 28px' }}>Upload videos, reels, or images to your channel.</p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Drop zone / preview */}
        <div style={{ flex: 2, minWidth: 320 }}>
          {!file ? (
            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? C.primary : C.border}`, borderRadius: 16, padding: '60px 32px', textAlign: 'center', cursor: 'pointer', background: dragOver ? `${C.primary}08` : C.card, transition: 'all 0.15s' }}>
              <UploadCloud size={48} color={dragOver ? C.primary : C.dim} style={{ marginBottom: 16 }} />
              <p style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Drag & drop your file here</p>
              <p style={{ color: C.muted, fontSize: 13, margin: '0 0 20px' }}>MP4, MOV, AVI up to 10 GB · PNG, JPG up to 50 MB</p>
              <button style={{ background: C.gradPrimary, border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Browse File</button>
              <input ref={fileRef} type="file" accept="video/*,image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ height: 200, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {file.type.startsWith('video/') ? (
                  <video src={URL.createObjectURL(file)} style={{ maxHeight: '100%', maxWidth: '100%' }} controls />
                ) : (
                  <img src={URL.createObjectURL(file)} alt="preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                )}
                <button onClick={() => { setFile(null); setProgress(0); setDone(false); setUploadError(null); }} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', padding: 6, color: '#fff', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Film size={18} color={C.accent} />
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{file.name}</span>
                  <span style={{ color: C.dim, fontSize: 12 }}>({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>

                {uploadError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#EF444420', borderRadius: 6 }}>
                    <AlertCircle size={14} />{uploadError}
                  </div>
                )}

                {(uploading || done) && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: C.muted, fontSize: 13 }}>{done ? 'Upload complete' : 'Uploading…'}</span>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{progress}%</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 99 }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: done ? '#10B981' : C.gradPrimary, borderRadius: 99, transition: 'width 0.2s' }} />
                    </div>
                  </div>
                )}

                {done ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontSize: 14 }}>
                    <CheckCircle size={18} /> File uploaded successfully
                  </div>
                ) : (
                  <button onClick={handleUpload} disabled={uploading} style={{ background: C.gradPrimary, border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                    {uploading ? 'Uploading…' : 'Upload Now'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metadata form */}
        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6 }}>Title</label>
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Give your video a title"
              style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6 }}>Description</label>
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Tell viewers about your video…" rows={4}
              style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6 }}>Tags</label>
            <input value={form.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="gaming, fps, warzone"
              style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 8 }}>Visibility</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['public', 'unlisted', 'private'].map((v) => {
                const Icon = visIcons[v];
                return (
                  <button key={v} onClick={() => setField('visibility', v)} style={{ flex: 1, padding: '8px 6px', borderRadius: 8, background: form.visibility === v ? `${C.primary}20` : C.card, border: `1px solid ${form.visibility === v ? C.primary : C.border}`, color: form.visibility === v ? C.primary : C.muted, cursor: 'pointer', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Icon size={16} />{v[0].toUpperCase() + v.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {[
            { label: 'Allow Comments', key: 'allowComments' },
            { label: 'Enable Monetization', key: 'monetize' },
            { label: 'Age-Restricted Content', key: 'ageRestrict' },
          ].map(({ label, key }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: C.text, fontSize: 14 }}>{label}</span>
              <button onClick={() => setField(key, !form[key])} style={{ width: 44, height: 24, borderRadius: 99, background: form[key] ? C.primary : C.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 2, left: form[key] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
          ))}

          {/* VENTURE Kids Safe toggle */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 16 }}>👶</span>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Kids Safe Content</span>
                  {form.kidsSafe && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#FF6B35', background: '#FF6B3520', borderRadius: 4, padding: '1px 6px', letterSpacing: 0.5 }}>
                      VENTURE KIDS
                    </span>
                  )}
                </div>
                <p style={{ color: C.dim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                  Mark as safe for children under 13. Content will be reviewed before appearing in VENTURE Kids.
                  {form.kidsSafe && ' Cannot be combined with Age-Restricted Content.'}
                </p>
              </div>
              <button
                onClick={() => {
                  // Kids Safe and Age-Restricted are mutually exclusive
                  if (!form.kidsSafe && form.ageRestrict) setField('ageRestrict', false);
                  setField('kidsSafe', !form.kidsSafe);
                }}
                style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 99, background: form.kidsSafe ? '#FF6B35' : C.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: form.kidsSafe ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, marginBottom: 6 }}>Schedule (optional)</label>
            <input type="datetime-local" value={form.scheduledDate} onChange={(e) => setField('scheduledDate', e.target.value)}
              style={{ width: '100%', padding: '9px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
          </div>

          <button onClick={handleUpload} disabled={!file || uploading} style={{ padding: '12px', background: C.gradPrimary, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 15, cursor: !file || uploading ? 'not-allowed' : 'pointer', opacity: !file || uploading ? 0.6 : 1 }}>
            {uploading ? 'Uploading…' : 'Save & Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
