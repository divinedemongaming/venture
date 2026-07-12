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
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  ScrollView, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';

const { width: W } = Dimensions.get('window');
const TILE = (W - Spacing.base * 2 - 8) / 2;

const TRENDING_TAGS = ['#valorant', '#fortnite', '#apex', '#warzone', '#minecraft', '#gaming', '#clips', '#ranked', '#tournament', '#esports'];

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'search' },
  { key: 'creators', label: 'Creators', icon: 'person' },
  { key: 'clips', label: 'Clips', icon: 'play-circle' },
  { key: 'games', label: 'Games', icon: 'game-controller' },
  { key: 'live', label: 'Live', icon: 'radio' },
  { key: 'communities', label: 'Communities', icon: 'people' },
];

const MOCK_CREATORS = [
  { id: 'u1', type: 'creator', username: 'ProSniper', displayName: 'Pro Sniper', followerCount: 48200, isVerified: true, game: 'Valorant', isLive: true },
  { id: 'u2', type: 'creator', username: 'ClipMaster99', displayName: 'Clip Master', followerCount: 23400, isVerified: false, game: 'Fortnite', isLive: false },
  { id: 'u3', type: 'creator', username: 'VentureKing', displayName: 'Venture King', followerCount: 102000, isVerified: true, game: 'Apex', isLive: true },
  { id: 'u4', type: 'creator', username: 'EliteFragger', displayName: 'Elite Fragger', followerCount: 8900, isVerified: false, game: 'Warzone', isLive: false },
];

const MOCK_CLIPS = Array.from({ length: 8 }, (_, i) => ({
  id: `clip_${i}`,
  type: 'clip',
  caption: ['Clutch 1v5 🔥', 'Diamond grind', 'Best shot 2024', 'Solo win?!'][i % 4],
  game: ['Valorant', 'Fortnite', 'Apex', 'Warzone'][i % 4],
  likes: Math.floor(Math.random() * 20000) + 500,
  views: Math.floor(Math.random() * 200000) + 5000,
  author: { username: ['ProSniper', 'ClipMaster', 'VentureKing', 'EliteFragger'][i % 4] },
}));

const MOCK_GAMES = [
  { id: 'g1', type: 'game', title: 'Valorant', genre: 'Tactical FPS', players: '18.2M', live: 4820 },
  { id: 'g2', type: 'game', title: 'Fortnite', genre: 'Battle Royale', players: '25.4M', live: 9200 },
  { id: 'g3', type: 'game', title: 'Apex Legends', genre: 'Battle Royale', players: '14.8M', live: 3100 },
  { id: 'g4', type: 'game', title: 'Warzone', genre: 'Battle Royale', players: '12.1M', live: 2800 },
];

