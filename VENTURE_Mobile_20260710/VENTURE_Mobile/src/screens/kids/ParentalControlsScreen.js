/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * ParentalControlsScreen — PIN-protected parental control panel.
 * Parents can update time limits, content categories, and change their PIN.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Switch, Modal, Platform, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { hashPin } from '../../utils/pinHash';
import { KIDS_CONTENT_CATEGORIES, KIDS_TIME_LIMITS } from '../../constants/legal';

const K = {
  bg: '#0F1420',
  card: '#1A2035',
  orange: '#FF6B35',
  text: '#FFFFFF',
  muted: '#94A3B8',
  dim: '#64748B',
  border: 'rgba(255,255,255,0.08)',
  red: '#FF4D4D',
  green: '#3ECFB0',
};

// PIN hashing is delegated to the shared hashPin utility (SHA-256 via crypto.subtle).

export default function ParentalControlsScreen({ navigation }) {
  const { kidsProfile, updateKidsProfile, exitKidsMode } = useAuthStore();

  // PIN gate
  const [pinGatePassed, setPinGatePassed] = useState(false);
  const [gatePin, setGatePin] = useState('');
  const [gateError, setGateError] = useState('');

  // Settings (mirrors kidsProfile)
  const [dailyLimit, setDailyLimit] = useState(kidsProfile?.dailyLimitMinutes ?? 60);
  const [allowedCategories, setAllowedCategories] = useState(
    kidsProfile?.allowedCategories || Object.keys(KIDS_CONTENT_CATEGORIES)
  );

  // PIN change modal
  const [changePinModal, setChangePinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');

  // Delete profile modal
  const [deleteModal, setDeleteModal] = useState(false);

  const handleGateSubmit = async () => {
    const stored = await SecureStore.getItemAsync('venture_kids_pin');
    const hashed = await hashPin(gatePin);
    if (hashed === stored) {
      setPinGatePassed(true);
      setGateError('');
    } else {
      setGateError('Incorrect PIN.');
      setGatePin('');
    }
  };

  const toggleCategory = (key) => {
    setAllowedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    await updateKidsProfile({ allowedCategories, dailyLimitMinutes: dailyLimit });
    Alert.alert('Saved', 'Parental controls updated successfully.');
    navigation.goBack();
  };

  const handleChangePin = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinChangeError('PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinChangeError('PINs do not match.');
      return;
    }
    const hashedNew = await hashPin(newPin);
    await SecureStore.setItemAsync('venture_kids_pin', hashedNew);
    setChangePinModal(false);
    setNewPin('');
    setConfirmNewPin('');
    setPinChangeError('');
    Alert.alert('PIN Updated', 'Your parental PIN has been changed.');
  };

  const handleDeleteProfile = async () => {
    Alert.alert(
      'Delete Kids Profile',
      `This will permanently delete ${kidsProfile?.childName || "this"}'s VENTURE Kids profile and all settings. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await exitKidsMode();
          },
        },
      ]
    );
  };

  // ─── PIN Gate ───────────────────────────────────
  if (!pinGatePassed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gateContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={K.text} />
          </TouchableOpacity>
          <View style={styles.gateContent}>
            <Text style={styles.gateEmoji}>🔐</Text>
            <Text style={styles.gateTitle}>Parental Controls</Text>
            <Text style={styles.gateSub}>Enter your parent PIN to continue</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="••••"
              placeholderTextColor={K.dim}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={gatePin}
              onChangeText={setGatePin}
              autoFocus
            />
            {!!gateError && <Text style={styles.error}>{gateError}</Text>}
            <TouchableOpacity
              style={[styles.gateBtn, gatePin.length !== 4 && styles.gateBtnDisabled]}
              onPress={handleGateSubmit}
              disabled={gatePin.length !== 4}
            >
              <Text style={styles.gateBtnText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Controls Panel ───────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={K.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parental Controls</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Child Profile Card */}
        <View style={styles.profileRow}>
          <Text style={styles.profileAvatar}>{kidsProfile?.avatar || '🌟'}</Text>
          <View>
            <Text style={styles.profileName}>{kidsProfile?.childName || 'Explorer'}</Text>
            <Text style={styles.profileTag}>VENTURE Kids Account</Text>
          </View>
        </View>

        {/* Daily Time Limit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱ Daily Screen Time Limit</Text>
          <View style={styles.timeLimitRow}>
            {KIDS_TIME_LIMITS.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.timeLimitChip, dailyLimit === t.value && styles.timeLimitChipActive]}
                onPress={() => setDailyLimit(t.value)}
              >
                <Text style={[styles.timeLimitText, dailyLimit === t.value && styles.timeLimitTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Allowed Content</Text>
          <Text style={styles.sectionSub}>Toggle categories your child can browse</Text>
          {Object.entries(KIDS_CONTENT_CATEGORIES).map(([key, label]) => {
            const active = allowedCategories.includes(key);
            return (
              <View key={key} style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <Switch
                  value={active}
                  onValueChange={() => toggleCategory(key)}
                  trackColor={{ false: K.border, true: K.orange + '66' }}
                  thumbColor={active ? K.orange : K.dim}
                />
              </View>
            );
          })}
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Security</Text>

          <TouchableOpacity style={styles.actionRow} onPress={() => setChangePinModal(true)}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
                <Ionicons name="keypad-outline" size={18} color={K.orange} />
              </View>
              <Text style={styles.actionLabel}>Change Parental PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={K.dim} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(62,207,176,0.12)' }]}>
                <Ionicons name="mail-outline" size={18} color={K.green} />
              </View>
              <Text style={styles.actionLabel}>Change Parent Email</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={K.dim} />
          </TouchableOpacity>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Data & Privacy</Text>
          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(79,172,254,0.12)' }]}>
                <Ionicons name="document-text-outline" size={18} color='#4FACFE' />
              </View>
              <Text style={styles.actionLabel}>View Watch History</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={K.dim} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(244,114,182,0.12)' }]}>
                <Ionicons name="download-outline" size={18} color='#F472B6' />
              </View>
              <Text style={styles.actionLabel}>Request Data Export</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={K.dim} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, { color: K.red }]}>⚠ Danger Zone</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteProfile}>
            <Ionicons name="trash-outline" size={16} color={K.red} />
            <Text style={styles.deleteBtnText}>Delete Kids Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal visible={changePinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Change Parental PIN</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="New 4-digit PIN"
              placeholderTextColor={K.dim}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
            />
            <TextInput
              style={[styles.pinInput, { marginTop: 10 }]}
              placeholder="Confirm new PIN"
              placeholderTextColor={K.dim}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={confirmNewPin}
              onChangeText={setConfirmNewPin}
            />
            {!!pinChangeError && <Text style={styles.error}>{pinChangeError}</Text>}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setChangePinModal(false); setNewPin(''); setConfirmNewPin(''); setPinChangeError(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleChangePin}>
                <Text style={styles.modalConfirmText}>Update PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: K.bg },

  // Gate
  gateContainer: { flex: 1 },
  backBtn: { padding: 20, paddingBottom: 0 },
  gateContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  gateEmoji: { fontSize: 52, marginBottom: 16 },
  gateTitle: { fontSize: 24, fontWeight: '700', color: K.text, marginBottom: 8 },
  gateSub: { fontSize: 15, color: K.muted, marginBottom: 24, textAlign: 'center' },
  pinInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, color: K.text, borderWidth: 1, borderColor: K.border, textAlign: 'center', letterSpacing: 12, marginBottom: 8 },
  error: { fontSize: 13, color: K.red, marginBottom: 8 },
  gateBtn: { width: '100%', backgroundColor: K.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  gateBtnDisabled: { opacity: 0.4 },
  gateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 12, paddingBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: K.text },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: K.orange, borderRadius: 20 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Content
  content: { paddingHorizontal: 20 },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: K.card, borderRadius: 16, padding: 16, marginBottom: 20 },
  profileAvatar: { fontSize: 40 },
  profileName: { fontSize: 18, fontWeight: '700', color: K.text },
  profileTag: { fontSize: 12, color: K.orange, marginTop: 2, fontWeight: '600' },

  section: { marginBottom: 24 },
  dangerSection: { borderTopWidth: 1, borderTopColor: K.border, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: K.text, marginBottom: 12 },
  sectionSub: { fontSize: 13, color: K.muted, marginBottom: 12, marginTop: -8 },

  timeLimitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeLimitChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: K.border },
  timeLimitChipActive: { backgroundColor: K.orange, borderColor: K.orange },
  timeLimitText: { fontSize: 13, color: K.muted },
  timeLimitTextActive: { color: '#fff', fontWeight: '600' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: K.border },
  toggleLabel: { fontSize: 15, color: K.text },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: K.border },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 15, color: K.text },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  deleteBtnText: { fontSize: 15, color: K.red, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modal: { backgroundColor: K.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: K.text, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: K.border, alignItems: 'center' },
  modalCancelText: { fontSize: 15, color: K.muted, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: K.orange, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
