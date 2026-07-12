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
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, Animated, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - 3) / 3;
const AVATAR_SIZE = 88;

// ─── Mock profile data ────────────────────────────────────────────────────────
const buildMockProfile = (userId, isOwn) => ({
  id: userId || 'me',
  username: isOwn ? 'you' : 'xXDarkGamer',
  displayName: isOwn ? 'Your Profile' : 'Dark Gamer',
  bio: isOwn
    ? '🎮 Creator on VENTURE | Clips • Gaming • Vibes\n🔥 Building the best gaming community\n💜 @venture',
    : '🎮 Pro gamer | Content creator\n📍 NA Server | Ranked top 0.1%\n🏆 Tournament winner 2024',
  avatar: null,
  bannerUrl: null,
  isVerified: true,
  isCreator: true,
  isLive: !isOwn && Math.random() > 0.7,
  tier: isOwn ? 'PRO' : ['FREE', 'PRO', 'ELITE'][Math.floor(Math.random() * 3)],
  stats: {
    followers: isOwn ? 4821 : Math.floor(Math.random() * 500000) + 1000,
    following: isOwn ? 312 : Math.floor(Math.random() * 5000) + 50,
    posts: isOwn ? 47 : Math.floor(Math.random() * 500) + 10,
    reels: isOwn ? 23 : Math.floor(Math.random() * 200) + 5,
    likes: isOwn ? 89200 : Math.floor(Math.random() * 2000000) + 5000,
  },
  games: ['Fortnite', 'Valorant', 'Apex Legends', 'Warzone'],
  socialLinks: { twitter: 'darkgamer', twitch: 'darkgamer_tv', youtube: 'darkgamertv' },
  isFollowing: !isOwn && Math.random() > 0.4,
  isFollower: !isOwn && Math.random() > 0.6,
  joinedAt: '2024-01-15',
  monthlySubscribers: isOwn ? 126 : undefined,
  totalEarnings: isOwn ? 3840.00 : undefined,
});

