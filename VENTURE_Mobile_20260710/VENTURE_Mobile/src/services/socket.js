/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  This software is the exclusive intellectual property of
 *  DivineDemonGaming Inc. Unauthorized copying, distribution,
 *  modification, or use of this software, in whole or in part,
 *  is strictly prohibited without written permission from
 *  DivineDemonGaming Inc.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 * ============================================================
 */
import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useNotificationStore } from '../store/notificationStore';

const API_URL = "https://venture-production.up.railway.app";
let socket = null;

export const connectSocket = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) return null;

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));
  socket.on('connect_error', (err) => console.warn('Socket error:', err.message));

  // Global notification handler
  socket.on('notification:new', (notification) => {
    useNotificationStore.getState().addNotification(notification);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const getSocket = () => socket;

export const joinThread = (threadId) => socket?.emit('join:thread', threadId);
export const leaveThread = (threadId) => socket?.emit('leave:thread', threadId);
export const sendMessage = (data) => socket?.emit('message:send', data);
export const sendTyping = (threadId, isTyping) => socket?.emit('message:typing', { threadId, isTyping });
export const joinLive = (streamId) => socket?.emit('live:join', streamId);
export const leaveLive = (streamId) => socket?.emit('live:leave', streamId);
export const sendLiveChat = (streamId, message) => socket?.emit('live:chat', { streamId, message });
