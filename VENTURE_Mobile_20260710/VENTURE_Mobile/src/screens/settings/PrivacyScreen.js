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

export default function PrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [showSubscriberCount, setShowSubscriberCount] = useState(true);
  const [allowTagging, setAllowTagging] = useState(true);
  const [dmFrom, setDmFrom] = useState('everyone'); // 'everyone' | 'followers' | 'none'

  const SwitchRow = ({ icon, iconColor, label, sublabel, value, onPress, isLast }) => (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.rowIcon, { backgroundColor: (iconColor || Colors.primary) + '20' }]}>
        <Ionicons name={icon} size={17} color={iconColor || Colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel && <Text style={styles.rowSub}>{sublabel}</Text>}
      </View>
      <Switch value={value} onValueChange={onPress} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Visibility</Text>
          <View style={styles.card}>
            <SwitchRow icon="lock-closed-outline" iconColor={Colors.warning} label="Private Account" sublabel="Only approved followers see your content" value={privateAccount} onPress={setPrivateAccount} />
            <SwitchRow icon="time-outline" label="Show Online Status" sublabel="Let others see when you're active" value={showActivity} onPress={setShowActivity} isLast />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactions</Text>
          <View style={styles.card}>
            <SwitchRow icon="chatbubble-outline" iconColor={Colors.accent} label="Allow Comments" sublabel="On your posts and reels" value={allowComments} onPress={setAllowComments} />
            <SwitchRow icon="pricetag-outline" iconColor={Colors.success} label="Allow Tagging" sublabel="Others can tag you in posts" value={allowTagging} onPress={setAllowTagging} isLast />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Direct Messages</Text>
          <View style={styles.card}>
            {['everyone', 'followers', 'none'].map((opt, i) => (
              <TouchableOpacity
                key={opt}
                style={[styles.row, i < 2 && styles.rowBorder]}
                onPress={() => setDmFrom(opt)}
              >
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>{opt === 'everyone' ? 'Everyone' : opt === 'followers' ? 'Followers only' : 'No one'}</Text>
                </View>
                <View style={[styles.radio, dmFrom === opt && styles.radioActive]}>
                  {dmFrom === opt && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creator Stats</Text>
          <View style={styles.card}>
            <SwitchRow icon="people-outline" iconColor={Colors.accentAlt} label="Show Subscriber Count" value={showSubscriberCount} onPress={setShowSubscriberCount} isLast />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocked Accounts</Text>
          <TouchableOpacity style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: Colors.danger + '20' }]}><Ionicons name="ban-outline" size={17} color={Colors.danger} /></View>
              <Text style={styles.rowLabel}>Manage Blocked Users</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.base, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  rowSub: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});
