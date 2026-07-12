/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * KidsProfileScreen — Safe child profile: badges, watch stats, recent history.
 *
 * All data lives in SecureStore on-device (no server calls needed):
 *   venture_kids_videos_watched  — integer count
 *   venture_kids_watch_minutes   — integer total minutes watched
 *   venture_kids_watch_history   — JSON array of last 20 watched items
 *
 * Badge system:
 *   🌟 First Watch    — 1st video watched
 *   📚 Learner        — watched an EDUCATIONAL video
 *   🎵 Music Fan      — watched a MUSIC video
 *   🔬 Scientist      — watched a SCIENCE video
 *   🏆 Explorer       — 5 videos watched
 *   🎨 Artist         — watched an ARTS_CRAFTS video
 *   🌿 Nature Lover   — watched a NATURE video
 *   ⭐ Super Fan       — 60 total minutes watched
 *   🦄 Legend         — 300 total minutes watched
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Platform, ActivityIndicator, Image, Dimensions,
} from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

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

// Badge definitions — unlocked is derived from real stats
const BADGE_DEFS = [
  { id: 'first_watch',  emoji: '🌟', label: 'First Watch',  hint: 'Watch your first video',     check: (s) => s.videosWatched >= 1 },
  { id: 'learner',      emoji: '📚', label: 'Learner',      hint: 'Watch an educational video', check: (s) => s.watchedTags.includes('EDUCATIONAL') },
  { id: 'music_fan',    emoji: '🎵', label: 'Music Fan',    hint: 'Watch a music video',        check: (s) => s.watchedTags.includes('MUSIC') },
  { id: 'scientist',    emoji: '🔬', label: 'Scientist',    hint: 'Watch a science video',      check: (s) => s.watchedTags.includes('SCIENCE') },
  { id: 'explorer',     emoji: '🏆', label: 'Explorer',     hint: 'Watch 5 videos',             check: (s) => s.videosWatched >= 5 },
  { id: 'artist',       emoji: '🎨', label: 'Artist',       hint: 'Watch an arts & crafts video',check: (s) => s.watchedTags.includes('ARTS_CRAFTS') },
  { id: 'nature_lover', emoji: '🌿', label: 'Nature Lover', hint: 'Watch a nature video',       check: (s) => s.watchedTags.includes('NATURE') },
  { id: 'super_fan',    emoji: '⭐', label: 'Super Fan',    hint: '60 minutes watched',         check: (s) => s.watchMinutes >= 60 },
  { id: 'legend',       emoji: '🦄', label: 'Legend',       hint: '300 minutes watched',        check: (s) => s.watchMinutes >= 300 },
];

function formatWatchTime(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Badge Card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge }) {
  return (
    <View style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}>
      <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
      <Text style={[styles.badgeLabel, !badge.unlocked && styles.badgeLabelLocked]}>
        {badge.label}
      </Text>
      {!badge.unlocked && (
        <>
          <Ionicons name="lock-closed" size={12} color={K.dim} style={styles.lockIcon} />
          <Text style={styles.badgeHint} numberOfLines={2}>{badge.hint}</Text>
        </>
      )}
    </View>
  );
}