function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function CreatorCard({ item, navigation }) {
  return (
    <TouchableOpacity style={styles.creatorCard} onPress={() => navigation.navigate('Profile', { userId: item.id })}>
      <View style={styles.creatorAvatar}>
        <Text style={styles.creatorAvatarText}>{item.displayName[0]}</Text>
        {item.isLive && <View style={styles.liveRing} />}
      </View>
      <View style={styles.creatorInfo}>
        <View style={styles.creatorNameRow}>
          <Text style={styles.creatorName} numberOfLines={1}>{item.displayName}</Text>
          {item.isVerified && <Ionicons name="checkmark-circle" size={13} color={Colors.accent} />}
        </View>
        <Text style={styles.creatorMeta}>@{item.username} · {formatCount(item.followerCount)} followers</Text>
        <Text style={styles.creatorGame}>{item.game}</Text>
      </View>
      {item.isLive && (
        <View style={styles.liveTag}>
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ClipTile({ item, navigation }) {
  return (
    <TouchableOpacity style={styles.clipTile} onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
      <LinearGradient colors={['#1a0533', '#0d1b3e']} style={StyleSheet.absoluteFill} />
      <View style={styles.clipOverlay}>
        <View style={styles.clipGame}>
          <Text style={styles.clipGameText}>{item.game}</Text>
        </View>
        <View style={styles.clipStats}>
          <Ionicons name="eye" size={10} color="rgba(255,255,255,0.7)" />
          <Text style={styles.clipStatText}>{formatCount(item.views)}</Text>
        </View>
      </View>
      <View style={styles.clipBottom}>
        <Text style={styles.clipCaption} numberOfLines={1}>{item.caption}</Text>
        <Text style={styles.clipAuthor}>@{item.author.username}</Text>
      </View>
    </TouchableOpacity>
  );
}

function GameCard({ item, navigation }) {
  return (
    <TouchableOpacity style={styles.gameCard} onPress={() => navigation.navigate('Game', { gameId: item.id })}>
      <LinearGradient colors={['#3b0764', '#1e1b4b']} style={styles.gameCardBg}>
        <View style={styles.gameCardLeft}>
          <Ionicons name="game-controller" size={28} color={Colors.primary} />
        </View>
        <View style={styles.gameCardInfo}>
          <Text style={styles.gameTitle}>{item.title}</Text>
          <Text style={styles.gameGenre}>{item.genre}</Text>
          <Text style={styles.gamePlayers}>{item.players} players · {formatCount(item.live)} live</Text>
        </View>
        <View style={styles.gameCardRight}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>{formatCount(item.live)}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function SearchScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mode = route?.params?.mode; // 'dm' mode for new message

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState({ creators: MOCK_CREATORS, clips: MOCK_CLIPS, games: MOCK_GAMES });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['ProSniper', '#valorant', 'Fortnite tournament']);
  const inputRef = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) return;
    searchTimer.current = setTimeout(() => runSearch(query.trim()), 400);
    return () => clearTimeout(searchTimer.current);
  }, [query, category]);

  const runSearch = async (q) => {
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}&type=${category}&limit=20`);
      if (res.data) setResults(res.data);
    } catch (_) {}
    setLoading(false);
  };

  const handleSelect = (item) => {
    // Add to recent
    setRecentSearches(prev => [item.username || item.title || query, ...prev.filter(s => s !== (item.username || item.title || query))].slice(0, 6));
    if (item.type === 'creator') {
      if (mode === 'dm') {
        navigation.navigate('Thread', { userId: item.id, username: item.username, displayName: item.displayName });
      } else {
        navigation.navigate('Profile', { userId: item.id });
      }
    } else if (item.type === 'game') {
      navigation.navigate('Game', { gameId: item.id });
    } else if (item.type === 'clip') {
      navigation.navigate('PostDetail', { postId: item.id });
    }
  };

  const allResults = [
    ...(category === 'all' || category === 'creators' ? results.creators : []),
    ...(category === 'all' || category === 'clips' ? results.clips : []),
    ...(category === 'all' || category === 'games' ? results.games : []),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={mode === 'dm' ? 'Find a creator to message...' : 'Search creators, games, clips...'}
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query.trim())}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
            onPress={() => setCategory(cat.key)}
          >
            <Ionicons
              name={cat.icon}
              size={14}
              color={category === cat.key ? '#fff' : Colors.textSecondary}
            />
            <Text style={[styles.categoryText, category === cat.key && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {query.length === 0 ? (
        // Empty state — show trending + recent
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent</Text>
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((s, i) => (
                <TouchableOpacity key={i} style={styles.recentRow} onPress={() => setQuery(s)}>
                  <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.recentText}>{s}</Text>
                  <TouchableOpacity onPress={() => setRecentSearches(prev => prev.filter((_, j) => j !== i))}>
                    <Ionicons name="close" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Trending tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending</Text>
            <View style={styles.tagsGrid}>
              {TRENDING_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={styles.trendingTag}
                  onPress={() => setQuery(tag)}
                >
                  <Text style={styles.trendingTagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Featured creators */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Creators</Text>
            {MOCK_CREATORS.map(item => (
              <CreatorCard key={item.id} item={item} navigation={navigation} />
            ))}
          </View>

          {/* Trending games */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Games</Text>
            {MOCK_GAMES.map(item => (
              <GameCard key={item.id} item={item} navigation={navigation} />
            ))}
          </View>
        </ScrollView>
      ) : loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : allResults.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No results for "{query}"</Text>
          <Text style={styles.emptySubtitle}>Try different keywords or check your spelling</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* Creators section */}
          {(category === 'all' || category === 'creators') && results.creators?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Creators</Text>
              {results.creators.map(item => (
                <CreatorCard key={item.id} item={item} navigation={navigation} />
              ))}
            </View>
          )}

          {/* Clips section */}
          {(category === 'all' || category === 'clips') && results.clips?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Clips</Text>
              <View style={styles.clipsGrid}>
                {results.clips.map(item => (
                  <ClipTile key={item.id} item={item} navigation={navigation} />
                ))}
              </View>
            </View>
          )}

          {/* Games section */}
          {(category === 'all' || category === 'games') && results.games?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Games</Text>
              {results.games.map(item => (
                <GameCard key={item.id} item={item} navigation={navigation} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sizes.sm },

  categoryScroll: { maxHeight: 48 },
  categoryContent: { paddingHorizontal: Spacing.base, paddingVertical: 8, gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  categoryTextActive: { color: '#fff' },

  section: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700', marginBottom: 8 },
  clearText: { color: Colors.primary, fontSize: Typography.sizes.xs },

  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  recentText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sizes.sm },

  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendingTag: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
  },
  trendingTagText: { color: Colors.primaryLight, fontSize: Typography.sizes.xs, fontWeight: '600' },

  creatorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  creatorAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  creatorAvatarText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '700' },
  liveRing: {
    position: 'absolute', top: -3, left: -3,
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2.5, borderColor: Colors.danger,
  },
  creatorInfo: { flex: 1 },
  creatorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  creatorName: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '700' },
  creatorMeta: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 1 },
  creatorGame: { color: Colors.accent, fontSize: Typography.sizes.xs, marginTop: 1 },
  liveTag: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: Colors.danger, borderRadius: 8,
  },
  liveTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  clipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clipTile: {
    width: TILE, height: TILE * 1.2,
    borderRadius: 10, overflow: 'hidden', position: 'relative',
    backgroundColor: Colors.surface,
  },
  clipOverlay: {
    position: 'absolute', top: 6, left: 6, right: 6,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  clipGame: {
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  clipGameText: { color: Colors.accent, fontSize: 9, fontWeight: '600' },
  clipStats: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clipStatText: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },
  clipBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 6, backgroundColor: 'rgba(0,0,0,0.5)',
  },
  clipCaption: { color: '#fff', fontSize: 11, fontWeight: '600' },
  clipAuthor: { color: 'rgba(255,255,255,0.6)', fontSize: 9 },

  gameCard: { marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  gameCardBg: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  gameCardLeft: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primary + '30', alignItems: 'center', justifyContent: 'center',
  },
  gameCardInfo: { flex: 1 },
  gameTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  gameGenre: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, marginTop: 2 },
  gamePlayers: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  gameCardRight: {},
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.danger + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.danger,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.danger },
  livePillText: { color: Colors.danger, fontSize: Typography.sizes.xs, fontWeight: '700' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: Typography.sizes.sm },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: Spacing['2xl'] },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.sizes.sm, textAlign: 'center' },
});
