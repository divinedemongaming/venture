/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';

const { width: W } = Dimensions.get('window');
const TILE_W = (W - Spacing.base * 2 - 8) / 2;

const GAMES = ['All', 'Fortnite', 'Valorant', 'Apex', 'Warzone', 'Minecraft', 'COD'];

const MOCK_STREAMS = Array.from({ length: 8 }, (_, i) => ({
  id: `s${i}`,
  title: ['RANKED GRIND 💜', 'Pro Scrims Live', 'Chill gaming sesh', 'Tournament final!', 'Road to Top 500', 'New meta testing', 'Speedrun attempt', 'Viewer games'][i],
  game: ['Valorant', 'Fortnite', 'Apex', 'Warzone'][i % 4],
  streamer: { username: ['ProSniper', 'ClipMaster', 'VentureKing', 'EliteFragger'][i % 4], isVerified: i % 2 === 0 },
  viewerCount: Math.floor(Math.random() * 5000) + 100,
  thumbnailUrl: null,
  tags: ['FPS', 'Ranked', 'Competitive'].slice(0, (i % 3) + 1),
}));

function StreamTile({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress}>
      <LinearGradient colors={['#1a0533', '#0d1b3e']} style={StyleSheet.absoluteFill} />
      <View style={styles.tileLiveBadge}><View style={styles.tileLiveDot} /><Text style={styles.tileLiveText}>LIVE</Text></View>
      <View style={styles.tileViewers}><Ionicons name="eye" size={10} color="rgba(255,255,255,0.8)" /><Text style={styles.tileViewerCount}>{item.viewerCount.toLocaleString()}</Text></View>
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.tileGrad}>
        <Text style={styles.tileStreamer}>@{item.streamer.username}{item.streamer.isVerified ? ' ✓' : ''}</Text>
        <Text style={styles.tileTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.tileGame}>{item.game}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function LiveBrowseScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [streams, setStreams] = useState(MOCK_STREAMS);
  const [selectedGame, setSelectedGame] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = selectedGame === 'All' ? streams : streams.filter(s => s.game === selectedGame);

  const onRefresh = async () => {
    setRefreshing(true);
    try { const res = await api.get('/live?limit=20'); if (res.data?.streams?.length) setStreams(res.data.streams); } catch (_) {}
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Live Now</Text>
        <TouchableOpacity style={styles.goLiveBtn} onPress={() => navigation.navigate('GoLive')}>
          <View style={styles.goLiveDot} />
          <Text style={styles.goLiveBtnText}>Go Live</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gameScroll} contentContainerStyle={styles.gameScrollContent}>
        {GAMES.map(g => (
          <TouchableOpacity key={g} style={[styles.gameChip, selectedGame === g && styles.gameChipActive]} onPress={() => setSelectedGame(g)}>
            <Text style={[styles.gameChipText, selectedGame === g && styles.gameChipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <StreamTile item={item} onPress={() => navigation.navigate('LiveStream', { streamId: item.id })} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '700' },
  goLiveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.danger, borderRadius: 16 },
  goLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  goLiveBtnText: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '700' },
  gameScroll: { maxHeight: 44 },
  gameScrollContent: { paddingHorizontal: Spacing.base, paddingVertical: 8, gap: 8 },
  gameChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  gameChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  gameChipText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  gameChipTextActive: { color: '#fff' },
  row: { paddingHorizontal: Spacing.base, gap: 8, marginBottom: 8 },
  tile: { width: TILE_W, height: TILE_W * 1.3, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  tileLiveBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.danger, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, zIndex: 2 },
  tileLiveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
  tileLiveText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  tileViewers: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, zIndex: 2 },
  tileViewerCount: { color: '#fff', fontSize: 9 },
  tileGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, paddingTop: 30 },
  tileStreamer: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  tileTitle: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '700', marginTop: 1 },
  tileGame: { color: Colors.accent, fontSize: 9, marginTop: 2 },
});