// ── History Row ───────────────────────────────────────────────────────────────
function HistoryRow({ item }) {
  const primaryTag = item.tags?.[0] || 'EDUCATIONAL';
  const EMOJI_MAP = {
    EDUCATIONAL:'📚', ANIMATION:'🎬', MUSIC:'🎵', ARTS_CRAFTS:'🎨',
    SCIENCE:'🔬', STORIES:'📖', NATURE:'🌿', SPORTS:'⚽', GAMING_FAMILY:'🎮',
  };
  const fallbackEmoji = EMOJI_MAP[primaryTag] || '🎉';

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyThumb}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.historyThumbImg} />
        ) : (
          <Text style={styles.historyEmoji}>{fallbackEmoji}</Text>
        )}
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.historyCreator}>{item.creatorName}</Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function KidsProfileScreen({ navigation }) {
  const { kidsProfile } = useAuthStore();
  const childName = kidsProfile?.childName || 'Explorer';
  const avatar = kidsProfile?.avatar || '🌟';
  const dailyLimitMinutes = kidsProfile?.dailyLimitMinutes ?? 0;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    videosWatched: 0,
    watchMinutes: 0,
    watchedTags: [],   // flat list of all tags encountered (may have duplicates)
  });
  const [history, setHistory] = useState([]);
  const [badges, setBadges] = useState([]);

  const loadStats = useCallback(async () => {
    try {
      const [countRaw, minsRaw, histRaw] = await Promise.all([
        SecureStore.getItemAsync('venture_kids_videos_watched'),
        SecureStore.getItemAsync('venture_kids_watch_minutes'),
        SecureStore.getItemAsync('venture_kids_watch_history'),
      ]);

      const videosWatched = parseInt(countRaw || '0', 10);
      const watchMinutes = parseInt(minsRaw || '0', 10);
      const hist = histRaw ? JSON.parse(histRaw) : [];

      // Collect all tags ever watched (for badge checks)
      const watchedTags = hist.flatMap(h => h.tags || []);

      const s = { videosWatched, watchMinutes, watchedTags };
      setStats(s);
      setHistory(hist.slice(0, 10)); // show last 10

      // Compute badge unlock states
      setBadges(BADGE_DEFS.map(def => ({ ...def, unlocked: def.check(s) })));
    } catch {
      // If SecureStore fails, show empty state — don't crash
      setBadges(BADGE_DEFS.map(def => ({ ...def, unlocked: false })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const unlockedCount = badges.filter(b => b.unlocked).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={K.orange} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ─── Profile Card ─── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>
          <Text style={styles.name}>{childName}</Text>
          <Text style={styles.subtitle}>VENTURE Kids ⭐</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.videosWatched}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{unlockedCount}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{formatWatchTime(stats.watchMinutes)}</Text>
              <Text style={styles.statLabel}>Watched</Text>
            </View>
          </View>

          {/* Screen time meter (only shown when a limit is set) */}
          {dailyLimitMinutes > 0 && (
            <View style={styles.timeMeter}>
              <View style={styles.timeMeterBar}>
                <View
                  style={[
                    styles.timeMeterFill,
                    { width: `${Math.min(100, (stats.watchMinutes / dailyLimitMinutes) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.timeMeterLabel}>
                {formatWatchTime(stats.watchMinutes)} of {formatWatchTime(dailyLimitMinutes)} daily limit
              </Text>
            </View>
          )}
        </View>

        {/* ─── Badges ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 My Badges</Text>
          <Text style={styles.sectionSub}>
            {unlockedCount}/{BADGE_DEFS.length} unlocked
          </Text>
          <View style={styles.badgeGrid}>
            {badges.map(b => <BadgeCard key={b.id} badge={b} />)}
          </View>
        </View>

        {/* ─── Recently Watched ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>▶ Recently Watched</Text>
          {history.length === 0 ? (
            <View style={styles.historyEmpty}>
              <Text style={styles.historyEmptyEmoji}>🎠</Text>
              <Text style={styles.historyEmptyText}>
                No videos watched yet — go explore!
              </Text>
            </View>
          ) : (
            history.map((item, i) => <HistoryRow key={item.id ?? i} item={item} />)
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: K.bg },

  profileCard: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderWidth: 3, borderColor: K.orange,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 52 },
  name: { fontSize: 24, fontWeight: '800', color: K.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: K.orange, fontWeight: '600', marginBottom: 20 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: K.card, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 24, gap: 20,
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: K.text },
  statLabel: { fontSize: 12, color: K.muted, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: K.border },

  // Screen time meter
  timeMeter: { width: '100%', marginTop: 16 },
  timeMeterBar: {
    height: 8, backgroundColor: K.card, borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  timeMeterFill: { height: '100%', backgroundColor: K.green, borderRadius: 4 },
  timeMeterLabel: { fontSize: 12, color: K.muted, textAlign: 'center' },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: K.text, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: K.dim, marginBottom: 14 },

  // Badges
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: (Platform.OS === 'web' ? 100 : Math.floor((SCREEN_WIDTH - 60) / 3)),
    alignItems: 'center', backgroundColor: K.card, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)',
  },
  badgeLocked: { opacity: 0.4, borderColor: K.border },
  badgeEmoji: { fontSize: 26, marginBottom: 6 },
  badgeLabel: { fontSize: 11, color: K.text, fontWeight: '600', textAlign: 'center' },
  badgeLabelLocked: { color: K.dim },
  lockIcon: { marginTop: 4 },
  badgeHint: { fontSize: 10, color: K.dim, textAlign: 'center', marginTop: 3, lineHeight: 13 },

  // History
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: K.card, borderRadius: 14, padding: 12, marginBottom: 8,
  },
  historyThumb: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.12)',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  historyThumbImg: { width: 52, height: 52 },
  historyEmoji: { fontSize: 26 },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: K.text },
  historyCreator: { fontSize: 12, color: K.muted, marginTop: 2 },

  historyEmpty: { alignItems: 'center', paddingVertical: 32 },
  historyEmptyEmoji: { fontSize: 40, marginBottom: 10 },
  historyEmptyText: { fontSize: 14, color: K.muted, textAlign: 'center' },
});
