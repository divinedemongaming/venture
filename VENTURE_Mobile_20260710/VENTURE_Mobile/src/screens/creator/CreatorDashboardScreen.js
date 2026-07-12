/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';

const { width: W } = Dimensions.get('window');
const STAT_W = (W - Spacing.base * 2 - 12) / 2;

const MOCK_STATS = {
  followers: 4821, followerGrowth: +142,
  views: 284000, viewsGrowth: +18200,
  earnings: 3840.00, earningsGrowth: +420,
  subscribers: 126, subscriberGrowth: +8,
};

const CHART_DATA = [12, 28, 18, 42, 35, 58, 72, 48, 65, 89, 74, 92, 108, 86].map(v => v / 1.2);

function MiniChart({ data, color }) {
  const max = Math.max(...data);
  return (
    <View style={styles.chart}>
      {data.map((v, i) => (
        <View
          key={i}
          style={[styles.bar, { height: (v / max) * 32, backgroundColor: color, opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.4 }]}
        />
      ))}
    </View>
  );
}

function StatCard({ label, value, growth, icon, color, prefix = '', onPress }) {
  const isUp = growth >= 0;
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient colors={[color + '20', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={styles.statCardTop}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={[styles.growthTag, { backgroundColor: isUp ? Colors.success + '20' : Colors.danger + '20' }]}>
          <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={11} color={isUp ? Colors.success : Colors.danger} />
          <Text style={[styles.growthText, { color: isUp ? Colors.success : Colors.danger }]}>
            {isUp ? '+' : ''}{typeof growth === 'number' && growth > 1000 ? `${(growth / 1000).toFixed(1)}K` : growth}
          </Text>
        </View>
      </View>
      <Text style={styles.statValue}>{prefix}{typeof value === 'number' && value >= 1000 ? value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${(value / 1000).toFixed(1)}K` : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function CreatorDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('7d');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
          <Ionicons name="analytics-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { import('expo-linking').then(Linking => Linking.openURL('http://localhost:3001')); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#7C3AED' + '20', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#7C3AED' + '40' }}
        >
          <Ionicons name="desktop-outline" size={14} color={Colors.primary} />
          <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: '700' }}>Studio</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {/* Period selector */}
        <View style={styles.periodRow}>
          {['24h', '7d', '30d', '90d'].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodChip, period === p && styles.periodChipActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Followers" value={MOCK_STATS.followers} growth={MOCK_STATS.followerGrowth} icon="people-outline" color={Colors.primary} onPress={() => {}} />
          <StatCard label="Views" value={MOCK_STATS.views} growth={MOCK_STATS.viewsGrowth} icon="eye-outline" color={Colors.accent} onPress={() => {}} />
          <StatCard label="Earnings" value={MOCK_STATS.earnings} growth={MOCK_STATS.earningsGrowth} icon="cash-outline" color={Colors.accentAlt} prefix="$" onPress={() => navigation.navigate('Monetization')} />
          <StatCard label="Subscribers" value={MOCK_STATS.subscribers} growth={MOCK_STATS.subscriberGrowth} icon="star-outline" color={Colors.success} onPress={() => navigation.navigate('Monetization')} />
        </View>

        {/* Views chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Views · {period}</Text>
          <View style={styles.chartContainer}>
            <MiniChart data={CHART_DATA} color={Colors.primary} />
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'add-circle', label: 'New Post', color: Colors.primary, nav: 'CreatePost' },
            { icon: 'play-circle', label: 'New Reel', color: Colors.accent, nav: 'CreateReel' },
            { icon: 'radio', label: 'Go Live', color: Colors.danger, nav: 'GoLive' },
            { icon: 'download', label: 'Import', color: Colors.success, nav: 'Import' },
          ].map(a => (
            <TouchableOpacity key={a.nav} style={styles.actionCard} onPress={() => navigation.navigate(a.nav)}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top performing content */}
        <Text style={styles.sectionTitle}>Top Content</Text>
        <View style={styles.topContent}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.topContentRow}>
              <Text style={styles.topRank}>#{i}</Text>
              <LinearGradient colors={['#1a0533', '#0d1b3e']} style={styles.topThumb} />
              <View style={styles.topInfo}>
                <Text style={styles.topCaption}>Clip post #{i} · Valorant</Text>
                <Text style={styles.topViews}>{(120000 / i).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} views · {(5000 / i).toFixed(0)} likes</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '700' },
  periodRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.base, paddingVertical: 10 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  periodChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  periodTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: Spacing.base },
  statCard: { width: STAT_W, padding: 14, backgroundColor: Colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  growthTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  growthText: { fontSize: 10, fontWeight: '700' },
  statValue: { color: Colors.textPrimary, fontSize: Typography.sizes['2xl'], fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  chartCard: { margin: Spacing.base, padding: Spacing.base, backgroundColor: Colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  chartTitle: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: 12 },
  chartContainer: { height: 60 },
  chart: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { flex: 1, borderRadius: 2 },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700', paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: 8 },
  actionsGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.base },
  actionCard: { flex: 1, alignItems: 'center', gap: 6, padding: 14, backgroundColor: Colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  topContent: { marginHorizontal: Spacing.base, backgroundColor: Colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  topContentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  topRank: { color: Colors.primary, fontSize: Typography.sizes.md, fontWeight: '800', width: 24 },
  topThumb: { width: 48, height: 48, borderRadius: 8 },
  topInfo: { flex: 1 },
  topCaption: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  topViews: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
});
