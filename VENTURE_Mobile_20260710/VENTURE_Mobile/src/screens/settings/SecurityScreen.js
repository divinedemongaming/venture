/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
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

const MOCK_SESSIONS = [
  { id: 's1', device: 'iPhone 14 Pro', location: 'Los Angeles, CA', lastActive: 'Active now', isCurrent: true },
  { id: 's2', device: 'MacBook Pro', location: 'Los Angeles, CA', lastActive: '2 hours ago', isCurrent: false },
  { id: 's3', device: 'iPad Air', location: 'Phoenix, AZ', lastActive: '5 days ago', isCurrent: false },
];

export default function SecurityScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [twoFA, setTwoFA] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const revokeSession = (id) => {
    Alert.alert('Revoke Session', 'This will log out that device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => setSessions(prev => prev.filter(s => s.id !== id)) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Password */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: Colors.primary + '20' }]}><Ionicons name="key-outline" size={18} color={Colors.primary} /></View>
              <View style={styles.rowContent}><Text style={styles.rowLabel}>Change Password</Text><Text style={styles.rowSub}>Last changed: never</Text></View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2FA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: Colors.accent + '20' }]}><Ionicons name="phone-portrait-outline" size={18} color={Colors.accent} /></View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Authenticator App</Text>
                <Text style={styles.rowSub}>{twoFA ? '✓ Enabled' : 'Not configured'}</Text>
              </View>
              <Switch value={twoFA} onValueChange={setTwoFA} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
            </View>
            <View style={[styles.row, styles.rowBorderTop]}>
              <View style={[styles.rowIcon, { backgroundColor: Colors.success + '20' }]}><Ionicons name="mail-outline" size={18} color={Colors.success} /></View>
              <View style={styles.rowContent}><Text style={styles.rowLabel}>Login Alerts via Email</Text></View>
              <Switch value={loginAlerts} onValueChange={setLoginAlerts} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        {/* Active sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Sessions</Text>
            <TouchableOpacity onPress={() => setSessions([sessions[0]])}>
              <Text style={styles.revokeAll}>Revoke all others</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {sessions.map((s, i) => (
              <View key={s.id} style={[styles.sessionRow, i > 0 && styles.rowBorderTop]}>
                <View style={[styles.rowIcon, { backgroundColor: s.isCurrent ? Colors.success + '20' : Colors.surface }]}>
                  <Ionicons name={s.device.includes('Mac') ? 'laptop-outline' : s.device.includes('iPad') ? 'tablet-portrait-outline' : 'phone-portrait-outline'} size={18} color={s.isCurrent ? Colors.success : Colors.textMuted} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>{s.device} {s.isCurrent && <Text style={styles.currentTag}>(this device)</Text>}</Text>
                  <Text style={styles.rowSub}>{s.location} · {s.lastActive}</Text>
                </View>
                {!s.isCurrent && (
                  <TouchableOpacity onPress={() => revokeSession(s.id)} style={styles.revokeBtn}>
                    <Text style={styles.revokeBtnText}>Revoke</Text>
                  </TouchableOpacity>
                )}
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sectionTitle: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 2 },
  card: { backgroundColor: Colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.base, paddingVertical: 13 },
  rowBorderTop: { borderTopWidth: 0.5, borderTopColor: Colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  rowSub: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 1 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.base, paddingVertical: 13 },
  currentTag: { color: Colors.success, fontWeight: '600' },
  revokeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: Colors.danger },
  revokeBtnText: { color: Colors.danger, fontSize: Typography.sizes.xs, fontWeight: '600' },
  revokeAll: { color: Colors.danger, fontSize: Typography.sizes.xs },
});
