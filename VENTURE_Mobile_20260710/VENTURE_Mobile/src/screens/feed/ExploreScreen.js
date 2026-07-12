/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, FlatList, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { feedAPI } from '../../services/api';

const { width: W } = Dimensions.get('window');
const FEATURED_H = 200;
const GRID_SIZE = (W - 4) / 3;

const CATEGORIES = [
  { key: 'all',         label: 'All',         icon: 'apps-outline' },
  { key: 'trending',    label: 'Trending',     icon: 'trending-up-outline' },
  { key: 'gaming',      label: 'Gaming',       icon: 'game-controller-outline' },
  { key: 'creators',    label: 'Creators',     icon: 'people-outline' },
  { key: 'live',        label: 'Live',         icon: 'radio-outline' },
  { key: 'tournaments', label: 'Tournaments',  icon: 'trophy-outline' },
];

// Gradient sets for featured cards when no image is available
const CARD_GRADIENTS = [
  ['#3b0764', '#1e1b4b'],
  ['#0c4a6e', '#1e1b4b'],
  ['#1e1b4b', '#3b0764'],
  ['#0f172a', '#1e3a5f'],
];

function FeaturedCard({ item, index, onPress }) {
  const hasImage = !!item.thumbnailUrl;
  return (
    <TouchableOpacity
      style={[styles.featuredCard, { width: W - Spacing.base * 2 }]}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      {hasImage ? (
        <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={CARD_GRADIENTS[index % CARD_GRADIENTS.length]} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: 16 }]}
      >
        {item.game || item.category ? (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredTagText}>{item.game || item.category}</Text>
          </View>
        ) : null}
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {item.title || item.content?.slice(0, 80) || 'Featured Content'}
        </Text>
        <Text style={styles.featuredSub}>
          {item.author?.displayName || item.author?.username || 'Creator'} · Explore now →
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function GridTile({ item, onPress }) {
  const hasImage = item.thumbnailUrl || item.mediaUrls?.[0];
  const isVideo = item.mediaUrls?.[0]?.match(/\.(mp4|mov|webm)$/i) || item.type === 'video';
  return (
    <TouchableOpacity style={styles.gridTile} onPress={() => onPress(item)} activeOpacity={0.85}>
      {hasImage ? (
        <Image
          source={{ uri: hasImage }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient colors={['#1a0533', '#0d1b3e']} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: 4 }]}
      />
      {isVideo && (
        <View style={styles.reelBadge}>
          <Ionicons name="play" size={8} color="#fff" />
        </View>
      )}
      {item.likeCount > 0 && (
        <View style={styles.tileLikes}>
          <Ionicons name="heart" size={9} color="#FF4B77" />
          <Text style={styles.tileLikesText}>
            {item.likeCount >= 1000 ? `${(item.likeCount / 1000).toFixed(1)}k` : item.likeCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ExploreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('all');
  const [featured, setFeatured] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (cat = category, reset = true) => {
    if (reset) {
      setLoading(true);
      setError(null);
    }
    try {
      const [exploreRes, trendingRes] = await Promise.all([
        feedAPI.explore({ category: cat === 'all' ? undefined : cat, limit: 20 }),
        reset ? feedAPI.trending() : Promise.resolve(null),
      ]);

      const exploreData = exploreRes.data;
      if (reset) {
        setFeatured(exploreData.featured || []);
        setPosts(exploreData.posts || []);
        setCursor(exploreData.nextCursor || null);
        setHasMore(!!exploreData.hasMore);
        if (trendingRes?.data?.tags) setTrendingTags(trendingRes.data.tags);
      } else {
        setPosts(prev => [...prev, ...(exploreData.posts || [])]);
        setCursor(exploreData.nextCursor || null);
        setHasMore(!!exploreData.hasMore);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load explore feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [category]);

  useEffect(() => { load(category, true); }, [category]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(category, true);
  }, [category, load]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    load(category, false);
  }, [loadingMore, hasMore, cursor, category, load]);

  const handlePostPress = useCallback((item) => {
    // Video items → VideoPlayer; everything else → PostDetail
    const isVideo = item.mediaUrls?.[0]?.match(/\.(mp4|mov|webm)$/i) || item.type === 'video';
    if (isVideo) {
      navigation.navigate('VideoPlayer', {
        videoUrl: item.mediaUrls?.[0],
        title: item.content?.slice(0, 60),
        creator: item.author?.displayName || item.author?.username,
        thumbnailUrl: item.thumbnailUrl,
        postId: item.id,
      });
    } else {
      navigation.navigate('PostDetail', { postId: item.id });
    }
  }, [navigation]);

  const renderPost = useCallback(({ item }) => (
    <GridTile item={item} onPress={handlePostPress} />
  ), [handlePostPress]);

  const ListHeader = (
    <View>
      {/* Featured carousel */}
      {featured.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.featuredScroll}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {featured.map((item, i) => (
            <FeaturedCard key={item.id || i} item={item} index={i} onPress={handlePostPress} />
          ))}
        </ScrollView>
      )}

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.catChip, category === c.key && styles.catChipActive]}
            onPress={() => setCategory(c.key)}
          >
            <Ionicons name={c.icon} size={14} color={category === c.key ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.catText, category === c.key && styles.catTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending tags */}
      {trendingTags.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Trending Tags</Text>
          <View style={styles.tagsWrap}>
            {trendingTags.slice(0, 12).map((tag, i) => (
              <TouchableOpacity
                key={tag.name || tag || i}
                style={styles.tagChip}
                onPress={() => navigation.navigate('Search', { query: tag.name || tag })}
              >
                <Text style={styles.tagText}>#{tag.name || tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>
        {category === 'all' ? 'Top Content' : CATEGORIES.find(c => c.key === category)?.label || 'Content'}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search creators, games, clips...</Text>
        </TouchableOpacity>
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 80 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar — always visible at top */}
      <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <Text style={styles.searchPlaceholder}>Search creators, games, clips...</Text>
      </TouchableOpacity>

      {error && !posts.length ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error || '#F44336'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(category, true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={renderPost}
          numColumns={3}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          columnWrapperStyle={{ gap: 2 }}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={Colors.primary} style={{ margin: 16 }} />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: Spacing.sm, padding: 12,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchPlaceholder: { color: Colors.textMuted, fontSize: Typography.sizes.sm },
  featuredScroll: { marginHorizontal: Spacing.base, marginBottom: 8 },
  featuredCard: {
    height: FEATURED_H, borderRadius: 16, marginRight: 8,
    overflow: 'hidden', backgroundColor: Colors.surface,
  },
  featuredTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, marginBottom: 6,
  },
  featuredTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  featuredTitle: { color: '#fff', fontSize: Typography.sizes.lg, fontWeight: '800' },
  featuredSub: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.sizes.xs, marginTop: 4 },
  catContent: { paddingHorizontal: Spacing.base, paddingVertical: 8, gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  catTextActive: { color: '#fff' },
  sectionTitle: {
    color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: 8,
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Spacing.base, marginBottom: 4 },
  tagChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  tagText: { color: Colors.primaryLight, fontSize: Typography.sizes.xs, fontWeight: '600' },
  gridTile: {
    width: GRID_SIZE, height: GRID_SIZE,
    backgroundColor: Colors.surface, overflow: 'hidden',
    position: 'relative', alignItems: 'center', justifyContent: 'center',
  },
  reelBadge: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 3, padding: 3,
  },
  tileLikes: {
    position: 'absolute', bottom: 4, left: 4,
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  tileLikesText: { color: '#fff', fontSize: 9, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 3 },
  errorText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', marginTop: 12 },
  retryBtn: {
    marginTop: 16, backgroundColor: Colors.primary,
    paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
