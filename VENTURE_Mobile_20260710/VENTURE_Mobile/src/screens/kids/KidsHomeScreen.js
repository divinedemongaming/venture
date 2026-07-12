/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * KidsHomeScreen — Bright, cheerful content feed for children under 13.
 *
 * Safety guarantees:
 *  - All content served via /feed/kids: madeForKids + !isNSFW + contentRating=EVERYONE
 *  - No comments visible, no DMs, no live chat surfaces
 *  - Screen time timer fires every 30s; Time's Up wall blocks all interaction
 *  - Exit Kids Mode and time extension both require the parent PIN
 *  - Each video watch is recorded to SecureStore for badge tracking
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, Image, RefreshControl, Modal, TextInput,
  Dimensions, Platform, Alert, ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { KIDS_CONTENT_CATEGORIES } from '../../constants/legal';
import { hashPin } from '../../utils/pinHash';
import { kidsAPI } from '../../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ── Brand palette ────────────────────────────────────────────────────────────
const K = {
  bg: '#0F1420',
  card: '#1A2035',
  orange: '#FF6B35',
  yellow: '#FFD23F',
  green: '#3ECFB0',
  blue: '#4FACFE',
  purple: '#A78BFA',
  pink: '#F472B6',
  text: '#FFFFFF',
  muted: '#94A3B8',
  dim: '#64748B',
  border: 'rgba(255,255,255,0.08)',
};

const CATEGORY_COLORS = {
  EDUCATIONAL: K.blue,
  ANIMATION: K.purple,
  MUSIC: K.pink,
  ARTS_CRAFTS: K.orange,
  SCIENCE: K.green,
  STORIES: K.yellow,
  NATURE: '#7EC850',
  SPORTS: '#FF6584',
  GAMING_FAMILY: K.orange,
};

const CATEGORY_ICONS = {
  EDUCATIONAL: '📚',
  ANIMATION: '🎬',
  MUSIC: '🎵',
  ARTS_CRAFTS: '🎨',
  SCIENCE: '🔬',
  STORIES: '📖',
  NATURE: '🌿',
  SPORTS: '⚽',
  GAMING_FAMILY: '🎮',
};

// Fallback emoji when no thumbnail is available
const CATEGORY_EMOJI = {
  EDUCATIONAL: '📚',
  ANIMATION: '🎬',
  MUSIC: '🎵',
  ARTS_CRAFTS: '🎨',
  SCIENCE: '🔬',
  STORIES: '📖',
  NATURE: '🌿',
  SPORTS: '⚽',
  GAMING_FAMILY: '🎮',
};

// Format "3661" seconds → "1h 1m" or "4:30" for short clips
function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Content Card ─────────────────────────────────────────────────────────────
function ContentCard({ item, onPress }) {
  const primaryTag = item.tags?.[0] || 'EDUCATIONAL';
  const color = CATEGORY_COLORS[primaryTag] || K.orange;
  const emoji = CATEGORY_EMOJI[primaryTag] || '🎉';
  const icon = CATEGORY_ICONS[primaryTag] || '🎉';

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH }]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.cardThumbImg} resizeMode="cover" />
      ) : (
        <View style={[styles.cardThumb, { backgroundColor: color + '22' }]}>
          <Text style={styles.cardEmoji}>{emoji}</Text>
        </View>
      )}

      {/* Category badge */}
      <View style={[styles.categoryBadge, { backgroundColor: color }]}>
        <Text style={styles.categoryBadgeText}>{icon}</Text>
      </View>

      {/* Duration overlay */}
      {!!item.duration && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
      )}

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || 'Watch Now'}
        </Text>
        <Text style={styles.cardCreator} numberOfLines={1}>
          {item.creator?.displayName || item.creator?.username || 'Creator'}
        </Text>
        <Text style={styles.cardViews}>{formatViews(item.stats?.views)} views</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Time's Up Wall ────────────────────────────────────────────────────────────
