/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';

const PREFS = [
  { key: 'likes', label: 'Likes', sublabel: 'When someone likes your posts', icon: 'heart-outline', color: Colors.danger, default: true },
  { key: 'comments', label: 'Comments', sublabel: 'New comments on your content', icon: 'chatbubble-outline', color: Colors.accent, default: true },
  { key: 'follows', label: 'New Followers', sublabel: 'When someone follows you', icon: 'person-add-outline', color: Colors.success, default: true },
  { key: 'messages', label: 'Direct Messages', sublabel: 'New DMs', icon: 'mail-outline', color: Colors.primary, default: true },
  { key: 'subs', label: 'New Subscribers', sublabel: 'Subscriber notifications', icon: 'star-outline', color: Colors.accentAlt, default: true },
  { key: 'tips', label: 'Tips & Super Chats', sublabel: 'When someone tips you', icon: 'cash-outline', color: Colors.accentAlt, default: true },
  { key: 'live', label: 'Creator Going Live', sublabel: 'Creators you follow go live', icon: 'radio-outline', color: Colors.danger, default: false },
  { key: 'mentions', label: 'Mentions', sublabel: 'When tagged or mentioned', icon: 'at-outline', color: Colors.primary, default: true },
  { key: 'community', label: 'Community Chat', sublabel: 'Activity in your rooms', icon: 'people-outline', color: Colors.accent, default: false },
  { key: 'promotions', label: 'Promotions & Updates', sublabel: 'VENTURE announcements', icon: 'megaphone-outline', color: Colors.textMuted, default: false },
];

export default function NotificationPrefsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState(() => Object.fromEntries(PREFS.map(p => [p.key, p.default])));
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channels</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: Colors.primary + '20' }]}><Ionicons name="notifications-outline" size={17} color={Colors.primary} /></View>
              <View style={styles.rowContent}><Text style={styles.label}>Push Notifications</Text></View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
            </View>
            <View style={[styles.row, styles.rowBorder]}>
              <View style={[styles.icon, { backgroundColor: Colors.accent + '20' }]}><Ionicons name="mail-outline" size={17} color={Colors.accent} /></View>
              <View style={styles.rowContent}><Text style={styles.label}>Email Notifications</Text></View>
              <Switch value={emailNotifs} onValueChange={setEmailNotifs} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.card}>
            {PREFS.map((p, i) => (
              <View key={p.key} style={[styles.row, i < PREFS.length - 1 && styles.rowBorder]}>
                <View style={[styles.icon, { backgroundColor: p.color + '20' }]}><Ionicons name={p.icon} size={17} color={p.color} /></View>
                <View style={styles.rowContent}>
                  <Text style={styles.label}>{p.label}</Text>
                  <Text style={styles.sub}>{p.sublabel}</Text>
                </View>
                <Switch value={prefs[p.key]} onValueChange={() => toggle(p.key)} trackColor={{ true: Colors.primary }} thumbColor="#fff" disabled={!pushEnabled} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '700' },
  section: { marginHorizontal: Spacing.base, marginTop: Spacing.base },
  sectionTitle: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 2 },
  card: { backgroundColor: Colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.base, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 0.5, borderTopColor: Colors.border },
  icon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  label: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  sub: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 1 },
});
