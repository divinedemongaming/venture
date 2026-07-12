/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * KidsSetupScreen — Parent/guardian sets up VENTURE Kids for their child.
 *
 * Steps:
 *   0  — Parent age check (must be 18+)
 *   1  — Parental consent text + email entry
 *   1.5 — Email verification gate (polls backend until parent confirms in email)
 *   2  — Child name + avatar
 *   3  — Create parental PIN (SHA-256 hashed)
 *   4  — Content settings
 *
 * Security model:
 *   - PIN is SHA-256 hashed before storage (not reversible btoa)
 *   - Email consent loop: backend sends email with a signed JWT link;
 *     profile is blocked until the parent clicks that link from their inbox.
 *     This ensures whoever entered the email address has access to it —
 *     a child cannot complete setup by entering a parent's email they don't control.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Dimensions, ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme';
import { KIDS_PARENTAL_CONSENT, KIDS_CONTENT_CATEGORIES, KIDS_TIME_LIMITS } from '../../constants/legal';
import { hashPin } from '../../utils/pinHash';
import { initKidsSessionSecret } from '../../utils/kidsSession';
import { kidsAPI } from '../../services/api';
import { useStripe } from '@stripe/stripe-react-native';

const { width } = Dimensions.get('window');

// Steps shown in the header
const STEP_TITLES = [
  'Parent Verification',
  'Parental Consent',
  'Email Confirmation',
  'Identity Verification',
  'Child Profile',
  'Create PIN',
  'Content Settings',
];

const AVATARS = ['🦁','🐼','🦊','🐸','🦋','🐬','🦄','🐧','🐯','🦖','🌟','🚀'];

// Steps as named constants — easier to read than raw numbers
const S = {
  AGE:        0,
  CONSENT:    1,
  EMAIL_GATE: 2,
  CARD:       3,
  CHILD:      4,
  PIN:        5,
  CONTENT:    6,
};

