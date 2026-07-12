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
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, BorderRadius, Spacing } from '../../theme';

export default function VentureButton({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, fullWidth = false, style
}) {
  const handlePress = async () => {
    if (loading || disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const isGradient = variant === 'primary' || variant === 'accent';

  const content = (
    <View style={[styles.inner, size === 'sm' && styles.innerSm, size === 'lg' && styles.innerLg]}>
      {loading ? (
        <ActivityIndicator color="#FFF" size="small" />
      ) : (
        <>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[
            styles.text,
            variant === 'outline' && styles.textOutline,
            variant === 'ghost' && styles.textGhost,
            size === 'sm' && styles.textSm,
            size === 'lg' && styles.textLg,
            disabled && styles.textDisabled
          ]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  if (isGradient && !disabled) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.base, fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={variant === 'accent' ? Colors.gradientAccent : Colors.gradientPrimary}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.gradient, size === 'sm' && styles.gradientSm, size === 'lg' && styles.gradientLg]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles.button,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        variant === 'dark' && styles.dark,
        disabled && styles.buttonDisabled,
        fullWidth && styles.fullWidth,
        size === 'sm' && styles.buttonSm,
        size === 'lg' && styles.buttonLg,
        style
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  button: { backgroundColor: Colors.primary },
  gradient: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
  gradientSm: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  gradientLg: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.base },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.danger },
  dark: { backgroundColor: Colors.surface },
  buttonDisabled: { backgroundColor: Colors.surfaceHigh, opacity: 0.5 },
  buttonSm: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  buttonLg: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.base },
  fullWidth: { width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  innerSm: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  innerLg: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.base },
  icon: { marginRight: Spacing.sm },
  text: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  textSm: { fontSize: Typography.sizes.base },
  textLg: { fontSize: Typography.sizes.lg },
  textOutline: { color: Colors.primary },
  textGhost: { color: Colors.primary },
  textDisabled: { color: Colors.textMuted },
});
