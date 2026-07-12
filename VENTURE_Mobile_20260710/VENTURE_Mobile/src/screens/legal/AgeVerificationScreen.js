/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../theme';
import { getAgeGroup, AGE_GROUPS } from '../../constants/legal';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function AgeVerificationScreen({ navigation }) {
  const [month, setMonth] = useState(null);
  const [day, setDay] = useState(null);
  const [year, setYear] = useState(null);
  const [step, setStep] = useState('month'); // month → day → year → confirm

  const handleContinue = async () => {
    if (!month || !day || !year) return;

    const ageGroup = getAgeGroup(year, month, day);

    await SecureStore.setItemAsync('venture_age_group', ageGroup);
    await SecureStore.setItemAsync('venture_birth_year', String(year));
    await SecureStore.setItemAsync('venture_age_verified', 'true');

    if (ageGroup === AGE_GROUPS.KIDS) {
      // Route to parent-managed Kids Mode setup instead of blocking
      navigation.replace('KidsSetup');
    } else {
      // Teen or Adult — proceed to terms acceptance
      navigation.replace('TermsAcceptance', { ageGroup });
    }
  };

  const renderPicker = (label, items, selected, onSelect, displayFn) => (
    <View style={styles.pickerSection}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <ScrollView
        horizontal={false}
        style={styles.pickerScroll}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => {
              onSelect(item);
              if (label === 'Month') setStep('day');
              else if (label === 'Day') setStep('year');
            }}
            style={[styles.pickerItem, selected === item && styles.pickerItemSelected]}
          >
            <Text style={[styles.pickerItemText, selected === item && styles.pickerItemTextSelected]}>
              {displayFn ? displayFn(item) : item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const ready = month && day && year;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>When were you born?</Text>
        <Text style={styles.subtitle}>We use this to personalise your experience and keep everyone safe.</Text>
      </View>

      <View style={styles.pickers}>
        {(step === 'month' || month) && renderPicker('Month', MONTHS, MONTHS[month - 1], (m) => setMonth(MONTHS.indexOf(m) + 1), null)}
        {(step === 'day' || day) && month && renderPicker('Day', DAYS, day, setDay, null)}
        {(step === 'year' || year) && day && renderPicker('Year', YEARS, year, setYear, null)}
      </View>

      {ready && (
        <View style={styles.selected}>
          <Text style={styles.selectedText}>
            {MONTHS[month - 1]} {day}, {year}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, !ready && styles.btnDisabled]}
        onPress={handleContinue}
        disabled={!ready}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Your birthday is kept private and is never shared publicly.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  header: { paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textMuted, lineHeight: 22 },
  pickers: { flex: 1, flexDirection: 'row', gap: 12 },
  pickerSection: { flex: 1 },
  pickerLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  pickerScroll: { maxHeight: 240 },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  pickerItemSelected: { backgroundColor: Colors.primary },
  pickerItemText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  pickerItemTextSelected: { color: '#fff', fontWeight: '600' },
  selected: { alignItems: 'center', marginBottom: 16 },
  selectedText: { fontSize: 18, fontWeight: '600', color: Colors.text },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 12, color: Colors.textDim, textAlign: 'center', marginBottom: 32, lineHeight: 18 },
});