export default function KidsSetupScreen({ navigation }) {
  const { enterKidsMode } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [step, setStep] = useState(S.AGE);

  // Step 0 — Parent age confirmation
  const [parentBirthYear, setParentBirthYear] = useState('');
  const [parentAgeError, setParentAgeError] = useState('');

  // Step 1 — Consent + email
  const [parentEmail, setParentEmail] = useState('');
  const [consentScrolled, setConsentScrolled] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Step 2 — Email gate state
  const [cardVerifying, setCardVerifying] = useState(false);
  const [cardError, setCardError] = useState('');

  // Step 3 — Card verification state (above email gate to keep ordering clean)
  const [consentId, setConsentId] = useState(null);
  const [consentStatus, setConsentStatus] = useState('pending'); // 'pending' | 'verified'
  const [consentLoading, setConsentLoading] = useState(false);   // true while sending email
  const [resendCooldown, setResendCooldown] = useState(0);       // seconds until resend allowed
  const pollRef = useRef(null);
  const cooldownRef = useRef(null);

  // Step 3 — Child profile
  const [childName, setChildName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [nameError, setNameError] = useState('');

  // Step 4 — PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinVisible, setPinVisible] = useState(false);

  // Step 5 — Content settings
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(60);
  const [allowedCategories, setAllowedCategories] = useState(
    Object.keys(KIDS_CONTENT_CATEGORIES)
  );

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearInterval(cooldownRef.current);
    };
  }, []);

  // ── Poll for consent status every 5 seconds ──────────────────────────────
  const startPolling = useCallback((id) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await kidsAPI.getConsentStatus(id);
        if (data.status === 'verified') {
          clearInterval(pollRef.current);
          setConsentStatus('verified');
          // Brief pause so the user sees the green tick, then advance to card verify
          setTimeout(() => setStep(S.CARD), 1000);
        }
      } catch {
        // Ignore transient network errors during polling
      }
    }, 5000);
  }, []);

  // ── Start resend cooldown (60s) ───────────────────────────────────────────
  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Send consent email (initial or resend) ───────────────────────────────
  const requestConsent = useCallback(async (emailOverride) => {
    const email = emailOverride || parentEmail;
    setConsentLoading(true);
    try {
      const { data } = await kidsAPI.requestConsent(email, childName || 'your child');
      setConsentId(data.consentId);
      setConsentStatus('pending');
      startPolling(data.consentId);
      startCooldown();
    } catch (err) {
      Alert.alert(
        'Could not send email',
        err.response?.data?.error || 'Please check the email address and try again.',
      );
    } finally {
      setConsentLoading(false);
    }
  }, [parentEmail, childName, startPolling, startCooldown]);

  // ── Manual "I've confirmed" poll ─────────────────────────────────────────
  const checkNow = useCallback(async () => {
    if (!consentId) return;
    try {
      const { data } = await kidsAPI.getConsentStatus(consentId);
      if (data.status === 'verified') {
        clearInterval(pollRef.current);
        setConsentStatus('verified');
        setTimeout(() => setStep(S.CARD), 800);
      } else if (data.status === 'expired') {
        Alert.alert('Link Expired', 'The consent link has expired. Tap "Resend" to get a new one.');
      } else {
        Alert.alert('Not yet confirmed', 'We haven\'t received your confirmation yet. Check your inbox and click the link in the email.');
      }
    } catch {
      Alert.alert('Error', 'Could not check consent status. Check your connection.');
    }
  }, [consentId]);

  // ── Card verification ────────────────────────────────────────────────────
  const handleCardVerify = async () => {
    setCardVerifying(true);
    setCardError('');
    try {
      // 1. Backend creates a $0.30 manual-capture PaymentIntent
      const { data } = await kidsAPI.createCardVerify();
      const { clientSecret } = data;

      // 2. Init the Stripe Payment Sheet — Stripe's native card UI
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'VENTURE Kids Verification',
        // No saved cards — this is a one-time verification
        allowsDelayedPaymentMethods: false,
        appearance: {
          colors: {
            primary: '#FF6B35',
            background: '#0F1420',
            componentBackground: '#1A2035',
            componentBorder: 'rgba(255,255,255,0.08)',
            componentDivider: 'rgba(255,255,255,0.08)',
            primaryText: '#FFFFFF',
            secondaryText: '#94A3B8',
            componentText: '#FFFFFF',
            placeholderText: '#64748B',
            icon: '#94A3B8',
          },
        },
      });
      if (initError) {
        setCardError(initError.message || 'Could not initialise card form.');
        setCardVerifying(false);
        return;
      }

      // 3. Present Stripe's native payment sheet — parent enters card details
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        // User cancelled — not an error, just don't advance
        if (presentError.code === 'Canceled') { setCardVerifying(false); return; }
        setCardError(presentError.message || 'Card verification failed. Please try again.');
        setCardVerifying(false);
        return;
      }

      // 4. Payment Sheet succeeded (card authorized). Tell backend to cancel the intent.
      await kidsAPI.completeCardVerify();

      // 5. Advance to child profile setup
      setStep(S.CHILD);
    } catch (err) {
      setCardError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setCardVerifying(false);
    }
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleNext = async () => {
    if (step === S.AGE) {
      const year = parseInt(parentBirthYear, 10);
      const age = new Date().getFullYear() - year;
      if (!year || isNaN(year) || age < 18 || age > 120) {
        setParentAgeError('You must be at least 18 years old to set up VENTURE Kids.');
        return;
      }
      setParentAgeError('');
      setStep(S.CONSENT);

    } else if (step === S.CONSENT) {
      if (!consentChecked) {
        Alert.alert('Consent Required', 'Please read and accept the parental consent terms.');
        return;
      }
      if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
        setEmailError('Please enter a valid email address.');
        return;
      }
      setEmailError('');
      // Send consent email then advance to gate step
      setStep(S.EMAIL_GATE);
      await requestConsent(parentEmail);

    } else if (step === S.CARD) {
      // CARD step uses its own inline button — handleNext not called from footer
      // but guard here in case of fallback
      await handleCardVerify();

    } else if (step === S.CHILD) {
      if (!childName.trim() || childName.trim().length < 2) {
        setNameError('Please enter your child\'s name (at least 2 characters).');
        return;
      }
      setNameError('');
      setStep(S.PIN);

    } else if (step === S.PIN) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        setPinError('PIN must be exactly 4 digits.');
        return;
      }
      if (pin !== confirmPin) {
        setPinError('PINs do not match. Please try again.');
        return;
      }
      setPinError('');
      setStep(S.CONTENT);

    } else if (step === S.CONTENT) {
      await handleFinish();
    }
  };

  const handleBack = () => {
    if (step === S.EMAIL_GATE) {
      clearInterval(pollRef.current);
      clearInterval(cooldownRef.current);
      setConsentId(null);
      setConsentStatus('pending');
      setStep(S.CONSENT);
    } else if (step === S.CARD) {
      // Can't go back past email gate — once email is verified, skip back to CONSENT
      setStep(S.CONSENT);
    } else if (step > S.AGE) {
      setStep(s => s - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleFinish = async () => {
    const hashedPin = await hashPin(pin);

    // Initialize the HMAC session secret — used to sign all kids-mode API requests.
    // Must be set before enterKidsMode so the first kids feed request is properly signed.
    const accessToken = await import('expo-secure-store').then(m => m.getItemAsync('accessToken'));
    if (accessToken) {
      await initKidsSessionSecret(accessToken, hashedPin).catch(() => {});
    }

    const kidsProfile = {
      childName: childName.trim(),
      avatar: selectedAvatar,
      allowedCategories,
      dailyLimitMinutes,
      sessionStartTime: null,
    };

    await SecureStore.setItemAsync('venture_parent_email', parentEmail);
    await SecureStore.setItemAsync('venture_kids_pin', hashedPin);
    await SecureStore.setItemAsync('venture_parent_consent_timestamp', new Date().toISOString());
    await SecureStore.setItemAsync('venture_parent_consent_id', consentId || '');

    await enterKidsMode(kidsProfile);
  };

  const toggleCategory = (key) => {
    setAllowedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const progress = (step + 1) / STEP_TITLES.length;
  // EMAIL_GATE doesn't count as a "real" step forward — show same progress as CONSENT
  const displayProgress = step === S.EMAIL_GATE ? (S.CONSENT + 1) / STEP_TITLES.length : progress;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {(step > S.AGE) && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step {Math.min(step + 1, STEP_TITLES.length)} of {STEP_TITLES.length}</Text>
          <Text style={styles.stepTitle}>{STEP_TITLES[Math.min(step, STEP_TITLES.length - 1)]}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${displayProgress * 100}%` }]} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >

          {/* ─── STEP 0: Parent Age ─── */}
          {step === S.AGE && (
            <View>
              <View style={styles.kidsHero}>
                <Text style={styles.kidsEmoji}>👨‍👧</Text>
                <Text style={styles.kidsHeroTitle}>VENTURE Kids</Text>
                <Text style={styles.kidsHeroSub}>
                  A safe, fun world of wholesome content — just for kids.
                  {'\n\n'}Set it up in a few minutes.
                </Text>
              </View>
              <Text style={styles.fieldLabel}>Your birth year (parent/guardian)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1985"
                placeholderTextColor={Colors.textDim}
                keyboardType="number-pad"
                maxLength={4}
                value={parentBirthYear}
                onChangeText={setParentBirthYear}
              />
              {!!parentAgeError && <Text style={styles.error}>{parentAgeError}</Text>}
              <Text style={styles.hint}>
                You must be 18 or older to create a Kids account. Required by COPPA.
              </Text>
            </View>
          )}

          {/* ─── STEP 1: Consent ─── */}
          {step === S.CONSENT && (
            <View>
              <Text style={styles.sectionTitle}>Read & Accept</Text>
              <ScrollView
                style={styles.consentScroll}
                onScrollEndDrag={() => setConsentScrolled(true)}
                onMomentumScrollEnd={() => setConsentScrolled(true)}
                showsVerticalScrollIndicator
              >
                <Text style={styles.consentText}>{KIDS_PARENTAL_CONSENT}</Text>
              </ScrollView>
              {!consentScrolled && (
                <Text style={styles.scrollHint}>↓ Scroll to read the full consent</Text>
              )}
              <TouchableOpacity
                style={[styles.checkRow, !consentScrolled && styles.checkRowDisabled]}
                onPress={() => consentScrolled && setConsentChecked(c => !c)}
                disabled={!consentScrolled}
              >
                <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
                  {consentChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkLabel}>
                  I am the parent/guardian and I consent to my child using VENTURE Kids
                </Text>
              </TouchableOpacity>
              <Text style={styles.fieldLabel}>Your email address</Text>
              <TextInput
                style={styles.input}
                placeholder="parent@email.com"
                placeholderTextColor={Colors.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                value={parentEmail}
                onChangeText={setParentEmail}
              />
              {!!emailError && <Text style={styles.error}>{emailError}</Text>}
              <Text style={styles.hint}>
                We'll send a one-time confirmation to this address. You must click the link in that
                email before your child's account activates. This proves a real parent is in control.
              </Text>
            </View>
          )}

          {/* ─── STEP 2: Email Verification Gate ─── */}
          {step === S.EMAIL_GATE && (
            <View style={styles.gateContainer}>
              {consentStatus === 'verified' ? (
                <View style={styles.verifiedBox}>
                  <Text style={styles.verifiedIcon}>✅</Text>
                  <Text style={styles.verifiedTitle}>Email Confirmed!</Text>
                  <Text style={styles.verifiedSub}>Parental consent verified. Setting up your child's profile…</Text>
                </View>
              ) : (
                <>
                  {consentLoading ? (
                    <View style={styles.sendingBox}>
                      <ActivityIndicator size="large" color={C_KIDS} />
                      <Text style={styles.sendingText}>Sending confirmation email…</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.gateEmoji}>📧</Text>
                      <Text style={styles.gateTitle}>Check Your Email</Text>
                      <Text style={styles.gateSub}>
                        We sent a confirmation link to:
                      </Text>
                      <View style={styles.emailPill}>
                        <Ionicons name="mail" size={16} color={C_KIDS} />
                        <Text style={styles.emailPillText}>{parentEmail}</Text>
                      </View>
                      <Text style={styles.gateSub}>
                        Open that email on your phone or another device and tap{' '}
                        <Text style={{ color: C_KIDS, fontWeight: '700' }}>"I Confirm"</Text>
                        . The link only works once and expires in 24 hours.
                      </Text>

                      {/* Polling indicator */}
                      <View style={styles.pollingRow}>
                        <ActivityIndicator size="small" color={Colors.textDim} />
                        <Text style={styles.pollingText}>Waiting for confirmation…</Text>
                      </View>

                      {/* Manual check button */}
                      <TouchableOpacity style={styles.checkBtn} onPress={checkNow}>
                        <Text style={styles.checkBtnText}>I've clicked the link — continue</Text>
                      </TouchableOpacity>

                      {/* Resend */}
                      <TouchableOpacity
                        style={[styles.resendBtn, resendCooldown > 0 && styles.resendBtnDisabled]}
                        onPress={() => resendCooldown === 0 && requestConsent()}
                        disabled={resendCooldown > 0}
                      >
                        <Text style={styles.resendText}>
                          {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : 'Resend email'}
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.gateHint}>
                        Don't see it? Check your spam folder. The sender is noreply@venture.gg.
                      </Text>
                    </>
                  )}
                </>
              )}
            </View>
          )}

          {/* ─── STEP 3: Card Verification ─── */}
          {step === S.CARD && (
            <View style={styles.gateContainer}>
              <Text style={styles.gateEmoji}>💳</Text>
              <Text style={styles.gateTitle}>One Last Step</Text>
              <Text style={styles.gateSub}>
                To confirm you're a real adult, we'll place a{' '}
                <Text style={{ color: C_KIDS, fontWeight: '700' }}>$0.30 authorization</Text>{' '}
                on your card — then immediately cancel it.
              </Text>
              <View style={styles.verifyExplainCard}>
                <View style={styles.verifyRow}>
                  <Text style={styles.verifyIcon}>✅</Text>
                  <Text style={styles.verifyText}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>You are not charged.</Text>
                    {' '}The $0.30 authorization is cancelled the moment you tap Verify. Net charge: $0.
                  </Text>
                </View>
                <View style={styles.verifyRow}>
                  <Text style={styles.verifyIcon}>🔒</Text>
                  <Text style={styles.verifyText}>
                    Your card details go directly to Stripe. VENTURE never sees your card number.
                  </Text>
                </View>
                <View style={styles.verifyRow}>
                  <Text style={styles.verifyIcon}>👨‍👧</Text>
                  <Text style={styles.verifyText}>
                    This proves a real adult is in control — not a child who found a parent's email.
                  </Text>
                </View>
                <View style={styles.verifyRow}>
                  <Text style={styles.verifyIcon}>🎯</Text>
                  <Text style={styles.verifyText}>
                    VENTURE is completely free to use. We only make money when creators choose to monetize — no ads, no subscriptions, no hidden fees.
                  </Text>
                </View>
              </View>

              {!!cardError && (
                <View style={styles.cardErrorBox}>
                  <Ionicons name=alert-circle size={16} color=#FF4D4D />
                  <Text style={styles.cardErrorText}>{cardError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.checkBtn, cardVerifying && styles.checkBtnDisabled]}
                onPress={handleCardVerify}
                disabled={cardVerifying}
              >
                {cardVerifying ? (
                  <ActivityIndicator color=#fff />
                ) : (
                  <Text style={styles.checkBtnText}>Verify with Card ($0.30 auth, not charged)</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.gateHint}>
                This is the industry-standard COPPA parental verification method.
                The authorization appears briefly as pending then disappears.
              </Text>
            </View>
          )}

          {/* ─── STEP 4: Child Profile ─── */}
          {step === S.CHILD && (
            <View>
              <Text style={styles.sectionTitle}>Your child's profile</Text>
              <Text style={styles.sectionSub}>
                This is the name and avatar your child will see. No real name required.
              </Text>
              <Text style={styles.fieldLabel}>Display name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. SuperStar, TigerKid…"
                placeholderTextColor={Colors.textDim}
                maxLength={20}
                value={childName}
                onChangeText={setChildName}
              />
              {!!nameError && <Text style={styles.error}>{nameError}</Text>}
              <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Choose an avatar</Text>
              <View style={styles.avatarGrid}>
                {AVATARS.map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.avatarBtn, selectedAvatar === a && styles.avatarBtnSelected]}
                    onPress={() => setSelectedAvatar(a)}
                  >
                    <Text style={styles.avatarEmoji}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ─── STEP 4: PIN ─── */}
          {step === S.PIN && (
            <View>
              <View style={styles.pinHero}>
                <Text style={styles.kidsEmoji}>🔐</Text>
              </View>
              <Text style={styles.sectionTitle}>Create a Parent PIN</Text>
              <Text style={styles.sectionSub}>
                Your child needs this 4-digit PIN to exit VENTURE Kids mode. Keep it private.
              </Text>
              <Text style={styles.fieldLabel}>4-digit PIN</Text>
              <View style={styles.pinRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••"
                  placeholderTextColor={Colors.textDim}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry={!pinVisible}
                  value={pin}
                  onChangeText={setPin}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setPinVisible(v => !v)}>
                  <Ionicons name={pinVisible ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Confirm PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor={Colors.textDim}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry={!pinVisible}
                value={confirmPin}
                onChangeText={setConfirmPin}
              />
              {!!pinError && <Text style={styles.error}>{pinError}</Text>}
              <Text style={styles.hint}>
                You can change this PIN later from Parental Controls.
              </Text>
            </View>
          )}

          {/* ─── STEP 5: Content Settings ─── */}
          {step === S.CONTENT && (
            <View>
              <Text style={styles.sectionTitle}>Content Settings</Text>
              <Text style={styles.sectionSub}>
                Choose what your child can watch. Update these any time from Parental Controls.
              </Text>
              <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Daily screen time limit</Text>
              <View style={styles.timeLimitRow}>
                {KIDS_TIME_LIMITS.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.timeLimitChip, dailyLimitMinutes === t.value && styles.timeLimitChipActive]}
                    onPress={() => setDailyLimitMinutes(t.value)}
                  >
                    <Text style={[styles.timeLimitText, dailyLimitMinutes === t.value && styles.timeLimitTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Allowed content categories</Text>
              <Text style={styles.hint}>All on by default. Tap to disable any.</Text>
              <View style={styles.categoryGrid}>
                {Object.entries(KIDS_CONTENT_CATEGORIES).map(([key, label]) => {
                  const active = allowedCategories.includes(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      onPress={() => toggleCategory(key)}
                    >
                      <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.readyCard}>
                <Text style={styles.readyEmoji}>{selectedAvatar}</Text>
                <View>
                  <Text style={styles.readyName}>{childName}</Text>
                  <Text style={styles.readyDetails}>
                    {allowedCategories.length} categories •{' '}
                    {dailyLimitMinutes === 0 ? 'No time limit' : `${dailyLimitMinutes} min/day`}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CTA — hidden on email gate and card step (actions are inline) */}
      {step !== S.EMAIL_GATE && step !== S.CARD && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {step === S.CONTENT ? `Launch ${childName || 'Kids'} Mode 🚀` : 'Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const C_KIDS = '#FF6B35';
const C_KIDS_LIGHT = '#FFF3EE';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 12, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerCenter: { flex: 1 },
  stepLabel: { fontSize: 11, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 1 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 2 },
  progressTrack: { height: 3, backgroundColor: Colors.border, marginHorizontal: 20, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 3, backgroundColor: C_KIDS, borderRadius: 2 },
  content: { flex: 1 },
  contentContainer: { padding: 24 },

  // Hero
  kidsHero: { alignItems: 'center', marginBottom: 32 },
  kidsEmoji: { fontSize: 56, marginBottom: 12 },
  kidsHeroTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  kidsHeroSub: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  pinHero: { alignItems: 'center', marginBottom: 16 },

  sectionTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  sectionSub: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 20 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    backgroundColor: Colors.backgroundCard || 'rgba(255,255,255,0.06)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: Colors.border, marginBottom: 6,
  },
  error: { fontSize: 13, color: '#FF4D4D', marginBottom: 8 },
  hint: { fontSize: 12, color: Colors.textDim, lineHeight: 18, marginBottom: 8 },

  // Consent
  consentScroll: { height: 200, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 8 },
  consentText: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  scrollHint: { fontSize: 12, color: C_KIDS, textAlign: 'center', marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginVertical: 12 },
  checkRowDisabled: { opacity: 0.4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: C_KIDS, borderColor: C_KIDS },
  checkLabel: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },

  // Email gate
  gateContainer: { alignItems: 'center', paddingVertical: 24 },
  gateEmoji: { fontSize: 64, marginBottom: 20 },
  gateTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  gateSub: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 16, paddingHorizontal: 8 },
  emailPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,107,53,0.1)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)' },
  emailPillText: { fontSize: 15, color: Colors.text, fontWeight: '600', flexShrink: 1 },
  pollingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 24 },
  pollingText: { fontSize: 13, color: Colors.textDim },
  checkBtn: { width: '100%', backgroundColor: C_KIDS, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  checkBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  resendBtn: { width: '100%', borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  resendBtnDisabled: { opacity: 0.45 },
  resendText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  gateHint: { fontSize: 12, color: Colors.textDim, textAlign: 'center', lineHeight: 18 },
  sendingBox: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  sendingText: { fontSize: 15, color: Colors.textMuted },
  verifiedBox: { alignItems: 'center', paddingVertical: 32 },
  verifiedIcon: { fontSize: 64, marginBottom: 16 },
  verifiedTitle: { fontSize: 24, fontWeight: '700', color: '#3ECFB0', marginBottom: 8 },
  verifiedSub: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // Avatar grid
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatarBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarBtnSelected: { borderColor: C_KIDS, backgroundColor: C_KIDS_LIGHT + '22' },
  avatarEmoji: { fontSize: 28 },

  // PIN
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 12 },

  // Time limits
  timeLimitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  timeLimitChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  timeLimitChipActive: { backgroundColor: C_KIDS, borderColor: C_KIDS },
  timeLimitText: { fontSize: 13, color: Colors.textMuted },
  timeLimitTextActive: { color: '#fff', fontWeight: '600' },

  // Categories
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: C_KIDS },
  categoryText: { fontSize: 13, color: Colors.textMuted },
  categoryTextActive: { color: C_KIDS, fontWeight: '600' },

  // Ready card
  readyCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)' },
  readyEmoji: { fontSize: 40 },
  readyName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  readyDetails: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  // Card verify
  verifyExplainCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24, gap: 16 },
  verifyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  verifyIcon: { fontSize: 18, marginTop: 1 },
  verifyText: { flex: 1, fontSize: 13, color: Colors.textMuted, lineHeight: 19 },
  cardErrorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,77,77,0.1)', borderRadius: 10, padding: 12, width: '100%', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,77,77,0.25)' },
  cardErrorText: { flex: 1, fontSize: 13, color: '#FF4D4D', lineHeight: 18 },
  checkBtnDisabled: { opacity: 0.5 },

  // Footer
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 20 },
  nextBtn: { backgroundColor: C_KIDS, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
