/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    website: user?.website || '',
    games: user?.games?.join(', ') || '',
    twitter: user?.socialLinks?.twitter || '',
    twitch: user?.socialLinks?.twitch || '',
    youtube: user?.socialLinks?.youtube || '',
    discord: user?.socialLinks?.discord || '',
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.displayName.trim()) return Alert.alert('Required', 'Display name cannot be empty.');
    setLoading(true);
    try {
      await api.patch('/users/me/profile', {
        displayName: form.displayName.trim(),
        username: form.username.trim(),
        bio: form.bio.trim(),
        website: form.website.trim(),
        games: form.games.split(',').map(g => g.trim()).filter(Boolean),
        socialLinks: { twitter: form.twitter, twitch: form.twitch, youtube: form.youtube, discord: form.discord },
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save. Please try again.');
      setLoading(false);
    }
  };

  const Field = ({ label, value, onChange, placeholder, multiline, maxLength, autoCapitalize, prefix }) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, multiline && styles.inputMulti, prefix && styles.inputWithPrefix]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChange}
          multiline={multiline}
          maxLength={maxLength || 200}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={!prefix}
        />
      </View>
      {maxLength && <Text style={styles.charCount}>{(value || '').length}/{maxLength}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Avatar edit */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(form.displayName || 'U')[0].toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.changeAvatarBtn}>
            <Text style={styles.changeAvatarText}>Change Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.changeBannerBtn}>
            <Text style={styles.changeBannerText}>Change Banner</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Field label="Display Name" value={form.displayName} onChange={v => update('displayName', v)} placeholder="Your name" maxLength={50} />
          <Field label="Username" value={form.username} onChange={v => update('username', v)} placeholder="username" autoCapitalize="none" prefix="@" />
          <Field label="Bio" value={form.bio} onChange={v => update('bio', v)} placeholder="Tell people about yourself..." multiline maxLength={160} />
          <Field label="Website" value={form.website} onChange={v => update('website', v)} placeholder="https://yoursite.com" autoCapitalize="none" />
          <Field label="Games" value={form.games} onChange={v => update('games', v)} placeholder="Fortnite, Valorant, Apex..." />

          <Text style={styles.sectionDivider}>Social Links</Text>
          <Field label="Twitter / X" value={form.twitter} onChange={v => update('twitter', v)} placeholder="handle" autoCapitalize="none" prefix="@" />
          <Field label="Twitch" value={form.twitch} onChange={v => update('twitch', v)} placeholder="channel" autoCapitalize="none" />
          <Field label="YouTube" value={form.youtube} onChange={v => update('youtube', v)} placeholder="channel name or URL" autoCapitalize="none" />
          <Field label="Discord" value={form.discord} onChange={v => update('discord', v)} placeholder="username#0000" autoCapitalize="none" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 7, backgroundColor: Colors.primary, borderRadius: 16 },
  saveBtnText: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: '700' },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 10 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.primaryLight },
  avatarText: { color: '#fff', fontSize: Typography.sizes['3xl'], fontWeight: '800' },
  changeAvatarBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.primary },
  changeAvatarText: { color: Colors.primary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  changeBannerBtn: {},
  changeBannerText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs },
  form: { paddingHorizontal: Spacing.base, gap: 16 },
  field: { gap: 6 },
  fieldLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  inputPrefix: { paddingLeft: 12, color: Colors.textMuted, fontSize: Typography.sizes.sm },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, color: Colors.textPrimary, fontSize: Typography.sizes.sm },
  inputWithPrefix: { paddingLeft: 2 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 },
  charCount: { color: Colors.textMuted, fontSize: Typography.sizes.xs, alignSelf: 'flex-end' },
  sectionDivider: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
});
