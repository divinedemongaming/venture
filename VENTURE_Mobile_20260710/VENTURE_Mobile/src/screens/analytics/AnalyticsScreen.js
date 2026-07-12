import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme';
import api from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 80;
const PERIODS = [
  { label: '7 Days', value: '7d' },
  { label: '28 Days', value: '28d' },
  { label: '90 Days', value: '90d' },
];

function StatCard({ icon, label, value, delta, color }) {
  const positive = delta >= 0;
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      {delta !== undefined && delta !== null && (
        <View style={styles.deltaRow}>
          <Ionicons
            name={positive ? 'trending-up' : 'trending-down'}
            size={14}
            color={positive ? '#4CAF50' : '#F44336'}
          />
          <Text style={[styles.deltaText, { color: positive ? '#4CAF50' : '#F44336' }]}>
            {positive ? '+' : ''}{delta}% vs prev period
          </Text>
        </View>
      )}
    </View>
  );
}

function MiniBarChart({ data = [] }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.value || 0), 1);
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>Daily Views</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartBars}>
          {data.map((d, i) => {
            const h = Math.max(4, (d.value / maxVal) * BAR_MAX_HEIGHT);
            return (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barVal}>
                  {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
                </Text>
                <View style={[styles.bar, { height: h, backgroundColor: Colors.primary || '#6C63FF' }]} />
                <Text style={styles.barLabel}>{d.label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function TopContentRow({ item, rank }) {
  return (
    <View style={styles.topRow}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <View style={styles.topInfo}>
        <Text style={styles.topTitle} numberOfLines={1}>{item.title || item.caption || 'Untitled'}</Text>
        <Text style={styles.topMeta}>{item.type || 'post'} · {formatNum(item.views)} views</Text>
      </View>
      <View style={styles.topStats}>
        <Text style={styles.topStatVal}>{formatNum(item.likes)}</Text>
        <Ionicons name="heart" size={12} color="#FF4B77" />
      </View>
    </View>
  );
}

function formatNum(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function AnalyticsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (p = period, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/analytics/overview?period=${p}`);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { load(period); }, [period]);

  const onRefresh = useCallback(() => load(period, true), [period, load]);

  // Map flat backend response { totalViews, followers, newFollowers, totalLikes, engagementRate }
  // into the shape our StatCards expect
  const stats = data ? {
    totalViews: data.totalViews,
    viewsDelta: null,                  // backend doesn't track delta yet
    followerCount: data.followers,
    followersDelta: null,
    revenue: null,                     // revenue not in this endpoint yet
    revenueDelta: null,
    engagementRate: data.engagementRate,
    engagementDelta: null,
    // extras exposed in the info row below
    newFollowers: data.newFollowers,
    totalLikes: data.totalLikes,
    posts: data.posts,
  } : {};
  const chartData = data?.dailyViews || [];   // backend doesn't send this yet — chart hides gracefully
  const topContent = data?.topContent || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.text || '#fff'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.value}
            style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
            onPress={() => setPeriod(p.value)}
          >
            <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary || '#6C63FF'} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error || '#F44336'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(period)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Stat cards */}
          <View style={styles.cardGrid}>
            <StatCard
              icon="eye-outline"
              label="Views"
              value={formatNum(stats.totalViews)}
              delta={stats.viewsDelta}
              color="#6C63FF"
            />
            <StatCard
              icon="people-outline"
              label="Followers"
              value={formatNum(stats.followerCount)}
              delta={stats.followersDelta}
              color="#4CAF50"
            />
            <StatCard
              icon="cash-outline"
              label="Revenue"
              value={stats.revenue !== undefined ? `$${Number(stats.revenue).toFixed(2)}` : '—'}
              delta={stats.revenueDelta}
              color="#FF9800"
            />
            <StatCard
              icon="stats-chart-outline"
              label="Engagement"
              value={stats.engagementRate !== undefined ? `${stats.engagementRate}%` : '—'}
              delta={stats.engagementDelta}
              color="#E91E63"
            />
          </View>

          {/* Daily views chart */}
          <MiniBarChart data={chartData} />

          {/* Top content */}
          {topContent.length > 0 && (
            <View style={styles.topSection}>
              <Text style={styles.sectionTitle}>Top Content</Text>
              {topContent.map((item, i) => (
                <TopContentRow key={item.id || i} item={item} rank={i + 1} />
              ))}
            </View>
          )}

          {/* Extra stats row — posts published + new followers */}
          {(stats.posts !== undefined || stats.newFollowers !== undefined) && (
            <View style={styles.extraRow}>
              {stats.posts !== undefined && (
                <View style={styles.extraItem}>
                  <Text style={styles.extraVal}>{stats.posts}</Text>
                  <Text style={styles.extraLabel}>Posts Published</Text>
                </View>
              )}
              {stats.totalLikes !== undefined && (
                <View style={styles.extraItem}>
                  <Text style={styles.extraVal}>{formatNum(stats.totalLikes)}</Text>
                  <Text style={styles.extraLabel}>Total Likes</Text>
                </View>
              )}
              {stats.newFollowers !== undefined && (
                <View style={styles.extraItem}>
                  <Text style={styles.extraVal}>+{stats.newFollowers}</Text>
                  <Text style={styles.extraLabel}>New Followers</Text>
                </View>
              )}
            </View>
          )}

          {/* Open full dashboard */}
          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={() => navigation.navigate('CreatorDashboard')}
          >
            <Ionicons name="grid-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.dashboardBtnText}>Open Full Creator Dashboard</Text>
          </TouchableOpacity>

          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const CARD_W = (SCREEN_WIDTH - 48) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#0F1420',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text || '#fff',
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.primary || '#6C63FF',
    borderColor: Colors.primary || '#6C63FF',
  },
  periodText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#fff',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: CARD_W,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: Colors.text || '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text || '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingBottom: 4,
  },
  barCol: {
    alignItems: 'center',
    width: 32,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  barVal: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    marginBottom: 4,
  },
  barLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
  },
  topSection: {
    marginBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: Colors.primary || '#6C63FF',
    fontSize: 12,
    fontWeight: '700',
  },
  topInfo: { flex: 1 },
  topTitle: {
    color: Colors.text || '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  topMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  topStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topStatVal: {
    color: '#FF4B77',
    fontSize: 13,
    fontWeight: '600',
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary || '#6C63FF',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  extraRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  extraItem: { alignItems: 'center', flex: 1 },
  extraVal: {
    color: Colors.text || '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  extraLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dashboardBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary || '#6C63FF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
