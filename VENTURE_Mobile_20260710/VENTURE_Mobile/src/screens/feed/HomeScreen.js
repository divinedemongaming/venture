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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Screen from '../../components/common/Screen';
import PostCard from '../../components/feed/PostCard';
import Avatar from '../../components/common/Avatar';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { feedAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('following');

  const loadFeed = useCallback(async () => {
    try {
      const [feedRes, storiesRes] = await Promise.all([
        feedAPI.home({ limit: 20 }),
        feedAPI.stories()
      ]);
      setPosts(feedRes.data.posts || []);
      setStories(storiesRes.data || []);
    } catch (err) {
      console.error('Feed load error:', err);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadFeed(); }, []);

  const handleRefresh = () => { setRefreshing(true); loadFeed(); };

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => navigation.navigate('Stories', { userId: item.author?.id })}
    >
      <View style={[styles.storyRing, item.hasUnseen && styles.storyRingUnseen]}>
        <Avatar user={item.author} size="lg" showLive />
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>{item.author?.username}</Text>
    </TouchableOpacity>
  );

  const renderMyStory = () => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => navigation.navigate('CreateStory')}
    >
      <View style={styles.addStoryContainer}>
        <Avatar user={user} size="lg" />
        <View style={styles.addStoryBtn}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.addStoryGradient}>
            <Ionicons name="add" size={14} color="#FFF" />
          </LinearGradient>
        </View>
      </View>
      <Text style={styles.storyUsername}>Your Story</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Stories Row */}
      <FlatList
        data={stories}
        renderItem={renderStoryItem}
        keyExtractor={item => item.author?.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={renderMyStory}
        contentContainerStyle={styles.storiesContainer}
        style={styles.storiesList}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        {['following', 'explore', 'gaming'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.logoIcon}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#FFF" />
          </LinearGradient>
          <Text style={styles.logoText}>VENTURE</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('CreatePost')}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.createBtn}>
              <Ionicons name="add" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              onProfilePress={() => navigation.navigate('UserProfile', { username: item.author?.username })}
            />
          )}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Your feed is empty</Text>
              <Text style={styles.emptySubtitle}>Follow creators to see their posts here, or explore trending content</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Explore')}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.exploreBtnGradient}>
                  <Text style={styles.exploreBtnText}>Explore VENTURE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  logoText: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.black, letterSpacing: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: { position: 'absolute', top: 4, right: 4, backgroundColor: Colors.primary, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  createBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  storiesList: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  storiesContainer: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md },
  storyItem: { alignItems: 'center', width: 72 },
  storyRing: { padding: 3, borderRadius: 50, borderWidth: 2, borderColor: Colors.border, marginBottom: 6 },
  storyRingUnseen: { borderColor: Colors.primary },
  addStoryContainer: { position: 'relative' },
  addStoryBtn: { position: 'absolute', bottom: 0, right: 0 },
  addStoryGradient: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background },
  storyUsername: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, textAlign: 'center', width: 64 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', position: 'relative' },
  tabActive: {},
  tabText: { color: Colors.textMuted, fontSize: Typography.sizes.md, fontWeight: '600' },
  tabTextActive: { color: Colors.textPrimary },
  tabIndicator: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, backgroundColor: Colors.primary, borderRadius: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: Spacing['3xl'], paddingHorizontal: Spacing['2xl'] },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '700', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  emptySubtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.md, textAlign: 'center', lineHeight: 22 },
  exploreBtn: { marginTop: Spacing.xl, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  exploreBtnGradient: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md },
  exploreBtnText: { color: '#FFF', fontSize: Typography.sizes.md, fontWeight: '700' },
});
