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
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingRow({ icon, iconColor = Colors.primary, label, sublabel, onPress, value, isSwitch, isDestructive, isLast }) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={!isSwitch ? onPress : undefined}
      disabled={isSwitch}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor || Colors.primary) + '20' }]}>
        <Ionicons name={icon} size={18} color={iconColor || Colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, isDestructive && styles.rowLabelDestructive]}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {isSwitch ? (
        <Switch value={value} onValueChange={onPress} trackColor={{ true: Colors.primary, false: Colors.surface }} thumbColor="#fff" />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);
  const [dataReduction, setDataReduction] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { try { logout(); } catch(_) {} navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This is permanent and cannot be undone. All your data, posts, and earnings will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Profile */}
        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('EditProfile')}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{(user?.displayName || user?.username || 'U')[0].toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'Your Name'}</Text>
            <Text style={styles.profileUsername}>@{user?.username || 'username'} · {user?.email || 'email'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <Section title="Account">
          <SettingRow icon="person-outline" label="Edit Profile" sublabel="Name, bio, links, games" onPress={() => navigation.navigate('EditProfile')} />
          <SettingRow icon="shield-outline" iconColor={Colors.accent} label="Security" sublabel="Password, 2FA, sessions" onPress={() => navigation.navigate('Security')} />
          <SettingRow icon="lock-closed-outline" iconColor={Colors.warning} label="Privacy" sublabel="Who can see your content" onPress={() => navigation.navigate('Privacy')} />
          <SettingRow icon="notifications-outline" iconColor={Colors.success} label="Notifications" sublabel="Push, email, in-app" onPress={() => navigation.navigate('NotificationPrefs')} isLast />
        </Section>

        <Section title="Creator">
          <SettingRow icon="cash-outline" iconColor={Colors.accentAlt} label="Monetization" sublabel="Earnings, subscriptions, Stripe" onPress={() => navigation.navigate('Monetization')} />
          <SettingRow icon="analytics-outline" iconColor={Colors.primary} label="Analytics" sublabel="Views, growth, revenue" onPress={() => navigation.navigate('Analytics')} />
          <SettingRow icon="download-outline" iconColor={Colors.accent} label="Import Content" sublabel="Bring clips from TikTok, YouTube..." onPress={() => navigation.navigate('Import')} isLast />
        </Section>

        <Section title="Appearance & Data">
          <SettingRow icon="moon-outline" label="Dark Mode" isSwitch value={darkMode} onPress={setDarkMode} />
          <SettingRow icon="cellular-outline" iconColor={Colors.warning} label="Data Saver" sublabel="Reduce video quality on mobile data" isSwitch value={dataReduction} onPress={setDataReduction} isLast />
        </Section>

        <Section title="Support">
          <SettingRow icon="help-circle-outline" iconColor={Colors.accent} label="Help Center" onPress={() => {}} />
          <SettingRow icon="chatbox-outline" label="Contact Support" onPress={() => {}} />
          <SettingRow icon="information-circle-outline" iconColor={Colors.textMuted} label="About VENTURE" sublabel="Version 1.0.0 · DivineDemonGaming Inc." onPress={() => navigation.navigate('About')} isLast />
        </Section>

        <Section title="Legal">
          <SettingRow icon="document-text-outline" iconColor={Colors.textMuted} label="Terms of Service" onPress={() => {}} />
          <SettingRow icon="eye-outline" iconColor={Colors.textMuted} label="Privacy Policy" onPress={() => {}} />
          <SettingRow icon="code-slash-outline" iconColor={Colors.textMuted} label="Licenses" onPress={() => {}} isLast />
        </Section>

        {/* Danger zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>VENTURE Creator Platform v1.0.0{'\n'}© 2024 DivineDemonGaming Inc.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '700' },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: Spacing.base, padding: Spacing.base, backgroundColor: Colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: '#fff', fontSize: Typography.sizes.xl, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  profileUsername: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  section: { marginHorizontal: Spacing.base, marginBottom: Spacing.base },
  sectionTitle: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 4 },
  sectionCard: { backgroundColor: Colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.base, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  rowLabelDestructive: { color: Colors.danger },
  rowSublabel: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 1 },
  dangerSection: { marginHorizontal: Spacing.base, marginTop: Spacing.sm, gap: 10 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.danger },
  logoutText: { color: Colors.danger, fontSize: Typography.sizes.md, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: 8 },
  deleteText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textDecorationLine: 'underline' },
  versionText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center', marginTop: Spacing.xl, lineHeight: 18 },
});
