/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { create } from 'zustand';

const useStreamStore = create((set, get) => ({
  isLive: false,
  duration: 0,
  viewerCount: 0,
  peakViewers: 0,
  chatMessages: [],
  _durationTimer: null,
  _chatTimer: null,

  scenes: [
    { id: 's1', name: 'Main Scene', active: true },
    { id: 's2', name: 'BRB Screen', active: false },
    { id: 's3', name: 'Starting Soon', active: false },
    { id: 's4', name: 'End Screen', active: false },
  ],
  activeScene: 's1',

  sources: [
    { id: 'src1', type: 'camera', name: 'Webcam', visible: true, muted: false },
    { id: 'src2', type: 'screen', name: 'Display Capture', visible: true, muted: false },
    { id: 'src3', type: 'media', name: 'Gameplay Audio', visible: true, muted: false },
    { id: 'src4', type: 'text', name: 'Stream Title', visible: true, muted: false },
  ],

  cameraStream: null,
  screenStream: null,
  micMuted: false,
  camOff: false,

  health: { bitrate: 5840, fps: 60, dropped: 0, quality: 'Excellent' },

  startStream: () => {
    const timer = setInterval(() => {
      const { isLive, duration, viewerCount } = get();
      if (!isLive) return;
      const newCount = Math.max(0, viewerCount + Math.floor(Math.random() * 11) - 3);
      set({
        duration: duration + 1,
        viewerCount: newCount,
        peakViewers: Math.max(get().peakViewers, newCount),
      });
    }, 1000);

    const mockUsers = ['xX_DarkLord_Xx', 'ProGamer99', 'ViewerOne', 'NightOwl', 'StreamFan', 'GGez', 'ClipIt', 'LFG_Stream'];
    const mockMsgs = ['LET\'S GOOO!!', 'PogChamp', 'W stream bro', 'CLIP THAT', 'lmaoooo', 'gg wp', 'this is fire 🔥', 'First!', 'GGs', 'POG'];
    const chatTimer = setInterval(() => {
      if (!get().isLive) return;
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const msg = mockMsgs[Math.floor(Math.random() * mockMsgs.length)];
      set((s) => ({
        chatMessages: [
          ...s.chatMessages.slice(-99),
          { id: Date.now(), user, message: msg, ts: new Date().toLocaleTimeString() },
        ],
      }));
    }, 2500);

    set({ isLive: true, viewerCount: 12, _durationTimer: timer, _chatTimer: chatTimer });
  },

  endStream: () => {
    const { _durationTimer, _chatTimer } = get();
    clearInterval(_durationTimer);
    clearInterval(_chatTimer);
    set({ isLive: false, duration: 0, viewerCount: 0, _durationTimer: null, _chatTimer: null });
  },

  setScene: (id) => {
    set((s) => ({
      activeScene: id,
      scenes: s.scenes.map((sc) => ({ ...sc, active: sc.id === id })),
    }));
  },

  toggleSourceVisibility: (id) => {
    set((s) => ({
      sources: s.sources.map((src) => src.id === id ? { ...src, visible: !src.visible } : src),
    }));
  },

  toggleSourceMute: (id) => {
    set((s) => ({
      sources: s.sources.map((src) => src.id === id ? { ...src, muted: !src.muted } : src),
    }));
  },

  setCameraStream: (stream) => set({ cameraStream: stream }),
  setScreenStream: (stream) => set({ screenStream: stream }),
  sendChatMessage: (user, message, isCreator = false) => {
    set((s) => ({
      chatMessages: [
        ...s.chatMessages.slice(-99),
        { id: Date.now(), user, message, ts: new Date().toLocaleTimeString(), isCreator },
      ],
    }));
  },

  toggleMic: () => set((s) => ({ micMuted: !s.micMuted })),
  toggleCam: () => set((s) => ({ camOff: !s.camOff })),
}));

export default useStreamStore;
