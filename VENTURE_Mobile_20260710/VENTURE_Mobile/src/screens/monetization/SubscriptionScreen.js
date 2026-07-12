/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';

const TIERS = [
  { id: 'tier1', name: 'Fan', price: 4.99, color: Colors.accent, perks: ['Ad-free viewing', 'Fan badge', 'Exclusive emotes', 'Priority chat'] },
  { id: 'tier2', name: 'Supporter', price: 9.99, color: Colors.primary, perks: ['All Fan perks', 'Supporter badge', 'Exclusive posts', 'Discord access', 'Monthly shoutout'] },
  { id: 'tier3', name: 'VIP', price: 24.99, color: Colors.accentAlt, perks: ['All Supporter perks', 'VIP badge', '1-on-1 game session/month', 'Early access content', 'Name in stream credits'] },
];

export default function SubscriptionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { creatorId, creatorName } = route?.params || {};
  const [selected, setSelected] = useState('tier2');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    const tier = TIERS.find(t => t.id === selected);
    setLoading(true);
    try {
      await api.post('/monetization/subscribe', { creatorId, tierId: selected, priceId: tier?.priceId });
      navigation.goBack();
    } catch (_) { setLoading(false); }
  };

  const selTier = TIERS.find(t => t.id === selected);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Subscribe{creatorName ? ` to @${creatorName}` : ''}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <Text style={styles.intro}>Choose a tier to unlock exclusive content and support this creator.</Text>
        {TIERS.map(tier => (
          <TouchableOpacity key={tier.id} style={[styles.tierCard, selected === tier.id && { borderColor: tier.color }]} onPress={() => setSelected(tier.id)}>
            {selected === tier.id && <LinearGradient colors={[tier.color + '15', 'transparent']} style={StyleSheet.absoluteFill} />}
            <View style={styles.tierHeader}>
              <View style={styles.tierNameRow}>
                <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                <Text style={styles.tierName}>{tier.name}</Text>
              </View>
              <Text style={[styles.tierPrice, { color: tier.color }]}>${tier.price}<Text style={styles.tierPriceSub}>/mo</Text></Text>
            </View>
            {tier.perks.map(perk => (
              <View key={perk} style={styles.perkRow}>
                <Ionicons name="checkmark" size={14} color={tier.color} />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
            {selected === tier.id && (
              <View style={[styles.selectedBadge, { backgroundColor: tier.color }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.subBtn, { backgroundColor: selTier?.color || Colors.primary }]} onPress={handleSubscribe} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.subBtnText}>Subscribe · ${selTier?.price}/month</Text>}
        </TouchableOpacity>
        <Text style={styles.footerNote}>Cancel anytime · Secure payment via Stripe · 85% to creator</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  intro: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.base },
  tierCard: { marginHorizontal: Spacing.base, marginBottom: 12, padding: Spacing.base, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, overflow: 'hidden', position: 'relative' },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  tierNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  tierName: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '800' },
  tierPrice: { fontSize: Typography.sizes['2xl'], fontWeight: '900' },
  tierPriceSub: { fontSize: Typography.sizes.sm, fontWeight: '400', color: Colors.textSecondary },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  perkText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  selectedBadge: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8, backgroundColor: Colors.background },
  subBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  subBtnText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '800' },
  footerNote: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center' },
});
