/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useRef, useEffect, useState } from 'react';
import { C } from '../theme';
import useStreamStore from '../store/streamStore';
import { useStreamInfo } from '../hooks/useStream';
import streamService from '../services/streamService';
import useAuthStore from '../store/authStore';
import {
  Monitor, Camera, Mic, MicOff, Video, VideoOff, Radio,
  Plus, Eye, EyeOff, Volume2, VolumeX, Send,
  Activity, Wifi, Zap, RefreshCw
} from 'lucide-react';

const MOCK_TOKEN = 'venture_mock_dev';

function formatDuration(secs) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function StreamStudio() {
  const {
    isLive, duration, viewerCount, chatMessages, scenes, sources,
    health, micMuted, camOff, startStream, endStream, setScene,
    toggleSourceVisibility, toggleSourceMute, toggleMic, toggleCam,
    setCameraStream, setScreenStream, cameraStream, screenStream, sendChatMessage,
  } = useStreamStore();

  const accessToken = useAuthStore((s) => s.accessToken);
  const isMock = accessToken === MOCK_TOKEN;

  const { data: streamInfo, refetch: refetchKey } = useStreamInfo();
  const streamKey = streamInfo?.streamKey || 'live_sk_abc123xyz_dev';
  const rtmpUrl = streamInfo?.rtmpUrl || 'rtmp://live.venture.app/stream';

  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const [chatInput, setChatInput] = useState('');
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [streamId, setStreamId] = useState(null);
  const [goingLive, setGoingLive] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
  useEffect(() => { if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream; }, [cameraStream]);

  const startCamera = async () => {
    try { setCameraStream(await navigator.mediaDevices.getUserMedia({ video: true, audio: true })); }
    catch (err) { console.warn('[Camera] access denied:', err.message); }
  };

  const startScreenShare = async () => {
    try { setScreenStream(await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })); }
    catch (err) { console.warn('[Screen] access denied:', err.message); }
  };

  const handleGoLive = async () => {
    if (!cameraStream) await startCamera();
    setGoingLive(true);
    try {
      if (!isMock) {
        const { data } = await streamService.createStream({ title: 'Live Stream', visibility: 'public' });
        await streamService.goLive(data.stream.id);
        setStreamId(data.stream.id);
      }
      startStream();
    } catch (err) {
      console.error('[GoLive] error:', err.message);
      startStream(); // fall back to local state even if API fails
    } finally {
      setGoingLive(false);
    }
  };

  const handleEndStream = async () => {
    if (!confirmEnd) { setConfirmEnd(true); return; }
    if (streamId && !isMock) {
      try { await streamService.endStream(streamId); } catch {}
    }
    endStream();
    setConfirmEnd(false); setStreamId(null);
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); }
    if (screenStream) { screenStream.getTracks().forEach(t => t.stop()); setScreenStream(null); }
  };

  const handleRegenerateKey = async () => {
    if (isMock) return;
    try { await streamService.regenerateKey(); refetchKey(); } catch {}
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    sendChatMessage('You (Creator)', chatInput, true);
    setChatInput('');
  };

  const healthColor = health.quality === 'Excellent' ? '#10B981' : health.quality === 'Good' ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden', background: C.bg }}>

      {/* LEFT — Scenes & Sources */}
      <div style={{ width: 220, flexShrink: 0, background: C.card, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Scenes</span>
            <button style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', padding: 2 }}><Plus size={14} /></button>
          </div>
          {scenes.map(sc => (
            <button key={sc.id} onClick={() => setScene(sc.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 6, background: sc.active ? `${C.primary}20` : 'transparent', border: sc.active ? `1px solid ${C.primary}40` : '1px solid transparent', color: sc.active ? C.primary : C.muted, fontSize: 13, cursor: 'pointer', textAlign: 'left', marginBottom: 4, fontWeight: sc.active ? 600 : 400 }}>
              {sc.active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />}
              {sc.name}
            </button>
          ))}
        </div>
        <div style={{ padding: 16, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Sources</span>
            <button style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', padding: 2 }}><Plus size={14} /></button>
          </div>
          {sources.map(src => {
            const Icon = src.type === 'camera' ? Camera : src.type === 'screen' ? Monitor : src.type === 'media' ? Volume2 : Zap;
            return (
              <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, background: C.bg, marginBottom: 4, border: `1px solid ${C.border}` }}>
                <Icon size={13} color={C.muted} style={{ flexShrink: 0 }} />
                <span style={{ color: C.text, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.name}</span>
                <button onClick={() => toggleSourceVisibility(src.id)} style={{ background: 'transparent', border: 'none', color: src.visible ? C.muted : C.dim, cursor: 'pointer', padding: 2 }}>
                  {src.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => toggleSourceMute(src.id)} style={{ background: 'transparent', border: 'none', color: src.muted ? '#EF4444' : C.muted, cursor: 'pointer', padding: 2 }}>
                  {src.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER — Preview + Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {cameraStream ? (
            <video ref={videoRef} autoPlay muted={micMuted} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center', color: C.dim }}>
              <Monitor size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 15, margin: '0 0 8px' }}>No preview active</p>
              <p style={{ fontSize: 13, margin: 0, color: C.border }}>Click "Start Camera" or "Share Screen" below</p>
            </div>
          )}
          {isLive && (
            <>
              <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8, background: '#EF4444', color: '#fff', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'livePulse 1.2s ease-in-out infinite' }} />
                LIVE · {formatDuration(duration)}
              </div>
              <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={14} />{viewerCount.toLocaleString()} watching
              </div>
              <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 12, display: 'flex', gap: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={12} color={healthColor} /> {health.bitrate} kbps</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Wifi size={12} color={healthColor} /> {health.fps} fps</span>
                <span style={{ color: healthColor }}>{health.quality}</span>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div style={{ height: 72, background: C.card, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', flexShrink: 0 }}>
          <button onClick={startCamera} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: cameraStream ? `${C.primary}20` : C.bg, border: `1px solid ${cameraStream ? C.primary : C.border}`, color: cameraStream ? C.primary : C.muted, cursor: 'pointer', fontSize: 13 }}>
            <Camera size={16} /> {cameraStream ? 'Camera On' : 'Start Camera'}
          </button>
          <button onClick={startScreenShare} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: screenStream ? `${C.accent}20` : C.bg, border: `1px solid ${screenStream ? C.accent : C.border}`, color: screenStream ? C.accent : C.muted, cursor: 'pointer', fontSize: 13 }}>
            <Monitor size={16} /> {screenStream ? 'Sharing' : 'Share Screen'}
          </button>
          <button onClick={toggleMic} style={{ padding: '8px', borderRadius: 8, background: micMuted ? '#EF444420' : C.bg, border: `1px solid ${micMuted ? '#EF4444' : C.border}`, color: micMuted ? '#EF4444' : C.muted, cursor: 'pointer' }}>
            {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={toggleCam} style={{ padding: '8px', borderRadius: 8, background: camOff ? '#EF444420' : C.bg, border: `1px solid ${camOff ? '#EF4444' : C.border}`, color: camOff ? '#EF4444' : C.muted, cursor: 'pointer' }}>
            {camOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
          <div style={{ flex: 1 }} />
          {!isLive ? (
            <button onClick={handleGoLive} disabled={goingLive} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderRadius: 8, background: 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: goingLive ? 'wait' : 'pointer', opacity: goingLive ? 0.8 : 1 }}>
              <Radio size={18} /> {goingLive ? 'Starting…' : 'Go Live'}
            </button>
          ) : (
            <button onClick={handleEndStream} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderRadius: 8, background: confirmEnd ? '#EF4444' : C.card, border: '2px solid #EF4444', color: confirmEnd ? '#fff' : '#EF4444', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {confirmEnd ? '⚠ Confirm End?' : 'End Stream'}
            </button>
          )}
        </div>
      </div>

      {/* RIGHT — Live Chat */}
      <div style={{ width: 280, flexShrink: 0, background: C.card, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: C.text, fontSize: 14, fontWeight: 600, flex: 1 }}>Live Chat</span>
          {isLive && <span style={{ background: '#EF444420', color: '#EF4444', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>LIVE</span>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {chatMessages.length === 0 && (
            <div style={{ textAlign: 'center', color: C.dim, fontSize: 13, padding: '32px 0' }}>
              {isLive ? 'Waiting for messages…' : 'Chat appears when you go live'}
            </div>
          )}
          {chatMessages.map((msg) => (
            <div key={msg.id} style={{ background: msg.isCreator ? `${C.primary}15` : C.bg, border: `1px solid ${msg.isCreator ? `${C.primary}40` : C.border}`, borderRadius: 8, padding: '7px 10px' }}>
              <span style={{ color: msg.isCreator ? C.primary : C.accent, fontSize: 12, fontWeight: 700, marginRight: 6 }}>{msg.user}</span>
              <span style={{ color: C.text, fontSize: 13 }}>{msg.message}</span>
              <div style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>{msg.ts}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder={isLive ? 'Chat as creator…' : 'Go live to chat'} disabled={!isLive}
              style={{ flex: 1, padding: '8px 10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: 'none', opacity: isLive ? 1 : 0.5 }} />
            <button onClick={sendChat} disabled={!isLive} style={{ background: isLive ? C.primary : C.border, border: 'none', borderRadius: 6, padding: '8px 10px', color: '#fff', cursor: isLive ? 'pointer' : 'default' }}>
              <Send size={14} />
            </button>
          </div>

          {/* Stream key + RTMP */}
          <div style={{ marginTop: 12, padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: C.dim, fontSize: 11, fontWeight: 600 }}>RTMP URL</span>
            </div>
            <div style={{ color: C.muted, fontSize: 10, fontFamily: 'monospace', marginBottom: 8, wordBreak: 'break-all' }}>{rtmpUrl}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: C.dim, fontSize: 11, fontWeight: 600 }}>Stream Key</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setShowStreamKey(!showStreamKey)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 11 }}>{showStreamKey ? 'Hide' : 'Show'}</button>
                <button onClick={handleRegenerateKey} title="Regenerate key" style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', padding: 0 }}><RefreshCw size={11} /></button>
              </div>
            </div>
            <div style={{ padding: '6px 8px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.dim, fontSize: 10, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {showStreamKey ? streamKey : '••••••••••••••••••••'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
