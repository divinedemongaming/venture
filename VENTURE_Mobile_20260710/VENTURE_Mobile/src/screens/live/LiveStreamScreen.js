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
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Animated, Dimensions, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const { width: W, height: H } = Dimensions.get('window');

const MOCK_STREAM = {
  id: 'stream_1',
  title: '🔥 RANKED GRIND — Road to Diamond',
  game: 'Valorant',
  streamer: {
    id: 'streamer_1',
    username: 'ProSniper',
    displayName: 'Pro Sniper',
    isVerified: true,
    followerCount: 48200,
    avatar: null,
  },
  viewerCount: 1847,
  peakViewers: 3200,
  startedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  isSubscribed: false,
  isModerator: false,
  superchatsEnabled: true,
  tags: ['FPS', 'Ranked', 'Valorant', 'Competitive'],
};

const MOCK_CHAT = [
  { id: 'c1', userId: 'u1', username: 'ClipMaster', message: 'LET\'S GOOO 🔥', type: 'normal', color: '#06B6D4' },
  { id: 'c2', userId: 'u2', username: 'VentureKing', message: 'VIPER DIFF FR', type: 'normal', color: '#7C3AED' },
  { id: 'c3', userId: 'u3', username: 'EliteFragger', message: 'bro that was clean', type: 'normal', color: '#10B981' },
  { id: 'c4', userId: 'u4', username: 'DarkSoul', message: '👀👀👀', type: 'normal', color: '#F59E0B' },
  { id: 'c5', userId: 'mod1', username: 'MOD_zeus', message: 'Keep chat clean everyone!', type: 'mod', color: '#EF4444' },
  { id: 'c6', userId: 'u5', username: 'apex_god', message: 'That headshot tho 😮', type: 'normal', color: '#8B5CF6' },
  { id: 'c7', userId: 'u6', username: 'FragMaster', message: 'W streamer W game W everything', type: 'normal', color: '#06B6D4' },
  { id: 'c8', userId: 'sub1', username: 'subscriber_x', message: 'Just gifted 5 subs!! 🎁', type: 'sub', color: Colors.accentAlt },
];

const SUPERCHAT_TIERS = [
  { amount: 1, color: '#1565C0', label: '$1' },
  { amount: 2, color: '#00838F', label: '$2' },
  { amount: 5, color: '#558B2F', label: '$5' },
  { amount: 10, color: '#F9A825', label: '$10' },
  { amount: 20, color: '#E65100', label: '$20' },
  { amount: 50, color: '#B71C1C', label: '$50' },
];

function ChatMessage({ item }) {
  const bgColor = item.type === 'sub'
    ? Colors.accentAlt + '20'
    : item.type === 'mod'
    ? Colors.danger + '15'
    : 'transparent';

  return (
    <View style={[styles.chatMsg, { backgroundColor: bgColor }]}>
      {item.type === 'sub' && <Ionicons name="gift" size={12} color={Colors.accentAlt} style={{ marginRight: 4 }} />}
      {item.type === 'mod' && <Ionicons name="shield" size={12} color={Colors.danger} style={{ marginRight: 4 }} />}
      <Text style={[styles.chatUsername, { color: item.color }]}>{item.username} </Text>
      <Text style={styles.chatText}>{item.message}</Text>
    </View>
  );
}

function FloatingHeart({ id, onDone }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const x = useRef(new Animated.Value(Math.random() * 40 - 20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: -200, duration: 2000, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ]).start(() => onDone(id));
  }, []);

  return (
    <Animated.View
      style={[styles.floatingHeart, { transform: [{ translateY: y }, { translateX: x }], opacity }]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: 24 }}>❤️</Text>
    </Animated.View>
  );
}

