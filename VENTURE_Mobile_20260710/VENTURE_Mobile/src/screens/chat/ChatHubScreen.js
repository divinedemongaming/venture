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
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, SectionList, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { chatAPI } from '../../services/api';

export default function ChatHubScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState({ world: [], countries: [], areaCodes: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('world');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = search ? { search } : {};
      const { data } = await chatAPI.getRooms(params);
      setRooms(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const TABS = [
    { id: 'world', label: '🌍 World', count: rooms.world?.length },
    { id: 'countries', label: '🗺️ Countries', count: rooms.countries?.length },
    { id: 'areaCodes', label: '📍 Area Codes', count: rooms.areaCodes?.length },
  ];

  const getCurrentData = () => rooms[activeTab] || [];

  const renderRoomCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.roomCard, item.type === 'WORLD' && styles.worldCard]}
      onPress={() => navigation.navigate('ChatRoom', { slug: item.slug, room: item })}
      activeOpacity={0.8}
    >
      <View style={styles.roomLeft}>
        <View style={[styles.flagContainer, item.type === 'WORLD' && styles.worldFlagContainer]}>
          <Text style={styles.flagEmoji}>{item.flagEmoji || '💬'}</Text>
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName} numberOfLines={1}>{item.name}</Text>
          {item.regionName && item.type !== 'WORLD' && (
            <Text style={styles.roomRegion} numberOfLines={1}>{item.regionName}</Text>
          )}
          {item.type === 'WORLD' && (
            <Text style={styles.roomDesc} numberOfLines={1}>{item.description}</Text>
          )}
        </View>
      </View>
      <View style={styles.roomRight}>
        {item.onlineCount > 0 && (
          <View style={styles.onlineTag}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{formatCount(item.onlineCount)}</Text>
          </View>
        )}
        {item.isLocked && (
          <Ionicons name="lock-closed" size={14} color={Colors.warning} />
        )}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const renderWorldRoom = () => {
    if (!rooms.world?.length) return null;
    const world = rooms.world[0];
    return (
      <TouchableOpacity
        style={styles.worldHeroCard}
        onPress={() => navigation.navigate('ChatRoom', { slug: world.slug, room: world })}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['rgba(124,58,237,0.3)', 'rgba(6,182,212,0.3)']} style={styles.worldHeroGradient}>
          <Text style={styles.worldHeroEmoji}>🌍</Text>
          <View style={styles.worldHeroText}>
            <Text style={styles.worldHeroTitle}>World Chat</Text>
            <Text style={styles.worldHeroDesc}>Join the global VENTURE conversation</Text>
          </View>
          <View style={styles.worldHeroRight}>
            {world.onlineCount > 0 && (
              <View style={styles.worldOnlineTag}>
                <View style={styles.onlineDot} />
                <Text style={styles.worldOnlineText}>{formatCount(world.onlineCount)} online</Text>
              </View>
            )}
            <LinearGradient colors={Colors.gradientPrimary} style={styles.worldJoinBtn}>
              <Text style={styles.worldJoinText}>Join</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFF" />
            </LinearGradient>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Community Chat</Text>
          <Text style={styles.headerSubtitle}>Global & local rooms — family-friendly ✅</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="shield-check" size={20} color={Colors.success} />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search rooms, area codes, countries..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      {!search && (
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={search ? [...(rooms.world || []), ...(rooms.countries || []), ...(rooms.areaCodes || [])] : getCurrentData()}
          renderItem={renderRoomCard}
          keyExtractor={item => item.id || item.slug}
          ListHeaderComponent={!search && activeTab === 'world' ? renderWorldRoom : null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No rooms found</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Family-friendly badge */}
      <View style={[styles.safetyBanner, { paddingBottom: insets.bottom + 8 }]}>
        <MaterialCommunityIcons name="shield-check-outline" size={14} color={Colors.success} />
        <Text style={styles.safetyText}>All rooms are monitored with AI + human moderation for a safe, family-friendly experience</Text>
      </View>
    </View>
  );
}

const formatCount = (n) => {
  if (!n) return '0';
  if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
  return n.toString();
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.black },
  headerSubtitle: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  headerIcon: { width: 40, height: 40, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginHorizontal: Spacing.base, marginBottom: Spacing.sm, paddingHorizontal: Spacing.md, height: 44, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sizes.md },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.base, marginBottom: Spacing.sm, gap: Spacing.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  tabActive: { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  tabBadge: { backgroundColor: Colors.border, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: Colors.primary },
  tabBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 80 },
  worldHeroCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '40' },
  worldHeroGradient: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
  worldHeroEmoji: { fontSize: 40 },
  worldHeroText: { flex: 1 },
  worldHeroTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  worldHeroDesc: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  worldHeroRight: { alignItems: 'flex-end', gap: Spacing.sm },
  worldOnlineTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  worldOnlineText: { color: Colors.success, fontSize: Typography.sizes.xs, fontWeight: '600' },
  worldJoinBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  worldJoinText: { color: '#FFF', fontSize: Typography.sizes.sm, fontWeight: '700' },
  roomCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md },
  worldCard: { borderWidth: 1, borderColor: Colors.primary + '30', backgroundColor: 'rgba(124,58,237,0.05)' },
  roomLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
  flagContainer: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  worldFlagContainer: { backgroundColor: 'rgba(124,58,237,0.2)' },
  flagEmoji: { fontSize: 24 },
  roomInfo: { flex: 1 },
  roomName: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '600' },
  roomRegion: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  roomDesc: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  roomRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  onlineTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: BorderRadius.sm },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  onlineText: { color: Colors.success, fontSize: Typography.sizes.xs, fontWeight: '600' },
  separator: { height: Spacing.sm },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sizes.md },
  safetyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  safetyText: { flex: 1, color: Colors.textMuted, fontSize: Typography.sizes.xs, lineHeight: 16 },
});
