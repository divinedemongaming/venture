/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';

const TRANSACTIONS = [
  { id: 't1', type: 'subscription', amount: 9.99, net: 8.49, user: 'ClipMaster99', date: new Date(Date.now() - 3600000).toISOString() },
  { id: 't2', type: 'tip', amount: 5.00, net: 4.25, user: 'ProSniper', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 't3', type: 'superchat', amount: 10.00, net: 8.50, user: 'VentureKing', date: new Date(Date.now() - 172800000).toISOString() },
  { id: 't4', type: 'subscription', amount: 4.99, net: 4.24, user: 'EliteFragger', date: new Date(Date.now() - 259200000).toISOString() },
  { id: 't5', type: 'tip', amount: 2.00, net: 1.70, user: 'DarkSoul_GG', date: new Date(Date.now() - 345600000).toISOString() },
];

const TYPE_CONFIG = {
  subscription: { icon: 'star', color: Colors.accentAlt, label: 'Subscription' },
  tip: { icon: 'cash', color: Colors.success, label: 'Tip' },
  superchat: { icon: 'chatbubble', color: Colors.primary, label: 'Super Chat' },
};

export default function EarningsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('month');

  const total = TRANSACTIONS.reduce((s, t) => s + t.net, 0);
  const gross = TRANSACTIONS.reduce((s, t) => s + t.amount, 0);
  const fee = gross - total;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Summary card */}
        <LinearGradient colors={['#3b0764', '#1e1b4b']} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net Earnings · This Month</Text>
          <Text style={styles.summaryAmount}>${total.toFixed(2)}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryDetail}>Gross: ${gross.toFixed(2)}</Text>
            <Text style={styles.summaryDetail}>Platform fee (15%): -${fee.toFixed(2)}</Text>
          </View>
          <Text style={styles.summaryNote}>85% goes to you · Paid via Stripe Connect</Text>
        </LinearGradient>

        {/* Period filter */}
        <View style={styles.periodRow}>
          {['week', 'month', '3months', 'year'].map(p => (
            <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodChipActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p === '3months' ? '90d' : p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {TRANSACTIONS.map(t => {
          const cfg = TYPE_CONFIG[t.type];
          return (
            <View key={t.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: cfg.color + '20' }]}><Ionicons name={cfg.icon} size={18} color={cfg.color} /></View>
              <View style={styles.txInfo}>
                <Text style={styles.txUser}>@{t.user}</Text>
                <Text style={styles.txType}>{cfg.label}</Text>
              </View>
              <View style={styles.txAmounts}>
                <Text style={styles.txNet}>+${t.net.toFixed(2)}</Text>
                <Text style={styles.txGross}>(${t.amount.toFixed(2)} gross)</Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.payoutBtn} onPress={() => {}}>
          <Ionicons name="card-outline" size={18} color="#fff" />
          <Text style={styles.payoutBtnText}>Request Payout via Stripe</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '700' },
  summaryCard: { margin: Spacing.base, borderRadius: 16, padding: 20, gap: 8 },
  summaryLabel: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.sizes.xs, fontWeight: '600' },
  summaryAmount: { color: '#fff', fontSize: 40, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryDetail: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.sizes.xs },
  summaryNote: { color: Colors.accentAlt, fontSize: Typography.sizes.xs, fontWeight: '500' },
  periodRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.base, marginBottom: 4 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  periodChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  periodTextActive: { color: '#fff' },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700', paddingHorizontal: Spacing.base, paddingVertical: 10 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.base, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  txIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txUser: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  txType: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 1 },
  txAmounts: { alignItems: 'flex-end' },
  txNet: { color: Colors.success, fontSize: Typography.sizes.sm, fontWeight: '700' },
  txGross: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  payoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: Spacing.base, marginTop: Spacing.xl, paddingVertical: 14, backgroundColor: Colors.primary, borderRadius: 14 },
  payoutBtnText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '700' },
});
