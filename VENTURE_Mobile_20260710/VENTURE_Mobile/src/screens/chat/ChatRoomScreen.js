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
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import moment from 'moment';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { chatAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';

const REACTIONS = ['❤️', '🔥', '😂', '😮', '👏', '🎮', '⚡', '💯'];
const BADGE_COLORS = {
  admin: Colors.danger, moderator: Colors.accentAlt,
  verified: Colors.primary, creator: Colors.primary,
  subscriber: Colors.success
};

export default function ChatRoomScreen({ route, navigation }) {
  const { slug, room: initialRoom } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const flatListRef = useRef(null);
  const [room, setRoom] = useState(initialRoom);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(initialRoom?.onlineCount || 0);
  const [replyTo, setReplyTo] = useState(null);
  const [showReactions, setShowReactions] = useState(null); // messageId
  const [isMuted, setIsMuted] = useState(false);
  const typingTimeout = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    loadRoom();
    joinRoom();
    return () => leaveRoom();
  }, [slug]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('chat:join', slug);

    socket.on('chat:message:new', (msg) => {
      if (msg.roomId !== room?.id) return;
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('chat:typing', ({ username, isTyping }) => {
      if (username === user?.username) return;
      setTypingUsers(prev =>
        isTyping ? [...new Set([...prev, username])] : prev.filter(u => u !== username)
      );
    });

    socket.on('chat:blocked', ({ message, autoMuted }) => {
      Alert.alert('Message Blocked ⚠️', message);
      if (autoMuted) {
        setIsMuted(true);
        Alert.alert('You\'ve been muted', 'Too many violations. You\'ve been muted for 10 minutes.');
      }
    });

    socket.on('chat:muted', () => setIsMuted(true));

    socket.on('chat:reaction', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: JSON.stringify(reactions) } : m));
    });

    socket.on('chat:user_joined', ({ username }) => {
      setOnlineCount(c => c + 1);
    });

    return () => {
      socket.off('chat:message:new');
      socket.off('chat:typing');
      socket.off('chat:blocked');
      socket.off('chat:muted');
      socket.off('chat:reaction');
      socket.off('chat:user_joined');
      socket.emit('chat:leave', room?.id);
    };
  }, [socket, room?.id, slug]);

  const loadRoom = async () => {
    try {
      const [roomRes, messagesRes] = await Promise.all([
        chatAPI.getRoom(slug),
        chatAPI.getMessages(slug, { limit: 50 })
      ]);
      setRoom(roomRes.data);
      setMessages(messagesRes.data.messages || []);
      setOnlineCount(roomRes.data.onlineCount || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const joinRoom = async () => {
    try { await chatAPI.joinRoom(slug); } catch {}
  };

  const leaveRoom = () => {
    if (socket && room?.id) socket.emit('chat:leave', room.id);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending || isMuted) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (socket && room?.id) {
      socket.emit('chat:message', { roomId: room.id, content: text, replyToId: replyTo?.id });
      setReplyTo(null);
    }
    setSending(false);
  };

  const handleTyping = (text) => {
    setInputText(text);
    if (socket && room?.id) {
      socket.emit('chat:typing', { roomId: room.id, isTyping: true });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('chat:typing', { roomId: room.id, isTyping: false });
      }, 2000);
    }
  };

  const handleLongPress = (message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReactions(message.id);
  };

  const sendReaction = async (messageId, emoji) => {
    setShowReactions(null);
    if (socket && room?.id) {
      socket.emit('chat:react', { roomId: room.id, messageId, emoji });
    }
  };

  const handleReport = (message) => {
    Alert.alert(
      'Report Message',
      'Why are you reporting this message?',
      [
        { text: 'Spam', onPress: () => chatAPI.reportMessage(message.id, { reason: 'spam' }) },
        { text: 'Inappropriate', onPress: () => chatAPI.reportMessage(message.id, { reason: 'inappropriate' }) },
        { text: 'Harassment', onPress: () => chatAPI.reportMessage(message.id, { reason: 'harassment' }) },
        { text: 'Hate Speech', onPress: () => chatAPI.reportMessage(message.id, { reason: 'hate_speech' }) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderBadge = (badge) => (
    <View key={badge} style={[styles.badge, { backgroundColor: (BADGE_COLORS[badge] || Colors.primary) + '30' }]}>
      <Text style={[styles.badgeText, { color: BADGE_COLORS[badge] || Colors.primary }]}>{badge}</Text>
    </View>
  );

  const renderMessage = ({ item, index }) => {
    const isOwn = item.userId === user?.id;
    const reactions = item.reactions ? JSON.parse(item.reactions) : {};
    const hasReactions = Object.keys(reactions).length > 0;

    return (
      <TouchableOpacity
        style={[styles.messageRow, isOwn && styles.messageRowOwn]}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.95}
      >
        {!isOwn && (
          <View style={styles.avatarCol}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={Colors.gradientPrimary} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{item.displayName?.charAt(0)}</Text>
              </LinearGradient>
            )}
          </View>
        )}

        <View style={[styles.messageBubbleContainer, isOwn && styles.messageBubbleContainerOwn]}>
          {!isOwn && (
            <View style={styles.messageHeader}>
              <Text style={styles.messageUsername}>{item.displayName}</Text>
              {item.badges?.map(renderBadge)}
            </View>
          )}

          {item.replyToId && (
            <View style={styles.replyPreview}>
              <Ionicons name="return-up-back" size={12} color={Colors.textMuted} />
              <Text style={styles.replyPreviewText} numberOfLines={1}>Replying...</Text>
            </View>
          )}

          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, item.isSystemMsg && styles.bubbleSystem]}>
            {item.isDeleted ? (
              <Text style={styles.deletedText}>🗑 Message deleted</Text>
            ) : (
              <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
                {item.content}
                {item.wasCensored && <Text style={styles.censoredNote}> ✏️</Text>}
              </Text>
            )}
          </View>

          <View style={[styles.messageMeta, isOwn && styles.messageMetaOwn]}>
            <Text style={styles.messageTime}>{moment(item.createdAt).format('HH:mm')}</Text>
            {hasReactions && (
              <View style={styles.reactions}>
                {Object.entries(reactions).map(([emoji, count]) => (
                  <TouchableOpacity key={emoji} style={styles.reactionTag} onPress={() => sendReaction(item.id, emoji)}>
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    <Text style={styles.reactionCount}>{count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {isOwn && (
          <View style={styles.avatarCol}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={Colors.gradientPrimary} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{item.displayName?.charAt(0)}</Text>
              </LinearGradient>
            )}
          </View>
        )}

        {/* Reaction picker overlay */}
        {showReactions === item.id && (
          <View style={[styles.reactionPicker, isOwn && styles.reactionPickerOwn]}>
            {REACTIONS.map(emoji => (
              <TouchableOpacity key={emoji} style={styles.reactionPickerItem} onPress={() => sendReaction(item.id, emoji)}>
                <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.reactionPickerItem} onPress={() => { setShowReactions(null); handleReport(item); }}>
              <Ionicons name="flag-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reactionPickerItem} onPress={() => { setReplyTo(item); setShowReactions(null); }}>
              <Ionicons name="return-up-back" size={20} color={Colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.reactionPickerClose} onPress={() => setShowReactions(null)}>
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{room?.name || slug}</Text>
          <View style={styles.headerMeta}>
            <View style={styles.onlineDotSmall} />
            <Text style={styles.headerOnline}>{formatCount(onlineCount)} online</Text>
            <View style={styles.shieldTag}>
              <MaterialCommunityIcons name="shield-check" size={11} color={Colors.success} />
              <Text style={styles.shieldText}>Moderated</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          {room?.isLocked && <Ionicons name="lock-closed" size={16} color={Colors.warning} />}
          <TouchableOpacity onPress={() => navigation.navigate('ChatRoomInfo', { slug, room })}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>{room?.flagEmoji || '💬'}</Text>
              <Text style={styles.emptyChatTitle}>Be the first to chat!</Text>
              <Text style={styles.emptyChatDesc}>Say hello to {room?.regionName || 'everyone'} 👋</Text>
            </View>
          }
        />
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <View style={styles.typingRow}>
          <View style={styles.typingDots}>
            {[0,1,2].map(i => (
              <View key={i} style={[styles.typingDot, { opacity: 0.4 + i * 0.2 }]} />
            ))}
          </View>
          <Text style={styles.typingText}>
            {typingUsers.slice(0, 2).join(', ')} {typingUsers.length > 2 ? `+${typingUsers.length - 2} ` : ''}
            {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </Text>
        </View>
      )}

      {/* Reply preview */}
      {replyTo && (
        <View style={styles.replyBar}>
          <Ionicons name="return-up-back" size={16} color={Colors.accent} />
          <Text style={styles.replyBarText} numberOfLines={1}>
            Replying to <Text style={styles.replyBarName}>{replyTo.displayName}</Text>: {replyTo.content}
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        {room?.isLocked ? (
          <View style={styles.lockedBar}>
            <Ionicons name="lock-closed" size={16} color={Colors.warning} />
            <Text style={styles.lockedText}>This room is locked by an admin</Text>
          </View>
        ) : isMuted ? (
          <View style={styles.mutedBar}>
            <Ionicons name="volume-mute" size={16} color={Colors.danger} />
            <Text style={styles.mutedText}>You are temporarily muted</Text>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={handleTyping}
              placeholder={`Message ${room?.name || 'room'}...`}
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
            >
              <LinearGradient
                colors={inputText.trim() ? Colors.gradientPrimary : [Colors.surface, Colors.surface]}
                style={styles.sendBtnGradient}
              >
                <Ionicons name="send" size={18} color={inputText.trim() ? '#FFF' : Colors.textMuted} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.ruleReminder}>Keep it clean · No hate · No links · Family-friendly only</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const formatCount = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : (n || 0).toString();

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, marginHorizontal: Spacing.sm },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  onlineDotSmall: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.success },
  headerOnline: { color: Colors.success, fontSize: Typography.sizes.xs, fontWeight: '600' },
  shieldTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  shieldText: { color: Colors.success, fontSize: 9, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.md, paddingBottom: 20 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyChatEmoji: { fontSize: 56 },
  emptyChatTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '700' },
  emptyChatDesc: { color: Colors.textSecondary, fontSize: Typography.sizes.md },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.md, gap: Spacing.sm, position: 'relative' },
  messageRowOwn: { flexDirection: 'row-reverse' },
  avatarCol: { width: 32, alignItems: 'center' },
  avatar: { width: 30, height: 30, borderRadius: 15 },
  avatarPlaceholder: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  messageBubbleContainer: { flex: 1, maxWidth: '75%' },
  messageBubbleContainerOwn: { alignItems: 'flex-end' },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3, paddingHorizontal: 4 },
  messageUsername: { color: Colors.primary, fontSize: Typography.sizes.xs, fontWeight: '700' },
  badge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  badgeText: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  replyPreview: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3, marginBottom: 3 },
  replyPreviewText: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  bubble: { borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  bubbleOwn: { backgroundColor: Colors.primary, borderBottomRightRadius: BorderRadius.sm },
  bubbleOther: { backgroundColor: Colors.surface, borderBottomLeftRadius: BorderRadius.sm },
  bubbleSystem: { backgroundColor: 'transparent', alignSelf: 'center' },
  deletedText: { color: Colors.textMuted, fontSize: Typography.sizes.sm, fontStyle: 'italic' },
  messageText: { color: Colors.textSecondary, fontSize: Typography.sizes.md, lineHeight: 20 },
  messageTextOwn: { color: '#FFF' },
  censoredNote: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  messageMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3, paddingHorizontal: 4 },
  messageMetaOwn: { flexDirection: 'row-reverse' },
  messageTime: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  reactionTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  reactionPicker: { position: 'absolute', bottom: '100%', left: 36, backgroundColor: Colors.backgroundElevated, borderRadius: BorderRadius.lg, flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.sm, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 100, maxWidth: 240 },
  reactionPickerOwn: { left: 'auto', right: 36 },
  reactionPickerItem: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  reactionPickerEmoji: { fontSize: 22 },
  reactionPickerClose: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 4, gap: Spacing.sm },
  typingDots: { flexDirection: 'row', gap: 3 },
  typingDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.textMuted },
  typingText: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  replyBarText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  replyBarName: { color: Colors.primary, fontWeight: '700' },
  inputContainer: { borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.backgroundCard, paddingTop: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.sm, gap: Spacing.sm, marginBottom: 4 },
  input: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, color: Colors.textPrimary, fontSize: Typography.sizes.md, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: BorderRadius.lg, marginHorizontal: Spacing.sm },
  lockedText: { color: Colors.warning, fontSize: Typography.sizes.sm, fontWeight: '600' },
  mutedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: BorderRadius.lg, marginHorizontal: Spacing.sm },
  mutedText: { color: Colors.danger, fontSize: Typography.sizes.sm, fontWeight: '600' },
  ruleReminder: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', paddingBottom: 2 },
});
