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
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity,
  StatusBar, Animated, ActivityIndicator, Image, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Mock reel data for offline/demo ────────────────────────────────────────
const MOCK_REELS = Array.from({ length: 12 }, (_, i) => ({
  id: `reel_${i}`,
  videoUrl: null,
  thumbnailUrl: null,
  caption: [
    '🔥 This clip goes hard fr',
    'POV: you hit the clutch shot 🎯',
    'Day 47 of grinding ranked 💀',
    'New meta just dropped and it\'s broken',
    'That reload animation tho 😮',
    'Ranked to Diamond using ONLY pistols 🔫',
    'When the squad finally syncs up 🤝',
    'Boss fight speedrun world record attempt',
    'Base building tier list 2024 🏗️',
    'The most satisfying combo I\'ve landed',
    'Solo vs Squad and won somehow??',
    'Game devs really said "balanced" 💀',
  ][i % 12],
  hashtags: ['#gaming', '#clips', '#venture', '#fyp'],
  game: ['Fortnite', 'Valorant', 'Apex', 'Warzone', 'Minecraft'][i % 5],
  likes: Math.floor(Math.random() * 50000) + 1000,
  comments: Math.floor(Math.random() * 5000) + 100,
  shares: Math.floor(Math.random() * 2000) + 50,
  bookmarks: Math.floor(Math.random() * 3000) + 100,
  isLiked: Math.random() > 0.6,
  isBookmarked: Math.random() > 0.8,
  isFollowing: Math.random() > 0.5,
  author: {
    id: `user_${i}`,
    username: ['xXDarkGamer', 'ClipMaster99', 'ProSniper', 'VentureKing', 'EliteFragger'][i % 5],
    displayName: ['Dark Gamer', 'Clip Master', 'Pro Sniper', 'Venture King', 'Elite Fragger'][i % 5],
    avatar: null,
    isVerified: i % 3 === 0,
    followerCount: Math.floor(Math.random() * 500000) + 1000,
  },
  audio: {
    name: ['Original Sound', 'Phonk Mix Vol.3', 'Hard Bass Drop', 'Gaming OST', 'Lo-fi Beats'][i % 5],
    isOriginal: i % 4 === 0,
  },
  viewCount: Math.floor(Math.random() * 1000000) + 10000,
  duration: Math.floor(Math.random() * 55) + 5,
}));

function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Action button component ─────────────────────────────────────────────────
function ActionButton({ icon, activeIcon, count, active, color, onPress, size = 28 }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.actionBtn}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={active ? activeIcon : icon} size={size} color={active ? color : '#fff'} />
      </Animated.View>
      <Text style={styles.actionCount}>{formatCount(count)}</Text>
    </TouchableOpacity>
  );
}

