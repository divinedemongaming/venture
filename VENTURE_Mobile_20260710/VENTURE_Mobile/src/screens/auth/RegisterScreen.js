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
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VentureButton from '../../components/common/VentureButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', displayName: '', password: '', confirmPassword: '' });
  const [isCreator, setIsCreator] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateStep1 = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Letters, numbers, and underscores only';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.displayName || form.displayName.length < 1) e.displayName = 'Display name required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#])/;
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!passRegex.test(form.password)) e.password = 'Must include uppercase, lowercase, number, and special character';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        username: form.username.toLowerCase(),
        email: form.email.toLowerCase(),
        displayName: form.displayName,
        password: form.password,
        isCreator
      });
      await login(data.user, data.accessToken, data.refreshToken);
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Registration failed' });
    } finally { setLoading(false); }
  };

  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return { score: 0, label: '', color: Colors.textMuted };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[@$!%*?&_#]/.test(p)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', Colors.danger, Colors.warning, Colors.warning, Colors.success, Colors.success];
    return { score, label: labels[score], color: colors[score] };
  };

  const strength = getPasswordStrength();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0A0A0F', '#111118']} style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.stepIndicator}>
            {[1, 2, 3].map(s => (
              <View key={s} style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotDone]}>
                {s < step ? <Ionicons name="checkmark" size={12} color="#FFF" /> : <Text style={styles.stepDotText}>{s}</Text>}
              </View>
            ))}
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join VENTURE and start creating</Text>

          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          {step === 1 && (
            <View style={styles.form}>
              {[
                { key: 'username', label: 'Username', icon: 'at', placeholder: 'your_username', autoCapitalize: 'none' },
                { key: 'displayName', label: 'Display Name', icon: 'person-outline', placeholder: 'Your Name' },
                { key: 'email', label: 'Email', icon: 'mail-outline', placeholder: 'you@email.com', autoCapitalize: 'none', keyboardType: 'email-address' },
              ].map(field => (
                <View key={field.key} style={styles.inputGroup}>
                  <Text style={styles.label}>{field.label}</Text>
                  <View style={[styles.inputContainer, errors[field.key] && styles.inputError]}>
                    <Ionicons name={field.icon} size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={form[field.key]}
                      onChangeText={v => update(field.key, v)}
                      placeholder={field.placeholder}
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize={field.autoCapitalize || 'words'}
                      keyboardType={field.keyboardType || 'default'}
                      autoCorrect={false}
                    />
                  </View>
                  {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
                </View>
              ))}
              <VentureButton title="Continue" onPress={() => validateStep1() && setStep(2)} fullWidth size="lg" style={styles.continueBtn} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={form.password}
                    onChangeText={v => update('password', v)}
                    secureTextEntry={!showPassword}
                    placeholder="Create a strong password"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(s => !s)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                {form.password.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBars}>
                      {[1,2,3,4,5].map(i => (
                        <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength.score ? strength.color : Colors.border }]} />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                  </View>
                )}
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={form.confirmPassword}
                    onChangeText={v => update('confirmPassword', v)}
                    secureTextEntry
                    placeholder="Repeat password"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              <VentureButton title="Continue" onPress={() => validateStep2() && setStep(3)} fullWidth size="lg" style={styles.continueBtn} />
            </View>
          )}

          {step === 3 && (
            <View style={styles.form}>
              <Text style={styles.accountTypeTitle}>What kind of account?</Text>

              <TouchableOpacity
                style={[styles.accountCard, !isCreator && styles.accountCardActive]}
                onPress={() => setIsCreator(false)}
              >
                <View style={styles.accountCardIcon}>
                  <Ionicons name="person" size={28} color={!isCreator ? Colors.primary : Colors.textMuted} />
                </View>
                <View style={styles.accountCardText}>
                  <Text style={[styles.accountCardTitle, !isCreator && styles.accountCardTitleActive]}>Fan / Viewer</Text>
                  <Text style={styles.accountCardDesc}>Follow creators, engage with content, join communities</Text>
                </View>
                {!isCreator && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.accountCard, isCreator && styles.accountCardActive]}
                onPress={() => setIsCreator(true)}
              >
                <LinearGradient colors={isCreator ? Colors.gradientPrimary : [Colors.surface, Colors.surface]} style={styles.accountCardIcon}>
                  <MaterialCommunityIcons name="lightning-bolt" size={28} color={isCreator ? '#FFF' : Colors.textMuted} />
                </LinearGradient>
                <View style={styles.accountCardText}>
                  <Text style={[styles.accountCardTitle, isCreator && styles.accountCardTitleActive]}>Creator</Text>
                  <Text style={styles.accountCardDesc}>Build your community, monetize your content, grow your brand</Text>
                </View>
                {isCreator && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
              </TouchableOpacity>

              <View style={styles.termsRow}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              <VentureButton title={loading ? 'Creating Account...' : 'Create Account'} onPress={handleRegister} loading={loading} fullWidth size="lg" />
            </View>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text></Text>
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
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.base, marginVertical: Spacing.xl },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: Colors.primary, backgroundColor: 'rgba(124,58,237,0.2)' },
  stepDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDotText: { color: Colors.textMuted, fontSize: Typography.sizes.sm, fontWeight: '600' },
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
  errorText: { color: Colors.danger, fontSize: Typography.sizes.xs },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: Typography.sizes.xs, fontWeight: '600', width: 70 },
  continueBtn: { marginTop: Spacing.sm },
  accountTypeTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700', marginBottom: Spacing.sm },
  accountCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.base, gap: Spacing.md },
  accountCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(124,58,237,0.1)' },
  accountCardIcon: { width: 52, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundElevated },
  accountCardText: { flex: 1 },
  accountCardTitle: { color: Colors.textSecondary, fontSize: Typography.sizes.md, fontWeight: '700' },
  accountCardTitleActive: { color: Colors.textPrimary },
  accountCardDesc: { color: Colors.textMuted, fontSize: Typography.sizes.sm, marginTop: 2, lineHeight: 18 },
  termsRow: { marginVertical: Spacing.base },
  termsText: { color: Colors.textMuted, fontSize: Typography.sizes.sm, textAlign: 'center', lineHeight: 20 },
  termsLink: { color: Colors.primary, fontWeight: '600' },
  loginLink: { alignItems: 'center', marginTop: Spacing.xl },
  loginLinkText: { color: Colors.textSecondary, fontSize: Typography.sizes.md },
  loginLinkBold: { color: Colors.primary, fontWeight: '700' },
});
