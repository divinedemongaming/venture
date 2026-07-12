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
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',       label: 'All',       icon: 'apps-outline' },
  { key: 'published', label: 'Published', icon: 'checkmark-circle-outline' },
  { key: 'scheduled', label: 'Scheduled', icon: 'calendar-outline' },
  { key: 'draft',     label: 'Drafts',    icon: 'document-outline' },
  { key: 'unlisted',  label: 'Unlisted',  icon: 'eye-off-outline' },
  { key: 'private',   label: 'Private',   icon: 'lock-closed-outline' },
];

const TYPE_FILTERS = [
  { key: 'all',    label: 'All Types' },
  { key: 'post',   label: 'Posts' },
  { key: 'reel',   label: 'Reels' },
  { key: 'story',  label: 'Stories' },
];

const STATUS_COLORS = {
  published:  Colors.success,
  scheduled:  Colors.primary,
  draft:      Colors.accentAlt,
  unlisted:   Colors.textMuted,
  private:    Colors.danger,
};

const STATUS_ICONS = {
  published:  'checkmark-circle',
  scheduled:  'calendar',
  draft:      'document-text',
  unlisted:   'eye-off',
  private:    'lock-closed',
};

// ─── Mock data (replaced by API in prod) ──────────────────────────────────────

const MOCK_CONTENT = [
  { id: '1', type: 'reel',  title: 'Epic clutch play — Valorant ranked',    status: 'published', views: 48200, likes: 3400, comments: 218, thumbnail: null, createdAt: '2026-07-08', scheduledAt: null, visibility: 'PUBLIC',  contentRating: 'TEEN',     tipsEnabled: true, collectionId: null },
  { id: '2', type: 'post',  title: 'New gaming setup reveal 🎮',            status: 'published', views: 12400, likes: 891,  comments: 74,  thumbnail: null, createdAt: '2026-07-07', scheduledAt: null, visibility: 'PUBLIC',  contentRating: 'EVERYONE', tipsEnabled: false, collectionId: null },
  { id: '3', type: 'reel',  title: 'Behind the scenes — stream prep',       status: 'scheduled', views: 0,     likes: 0,    comments: 0,   thumbnail: null, createdAt: '2026-07-06', scheduledAt: '2026-07-10T18:00:00Z', visibility: 'PUBLIC',  contentRating: 'EVERYONE', tipsEnabled: true, collectionId: null },
  { id: '4', type: 'post',  title: 'Tournament recap draft',                status: 'draft',     views: 0,     likes: 0,    comments: 0,   thumbnail: null, createdAt: '2026-07-05', scheduledAt: null, visibility: 'PRIVATE', contentRating: 'EVERYONE', tipsEnabled: false, collectionId: null },
  { id: '5', type: 'reel',  title: 'Subscriber-only training session',      status: 'published', views: 3200,  likes: 420,  comments: 56,  thumbnail: null, createdAt: '2026-07-04', scheduledAt: null, visibility: 'SUBSCRIBERS_ONLY', contentRating: 'TEEN', tipsEnabled: true, collectionId: null },
  { id: '6', type: 'story', title: 'Story — midnight stream hype',          status: 'published', views: 2800,  likes: 190,  comments: 0,   thumbnail: null, createdAt: '2026-07-03', scheduledAt: null, visibility: 'PUBLIC',  contentRating: 'EVERYONE', tipsEnabled: false, collectionId: null },
  { id: '7', type: 'post',  title: 'Unlisted sponsor review',               status: 'unlisted',  views: 340,   likes: 28,   comments: 5,   thumbnail: null, createdAt: '2026-07-02', scheduledAt: null, visibility: 'UNLISTED', contentRating: 'EVERYONE', tipsEnabled: false, collectionId: null },
  { id: '8', type: 'reel',  title: 'Mature content — ranked rants',         status: 'published', views: 7600,  likes: 560,  comments: 88,  thumbnail: null, createdAt: '2026-07-01', scheduledAt: null, visibility: 'PUBLIC',  contentRating: 'MATURE',   tipsEnabled: false, collectionId: null },
];

// ─── Content Item Card ─────────────────────────────────────────────────────────

