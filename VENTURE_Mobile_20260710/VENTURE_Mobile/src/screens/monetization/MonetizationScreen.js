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
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import VentureButton from '../../components/common/VentureButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { monetizationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const PLATFORM_FEE = 0.15;

export default function MonetizationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [becomingCreator, setBecomingCreator] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.isCreator) { setLoading(false); return; }
      try {
        const [profileRes, tiersRes] = await Promise.all([
          monetizationAPI.getCreatorProfile(),
          monetizationAPI.getTiers(user.id)
        ]);
        setProfile(profileRes.data);
        setTiers(tiersRes.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const handleBecomeCreator = async () => {
    Alert.alert(
      'Become a Creator',
      'Unlock monetization, subscriptions, tips, and creator analytics. You keep 85% of all earnings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate Creator Mode',
          onPress: async () => {
            setBecomingCreator(true);
            try {
              await monetizationAPI.becomeCreator({ tagline: `Welcome to ${user?.displayName}'s page` });
              updateUser({ isCreator: true, accountType: 'CREATOR' });
              const profileRes = await monetizationAPI.getCreatorProfile();
              setProfile(profileRes.data);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to activate creator mode');
            } finally { setBecomingCreator(false); }
          }
        }
      ]
    );
  };

  const handleStripeConnect = async () => {
    try {
      const { data } = await monetizationAPI.stripeConnect();
      await WebBrowser.openBrowserAsync(data.url);
      // Re-verify after returning from browser
      const verifyRes = await monetizationAPI.stripeVerify();
      if (verifyRes.data.onboarded) {
        const profileRes = await monetizationAPI.getCreatorProfile();
        setProfile(profileRes.data);
        Alert.alert('Payment Setup Complete', 'You can now receive payouts directly to your bank account!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to connect payment account');
    }
  };

  if (loading) return (
    <View style={[styles.container, styles.loader]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  if (!user?.isCreator) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <LinearGradient colors={['rgba(124,58,237,0.2)', 'transparent']} style={styles.heroBg}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.heroIcon}>
              <MaterialCommunityIcons name="currency-usd" size={48} color="#FFF" />
            </LinearGradient>
            <Text style={styles.heroTitle}>Creator Monetization</Text>
            <Text style={styles.heroSubtitle}>Turn your passion into income. VENTURE gives creators the most creator-friendly revenue split in the industry.</Text>
          </LinearGradient>

          <View style={styles.splitDisplay}>
            <View style={styles.splitItem}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.splitCircle}>
                <Text style={styles.splitPercent}>85%</Text>
              </LinearGradient>
              <Text style={styles.splitLabel}>You Keep</Text>
              <Text style={styles.splitDesc}>Every subscription, tip, and superchat</Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitItem}>
              <View style={[styles.splitCircle, styles.splitCircleDark]}>
                <Text style={[styles.splitPercent, { color: Colors.textMuted }]}>15%</Text>
              </View>
              <Text style={styles.splitLabel}>Platform Fee</Text>
              <Text style={styles.splitDesc}>Keeps VENTURE running — servers, features, support</Text>
            </View>
          </View>

          <View style={styles.features}>
            {[
              { icon: 'card', title: 'Subscription Tiers', desc: 'Create multiple membership tiers with exclusive perks and content' },
              { icon: 'heart', title: 'Tips & Donations', desc: 'Fans can tip you directly with personal messages' },
              { icon: 'radio', title: 'Live Superchats', desc: 'Highlighted messages during live streams with instant payouts' },
              { icon: 'bag-handle', title: 'Digital Products', desc: 'Sell presets, tutorials, exclusive content, and merch' },
              { icon: 'analytics', title: 'Creator Analytics', desc: 'Deep insights on earnings, audience, and content performance' },
              { icon: 'wallet', title: 'Fast Payouts', desc: 'Request payouts anytime. Funds arrive in 2-3 business days' },
            ].map(f => (
              <View key={f.title} style={styles.feature}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={20} color="#FFF" />
                </LinearGradient>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <VentureButton
            title={becomingCreator ? 'Activating...' : 'Activate Creator Mode — Free'}
            onPress={handleBecomeCreator}
            loading={becomingCreator}
            fullWidth size="lg"
            style={styles.activateBtn}
          />
          <Text style={styles.freeNote}>No monthly fees. No minimum subscribers. Start earning immediately.</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monetization</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Earnings')}>
          <Text style={styles.headerAction}>Earnings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Payment Setup */}
        {!profile?.stripeOnboarded && (
          <View style={styles.setupBanner}>
            <LinearGradient colors={['rgba(245,158,11,0.15)', 'transparent']} style={styles.setupBannerGradient}>
              <Ionicons name="warning" size={24} color={Colors.accentAlt} />
              <View style={styles.setupBannerText}>
                <Text style={styles.setupBannerTitle}>Set Up Payments to Get Paid</Text>
                <Text style={styles.setupBannerDesc}>Connect your bank account via Stripe to start receiving payouts</Text>
              </View>
            </LinearGradient>
            <VentureButton title="Connect Payment Account" onPress={handleStripeConnect} variant="accent" fullWidth />
          </View>
        )}

        {/* Earnings Summary */}
        <View style={styles.earningsCard}>
          <LinearGradient colors={['rgba(124,58,237,0.2)', 'rgba(124,58,237,0.05)']} style={styles.earningsGradient}>
            <Text style={styles.earningsTitle}>Total Earned</Text>
            <Text style={styles.earningsAmount}>${(profile?.totalEarned || 0).toFixed(2)}</Text>
            <View style={styles.earningsRow}>
              <View style={styles.earningsStat}>
                <Text style={styles.earningsStatLabel}>Pending Payout</Text>
                <Text style={styles.earningsStatValue}>${(profile?.pendingPayout || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.earningsDivider} />
              <View style={styles.earningsStat}>
                <Text style={styles.earningsStatLabel}>Paid Out</Text>
                <Text style={styles.earningsStatValue}>${(profile?.totalPaidOut || 0).toFixed(2)}</Text>
              </View>
            </View>
            {profile?.pendingPayout >= 25 && (
              <VentureButton title="Request Payout" variant="outline" size="sm" onPress={() => monetizationAPI.requestPayout().then(() => Alert.alert('Payout Initiated', 'Funds will arrive in 2-3 business days!'))} style={styles.payoutBtn} />
            )}
          </LinearGradient>
        </View>

        {/* Subscription Tiers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Subscription Tiers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreateTier')}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.addTierBtn}>
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.addTierText}>Add Tier</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {tiers.length === 0 ? (
            <View style={styles.emptyTiers}>
              <Ionicons name="layers-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTiersText}>No subscription tiers yet</Text>
              <Text style={styles.emptyTiersDesc}>Create tiers to offer exclusive content and perks to your supporters</Text>
            </View>
          ) : (
            tiers.map(tier => (
              <View key={tier.id} style={[styles.tierCard, { borderLeftColor: tier.color || Colors.primary }]}>
                <View style={styles.tierHeader}>
                  <View style={[styles.tierColorDot, { backgroundColor: tier.color }]} />
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierPrice}>${tier.price}/{tier.interval}</Text>
                </View>
                {tier.description && <Text style={styles.tierDesc}>{tier.description}</Text>}
                <View style={styles.tierPerks}>
                  {(tier.perks || []).map((p, i) => (
                    <View key={i} style={styles.tierPerk}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={styles.tierPerkText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Monetization Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earn More</Text>
          <View style={styles.earnOptions}>
            {[
              { icon: 'heart', label: 'Enable Tips', desc: 'Fans can tip you anytime', enabled: true },
              { icon: 'radio', label: 'Live Superchats', desc: 'Highlighted messages during streams', enabled: true },
              { icon: 'star', label: 'Exclusive Posts', desc: 'Subscriber-only content', enabled: false },
            ].map(opt => (
              <TouchableOpacity key={opt.label} style={styles.earnOption}>
                <View style={styles.earnOptionLeft}>
                  <Ionicons name={opt.icon} size={20} color={opt.enabled ? Colors.success : Colors.textMuted} />
                  <View>
                    <Text style={styles.earnOptionLabel}>{opt.label}</Text>
                    <Text style={styles.earnOptionDesc}>{opt.desc}</Text>
                  </View>
                </View>
                <Ionicons name={opt.enabled ? 'toggle' : 'toggle-outline'} size={28} color={opt.enabled ? Colors.primary : Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
  backBtn: { marginTop: Spacing.base, width: 44, height: 44, justifyContent: 'center' },
  heroBg: { alignItems: 'center', padding: Spacing['2xl'], borderRadius: BorderRadius.xl, marginBottom: Spacing.xl },
  heroIcon: { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  heroTitle: { color: Colors.textPrimary, fontSize: Typography.sizes['3xl'], fontWeight: Typography.weights.black, textAlign: 'center', marginBottom: Spacing.sm },
  heroSubtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.md, textAlign: 'center', lineHeight: 24 },
  splitDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing['2xl'] },
  splitItem: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  splitCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  splitCircleDark: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border },
  splitPercent: { color: '#FFF', fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.black },
  splitLabel: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  splitDesc: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center' },
  splitDivider: { width: 1, height: 80, backgroundColor: Colors.border },
  features: { gap: Spacing.md, marginBottom: Spacing['2xl'] },
  feature: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.md },
  featureIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1 },
  featureTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '600' },
  featureDesc: { color: Colors.textMuted, fontSize: Typography.sizes.sm, marginTop: 2 },
  activateBtn: { marginBottom: Spacing.sm },
  freeNote: { color: Colors.textMuted, fontSize: Typography.sizes.sm, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  headerAction: { color: Colors.primary, fontSize: Typography.sizes.md, fontWeight: '600' },
  setupBanner: { margin: Spacing.base, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.accentAlt + '40' },
  setupBannerGradient: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md, marginBottom: Spacing.md },
  setupBannerText: { flex: 1 },
  setupBannerTitle: { color: Colors.accentAlt, fontSize: Typography.sizes.md, fontWeight: '700' },
  setupBannerDesc: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  earningsCard: { margin: Spacing.base, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.primary + '30' },
  earningsGradient: { padding: Spacing.xl },
  earningsTitle: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.xs },
  earningsAmount: { color: Colors.textPrimary, fontSize: Typography.sizes['4xl'], fontWeight: Typography.weights.black, marginBottom: Spacing.lg },
  earningsRow: { flexDirection: 'row', alignItems: 'center' },
  earningsStat: { flex: 1 },
  earningsStatLabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  earningsStatValue: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700' },
  earningsDivider: { width: 1, height: 36, backgroundColor: Colors.border, marginHorizontal: Spacing.base },
  payoutBtn: { marginTop: Spacing.base },
  section: { padding: Spacing.base, marginBottom: Spacing.base },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.base },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  addTierBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  addTierText: { color: '#FFF', fontSize: Typography.sizes.sm, fontWeight: '600' },
  emptyTiers: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyTiersText: { color: Colors.textSecondary, fontSize: Typography.sizes.md, fontWeight: '600', marginTop: Spacing.sm },
  emptyTiersDesc: { color: Colors.textMuted, fontSize: Typography.sizes.sm, textAlign: 'center', marginTop: 4 },
  tierCard: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderLeftWidth: 3 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  tierColorDot: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.sm },
  tierName: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  tierPrice: { color: Colors.primary, fontSize: Typography.sizes.md, fontWeight: '700' },
  tierDesc: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, marginBottom: Spacing.sm },
  tierPerks: { gap: 4 },
  tierPerk: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tierPerkText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  earnOptions: { gap: Spacing.sm },
  earnOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.base },
  earnOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  earnOptionLabel: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '600' },
  earnOptionDesc: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
});
