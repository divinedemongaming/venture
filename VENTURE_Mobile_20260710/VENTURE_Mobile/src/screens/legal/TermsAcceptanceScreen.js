/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Animated,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../theme';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, LEGAL_VERSIONS, AGE_GROUPS } from '../../constants/legal';
import { useAuthStore } from '../../store/authStore';

const TEEN_NOTICE = `NOTICE FOR TEENS (AGES 13–17)

Because you are under 18, your account will have these protections applied automatically:

• Direct messages limited to mutual followers only
• Adult or explicit content is never shown
• Your profile is private by default
• Payment features are restricted until you turn 18
• Your data is never used for targeted advertising
• Your account does not appear in external search engines

These settings cannot be disabled until you turn 18.`;

export default function TermsAcceptanceScreen({ navigation, route }) {
  const { ageGroup } = route.params || { ageGroup: AGE_GROUPS.ADULT };
  const isTeen = ageGroup === AGE_GROUPS.TEEN;
  const { setLegalAccepted } = useAuthStore();

  const [activeTab, setActiveTab] = useState('terms'); // 'terms' | 'privacy' | (teen: 'teen')
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTeen, setAgreedTeen] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState({ terms: false, privacy: false, teen: false });
  const scrollRef = useRef(null);

  const tabs = isTeen
    ? [['terms', 'Terms'], ['privacy', 'Privacy'], ['teen', 'Teen Safety']]
    : [['terms', 'Terms of Service'], ['privacy', 'Privacy Policy']];

  const handleScroll = (e) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (nearBottom) {
      setScrolledToBottom(prev => ({ ...prev, [activeTab]: true }));
    }
  };

  const canAgreeTerms = scrolledToBottom.terms;
  const canAgreePrivacy = scrolledToBottom.privacy;
  const canAgreeTeen = !isTeen || scrolledToBottom.teen;

  const allAgreed = agreedTerms && agreedPrivacy && (!isTeen || agreedTeen);

  const handleAccept = async () => {
    if (!allAgreed) return;

    const timestamp = new Date().toISOString();
    await SecureStore.setItemAsync('venture_terms_version', LEGAL_VERSIONS.terms);
    await SecureStore.setItemAsync('venture_privacy_version', LEGAL_VERSIONS.privacy);
    await SecureStore.setItemAsync('venture_consent_timestamp', timestamp);

    // Update store — navigator will automatically show the auth gate
    await setLegalAccepted(ageGroup);
  };

  const content = activeTab === 'terms' ? TERMS_OF_SERVICE
    : activeTab === 'privacy' ? PRIVACY_POLICY
    : TEEN_NOTICE;

  const Checkbox = ({ checked, disabled, onPress, label }) => (
    <TouchableOpacity
      style={[styles.checkRow, disabled && styles.checkRowDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.checkLabel, disabled && styles.checkLabelDisabled]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}><Text style={styles.logoText}>V</Text></View>
        <Text style={styles.title}>Before you join</Text>
        <Text style={styles.subtitle}>Please read and agree to our policies to continue.</Text>
      </View>

      {/* Teen notice banner */}
      {isTeen && (
        <View style={styles.teenBanner}>
          <Text style={styles.teenBannerText}>🛡 Teen Account — Extra protections are enabled for your safety</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => { setActiveTab(key); scrollRef.current?.scrollTo({ y: 0 }); }} style={[styles.tab, activeTab === key && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.contentText}>{content}</Text>
        <View style={styles.scrollEndIndicator}>
          <Text style={styles.scrollEndText}>— End —</Text>
        </View>
      </ScrollView>

      {/* Scroll hint */}
      {!scrolledToBottom[activeTab] && (
        <Text style={styles.scrollHint}>↓ Scroll to the bottom to agree</Text>
      )}

      {/* Checkboxes */}
      <View style={styles.agreements}>
        <Checkbox
          checked={agreedTerms}
          disabled={!canAgreeTerms}
          onPress={() => setAgreedTerms(!agreedTerms)}
          label="I have read and agree to the Terms of Service"
        />
        <Checkbox
          checked={agreedPrivacy}
          disabled={!canAgreePrivacy}
          onPress={() => setAgreedPrivacy(!agreedPrivacy)}
          label="I have read and agree to the Privacy Policy"
        />
        {isTeen && (
          <Checkbox
            checked={agreedTeen}
            disabled={!canAgreeTeen}
            onPress={() => setAgreedTeen(!agreedTeen)}
            label="I understand and accept the Teen Safety restrictions"
          />
        )}
      </View>

      {/* Accept button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !allAgreed && styles.btnDisabled]}
          onPress={handleAccept}
          disabled={!allAgreed}
        >
          <Text style={styles.btnText}>I Agree — Create My Account</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          By agreeing you confirm you are at least 13 years old and accept these terms.
          {'\n'}© 2024 DivineDemonGaming Inc. All Rights Reserved.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  logo: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  teenBanner: { marginHorizontal: 16, marginBottom: 8, backgroundColor: `${Colors.accent}15`, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: `${Colors.accent}40` },
  teenBannerText: { color: Colors.accent, fontSize: 12, textAlign: 'center', fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  content: { flex: 1, marginHorizontal: 16, marginTop: 8 },
  contentText: { color: Colors.textMuted, fontSize: 12, lineHeight: 20, fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace' },
  scrollEndIndicator: { paddingVertical: 24, alignItems: 'center' },
  scrollEndText: { color: Colors.textDim, fontSize: 12 },
  scrollHint: { color: Colors.textDim, fontSize: 12, textAlign: 'center', paddingVertical: 6 },
  agreements: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  checkRowDisabled: { opacity: 0.4 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  checkLabel: { color: Colors.text, fontSize: 13, flex: 1, lineHeight: 18 },
  checkLabelDisabled: { color: Colors.textDim },
  footer: { padding: 20, paddingTop: 12 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footerNote: { color: Colors.textDim, fontSize: 10, textAlign: 'center', lineHeight: 14 },
});
