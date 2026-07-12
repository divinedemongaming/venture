/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import { api } from '../../services/api';

const QUICK_AMOUNTS = [1, 2, 5, 10, 20, 50];

export default function TipScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { creatorId, creatorName } = route?.params || {};
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const sendTip = async () => {
    if (finalAmount < 1) return;
    setLoading(true);
    try {
      await api.post('/monetization/tip', { creatorId, amount: finalAmount, message });
      setSent(true);
    } catch (_) { setLoading(false); }
  };

  if (sent) return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.successBox}>
        <Ionicons name="heart" size={64} color={Colors.danger} />
        <Text style={styles.successTitle}>Tip Sent! 💜</Text>
        <Text style={styles.successText}>You sent ${finalAmount.toFixed(2)} to @{creatorName || 'creator'}</Text>
        <Text style={styles.successSub}>85% goes directly to the creator. Thank you for your support!</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}><Text style={styles.doneBtnText}>Done</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Send Tip{creatorName ? ` to @${creatorName}` : ''}</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.displayAmount}>${customAmount || amount.toFixed(2)}</Text>
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map(a => (
            <TouchableOpacity key={a} style={[styles.quickBtn, amount === a && !customAmount && styles.quickBtnActive]} onPress={() => { setAmount(a); setCustomAmount(''); }}>
              <Text style={[styles.quickText, amount === a && !customAmount && styles.quickTextActive]}>${a}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.customInput} placeholder="Or enter custom amount" placeholderTextColor={Colors.textMuted} value={customAmount} onChangeText={setCustomAmount} keyboardType="decimal-pad" />
        <TextInput style={[styles.customInput, styles.msgInput]} placeholder="Add a message (optional)" placeholderTextColor={Colors.textMuted} value={message} onChangeText={setMessage} maxLength={150} />
        <Text style={styles.feeNote}>85% goes to creator · 15% platform fee · Powered by Stripe</Text>
        <TouchableOpacity style={[styles.tipBtn, finalAmount < 1 && styles.tipBtnOff]} onPress={sendTip} disabled={loading || finalAmount < 1}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="heart" size={18} color="#fff" /><Text style={styles.tipBtnText}>Send ${finalAmount.toFixed(2)} Tip</Text></>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: Spacing.base, paddingTop: 40, gap: 16, alignItems: 'center' },
  displayAmount: { color: Colors.textPrimary, fontSize: 56, fontWeight: '900', color: Colors.accentAlt },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border },
  quickBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '700' },
  quickTextActive: { color: '#fff' },
  customInput: { width: '100%', backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10, color: Colors.textPrimary, fontSize: Typography.sizes.sm, textAlign: 'center' },
  msgInput: { textAlign: 'left' },
  feeNote: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center' },
  tipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', paddingVertical: 14, backgroundColor: Colors.danger, borderRadius: 14 },
  tipBtnOff: { opacity: 0.4 },
  tipBtnText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '800' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: Spacing['2xl'] },
  successTitle: { color: Colors.textPrimary, fontSize: Typography.sizes['2xl'], fontWeight: '800' },
  successText: { color: Colors.textPrimary, fontSize: Typography.sizes.md, textAlign: 'center' },
  successSub: { color: Colors.textMuted, fontSize: Typography.sizes.sm, textAlign: 'center' },
  doneBtn: { paddingHorizontal: 32, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 20 },
  doneBtnText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: '700' },
});
