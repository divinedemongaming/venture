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
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import VentureButton from '../../components/common/VentureButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const passwordRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!identifier.trim()) e.identifier = 'Username or email required';
    if (!password) e.password = 'Password required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const { data } = await authAPI.login({ identifier: identifier.trim(), password });

      if (data.requires2FA) {
        navigation.navigate('TwoFA', { userId: data.userId, identifier, password });
        return;
      }

      await login(data.user, data.accessToken, data.refreshToken);
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      const remaining = err.response?.data?.attemptsRemaining;
      setErrors({
        general: remaining !== undefined
          ? `${msg} (${remaining} attempts remaining before lockout)`
          : msg
      });
      if (err.response?.data?.code === 'ACCOUNT_LOCKED') {
        Alert.alert('Account Locked', 'Too many failed attempts. Please try again in 15 minutes.');
      }
    } finally { setLoading(false); }
  };

  const OAUTH_PROVIDERS = [
    { id: 'google', icon: 'logo-google', label: 'Google', color: '#DB4437' },
    { id: 'twitch', icon: 'logo-twitch', label: 'Twitch', color: '#9147FF' },
    { id: 'discord', icon: 'logo-discord', label: 'Discord', color: '#5865F2' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0A0A0F', '#111118']} style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back + Logo */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.logoIcon}>
              <MaterialCommunityIcons name="lightning-bolt" size={22} color="#FFF" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your VENTURE account</Text>

          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          {/* Inputs */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username or Email</Text>
              <View style={[styles.inputContainer, errors.identifier && styles.inputError]}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="username or email"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {errors.identifier && <Text style={styles.errorText}>{errors.identifier}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <VentureButton title="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" style={styles.signInBtn} />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth */}
          <View style={styles.oauthRow}>
            {OAUTH_PROVIDERS.map(p => (
              <TouchableOpacity key={p.id} style={styles.oauthBtn} activeOpacity={0.8}>
                <Ionicons name={p.icon} size={22} color={p.color} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Register link */}
          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
  backBtn: { marginTop: Spacing.base, width: 44, height: 44, justifyContent: 'center' },
  logoRow: { alignItems: 'center', marginVertical: Spacing.xl },
  logoIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.textPrimary, fontSize: Typography.sizes['3xl'], fontWeight: Typography.weights.black, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.md, textAlign: 'center', marginBottom: Spacing['2xl'] },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: Colors.danger, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.base, gap: 8 },
  errorBannerText: { color: Colors.danger, fontSize: Typography.sizes.sm, flex: 1 },
  form: { gap: Spacing.base },
  inputGroup: { gap: Spacing.xs },
  label: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 52 },
  inputError: { borderColor: Colors.danger },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sizes.md },
  eyeBtn: { padding: Spacing.sm },
  errorText: { color: Colors.danger, fontSize: Typography.sizes.xs },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { color: Colors.primary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  signInBtn: { marginTop: Spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl, gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: Typography.sizes.sm },
  oauthRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.base, marginBottom: Spacing.xl },
  oauthBtn: { width: 56, height: 56, borderRadius: BorderRadius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  registerLink: { alignItems: 'center', marginTop: Spacing.base },
  registerText: { color: Colors.textSecondary, fontSize: Typography.sizes.md },
  registerTextBold: { color: Colors.primary, fontWeight: '700' },
});
