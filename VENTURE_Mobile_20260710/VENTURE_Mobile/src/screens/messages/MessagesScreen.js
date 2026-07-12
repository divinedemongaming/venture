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
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';

const MOCK_THREADS = [
  {
    id: 'thread_1',
    participant: { id: 'u1', username: 'ClipMaster99', displayName: 'Clip Master', isVerified: true, isOnline: true, isCreator: true },
    lastMessage: { content: 'bro that clip was INSANE 🔥', sentAt: new Date(Date.now() - 120000).toISOString(), senderId: 'u1' },
    unreadCount: 3,
  },
  {
    id: 'thread_2',
    participant: { id: 'u2', username: 'ProSniper', displayName: 'Pro Sniper', isVerified: false, isOnline: false, isCreator: false },
    lastMessage: { content: 'gg wp, rematch tomorrow?', sentAt: new Date(Date.now() - 3600000).toISOString(), senderId: 'me' },
    unreadCount: 0,
  },
  {
    id: 'thread_3',
    participant: { id: 'u3', username: 'VentureKing', displayName: 'Venture King', isVerified: true, isOnline: true, isCreator: true },
    lastMessage: { content: 'collab stream this weekend?', sentAt: new Date(Date.now() - 7200000).toISOString(), senderId: 'u3' },
    unreadCount: 1,
  },
  {
    id: 'thread_4',
    participant: { id: 'u4', username: 'EliteFragger', displayName: 'Elite Fragger', isVerified: false, isOnline: false, isCreator: false },
    lastMessage: { content: 'Thanks for the sub! 💜', sentAt: new Date(Date.now() - 86400000).toISOString(), senderId: 'me' },
    unreadCount: 0,
  },
  {
    id: 'thread_5',
    participant: { id: 'u5', username: 'DarkSoul_GG', displayName: 'DarkSoul GG', isVerified: false, isOnline: true, isCreator: false },
    lastMessage: { content: 'that tournament bracket is insane lol', sentAt: new Date(Date.now() - 172800000).toISOString(), senderId: 'u5' },
    unreadCount: 0,
  },
  {
    id: 'thread_6',
    participant: { id: 'u6', username: 'ApexPredator', displayName: 'Apex Predator', isVerified: true, isOnline: false, isCreator: true },
    lastMessage: { content: 'We should do a gaming stream together sometime!', sentAt: new Date(Date.now() - 259200000).toISOString(), senderId: 'u6' },
    unreadCount: 0,
  },
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function ThreadRow({ item, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const p = item.participant;
  const isMyLast = item.lastMessage.senderId === 'me';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.threadRow}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Avatar with online indicator */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, p.isCreator && styles.avatarCreator]}>
            <Text style={styles.avatarText}>{p.displayName[0].toUpperCase()}</Text>
          </View>
          {p.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Thread content */}
        <View style={styles.threadContent}>
          <View style={styles.threadTopRow}>
            <View style={styles.nameGroup}>
              <Text style={[styles.threadName, item.unreadCount > 0 && styles.threadNameUnread]}>
                {p.displayName}
              </Text>
              {p.isVerified && (
                <Ionicons name="checkmark-circle" size={13} color={Colors.accent} />
              )}
              {p.isCreator && (
                <View style={styles.creatorTag}>
                  <Text style={styles.creatorTagText}>Creator</Text>
                </View>
              )}
            </View>
            <Text style={styles.threadTime}>{timeAgo(item.lastMessage.sentAt)}</Text>
          </View>
          <View style={styles.threadBottomRow}>
            <Text
              style={[styles.threadPreview, item.unreadCount > 0 && styles.threadPreviewUnread]}
              numberOfLines={1}
            >
              {isMyLast ? `You: ${item.lastMessage.content}` : item.lastMessage.content}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [threads, setThreads] = useState(MOCK_THREADS);
  const [filtered, setFiltered] = useState(MOCK_THREADS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    let results = threads;
    if (filterUnread) results = results.filter(t => t.unreadCount > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(t =>
        t.participant.displayName.toLowerCase().includes(q) ||
        t.participant.username.toLowerCase().includes(q) ||
        t.lastMessage.content.toLowerCase().includes(q)
      );
    }
    setFiltered(results);
  }, [search, threads, filterUnread]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages/threads?limit=30');
      if (res.data?.threads?.length) {
        setThreads(res.data.threads);
        setFiltered(res.data.threads);
      }
    } catch (_) {}
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchThreads();
    setRefreshing(false);
  };

  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Messages
          {totalUnread > 0 && <Text style={styles.headerUnread}> {totalUnread}</Text>}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.filterBtn, filterUnread && styles.filterBtnActive]}
            onPress={() => setFilterUnread(p => !p)}
          >
            <Text style={[styles.filterBtnText, filterUnread && styles.filterBtnTextActive]}>
              Unread
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newMsgBtn}
            onPress={() => navigation.navigate('Search', { mode: 'dm' })}
          >
            <Ionicons name="create-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Thread list */}
      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="chatbubbles-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {search ? 'No results' : filterUnread ? 'All caught up!' : 'No messages yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search ? 'Try a different name or keyword' : 'Start a conversation with another creator'}
          </Text>
          {!search && !filterUnread && (
            <TouchableOpacity
              style={styles.newConvoBtn}
              onPress={() => navigation.navigate('Search', { mode: 'dm' })}
            >
              <Ionicons name="person-add-outline" size={16} color="#fff" />
              <Text style={styles.newConvoText}>Find Someone</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ThreadRow
              item={item}
              onPress={() => navigation.navigate('Thread', {
                threadId: item.id,
                userId: item.participant.id,
                username: item.participant.username,
                displayName: item.participant.displayName,
                isOnline: item.participant.isOnline,
              })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes['2xl'], fontWeight: '800' },
  headerUnread: { color: Colors.primary, fontSize: Typography.sizes['2xl'] },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 16,
  },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  filterBtnText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  filterBtnTextActive: { color: Colors.primary },
  newMsgBtn: { padding: 4 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: Spacing.base, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sizes.sm },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: Spacing['2xl'] },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700', marginTop: 8 },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.sizes.sm, textAlign: 'center' },
  newConvoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.primary, borderRadius: 20,
  },
  newConvoText: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: '600' },

  threadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  avatarCreator: { borderColor: Colors.primary },
  avatarText: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.online,
    borderWidth: 2, borderColor: Colors.background,
  },
  threadContent: { flex: 1 },
  threadTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  nameGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  threadName: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  threadNameUnread: { color: Colors.textPrimary, fontWeight: '700' },
  creatorTag: {
    paddingHorizontal: 6, paddingVertical: 1,
    backgroundColor: Colors.primary + '30', borderRadius: 6,
  },
  creatorTagText: { color: Colors.primaryLight, fontSize: 9, fontWeight: '700' },
  threadTime: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  threadBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  threadPreview: { color: Colors.textMuted, fontSize: Typography.sizes.sm, flex: 1 },
  threadPreviewUnread: { color: Colors.textPrimary, fontWeight: '500' },
  unreadBadge: {
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  separator: { height: 0.5, backgroundColor: Colors.border, marginLeft: 74 },
});