function ContentCard({ item, onEdit, onUnpublish, onDelete }) {
  const statusColor = STATUS_COLORS[item.status] ?? Colors.textMuted;
  const statusIcon = STATUS_ICONS[item.status] ?? 'help';

  const fmtNum = n => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        <LinearGradient colors={['#1a1a2e', '#0A0A0F']} style={StyleSheet.absoluteFill} />
        <Ionicons
          name={item.type === 'reel' ? 'play-circle-outline' : item.type === 'story' ? 'radio-outline' : 'image-outline'}
          size={28} color={Colors.textMuted}
        />
        {/* Type badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.menuBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Status + Visibility row */}
        <View style={styles.cardMeta}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
            <Ionicons name={statusIcon} size={11} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
          {item.visibility !== 'PUBLIC' && (
            <View style={styles.visBadge}>
              <Ionicons name="eye-off-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.visBadgeText}>{item.visibility.replace('_', ' ')}</Text>
            </View>
          )}
          {item.contentRating !== 'EVERYONE' && (
            <View style={[styles.visBadge, { borderColor: item.contentRating === 'MATURE' ? Colors.danger + '40' : Colors.accentAlt + '40' }]}>
              <Text style={[styles.visBadgeText, { color: item.contentRating === 'MATURE' ? Colors.danger : Colors.accentAlt }]}>
                {item.contentRating}
              </Text>
            </View>
          )}
          {item.tipsEnabled && (
            <View style={[styles.visBadge, { borderColor: Colors.success + '40' }]}>
              <Ionicons name="cash-outline" size={11} color={Colors.success} />
            </View>
          )}
        </View>

        {/* Scheduled time */}
        {item.scheduledAt && (
          <View style={styles.scheduledRow}>
            <Ionicons name="calendar-outline" size={12} color={Colors.primary} />
            <Text style={styles.scheduledText}>
              {new Date(item.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}

        {/* Stats */}
        {item.status === 'published' && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.statText}>{fmtNum(item.views)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.statText}>{fmtNum(item.likes)}</Text>
            </View>
            {item.comments > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.statText}>{fmtNum(item.comments)}</Text>
              </View>
            )}
            <Text style={styles.dateText}>{item.createdAt}</Text>
          </View>
        )}

        {/* Context menu */}
        {menuOpen && (
          <View style={styles.contextMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); onEdit(item); }}>
              <Ionicons name="create-outline" size={15} color={Colors.textPrimary} />
              <Text style={styles.menuItemText}>Edit Settings</Text>
            </TouchableOpacity>
            {item.status === 'published' && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); onUnpublish(item); }}>
                <Ionicons name="eye-off-outline" size={15} color={Colors.accentAlt} />
                <Text style={[styles.menuItemText, { color: Colors.accentAlt }]}>Unpublish</Text>
              </TouchableOpacity>
            )}
            {item.status === 'draft' && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); onEdit(item); }}>
                <Ionicons name="send-outline" size={15} color={Colors.primary} />
                <Text style={[styles.menuItemText, { color: Colors.primary }]}>Publish Now</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: Colors.border }]} onPress={() => { setMenuOpen(false); onDelete(item); }}>
              <Ionicons name="trash-outline" size={15} color={Colors.danger} />
              <Text style={[styles.menuItemText, { color: Colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function ContentLibraryScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [content, setContent] = useState(MOCK_CONTENT);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadContent = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/content/library?status=${tab}&type=${typeFilter}&q=${search}`);
      setContent(res.data?.items ?? MOCK_CONTENT);
    } catch {
      // Keep mock data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, typeFilter, search]);

  useEffect(() => { loadContent(); }, [tab, typeFilter]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleEdit(item) {
    navigation.navigate('PostEdit', { item });
  }

  function handleUnpublish(item) {
    Alert.alert(
      'Unpublish',
      `"${item.title}" will be hidden from your audience but not deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpublish', style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/content/${item.type}s/${item.id}/unpublish`);
              setContent(prev => prev.map(c => c.id === item.id ? { ...c, status: 'draft' } : c));
            } catch {
              Alert.alert('Error', 'Could not unpublish. Try again.');
            }
          }
        }
      ]
    );
  }

  function handleDelete(item) {
    Alert.alert(
      'Delete Content',
      `This will permanently delete "${item.title}". This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/${item.type}s/${item.id}`);
              setContent(prev => prev.filter(c => c.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not delete. Try again.');
            }
          }
        }
      ]
    );
  }

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = content.filter(item => {
    const matchTab = tab === 'all' || item.status === tab;
    const matchType = typeFilter === 'all' || item.type === typeFilter;
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchType && matchSearch;
  });

  // ── Counts ─────────────────────────────────────────────────────────────────

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? content.length : content.filter(c => c.status === t.key).length;
    return acc;
  }, {});

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Library</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ContentScheduler')}>
          <Ionicons name="calendar-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your content..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => loadContent()}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type filter */}
      <View style={styles.typeFilterRow}>
        {TYPE_FILTERS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeBtn, typeFilter === t.key && styles.typeBtnActive]}
            onPress={() => setTypeFilter(t.key)}
          >
            <Text style={[styles.typeBtnText, typeFilter === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            {counts[t.key] > 0 && (
              <View style={[styles.tabBadge, tab === t.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, tab === t.key && styles.tabBadgeTextActive]}>{counts[t.key]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ContentCard
              item={item}
              onEdit={handleEdit}
              onUnpublish={handleUnpublish}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={{ padding: Spacing.base, gap: 12, paddingBottom: insets.bottom + 80 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No content here</Text>
              <Text style={styles.emptySub}>
                {tab === 'draft' ? 'No drafts saved.' : tab === 'scheduled' ? 'No scheduled posts.' : 'Nothing matches your filters.'}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadContent(true); }}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },

  searchRow: { paddingHorizontal: Spacing.base, paddingVertical: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.backgroundCard, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary },

  typeFilterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.base, marginBottom: 4 },
  typeBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  typeBtnText: { ...Typography.caption, color: Colors.textMuted },
  typeBtnTextActive: { color: Colors.primary, fontWeight: '700' },

  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: 4, paddingBottom: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { ...Typography.caption, color: Colors.textMuted },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  tabBadge: { backgroundColor: Colors.border, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { ...Typography.caption, color: Colors.textMuted, fontSize: 10 },
  tabBadgeTextActive: { color: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.backgroundCard, borderRadius: 16,
    padding: 12, borderWidth: 1, borderColor: Colors.border,
  },
  thumbnail: {
    width: 80, height: 80, borderRadius: 10, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
  typeBadge: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  typeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  cardInfo: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 6 },
  cardTitle: { flex: 1, ...Typography.body, color: Colors.textPrimary, fontWeight: '600', lineHeight: 18 },
  menuBtn: { padding: 2 },

  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  visBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  visBadgeText: { fontSize: 10, color: Colors.textMuted },

  scheduledRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  scheduledText: { ...Typography.caption, color: Colors.primary },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { ...Typography.caption, color: Colors.textMuted },
  dateText: { ...Typography.caption, color: Colors.textMuted, marginLeft: 'auto' },

  contextMenu: {
    backgroundColor: Colors.backgroundCard, borderRadius: 10, marginTop: 8,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  menuItemText: { ...Typography.body, color: Colors.textPrimary },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary },
  emptySub: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