export default function LiveStreamScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const streamId = route?.params?.streamId || 'stream_1';

  const [stream, setStream] = useState(MOCK_STREAM);
  const [chat, setChat] = useState(MOCK_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(MOCK_STREAM.viewerCount);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(23400);
  const [following, setFollowing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showSuperchat, setShowSuperchat] = useState(false);
  const [selectedTier, setSelectedTier] = useState(SUPERCHAT_TIERS[2]);
  const [superchatMsg, setSuperchatMsg] = useState('');
  const [chatVisible, setChatVisible] = useState(true);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [streamTime, setStreamTime] = useState(0);
  const [quality, setQuality] = useState('1080p');
  const [showQuality, setShowQuality] = useState(false);

  const chatListRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchStream();
    // Simulate live chat messages
    const chatTimer = setInterval(() => {
      const users = ['xXGamer', 'ClipLord', 'VentureFan', 'FPSGod', 'ProPlayer'];
      const msgs = ['GG 🔥', 'LETS GO', 'W', '👀', 'insane play', 'PEEPO HAPPY', '🔥🔥🔥', 'clip that!', 'GOAT', 'no way'];
      setChat(prev => [
        ...prev.slice(-40),
        {
          id: `live_${Date.now()}`,
          userId: `rand_${Math.random()}`,
          username: users[Math.floor(Math.random() * users.length)],
          message: msgs[Math.floor(Math.random() * msgs.length)],
          type: 'normal',
          color: ['#06B6D4', '#7C3AED', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)],
        }
      ]);
    }, 2500);

    // Simulate viewer count fluctuation
    const viewerTimer = setInterval(() => {
      setViewerCount(v => v + Math.floor(Math.random() * 10 - 4));
    }, 5000);

    // Stream elapsed timer
    timerRef.current = setInterval(() => setStreamTime(t => t + 1), 1000);

    return () => {
      clearInterval(chatTimer);
      clearInterval(viewerTimer);
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, [chat]);

  const fetchStream = async () => {
    try {
      const res = await api.get(`/live/${streamId}`);
      if (res.data?.stream) setStream(res.data.stream);
    } catch (_) {}
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    const newMsg = {
      id: `me_${Date.now()}`,
      userId: user?.id || 'me',
      username: user?.username || 'You',
      message: text,
      type: 'normal',
      color: Colors.primary,
    };
    setChat(prev => [...prev, newMsg]);
    setChatInput('');
    try { await api.post(`/live/${streamId}/chat`, { message: text }); } catch (_) {}
  };

  const handleLike = () => {
    setLiked(p => !p);
    setLikeCount(c => liked ? c - 1 : c + 1);
    // Spawn floating hearts
    const hearts = Array.from({ length: 3 }, () => ({ id: `h_${Date.now()}_${Math.random()}` }));
    setFloatingHearts(prev => [...prev, ...hearts]);
    try { api.post(`/live/${streamId}/like`); } catch (_) {}
  };

  const removeHeart = useCallback((id) => {
    setFloatingHearts(prev => prev.filter(h => h.id !== id));
  }, []);

  const sendSuperchat = async () => {
    const text = superchatMsg.trim();
    const newMsg = {
      id: `sc_${Date.now()}`,
      userId: user?.id || 'me',
      username: user?.username || 'You',
      message: `[Super Chat $${selectedTier.amount}] ${text || '🔥'}`,
      type: 'sub',
      color: selectedTier.color,
    };
    setChat(prev => [...prev, newMsg]);
    setShowSuperchat(false);
    setSuperchatMsg('');
    try { await api.post(`/live/${streamId}/superchat`, { amount: selectedTier.amount, message: text }); } catch (_) {}
  };

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const elapsed = Math.floor((Date.now() - new Date(stream.startedAt).getTime()) / 1000) + streamTime;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Stream video area */}
      <View style={styles.streamArea}>
        <LinearGradient colors={['#1a0533', '#0d1b3e', '#001a2e']} style={StyleSheet.absoluteFill} />

        {/* Simulated stream content */}
        <View style={styles.streamContent}>
          <Ionicons name="game-controller" size={64} color="rgba(255,255,255,0.1)" />
        </View>

        {/* Top bar */}
        <View style={[styles.streamTopBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-down" size={26} color="#fff" />
          </TouchableOpacity>

          <View style={styles.streamInfo}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>LIVE</Text>
            </View>
            <View style={styles.viewerPill}>
              <Ionicons name="eye" size={12} color="#fff" />
              <Text style={styles.viewerCount}>{viewerCount.toLocaleString()}</Text>
            </View>
            <Text style={styles.streamTimer}>{formatDuration(elapsed)}</Text>
          </View>

          <View style={styles.topRight}>
            <TouchableOpacity style={styles.topBtn} onPress={() => setShowQuality(p => !p)}>
              <Text style={styles.qualityText}>{quality}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBtn}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quality selector */}
        {showQuality && (
          <View style={[styles.qualityPanel, { top: insets.top + 50 }]}>
            {['1080p', '720p', '480p', '360p', 'Auto'].map(q => (
              <TouchableOpacity
                key={q}
                style={[styles.qualityOption, quality === q && styles.qualityOptionActive]}
                onPress={() => { setQuality(q); setShowQuality(false); }}
              >
                <Text style={[styles.qualityOptionText, quality === q && styles.qualityOptionTextActive]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Streamer info bar */}
        <View style={styles.streamerBar}>
          <TouchableOpacity
            style={styles.streamerInfo}
            onPress={() => navigation.navigate('Profile', { userId: stream.streamer.id })}
          >
            <View style={styles.streamerAvatar}>
              <Text style={styles.streamerAvatarText}>{stream.streamer.displayName[0]}</Text>
            </View>
            <View style={styles.streamerText}>
              <View style={styles.streamerNameRow}>
                <Text style={styles.streamerName}>{stream.streamer.displayName}</Text>
                {stream.streamer.isVerified && (
                  <Ionicons name="checkmark-circle" size={13} color={Colors.accent} />
                )}
              </View>
              <Text style={styles.streamTitle} numberOfLines={1}>{stream.title}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.streamerActions}>
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followingBtn]}
              onPress={() => setFollowing(p => !p)}
            >
              <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            {!subscribed && (
              <TouchableOpacity
                style={styles.subBtn}
                onPress={() => setSubscribed(true)}
              >
                <Text style={styles.subBtnText}>Sub</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Game tag */}
        <View style={styles.gameTag}>
          <Ionicons name="game-controller" size={12} color={Colors.accent} />
          <Text style={styles.gameTagText}>{stream.game}</Text>
        </View>

        {/* Floating hearts */}
        {floatingHearts.map(h => (
          <FloatingHeart key={h.id} id={h.id} onDone={removeHeart} />
        ))}

        {/* Right side actions */}
        <View style={styles.streamActions}>
          <TouchableOpacity onPress={handleLike} style={styles.streamAction}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color={liked ? Colors.danger : '#fff'} />
            <Text style={styles.streamActionCount}>{(likeCount / 1000).toFixed(1)}K</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.streamAction} onPress={() => setChatVisible(p => !p)}>
            <Ionicons name={chatVisible ? 'chatbubble' : 'chatbubble-outline'} size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.streamAction} onPress={() => setShowSuperchat(true)}>
            <Ionicons name="cash-outline" size={26} color={Colors.accentAlt} />
            <Text style={[styles.streamActionCount, { color: Colors.accentAlt }]}>SC</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.streamAction}>
            <Ionicons name="flag-outline" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat section */}
      {chatVisible && (
        <View style={styles.chatSection}>
          <FlatList
            ref={chatListRef}
            data={chat}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ChatMessage item={item} />}
            style={styles.chatList}
            contentContainerStyle={{ paddingVertical: 4 }}
            onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />

          {/* Chat input */}
          <View style={[styles.chatInputBar, { paddingBottom: insets.bottom + 4 }]}>
            <TextInput
              style={styles.chatInput}
              placeholder={subscribed ? 'Chat...' : 'Chat as viewer...'}
              placeholderTextColor={Colors.textMuted}
              value={chatInput}
              onChangeText={setChatInput}
              returnKeyType="send"
              onSubmitEditing={sendChat}
            />
            <TouchableOpacity style={styles.superchatBtn} onPress={() => setShowSuperchat(true)}>
              <Ionicons name="cash" size={18} color={Colors.accentAlt} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chatSendBtn, chatInput.trim() && styles.chatSendBtnActive]}
              onPress={sendChat}
            >
              <Ionicons name="send" size={16} color={chatInput.trim() ? '#fff' : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Superchat modal */}
      {showSuperchat && (
        <TouchableOpacity
          style={styles.scOverlay}
          activeOpacity={1}
          onPress={() => setShowSuperchat(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.scPanel}>
            <View style={styles.scHandle} />
            <Text style={styles.scTitle}>Super Chat</Text>
            <Text style={styles.scSubtitle}>Highlight your message · 85% goes to creator</Text>

            {/* Tier picker */}
            <View style={styles.scTiers}>
              {SUPERCHAT_TIERS.map(tier => (
                <TouchableOpacity
                  key={tier.amount}
                  style={[styles.scTier, { borderColor: tier.color }, selectedTier.amount === tier.amount && { backgroundColor: tier.color + '30' }]}
                  onPress={() => setSelectedTier(tier)}
                >
                  <Text style={[styles.scTierText, { color: tier.color }]}>{tier.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Message */}
            <TextInput
              style={styles.scInput}
              placeholder="Add a message (optional)"
              placeholderTextColor={Colors.textMuted}
              value={superchatMsg}
              onChangeText={setSuperchatMsg}
              maxLength={150}
            />

            {/* Preview */}
            <View style={[styles.scPreview, { backgroundColor: selectedTier.color + '20', borderColor: selectedTier.color }]}>
              <Text style={[styles.scPreviewAmount, { color: selectedTier.color }]}>${selectedTier.amount}</Text>
              <Text style={styles.scPreviewMsg}>{superchatMsg || 'Your message here...'}</Text>
            </View>

            <TouchableOpacity style={[styles.scSendBtn, { backgroundColor: selectedTier.color }]} onPress={sendSuperchat}>
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={styles.scSendText}>Send ${selectedTier.amount} Super Chat</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Stream area
  streamArea: { height: H * 0.52, position: 'relative' },
  streamContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  streamTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  streamInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveLabel: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '800' },
  viewerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  viewerCount: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '600' },
  streamTimer: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sizes.xs },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBtn: {
    padding: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8,
  },
  qualityText: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '600' },

  qualityPanel: {
    position: 'absolute', right: Spacing.base, zIndex: 50,
    backgroundColor: Colors.backgroundCard, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  qualityOption: { paddingHorizontal: 16, paddingVertical: 8 },
  qualityOptionActive: { backgroundColor: Colors.primary + '30' },
  qualityOptionText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  qualityOptionTextActive: { color: Colors.primary, fontWeight: '600' },

  streamerBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingBottom: 10,
    background: 'transparent',
  },
  streamerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  streamerAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  streamerAvatarText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '700' },
  streamerText: { flex: 1 },
  streamerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streamerName: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: '700' },
  streamTitle: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sizes.xs },
  streamerActions: { flexDirection: 'row', gap: 8 },
  followBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1.5, borderColor: '#fff', borderRadius: 16,
  },
  followingBtn: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  followBtnText: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '600' },
  followingBtnText: { color: Colors.primary },
  subBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: Colors.primary, borderRadius: 16,
  },
  subBtnText: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '700' },

  gameTag: {
    position: 'absolute', top: 52, left: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  gameTagText: { color: Colors.accent, fontSize: Typography.sizes.xs, fontWeight: '600' },

  streamActions: {
    position: 'absolute', right: Spacing.base, bottom: 60,
    alignItems: 'center', gap: Spacing.md,
  },
  streamAction: { alignItems: 'center', gap: 2 },
  streamActionCount: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '600' },

  floatingHeart: { position: 'absolute', bottom: 60, right: 60, zIndex: 100 },

  // Chat section
  chatSection: {
    flex: 1, backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  chatList: { flex: 1 },
  chatMsg: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 3,
  },
  chatUsername: { fontSize: Typography.sizes.xs, fontWeight: '700' },
  chatText: { color: Colors.textPrimary, fontSize: Typography.sizes.xs, lineHeight: 16 },

  chatInputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.sm, paddingTop: 6,
    borderTopWidth: 0.5, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chatInput: {
    flex: 1, height: 36, backgroundColor: Colors.surface,
    borderRadius: 18, paddingHorizontal: 12,
    color: Colors.textPrimary, fontSize: Typography.sizes.xs,
    borderWidth: 1, borderColor: Colors.border,
  },
  superchatBtn: { padding: 6 },
  chatSendBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  chatSendBtnActive: { backgroundColor: Colors.primary },

  // Superchat
  scOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end', zIndex: 300,
  },
  scPanel: {
    backgroundColor: Colors.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.base, gap: 12,
  },
  scHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 4,
  },
  scTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '800' },
  scSubtitle: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  scTiers: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  scTier: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1.5, borderRadius: 20,
  },
  scTierText: { fontSize: Typography.sizes.sm, fontWeight: '700' },
  scInput: {
    backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 8, color: Colors.textPrimary, fontSize: Typography.sizes.sm,
  },
  scPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  scPreviewAmount: { fontSize: Typography.sizes.xl, fontWeight: '800' },
  scPreviewMsg: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, flex: 1 },
  scSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 14,
  },
  scSendText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '700' },
});
