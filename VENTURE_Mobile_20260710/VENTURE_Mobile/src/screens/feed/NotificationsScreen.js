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
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';

const NOTIF_TYPES = {
  like: { icon: 'heart', color: '#EF4444', label: 'liked your clip' },
  comment: { icon: 'chatbubble', color: '#06B6D4', label: 'commented' },
  follow: { icon: 'person-add', color: '#10B981', label: 'started following you' },
  sub: { icon: 'star', color: '#F59E0B', label: 'subscribed to you' },
  tip: { icon: 'cash', color: '#F59E0B', label: 'sent you a tip' },
  mention: { icon: 'at', color: '#7C3AED', label: 'mentioned you' },
  live: { icon: 'radio', color: '#EF4444', label: 'went live' },
  system: { icon: 'information-circle', color: '#6B6B80', label: '' },
};

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'sub', userId: 'u1', username: 'ClipMaster99', content: 'subscribed to you · $9.99/mo', isRead: false, createdAt: new Date(Date.now() - 120000).toISOString(), postId: null },
  { id: 'n2', type: 'like', userId: 'u2', username: 'ProSniper', content: 'liked your clip "1v5 clutch 🔥"', isRead: false, createdAt: new Date(Date.now() - 600000).toISOString(), postId: 'p1' },
  { id: 'n3', type: 'follow', userId: 'u3', username: 'VentureKing', content: 'started following you', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString(), postId: null },
  { id: 'n4', type: 'comment', userId: 'u4', username: 'EliteFragger', content: 'commented: "bro that was insane 🔥"', isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString(), postId: 'p1' },
  { id: 'n5', type: 'tip', userId: 'u5', username: 'DarkSoul_GG', content: 'sent you a $5.00 tip!', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString(), postId: null },
  { id: 'n6', type: 'mention', userId: 'u6', username: 'ApexPredator', content: 'mentioned you in a comment', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString(), postId: 'p2' },
  { id: 'n7', type: 'like', userId: 'u7', username: 'FragMaster', content: 'liked your reel', isRead: true, createdAt: new Date(Date.now() - 259200000).toISOString(), postId: 'p3' },
  { id: 'n8', type: 'system', userId: null, username: 'VENTURE', content: '🎉 Congrats! You crossed 4,800 followers. Keep growing!', isRead: true, createdAt: new Date(Date.now() - 345600000).toISOString(), postId: null },
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

function NotifRow({ item, onPress, onMarkRead }) {
  const config = NOTIF_TYPES[item.type] || NOTIF_TYPES.system;
  return (
    <TouchableOpacity
      style={[styles.notifRow, !item.isRead && styles.notifRowUnread]}
      onPress={() => { onMarkRead(item.id); onPress(item); }}
    >
      {/* Icon */}
      <View style={[styles.notifIcon, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <Text style={styles.notifText}>
          {item.userId && <Text style={styles.notifUser}>{item.username} </Text>}
          <Text>{item.content}</Text>
        </Text>
        <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
      </View>

      {/* Unread dot */}
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('all'); // all | unread | mentions
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=50');
      if (res.data?.notifications?.length) setNotifications(res.data.notifications);
    } catch (_) {}
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try { api.patch(`/notifications/${id}/read`); } catch (_) {}
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try { api.post('/notifications/read-all'); } catch (_) {}
  };

  const handlePress = (item) => {
    if (item.postId) navigation.navigate('PostDetail', { postId: item.postId });
    else if (item.userId && item.type !== 'system') navigation.navigate('Profile', { userId: item.userId });
  };

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : filter === 'mentions'
    ? notifications.filter(n => n.type === 'mention')
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications {unreadCount > 0 && <Text style={styles.unreadCount}>({unreadCount})</Text>}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {['all', 'unread', 'mentions'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingBox}><ActivityIndicator color={Colors.primary} /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="notifications-off-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyText}>{filter === 'unread' ? "You're all caught up!" : "No notifications yet"}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <NotifRow item={item} onPress={handlePress} onMarkRead={markRead} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { color: Colors.textPrimary, fontSize: Typography.sizes['2xl'], fontWeight: '800' },
  unreadCount: { color: Colors.primary },
  markAllText: { color: Colors.primary, fontSize: Typography.sizes.sm },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.base, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sizes.md },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.base, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  notifRowUnread: { backgroundColor: Colors.primary + '08' },
  notifIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1, gap: 3 },
  notifText: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, lineHeight: 18 },
  notifUser: { fontWeight: '700' },
  notifTime: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});
