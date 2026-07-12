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
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { gamingAPI, feedAPI } from '../../services/api';
import Avatar from '../../components/common/Avatar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 2 - Spacing.sm) / 2;

export default function GamingHubScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [trending, setTrending] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const [gamesRes, liveRes, clipsRes] = await Promise.all([
          gamingAPI.getTrendingGames(),
          feedAPI.live({ limit: 8 }),
          gamingAPI.getClips({ sort: 'trending', limit: 8 })
        ]);
        setTrending(gamesRes.data || []);
        setLiveStreams(liveRes.data || []);
        setClips(clipsRes.data?.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const FILTERS = ['all', 'fps', 'rpg', 'battle royale', 'sports', 'strategy', 'indie'];

  const renderGameCard = ({ item }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => navigation.navigate('Game', { slug: item.slug, game: item })}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.coverUrl || `https://via.placeholder.com/200x280/1E1E2E/7C3AED?text=${encodeURIComponent(item.name)}` }}
        style={styles.gameCover} contentFit="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gameGradient} />
      <View style={styles.gameInfo}>
        <Text style={styles.gameName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.gameStats}>
          {item.streamCount > 0 && (
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTagText}>{item.streamCount} LIVE</Text>
            </View>
          )}
          <Text style={styles.viewersText}>{formatCount(item.viewerCount)} watching</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLiveCard = ({ item }) => (
    <TouchableOpacity
      style={styles.liveCard}
      onPress={() => navigation.navigate('LiveStream', { streamId: item.id })}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.thumbnailUrl || `https://via.placeholder.com/320x180/1E1E2E/EF4444?text=LIVE` }}
        style={styles.liveThumbnail} contentFit="cover"
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
      <View style={styles.liveTagAbsolute}>
        <View style={styles.liveDot} />
        <Text style={styles.liveTagAbsoluteText}>LIVE</Text>
      </View>
      <View style={styles.liveViewers}>
        <Ionicons name="eye" size={12} color="#FFF" />
        <Text style={styles.liveViewersText}>{formatCount(item.viewerCount)}</Text>
      </View>
      <View style={styles.liveCardBottom}>
        <Avatar user={item.host} size="sm" />
        <View style={styles.liveCardInfo}>
          <Text style={styles.liveCardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.liveCardHost} numberOfLines={1}>@{item.host?.username}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderClipCard = ({ item }) => (
    <TouchableOpacity
      style={styles.clipCard}
      onPress={() => navigation.navigate('Clips', { clipId: item.id })}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.thumbnailUrl || `https://via.placeholder.com/320x180/1E1E2E/06B6D4?text=CLIP` }}
        style={styles.clipThumbnail} contentFit="cover"
      />
      <View style={styles.clipPlayBtn}>
        <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
      </View>
      <View style={styles.clipDuration}>
        <Text style={styles.clipDurationText}>{formatDuration(item.duration)}</Text>
      </View>
      <View style={styles.clipInfo}>
        <Text style={styles.clipTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.clipStats}>
          <Text style={styles.clipAuthor}>@{item.author?.username}</Text>
          <View style={styles.clipStatRow}>
            <Ionicons name="eye-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.clipStatText}>{formatCount(item.viewsCount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={[styles.container, styles.loader]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Gaming Hub</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Leaderboard')}>
            <MaterialCommunityIcons name="trophy-outline" size={24} color={Colors.accentAlt} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Tournaments')}>
            <MaterialCommunityIcons name="sword-cross" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('LiveBrowse')}>
            <View style={styles.liveHeaderBtn}>
              <View style={styles.liveDotRed} />
              <Text style={styles.liveHeaderText}>LIVE</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Genre filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'videocam', label: 'Go Live', color: Colors.live, onPress: () => navigation.navigate('GoLive') },
            { icon: 'film-outline', label: 'Upload Clip', color: Colors.accent, onPress: () => navigation.navigate('Clips') },
            { icon: 'trophy-outline', label: 'Tournaments', color: Colors.accentAlt, onPress: () => navigation.navigate('Tournaments') },
            { icon: 'stats-chart', label: 'Leaderboard', color: Colors.primary, onPress: () => navigation.navigate('Leaderboard') },
          ].map(action => (
            <TouchableOpacity key={action.label} style={styles.quickAction} onPress={action.onPress}>
              <LinearGradient colors={[action.color + '33', action.color + '11']} style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending Games */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Trending Games</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Explore', { category: 'games' })}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={trending.slice(0, 8)}
            renderItem={renderGameCard}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Live Now */}
        {liveStreams.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.liveDotRed} />
                <Text style={styles.sectionTitle}>Live Now</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('LiveBrowse')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={liveStreams}
              renderItem={renderLiveCard}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Top Clips */}
        {clips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Top Clips</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Clips')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={clips}
              renderItem={renderClipCard}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const formatCount = (n) => {
  if (!n) return '0';
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
  return n.toString();
};

const formatDuration = (s) => {
  if (!s) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.black },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  liveHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveHeaderText: { color: Colors.live, fontSize: Typography.sizes.sm, fontWeight: '800', letterSpacing: 0.5 },
  liveDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.live },
  filters: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textMuted, fontSize: Typography.sizes.sm, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  quickActions: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.xl },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  quickActionIcon: { width: 52, height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600', textAlign: 'center' },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  seeAll: { color: Colors.primary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  horizontalList: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  gameCard: { width: 140, height: 200, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative' },
  gameCover: { width: '100%', height: '100%' },
  gameGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  gameInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.sm },
  gameName: { color: '#FFF', fontSize: Typography.sizes.sm, fontWeight: '700', marginBottom: 4 },
  gameStats: { gap: 2 },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.9)', alignSelf: 'flex-start', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  liveTagText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  viewersText: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sizes.xs },
  liveCard: { width: 240, height: 150, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative' },
  liveThumbnail: { width: '100%', height: '100%' },
  liveTagAbsolute: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.live, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  liveTagAbsoluteText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  liveViewers: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  liveViewersText: { color: '#FFF', fontSize: Typography.sizes.xs, fontWeight: '600' },
  liveCardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, gap: Spacing.sm },
  liveCardInfo: { flex: 1 },
  liveCardTitle: { color: '#FFF', fontSize: Typography.sizes.sm, fontWeight: '600' },
  liveCardHost: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sizes.xs },
  clipCard: { width: 220, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.surface },
  clipThumbnail: { width: '100%', height: 130 },
  clipPlayBtn: { position: 'absolute', top: 40, left: 90 },
  clipDuration: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  clipDurationText: { color: '#FFF', fontSize: Typography.sizes.xs, fontWeight: '600' },
  clipInfo: { padding: Spacing.sm },
  clipTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: 4 },
  clipStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clipAuthor: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  clipStatRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clipStatText: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
});