function TimesUpWall({ minutesUsed, onExtend }) {
  return (
    <View style={styles.timesUpOverlay}>
      <Text style={styles.timesUpEmoji}>⏰</Text>
      <Text style={styles.timesUpTitle}>Time's Up!</Text>
      <Text style={styles.timesUpSub}>
        You've watched for {minutesUsed} minute{minutesUsed !== 1 ? 's' : ''} today.{'\n'}
        Ask a grown-up to give you more time!
      </Text>
      <TouchableOpacity style={styles.timesUpBtn} onPress={onExtend}>
        <Ionicons name="lock-open-outline" size={18} color="#fff" />
        <Text style={styles.timesUpBtnText}>Ask Parent to Extend</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── PIN Modal ─────────────────────────────────────────────────────────────────
function PinModal({ visible, title, subtitle, onConfirm, onCancel, confirmLabel = 'Confirm' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    const stored = await SecureStore.getItemAsync('venture_kids_pin');
    const hashed = await hashPin(pin);
    if (hashed === stored) {
      setPin('');
      setError('');
      onConfirm();
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  // Reset when hidden
  useEffect(() => {
    if (!visible) { setPin(''); setError(''); }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.pinModal}>
          <Text style={styles.pinModalEmoji}>🔐</Text>
          <Text style={styles.pinModalTitle}>{title}</Text>
          <Text style={styles.pinModalSub}>{subtitle}</Text>
          <TextInput
            style={styles.pinInput}
            placeholder="••••"
            placeholderTextColor={K.dim}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            value={pin}
            onChangeText={setPin}
            autoFocus
          />
          {!!error && <Text style={styles.pinError}>{error}</Text>}
          <View style={styles.pinBtns}>
            <TouchableOpacity style={styles.pinCancelBtn} onPress={onCancel}>
              <Text style={styles.pinCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pinConfirmBtn, pin.length !== 4 && styles.pinConfirmDisabled]}
              onPress={handleConfirm}
              disabled={pin.length !== 4}
            >
              <Text style={styles.pinConfirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function KidsHomeScreen({ navigation }) {
  const { kidsProfile, exitKidsMode, updateKidsProfile } = useAuthStore();

  const childName = kidsProfile?.childName || 'Explorer';
  const avatar = kidsProfile?.avatar || '🌟';
  const allowedCategories = kidsProfile?.allowedCategories || Object.keys(KIDS_CONTENT_CATEGORIES);
  const dailyLimitMinutes = kidsProfile?.dailyLimitMinutes ?? 0; // 0 = no limit

  // ── Feed state ──────────────────────────────────────────────────────────────
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [fetchError, setFetchError] = useState(null);

  // ── Screen time state ───────────────────────────────────────────────────────
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [timesUp, setTimesUp] = useState(false);
  const timerRef = useRef(null);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [extendModalVisible, setExtendModalVisible] = useState(false);

  // ── Load feed ────────────────────────────────────────────────────────────────
  const loadFeed = useCallback(async (reset = false) => {
    try {
      setFetchError(null);
      const cats = activeCategory === 'ALL' ? allowedCategories : [activeCategory];
      const thisCursor = reset ? null : cursor;
      const { data } = await kidsAPI.getFeed(cats, thisCursor, 20);
      if (reset) {
        setFeed(data.items);
      } else {
        setFeed(prev => [...prev, ...data.items]);
      }
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setFetchError('Could not load videos. Check your connection!');
    }
  }, [activeCategory, allowedCategories, cursor]);

  // Initial load + category change
  useEffect(() => {
    setLoading(true);
    setCursor(null);
    setFeed([]);
    loadFeed(true).finally(() => setLoading(false));
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCursor(null);
    await loadFeed(true);
    setRefreshing(false);
  }, [loadFeed]);

  const onLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    await loadFeed(false);
    setLoadingMore(false);
  }, [loadingMore, hasMore, cursor, loadFeed]);

  // ── Screen time ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    const initTimer = async () => {
      // Record session start if not already set
      let start = await SecureStore.getItemAsync('venture_kids_session_start');
      if (!start) {
        start = new Date().toISOString();
        await SecureStore.setItemAsync('venture_kids_session_start', start);
      }

      timerRef.current = setInterval(async () => {
        const startStr = await SecureStore.getItemAsync('venture_kids_session_start');
        if (!startStr) return;
        const elapsed = Math.floor((Date.now() - new Date(startStr).getTime()) / 60000);
        setMinutesUsed(elapsed);
        if (dailyLimitMinutes > 0 && elapsed >= dailyLimitMinutes) {
          setTimesUp(true);
        }
      }, 30_000); // check every 30 seconds
    };

    initTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [dailyLimitMinutes]);

  // ── Record a watch + update badge counters ────────────────────────────────
  const recordWatch = useCallback(async (item) => {
    try {
      // Increment video count
      const countRaw = await SecureStore.getItemAsync('venture_kids_videos_watched');
      const count = parseInt(countRaw || '0', 10) + 1;
      await SecureStore.setItemAsync('venture_kids_videos_watched', String(count));

      // Add duration to total minutes
      if (item.duration) {
        const minsRaw = await SecureStore.getItemAsync('venture_kids_watch_minutes');
        const mins = parseInt(minsRaw || '0', 10) + Math.ceil(item.duration / 60);
        await SecureStore.setItemAsync('venture_kids_watch_minutes', String(mins));
      }

      // Prepend to watch history (keep last 20)
      const histRaw = await SecureStore.getItemAsync('venture_kids_watch_history');
      const hist = histRaw ? JSON.parse(histRaw) : [];
      const updated = [
        {
          id: item.id,
          title: item.title,
          tags: item.tags,
          thumbnailUrl: item.thumbnailUrl,
          creatorName: item.creator?.displayName || item.creator?.username || 'Creator',
          watchedAt: new Date().toISOString(),
        },
        ...hist.filter(h => h.id !== item.id), // deduplicate
      ].slice(0, 20);
      await SecureStore.setItemAsync('venture_kids_watch_history', JSON.stringify(updated));
    } catch {
      // Non-fatal: badge tracking is best-effort
    }
  }, []);

  const handleVideoPress = useCallback((item) => {
    recordWatch(item);
    navigation.navigate('VideoPlayer', {
      videoUrl: item.mediaUrls?.[0] || item.videoUrl || null,
      title: item.title || item.content?.slice(0, 60) || 'Watch Now',
      creator: item.creator?.displayName || item.creator?.username || 'Creator',
      thumbnailUrl: item.thumbnailUrl || null,
      postId: item.id,
      isKids: true,
    });
  }, [recordWatch]);

  // ── Exit Kids Mode ────────────────────────────────────────────────────────
  const handleExitConfirmed = useCallback(async () => {
    setExitModalVisible(false);
    await SecureStore.deleteItemAsync('venture_kids_session_start');
    await exitKidsMode();
  }, [exitKidsMode]);

  // ── Extend screen time ────────────────────────────────────────────────────
  const handleExtendConfirmed = useCallback(async () => {
    setExtendModalVisible(false);
    setTimesUp(false);
    // Grant 30 more minutes by bumping the limit
    await updateKidsProfile({ dailyLimitMinutes: dailyLimitMinutes + 30 });
    // Reset session start to now so the timer restarts clean
    await SecureStore.setItemAsync('venture_kids_session_start', new Date().toISOString());
    setMinutesUsed(0);
  }, [dailyLimitMinutes, updateKidsProfile]);

  // ── Category pill list ────────────────────────────────────────────────────
  const categories = [
    { key: 'ALL', label: 'All', emoji: '🏠' },
    ...allowedCategories.map(k => ({
      key: k,
      label: KIDS_CONTENT_CATEGORIES[k],
      emoji: CATEGORY_ICONS[k] || '🎉',
    })),
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ─── Top Bar ─── */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.avatarBig}>{avatar}</Text>
          <View>
            <Text style={styles.greeting}>Hi, {childName}! 👋</Text>
            {dailyLimitMinutes > 0 ? (
              <Text style={styles.subGreeting}>
                {Math.max(0, dailyLimitMinutes - minutesUsed)} min left today
              </Text>
            ) : (
              <Text style={styles.subGreeting}>What do you want to watch?</Text>
            )}
          </View>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity
            style={styles.controlsBtn}
            onPress={() => navigation.navigate('ParentalControls')}
          >
            <Ionicons name="settings-outline" size={20} color={K.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => setExitModalVisible(true)}
          >
            <Text style={styles.exitBtnText}>Exit Kids</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Category Filter ─── */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={i => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryList}
        renderItem={({ item }) => {
          const active = activeCategory === item.key;
          const color = item.key === 'ALL' ? K.orange : (CATEGORY_COLORS[item.key] || K.orange);
          return (
            <TouchableOpacity
              style={[styles.catChip, active && { backgroundColor: color, borderColor: color }]}
              onPress={() => setActiveCategory(item.key)}
            >
              <Text style={styles.catEmoji}>{item.emoji}</Text>
              <Text style={[styles.catLabel, active && styles.catLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ─── Feed ─── */}
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={K.orange} />
          <Text style={styles.loadingText}>Loading fun videos... 🎉</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.errorCenter}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={i => i.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={K.orange} />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎠</Text>
              <Text style={styles.emptyText}>No videos in this category yet!</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={K.orange} />
            ) : (
              <View style={{ height: 80 }} />
            )
          }
          renderItem={({ item }) => <ContentCard item={item} onPress={handleVideoPress} />}
        />
      )}

      {/* ─── Time's Up Wall — blocks all interaction ─── */}
      {timesUp && (
        <TimesUpWall
          minutesUsed={minutesUsed}
          onExtend={() => setExtendModalVisible(true)}
        />
      )}

      {/* ─── Extend Time PIN Modal ─── */}
      <PinModal
        visible={extendModalVisible}
        title="Extend Screen Time"
        subtitle="Enter your parent PIN to add 30 more minutes"
        confirmLabel="+30 min ✅"
        onConfirm={handleExtendConfirmed}
        onCancel={() => setExtendModalVisible(false)}
      />

      {/* ─── Exit Kids Mode PIN Modal ─── */}
      <PinModal
        visible={exitModalVisible}
        title="Parent PIN Required"
        subtitle="Enter your 4-digit PIN to exit VENTURE Kids"
        confirmLabel="Exit Kids"
        onConfirm={handleExitConfirmed}
        onCancel={() => setExitModalVisible(false)}
      />

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: K.bg },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 12,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBig: { fontSize: 36 },
  greeting: { fontSize: 17, fontWeight: '700', color: K.text },
  subGreeting: { fontSize: 13, color: K.muted, marginTop: 1 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  controlsBtn: { padding: 8 },
  exitBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: K.dim,
  },
  exitBtnText: { fontSize: 12, color: K.muted, fontWeight: '600' },

  // Category filter
  categoryList: { maxHeight: 52 },
  categoryRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: K.border, backgroundColor: K.card,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 13, color: K.muted, fontWeight: '500' },
  catLabelActive: { color: '#fff', fontWeight: '700' },

  // Grid
  grid: { paddingHorizontal: 16, paddingTop: 12 },
  gridRow: { gap: 12, marginBottom: 12 },

  // Card
  card: { borderRadius: 16, backgroundColor: K.card, overflow: 'hidden' },
  cardThumb: { height: 110, justifyContent: 'center', alignItems: 'center' },
  cardThumbImg: { width: '100%', height: 110 },
  cardEmoji: { fontSize: 40 },
  categoryBadge: {
    position: 'absolute', top: 8, left: 8,
    width: 24, height: 24, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  categoryBadgeText: { fontSize: 12 },
  durationBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  durationText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: K.text, lineHeight: 18, marginBottom: 4 },
  cardCreator: { fontSize: 11, color: K.muted, marginBottom: 2 },
  cardViews: { fontSize: 11, color: K.dim },

  // Loading / error states
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: K.muted },
  errorCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: 16, color: K.muted, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: K.orange, borderRadius: 24,
  },
  retryText: { fontSize: 15, color: '#fff', fontWeight: '700' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: K.muted },

  // Time's Up wall
  timesUpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0E1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 36,
    zIndex: 100,
  },
  timesUpEmoji: { fontSize: 72, marginBottom: 16 },
  timesUpTitle: { fontSize: 32, fontWeight: '900', color: K.yellow, marginBottom: 10 },
  timesUpSub: {
    fontSize: 17, color: K.muted, textAlign: 'center', lineHeight: 26, marginBottom: 32,
  },
  timesUpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 16,
    backgroundColor: K.orange, borderRadius: 28,
  },
  timesUpBtnText: { fontSize: 17, color: '#fff', fontWeight: '700' },

  // PIN modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  pinModal: {
    backgroundColor: K.card, borderRadius: 24, padding: 28,
    alignItems: 'center', width: '100%',
  },
  pinModalEmoji: { fontSize: 44, marginBottom: 12 },
  pinModalTitle: { fontSize: 20, fontWeight: '700', color: K.text, marginBottom: 6 },
  pinModalSub: { fontSize: 14, color: K.muted, textAlign: 'center', marginBottom: 20 },
  pinInput: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 24, color: K.text, borderWidth: 1, borderColor: K.border,
    textAlign: 'center', letterSpacing: 12, marginBottom: 8,
  },
  pinError: { fontSize: 13, color: '#FF4D4D', marginBottom: 8 },
  pinBtns: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  pinCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: K.border, alignItems: 'center',
  },
  pinCancelText: { fontSize: 15, color: K.muted, fontWeight: '600' },
  pinConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: K.orange, alignItems: 'center',
  },
  pinConfirmDisabled: { opacity: 0.4 },
  pinConfirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