const MOCK_POSTS = Array.from({ length: 12 }, (_, i) => ({
  id: `post_${i}`,
  type: i % 5 === 0 ? 'reel' : i % 7 === 0 ? 'story' : 'post',
  thumbnailUrl: null,
  likes: Math.floor(Math.random() * 10000) + 100,
  comments: Math.floor(Math.random() * 500) + 10,
  views: Math.floor(Math.random() * 50000) + 500,
  isLiked: Math.random() > 0.5,
  game: ['Fortnite', 'Valorant', 'Apex', 'Warzone', 'MC'][i % 5],
  caption: `Post caption ${i + 1} #gaming #venture`,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value }) {
  return (
    <TouchableOpacity style={styles.statTile}>
      <Text style={styles.statValue}>{formatCount(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Post grid tile ───────────────────────────────────────────────────────────
function GridTile({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.gridTile} onPress={() => onPress(item)}>
      <LinearGradient
        colors={['#1a0533', '#0d1b3e']}
        style={StyleSheet.absoluteFill}
      />
      {/* Type badge */}
      {item.type === 'reel' && (
        <View style={styles.reelBadge}>
          <Ionicons name="play" size={10} color="#fff" />
        </View>
      )}
      {/* Stats overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.tileMeta}
      >
        <View style={styles.tileStats}>
          <Ionicons name="heart" size={11} color="#fff" />
          <Text style={styles.tileStatText}>{formatCount(item.likes)}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();
  const targetUserId = route?.params?.userId;
  const isOwnProfile = !targetUserId || targetUserId === currentUser?.id;

  const [profile, setProfile] = useState(buildMockProfile(targetUserId, isOwnProfile));
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [tab, setTab] = useState('posts'); // posts | reels | tagged | liked
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [120, 160], outputRange: [0, 1], extrapolate: 'clamp' });

  useEffect(() => {
    fetchProfile();
  }, [targetUserId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const endpoint = isOwnProfile ? '/users/me' : `/users/${targetUserId}`;
      const res = await api.get(endpoint);
      if (res.data?.user) setProfile(res.data.user);
      const postsRes = await api.get(`/posts?userId=${targetUserId || currentUser?.id}&limit=24`);
      if (postsRes.data?.posts?.length) setPosts(postsRes.data.posts);
    } catch (_) {
      // Use mock data
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    const next = !following;
    setFollowing(next);
    try {
      if (next) await api.post(`/users/${profile.id}/follow`);
      else await api.delete(`/users/${profile.id}/follow`);
    } catch (_) { setFollowing(!next); }
  };

  const TABS = [
    { key: 'posts', icon: 'grid-outline' },
    { key: 'reels', icon: 'play-circle-outline' },
    { key: 'tagged', icon: 'pricetag-outline' },
    ...(isOwnProfile ? [{ key: 'liked', icon: 'heart-outline' }] : []),
  ];

  const tierColor = profile.tier === 'ELITE' ? Colors.accentAlt : profile.tier === 'PRO' ? Colors.primary : Colors.textMuted;
  const tierLabel = profile.tier === 'ELITE' ? '⭐ ELITE' : profile.tier === 'PRO' ? '💜 PRO' : 'FREE';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky header (appears on scroll) */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stickyUsername}>@{profile.username}</Text>
        <TouchableOpacity style={styles.headerOptions} onPress={() => setShowOptions(true)}>
          <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient colors={['#3b0764', '#1e1b4b', '#0c4a6e']} style={styles.banner} />
          {profile.isLive && (
            <View style={styles.liveBanner}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
          )}
          {/* Back button (transparent area) */}
          <TouchableOpacity
            style={styles.bannerBack}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          {isOwnProfile && (
            <TouchableOpacity
              style={styles.bannerSettings}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar + actions row */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrapper}>
            {profile.isLive && <View style={styles.liveRing} />}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.displayName[0].toUpperCase()}</Text>
            </View>
            {profile.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
              </View>
            )}
          </View>

          <View style={styles.profileActions}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn}>
                  <Ionicons name="share-outline" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.followActionBtn, following && styles.followingBtn]}
                  onPress={handleFollow}
                >
                  <Text style={[styles.followActionText, following && styles.followingText]}>
                    {following ? 'Following' : profile.isFollower ? 'Follow Back' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageBtn} onPress={() => navigation.navigate('Thread', { userId: profile.id })}>
                  <Ionicons name="chatbubble-outline" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionsBtn} onPress={() => setShowOptions(true)}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Name + tier */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <View style={[styles.tierBadge, { borderColor: tierColor }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
            </View>
          </View>
          <Text style={styles.username}>@{profile.username}</Text>
        </View>

        {/* Bio */}
        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        {/* Games */}
        {profile.games?.length > 0 && (
          <View style={styles.gamesRow}>
            <Ionicons name="game-controller-outline" size={13} color={Colors.textMuted} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {profile.games.map(game => (
                <View key={game} style={styles.gameChip}>
                  <Text style={styles.gameChipText}>{game}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Social links */}
        {profile.socialLinks && (
          <View style={styles.socialRow}>
            {profile.socialLinks.twitter && (
              <TouchableOpacity style={styles.socialLink}>
                <Ionicons name="logo-twitter" size={15} color={Colors.accent} />
                <Text style={styles.socialText}>@{profile.socialLinks.twitter}</Text>
              </TouchableOpacity>
            )}
            {profile.socialLinks.twitch && (
              <TouchableOpacity style={styles.socialLink}>
                <Ionicons name="logo-twitch" size={15} color={Colors.primary} />
                <Text style={styles.socialText}>{profile.socialLinks.twitch}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatTile label="Followers" value={profile.stats.followers} />
          <View style={styles.statDivider} />
          <StatTile label="Following" value={profile.stats.following} />
          <View style={styles.statDivider} />
          <StatTile label="Posts" value={profile.stats.posts} />
          <View style={styles.statDivider} />
          <StatTile label="Likes" value={profile.stats.likes} />
        </View>

        {/* Creator earnings banner (own profile only) */}
        {isOwnProfile && profile.isCreator && (
          <TouchableOpacity style={styles.earningsBanner} onPress={() => navigation.navigate('Monetization')}>
            <LinearGradient colors={['#3b0764', '#1e1b4b']} style={styles.earningsBannerGrad}>
              <View style={styles.earningsBannerLeft}>
                <Ionicons name="cash-outline" size={20} color={Colors.accentAlt} />
                <View>
                  <Text style={styles.earningsLabel}>Total Earnings</Text>
                  <Text style={styles.earningsValue}>${(profile.totalEarnings || 0).toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.earningsBannerRight}>
                <Text style={styles.subscriberCount}>{profile.monthlySubscribers || 0} subscribers</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Content tabs */}
        <View style={styles.tabsRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons
                name={t.icon}
                size={22}
                color={tab === t.key ? Colors.primary : Colors.textMuted}
              />
              {tab === t.key && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts grid */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="images-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No posts yet</Text>
            {isOwnProfile && (
              <TouchableOpacity style={styles.createFirstBtn} onPress={() => navigation.navigate('CreatePost')}>
                <Text style={styles.createFirstText}>Share your first clip</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {posts.map((item, idx) => (
              <GridTile
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              />
            ))}
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: insets.bottom + 80 }} />
      </Animated.ScrollView>

      {/* Options sheet */}
      {showOptions && (
        <TouchableOpacity
          style={styles.optionsOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsSheet}>
            <View style={styles.optionsHandle} />
            {isOwnProfile ? (
              <>
                <TouchableOpacity style={styles.optionRow} onPress={() => { setShowOptions(false); navigation.navigate('Settings'); }}>
                  <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.optionText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionRow} onPress={() => { setShowOptions(false); navigation.navigate('Analytics'); }}>
                  <Ionicons name="analytics-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.optionText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionRow}>
                  <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.optionText}>Share Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.optionRow}>
                  <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.optionText}>Share Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionRow}>
                  <Ionicons name="link-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.optionText}>Copy Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionRow}>
                  <Ionicons name="ban-outline" size={20} color={Colors.danger} />
                  <Text style={[styles.optionText, { color: Colors.danger }]}>Block</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionRow}>
                  <Ionicons name="flag-outline" size={20} color={Colors.danger} />
                  <Text style={[styles.optionText, { color: Colors.danger }]}>Report</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Sticky header
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingBottom: 10,
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBack: { padding: 4 },
  stickyUsername: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  headerOptions: { padding: 4 },

  // Banner
  bannerContainer: { height: 140, position: 'relative' },
  banner: { flex: 1 },
  liveBanner: {
    position: 'absolute', bottom: 8, left: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '800' },
  bannerBack: { position: 'absolute', top: 12, left: Spacing.base, padding: 4 },
  bannerSettings: { position: 'absolute', top: 12, right: Spacing.base, padding: 4 },

  // Avatar row
  avatarRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, marginTop: -(AVATAR_SIZE / 2),
  },
  avatarWrapper: { position: 'relative' },
  liveRing: {
    position: 'absolute', top: -4, left: -4,
    width: AVATAR_SIZE + 8, height: AVATAR_SIZE + 8, borderRadius: (AVATAR_SIZE + 8) / 2,
    borderWidth: 3, borderColor: Colors.danger,
  },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.background,
  },
  avatarText: { color: '#fff', fontSize: Typography.sizes['3xl'], fontWeight: '800' },
  verifiedBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: Colors.background, borderRadius: 10,
  },

  // Profile actions
  profileActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  editBtn: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20,
  },
  editBtnText: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  shareBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  followActionBtn: {
    paddingHorizontal: 24, paddingVertical: 8,
    backgroundColor: Colors.primary, borderRadius: 20,
  },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.border },
  followActionText: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: '700' },
  followingText: { color: Colors.textPrimary },
  messageBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  optionsBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Name section
  nameSection: { paddingHorizontal: Spacing.base, marginTop: 10, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '800' },
  tierBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderRadius: 10,
  },
  tierText: { fontSize: Typography.sizes.xs, fontWeight: '700' },
  username: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },

  // Bio
  bio: {
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
    color: Colors.textPrimary, fontSize: Typography.sizes.sm, lineHeight: 20,
  },

  // Games
  gamesRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.base, paddingTop: 8,
  },
  gameChip: {
    paddingHorizontal: 10, paddingVertical: 3,
    backgroundColor: Colors.surface, borderRadius: 12, marginRight: 6,
  },
  gameChipText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '500' },

  // Social
  socialRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: Spacing.base, paddingTop: 6,
  },
  socialLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  socialText: { color: Colors.accent, fontSize: Typography.sizes.xs },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.base, marginTop: 14,
    backgroundColor: Colors.backgroundCard, borderRadius: 16,
    paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statValue: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  // Earnings banner
  earningsBanner: {
    marginHorizontal: Spacing.base, marginTop: Spacing.sm,
    borderRadius: 14, overflow: 'hidden',
  },
  earningsBannerGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: 12,
  },
  earningsBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  earningsLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.xs },
  earningsValue: { color: Colors.accentAlt, fontSize: Typography.sizes.lg, fontWeight: '800' },
  earningsBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subscriberCount: { color: Colors.textSecondary, fontSize: Typography.sizes.xs },

  // Content tabs
  tabsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: Colors.border, marginTop: Spacing.base,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative',
  },
  tabItemActive: {},
  tabActiveBar: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 2, backgroundColor: Colors.primary, borderRadius: 1,
  },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 1.5, paddingTop: 1.5 },
  gridTile: {
    width: GRID_SIZE, height: GRID_SIZE,
    backgroundColor: Colors.surface, overflow: 'hidden',
  },
  reelBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  tileMeta: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 30,
    justifyContent: 'flex-end', paddingHorizontal: 6, paddingBottom: 4,
  },
  tileStats: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tileStatText: { color: '#fff', fontSize: Typography.sizes.xs },

  // Loading / empty
  loadingBox: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sizes.md },
  createFirstBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.primary, borderRadius: 20,
  },
  createFirstText: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: '600' },

  // Options sheet
  optionsOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', zIndex: 300,
  },
  optionsSheet: {
    backgroundColor: Colors.backgroundCard, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  optionsHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginVertical: 12,
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base,
  },
  optionText: { color: Colors.textPrimary, fontSize: Typography.sizes.md },
});
