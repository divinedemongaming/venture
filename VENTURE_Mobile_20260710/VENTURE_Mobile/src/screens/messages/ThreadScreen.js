/**
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
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { socketService } from '../../services/socket';

const REACTIONS = ['❤️', '😂', '🔥', '👏', '💜', '😮'];

const MOCK_MESSAGES = [
  { id: 'm1', content: 'Hey! Loved your last clip 🔥', senderId: 'them', sentAt: new Date(Date.now() - 3600000).toISOString(), reactions: [] },
  { id: 'm2', content: 'Thanks man! That shot was pure luck lol', senderId: 'me', sentAt: new Date(Date.now() - 3500000).toISOString(), reactions: [{ emoji: '😂', count: 1 }] },
  { id: 'm3', content: 'No way, you\'ve been grinding ranked for months. You earned it', senderId: 'them', sentAt: new Date(Date.now() - 3400000).toISOString(), reactions: [] },
  { id: 'm4', content: 'True 😅 Hey, you wanna do a collab stream?', senderId: 'me', sentAt: new Date(Date.now() - 3000000).toISOString(), reactions: [] },
  { id: 'm5', content: 'YESSS been waiting for you to ask. When?', senderId: 'them', sentAt: new Date(Date.now() - 2900000).toISOString(), reactions: [{ emoji: '🔥', count: 1 }] },
  { id: 'm6', content: 'This weekend? Saturday night, maybe 8PM?', senderId: 'me', sentAt: new Date(Date.now() - 2800000).toISOString(), reactions: [] },
  { id: 'm7', content: 'Perfect. I\'ll set up the stream on my end', senderId: 'them', sentAt: new Date(Date.now() - 2700000).toISOString(), reactions: [] },
  { id: 'm8', content: 'bro that clip was INSANE 🔥', senderId: 'them', sentAt: new Date(Date.now() - 120000).toISOString(), reactions: [] },
];

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeader(iso) {
  const d = new Date(iso);
  const today = new Date();
  const diff = today.getDate() - d.getDate();
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function MessageBubble({ message, isMe, showAvatar, otherInitial, onLongPress }) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <View style={[styles.msgWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperThem]}>
      {/* Avatar placeholder for them */}
      {!isMe && (
        <View style={[styles.msgAvatar, !showAvatar && styles.msgAvatarHidden]}>
          {showAvatar && (
            <Text style={styles.msgAvatarText}>{otherInitial}</Text>
          )}
        </View>
      )}

      <View style={[styles.msgGroup, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
        <Pressable
          style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
          onLongPress={() => onLongPress(message)}
        >
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {message.content}
          </Text>
        </Pressable>

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <View style={styles.reactionsRow}>
            {message.reactions.map((r, i) => (
              <View key={i} style={styles.reactionPill}>
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                {r.count > 1 && <Text style={styles.reactionCount}>{r.count}</Text>}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.msgTime}>{formatTime(message.sentAt)}</Text>
      </View>

      {/* Spacer for me-side */}
      {isMe && <View style={styles.msgAvatarHidden} />}
    </View>
  );
}

export default function ThreadScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { threadId, userId, username, displayName, isOnline } = route?.params || {};

  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);
  const typingDot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchMessages();
    setupSocket();
    return () => teardownSocket();
  }, [threadId]);

  useEffect(() => {
    // Animate typing dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingDot, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(typingDot, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const endpoint = threadId
        ? `/messages/threads/${threadId}?limit=50`
        : `/messages/thread?userId=${userId}&limit=50`;
      const res = await api.get(endpoint);
      if (res.data?.messages?.length) setMessages(res.data.messages);
    } catch (_) {}
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const setupSocket = () => {
    try {
      socketService?.socket?.on('new_message', handleNewMessage);
      socketService?.socket?.on('typing', handleTyping);
    } catch (_) {}
  };

  const teardownSocket = () => {
    try {
      socketService?.socket?.off('new_message', handleNewMessage);
      socketService?.socket?.off('typing', handleTyping);
    } catch (_) {}
  };

  const handleNewMessage = useCallback((msg) => {
    if (msg.senderId === userId || msg.threadId === threadId) {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [userId, threadId]);

  const handleTyping = useCallback(({ fromUserId }) => {
    if (fromUserId === userId) {
      setTypingVisible(true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingVisible(false), 3000);
    }
  }, [userId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const tempId = `temp_${Date.now()}`;
    const newMsg = {
      id: tempId,
      content: text,
      senderId: 'me',
      sentAt: new Date().toISOString(),
      pending: true,
      reactions: [],
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setSending(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await api.post(`/messages/threads/${threadId}`, {
        recipientId: userId,
        content: text,
      });
      // Replace temp with real
      setMessages(prev => prev.map(m => m.id === tempId ? { ...res.data.message, reactions: [] } : m));
    } catch (_) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true } : m));
    } finally {
      setSending(false);
    }
  };

  const addReaction = (emoji) => {
    if (!selectedMsg) return;
    setMessages(prev => prev.map(m => {
      if (m.id !== selectedMsg.id) return m;
      const existing = m.reactions?.find(r => r.emoji === emoji);
      const reactions = existing
        ? m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
        : [...(m.reactions || []), { emoji, count: 1 }];
      return { ...m, reactions };
    }));
    setShowReactionPicker(false);
    setSelectedMsg(null);
    try { api.post(`/messages/${selectedMsg.id}/react`, { emoji }); } catch (_) {}
  };

  const handleLongPress = (msg) => {
    setSelectedMsg(msg);
    setShowReactionPicker(true);
  };

  const otherInitial = (displayName || username || 'U')[0].toUpperCase();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => navigation.navigate('Profile', { userId })}
        >
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{otherInitial}</Text>
            {isOnline && <View style={styles.headerOnlineDot} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{displayName || username || 'User'}</Text>
            <Text style={[styles.headerStatus, isOnline && styles.headerStatusOnline]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="call-outline" size={21} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="videocam-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="information-circle-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => {
            const isMe = item.senderId === 'me' || item.senderId === user?.id;
            const prevMsg = messages[index - 1];
            const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== item.senderId);
            return (
              <MessageBubble
                message={item}
                isMe={isMe}
                showAvatar={showAvatar}
                otherInitial={otherInitial}
                onLongPress={handleLongPress}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: Spacing.base, paddingHorizontal: Spacing.sm }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Typing indicator */}
      {typingVisible && (
        <View style={styles.typingRow}>
          <View style={styles.typingBubble}>
            {[0, 0.3, 0.6].map((delay, i) => (
              <Animated.View
                key={i}
                style={[styles.typingDot, {
                  opacity: typingDot.interpolate({
                    inputRange: [0, 1],
                    outputRange: i === 0 ? [0.3, 1] : i === 1 ? [0.6, 0.3] : [1, 0.6],
                  })
                }]}
              />
            ))}
          </View>
          <Text style={styles.typingText}>{username} is typing...</Text>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.inputAction}>
          <Ionicons name="image-outline" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputAction}>
          <Ionicons name="game-controller-outline" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={(t) => {
            setInput(t);
            try { socketService?.socket?.emit('typing', { recipientId: userId }); } catch (_) {}
          }}
          multiline
          maxLength={2000}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, input.trim() && styles.sendBtnActive]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color={input.trim() ? '#fff' : Colors.textMuted} />
          }
        </TouchableOpacity>
      </View>

      {/* Reaction picker */}
      {showReactionPicker && (
        <TouchableOpacity
          style={styles.reactionOverlay}
          activeOpacity={1}
          onPress={() => { setShowReactionPicker(false); setSelectedMsg(null); }}
        >
          <View style={styles.reactionPicker}>
            {REACTIONS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionOption}
                onPress={() => addReaction(emoji)}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8,
  },
  backBtn: { padding: 4 },
  headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  headerAvatarText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '700' },
  headerOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.online,
    borderWidth: 2, borderColor: Colors.background,
  },
  headerInfo: { gap: 1 },
  headerName: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  headerStatus: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  headerStatusOnline: { color: Colors.online },
  headerRight: { flexDirection: 'row', gap: 2 },
  headerAction: { padding: 6 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  msgWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2, paddingHorizontal: 4, gap: 6 },
  msgWrapperMe: { justifyContent: 'flex-end' },
  msgWrapperThem: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarHidden: { width: 28, opacity: 0 },
  msgAvatarText: { color: Colors.textPrimary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  msgGroup: { maxWidth: '72%', gap: 3 },
  bubble: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  bubbleText: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  reactionsRow: { flexDirection: 'row', gap: 4, marginTop: 2 },
  reactionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.backgroundElevated, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { color: Colors.textSecondary, fontSize: 10, fontWeight: '600' },
  msgTime: { color: Colors.textMuted, fontSize: 10 },

  // Typing
  typingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.base, paddingBottom: 4,
  },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 16, borderBottomLeftRadius: 4,
  },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  typingText: { color: Colors.textMuted, fontSize: Typography.sizes.xs },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6,
    paddingHorizontal: Spacing.sm, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  inputAction: { padding: 6, paddingBottom: 10 },
  input: {
    flex: 1, minHeight: 38, maxHeight: 100,
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    color: Colors.textPrimary, fontSize: Typography.sizes.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: 0,
  },
  sendBtnActive: { backgroundColor: Colors.primary },

  // Reaction picker
  reactionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  reactionPicker: {
    flexDirection: 'row', gap: 8, padding: 12,
    backgroundColor: Colors.backgroundCard, borderRadius: 30,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  reactionOption: { padding: 6 },
  reactionOptionEmoji: { fontSize: 26 },
});
