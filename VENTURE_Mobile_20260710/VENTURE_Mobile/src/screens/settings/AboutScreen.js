/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * ============================================================
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { OWNERSHIP } from '../../utils/watermark';

export default function AboutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version || '1.0.0';

  const OWNERSHIP_HASH = 'a3f8d2c1e9b74056f1a2d3e4c5b6a7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4';

  const handleCopyHash = async () => {
    await Clipboard.setStringAsync(OWNERSHIP_HASH);
    Alert.alert('Copied', 'Ownership hash copied to clipboard.');
  };

  const LINKS = [
    { label: 'Terms of Service',      url: 'https://venture.divinedemongaming.com/terms',   icon: 'document-text-outline' },
    { label: 'Privacy Policy',        url: 'https://venture.divinedemongaming.com/privacy', icon: 'shield-checkmark-outline' },
    { label: 'DMCA / IP Policy',      url: 'https://venture.divinedemongaming.com/dmca',    icon: 'alert-circle-outline' },
    { label: 'Contact Legal',         url: 'mailto:legal@divinedemongaming.com',             icon: 'mail-outline' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About VENTURE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero Logo */}
        <View style={styles.hero}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.logoBox}>
            <MaterialCommunityIcons name="lightning-bolt" size={48} color="#FFF" />
          </LinearGradient>
          <Text style={styles.appName}>VENTURE</Text>
          <Text style={styles.appTagline}>Creator Platform</Text>
          <Text style={styles.appVersion}>Version {version}</Text>
        </View>

        {/* Ownership Certificate */}
        <View style={styles.ownershipCard}>
          <LinearGradient
            colors={['rgba(124,58,237,0.2)', 'rgba(124,58,237,0.05)']}
            style={styles.ownershipGradient}
          >
            <View style={styles.ownershipHeader}>
              <LinearGradient colors={Colors.gradientGold} style={styles.sealIcon}>
                <MaterialCommunityIcons name="seal" size={22} color="#FFF" />
              </LinearGradient>
              <View>
                <Text style={styles.ownershipTitle}>Official Ownership Certificate</Text>
                <Text style={styles.ownershipSubtitle}>Digitally verified intellectual property</Text>
              </View>
            </View>

            <View style={styles.ownershipRows}>
              {[
                { label: 'Owner',    value: OWNERSHIP.owner },
                { label: 'Product',  value: OWNERSHIP.product },
                { label: 'Year',     value: '2024' },
                { label: 'Contact',  value: OWNERSHIP.contact },
              ].map(row => (
                <View key={row.label} style={styles.ownershipRow}>
                  <Text style={styles.ownershipLabel}>{row.label}</Text>
                  <Text style={styles.ownershipValue}>{row.value}</Text>
                </View>
              ))}
            </View>

            {/* Ownership hash */}
            <TouchableOpacity style={styles.hashContainer} onPress={handleCopyHash} activeOpacity={0.7}>
              <View style={styles.hashHeader}>
                <Ionicons name="finger-print-outline" size={14} color={Colors.accent} />
                <Text style={styles.hashLabel}>Ownership Hash (tap to copy)</Text>
              </View>
              <Text style={styles.hashValue} numberOfLines={2}>{OWNERSHIP_HASH}</Text>
            </TouchableOpacity>

            <View style={styles.copyrightBanner}>
              <Text style={styles.copyrightText}>{OWNERSHIP.copyright}</Text>
              <Text style={styles.copyrightStatement}>
                This software is the exclusive intellectual property of DivineDemonGaming Inc.
                Unauthorized copying, distribution, or modification is strictly prohibited.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Legal Links */}
        <Text style={styles.sectionTitle}>Legal</Text>
        {LINKS.map(link => (
          <TouchableOpacity
            key={link.label}
            style={styles.linkRow}
            onPress={() => Linking.openURL(link.url)}
          >
            <View style={styles.linkIcon}>
              <Ionicons name={link.icon} size={18} color={Colors.primary} />
            </View>
            <Text style={styles.linkLabel}>{link.label}</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* All rights reserved footer */}
        <View style={styles.footer}>
          <MaterialCommunityIcons name="lightning-bolt" size={16} color={Colors.primary} />
          <Text style={styles.footerText}>
            VENTURE is a product of DivineDemonGaming Inc.{'\n'}
            All rights reserved worldwide. {'\n'}
            {OWNERSHIP.copyright}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '700' },
  scroll: { padding: Spacing.base, paddingBottom: 60 },
  hero: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  logoBox: { width: 90, height: 90, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  appName: { color: Colors.textPrimary, fontSize: Typography.sizes['4xl'], fontWeight: '900', letterSpacing: 4 },
  appTagline: { color: Colors.primary, fontSize: Typography.sizes.md, fontWeight: '600', letterSpacing: 2, marginTop: 4 },
  appVersion: { color: Colors.textMuted, fontSize: Typography.sizes.sm, marginTop: Spacing.sm },
  ownershipCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.xl, borderWidth: 1.5, borderColor: Colors.primary + '40' },
  ownershipGradient: { padding: Spacing.xl },
  ownershipHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  sealIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ownershipTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '800' },
  ownershipSubtitle: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  ownershipRows: { gap: Spacing.sm, marginBottom: Spacing.lg },
  ownershipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ownershipLabel: { color: Colors.textMuted, fontSize: Typography.sizes.sm, fontWeight: '600' },
  ownershipValue: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '700', flex: 1, textAlign: 'right' },
  hashContainer: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.accent + '30' },
  hashHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  hashLabel: { color: Colors.accent, fontSize: Typography.sizes.xs, fontWeight: '700' },
  hashValue: { color: Colors.textMuted, fontSize: 10, fontFamily: 'monospace', letterSpacing: 0.5 },
  copyrightBanner: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: BorderRadius.md, padding: Spacing.md },
  copyrightText: { color: Colors.accentAlt, fontSize: Typography.sizes.sm, fontWeight: '800', marginBottom: Spacing.xs },
  copyrightStatement: { color: Colors.textMuted, fontSize: Typography.sizes.xs, lineHeight: 18 },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700', marginBottom: Spacing.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, gap: Spacing.md },
  linkIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sizes.md },
  footer: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
  footerText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center', lineHeight: 20 },
});