// ─── Single Reel Item ─────────────────────────────────────────────────────────
function ReelItem({ item, isActive, navigation }) {
  const [liked, setLiked] = useState(item.isLiked);
  const [bookmarked, setBookmarked] = useState(item.isBookmarked);
  const [following, setFollowing] = useState(item.isFollowing);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    { id: 1, user: 'gamer_x', text: 'INSANE CLIP 🔥🔥🔥', likes: 234 },
    { id: 2, user: 'pro99', text: 'How did you do that??', likes: 89 },
    { id: 3, user: 'ventureking', text: 'W rizz, W clip', likes: 567 },
    { id: 4, user: 'darksouls', text: 'Bro said delete 💀', likes: 1200 },
    { id: 5, user: 'apex_master', text: 'This is what VENTURE is for 🎯', likes: 445 },
  ]);

  const doubleTapRef = useRef(null);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const handleDoubleTap = () => {
    if (doubleTapRef.current) {
      clearTimeout(doubleTapRef.current);
      doubleTapRef.current = null;
      if (!liked) {
        setLiked(true);
        setLikeCount(c => c + 1);
        // Heart burst animation
        heartScale.setValue(0);
        heartOpacity.setValue(1);
        Animated.sequence([
          Animated.spring(heartScale, { toValue: 1.2, useNativeDriver: true, speed: 20 }),
          Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
          Animated.timing(heartOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
      }
    } else {
      doubleTapRef.current = setTimeout(() => { doubleTapRef.current = null; }, 300);
    }
  };

  const toggleLike = () => {
    setLiked(prev => {
      setLikeCount(c => prev ? c - 1 : c + 1);
      return !prev;
    });
    try { api.post(`/reels/${item.id}/like`); } catch (_) {}
  };

  const toggleBookmark = () => {
    setBookmarked(p => !p);
    try { api.post(`/reels/${item.id}/bookmark`); } catch (_) {}
  };

  const sendComment = () => {
    if (!comment.trim()) return;
    setComments(prev => [{ id: Date.now(), user: 'you', text: comment.trim(), likes: 0 }, ...prev]);
    setComment('');
    try { api.post(`/reels/${item.id}/comment`, { content: comment.trim() }); } catch (_) {}
  };

  return (
    <View style={styles.reelContainer}>
      {/* Video / Thumbnail Placeholder */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={StyleSheet.absoluteFill}>
        <View style={styles.videoPlaceholder}>
          <LinearGradient
            colors={['#1a0533', '#0d1b3e', '#001a33']}
            style={StyleSheet.absoluteFill}
          />
          {/* Game tag */}
          <View style={styles.gameTagTop}>
            <Ionicons name="game-controller" size={12} color={Colors.accent} />
            <Text style={styles.gameTagText}>{item.game}</Text>
          </View>
          {/* Center icon (mimics paused video) */}
          <View style={styles.videoCenter}>
            <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.15)" />
          </View>
          {/* Duration badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}s</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Double-tap heart */}
      <Animated.View
        pointerEvents="none"
        style={[styles.heartBurst, { transform: [{ scale: heartScale }], opacity: heartOpacity }]}
      >
        <Ionicons name="heart" size={120} color={Colors.danger} />
      </Animated.View>

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        {/* Author row */}
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => navigation.navigate('Profile', { userId: item.author.id })}
        >
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarInitial}>{item.author.username[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.authorName}>@{item.author.username}</Text>
          {item.author.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
          )}
          {!following && (
            <TouchableOpacity
              style={styles.followBtn}
              onPress={() => setFollowing(true)}
            >
              <Text style={styles.followBtnText}>+ Follow</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Caption */}
        <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>

        {/* Hashtags */}
        <Text style={styles.hashtags}>{item.hashtags.join(' ')}</Text>

        {/* Audio */}
        <View style={styles.audioRow}>
          <Ionicons name="musical-notes" size={13} color={Colors.textSecondary} />
          <Text style={styles.audioText} numberOfLines={1}>{item.audio.name}</Text>
        </View>
      </View>

      {/* Right-side action buttons */}
      <View style={styles.actions}>
        {/* Avatar (larger) with ring */}
        <TouchableOpacity
          style={styles.avatarAction}
          onPress={() => navigation.navigate('Profile', { userId: item.author.id })}
        >
          <View style={styles.avatarRing}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeInitial}>{item.author.username[0].toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.followPill}>
            <Text style={styles.followPillText}>+</Text>
          </View>
        </TouchableOpacity>

        <ActionButton icon="heart-outline" activeIcon="heart" count={likeCount} active={liked} color={Colors.danger} onPress={toggleLike} />
        <ActionButton icon="chatbubble-outline" activeIcon="chatbubble" count={item.comments} active={false} color={Colors.accent} onPress={() => setShowComments(true)} />
        <ActionButton icon="bookmark-outline" activeIcon="bookmark" count={item.bookmarks} active={bookmarked} color={Colors.accentAlt} onPress={toggleBookmark} />
        <ActionButton icon="arrow-redo-outline" activeIcon="arrow-redo" count={item.shares} active={false} color={Colors.textPrimary} onPress={() => {}} />
        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Spinning audio disc */}
        <View style={styles.audioDisc}>
          <View style={styles.audioDiscInner}>
            <Text style={styles.audioDiscText}>♪</Text>
          </View>
        </View>
      </View>

      {/* Comments panel */}
      {showComments && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.commentsOverlay}
          onPress={() => setShowComments(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.commentsPanel} onPress={() => {}}>
            <View style={styles.commentsPanelHandle} />
            <Text style={styles.commentsPanelTitle}>Comments · {formatCount(item.comments)}</Text>
            {comments.map(c => (
              <View key={c.id} style={styles.commentRow}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{c.user[0].toUpperCase()}</Text>
                </View>
                <View style={styles.commentBody}>
                  <Text style={styles.commentUser}>@{c.user}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
                <View style={styles.commentLikes}>
                  <Ionicons name="heart-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.commentLikeCount}>{formatCount(c.likes)}</Text>
                </View>
              </View>
            ))}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={Colors.textMuted}
                value={comment}
                onChangeText={setComment}
                returnKeyType="send"
                onSubmitEditing={sendComment}
              />
              <TouchableOpacity onPress={sendComment} style={styles.sendBtn}>
                <Ionicons name="send" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReelsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [reels, setReels] = useState(MOCK_REELS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState('for_you'); // 'for_you' | 'following'
  const flatListRef = useRef(null);

  useEffect(() => {
    loadReels();
  }, [tab]);

  const loadReels = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get(`/reels/feed?type=${tab}&limit=20`);
      if (res.data?.reels?.length) {
        setReels(res.data.reels);
      } else {
        // Server returned empty — keep mock data so screen isn't blank
        setReels(MOCK_REELS);
      }
    } catch (e) {
      setLoadError(e?.response?.data?.error || e.message || 'Could not load reels');
      // Fall back to mock data so the UI is still usable offline/dev
      setReels(MOCK_REELS);
    } finally {
      setLoading(false);
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index);
  }, []);

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 70 };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top nav tabs (For You / Following) */}
      <View style={[styles.topNav, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBack}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.tabs}>
          {['for_you', 'following'].map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={styles.tabBtn}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'for_you' ? 'For You' : 'Following'}
              </Text>
              {tab === t && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.topSearch} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* API error banner — shown briefly at top, doesn't block content (mock shown instead) */}
      {loadError && (
        <View style={[styles.errorBanner, { top: insets.top + 64 }]}>
          <Ionicons name="alert-circle-outline" size={14} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.errorBannerText} numberOfLines={1}>{loadError} — showing cached content</Text>
          <TouchableOpacity onPress={loadReels} style={{ marginLeft: 8 }}>
            <Text style={styles.errorBannerRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Full-screen vertical reel list */}
      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ReelItem item={item} isActive={index === activeIndex} navigation={navigation} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
        onEndReached={loadReels}
        onEndReachedThreshold={0.5}
        style={{ flex: 1 }}
      />

      {/* Progress dots */}
      <View style={[styles.progressDots, { bottom: insets.bottom + 80 }]}>
        {reels.slice(Math.max(0, activeIndex - 2), activeIndex + 3).map((_, i) => {
          const realIndex = Math.max(0, activeIndex - 2) + i;
          return (
            <View
              key={realIndex}
              style={[styles.dot, realIndex === activeIndex && styles.dotActive]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  errorBanner: {
    position: 'absolute', left: 16, right: 16, zIndex: 200,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  errorBannerText: { flex: 1, color: '#fff', fontSize: 12 },
  errorBannerRetry: { color: '#fff', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },

  // Top nav
  topNav: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm,
  },
  topBack: { padding: 4 },
  topSearch: { padding: 4 },
  tabs: { flexDirection: 'row', gap: Spacing.xl },
  tabBtn: { alignItems: 'center', paddingBottom: 2 },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: Typography.sizes.md, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabUnderline: { height: 2, width: '100%', backgroundColor: '#fff', marginTop: 3, borderRadius: 1 },

  // Reel container
  reelContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gameTagTop: {
    position: 'absolute', top: 120, left: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  gameTagText: { color: Colors.accent, fontSize: Typography.sizes.xs, fontWeight: '600' },
  videoCenter: { alignItems: 'center', justifyContent: 'center' },
  durationBadge: {
    position: 'absolute', bottom: 160, right: Spacing.base + 60,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  durationText: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '500' },

  // Heart burst
  heartBurst: {
    position: 'absolute', top: '35%', left: '50%',
    marginLeft: -60, zIndex: 50,
    alignItems: 'center', justifyContent: 'center',
  },

  // Gradient
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.55 },

  // Bottom info
  bottomInfo: {
    position: 'absolute', bottom: 80, left: Spacing.base, right: 80, gap: 6,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarSmall: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarInitial: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: '700' },
  authorName: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: '700' },
  followBtn: {
    paddingHorizontal: 12, paddingVertical: 3,
    borderWidth: 1.5, borderColor: '#fff', borderRadius: 20,
  },
  followBtnText: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '600' },
  caption: { color: '#fff', fontSize: Typography.sizes.sm, lineHeight: 20 },
  hashtags: { color: Colors.primaryLight, fontSize: Typography.sizes.xs, fontWeight: '600' },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  audioText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, flex: 1 },

  // Right actions
  actions: {
    position: 'absolute', right: Spacing.base, bottom: 90,
    alignItems: 'center', gap: Spacing.lg,
  },
  actionBtn: { alignItems: 'center', gap: 3 },
  actionCount: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '600' },
  avatarAction: { marginBottom: 4 },
  avatarRing: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLarge: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLargeInitial: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '700' },
  followPill: {
    position: 'absolute', bottom: -8,
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#000',
  },
  followPillText: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: -1 },
  audioDisc: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.border,
  },
  audioDiscInner: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  audioDiscText: { color: Colors.textSecondary, fontSize: 10 },

  // Progress dots
  progressDots: {
    position: 'absolute', right: Spacing.xs, flexDirection: 'column', gap: 3,
    alignItems: 'center',
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { height: 12, backgroundColor: '#fff' },

  // Comments overlay
  commentsOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', zIndex: 200,
  },
  commentsPanel: {
    backgroundColor: Colors.backgroundCard, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.65, paddingBottom: 20,
  },
  commentsPanelHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 12,
  },
  commentsPanelTitle: {
    color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700',
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  commentRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  commentAvatarText: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  commentBody: { flex: 1, gap: 2 },
  commentUser: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  commentText: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, lineHeight: 18 },
  commentLikes: { alignItems: 'center', gap: 2 },
  commentLikeCount: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.base, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  commentInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    color: Colors.textPrimary, fontSize: Typography.sizes.sm,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.backgroundElevated,
    alignItems: 'center', justifyContent: 'center',
  },
});
