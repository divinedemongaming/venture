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
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Typography } from '../../theme';

const SIZE_MAP = { xs: 24, sm: 32, md: 44, lg: 56, xl: 72, '2xl': 96 };

export default function Avatar({ user, size = 'md', showOnline = false, showLive = false, onPress, style }) {
  const sz = SIZE_MAP[size] || 44;
  const fontSize = sz * 0.38;
  const initials = user?.displayName?.slice(0, 1).toUpperCase() || '?';
  const isLive = showLive && user?.isLive;
  const isOnline = showOnline && user?.isOnline;

  const inner = user?.avatarUrl ? (
    <Image source={{ uri: user.avatarUrl }} style={[styles.image, { width: sz, height: sz, borderRadius: sz / 2 }]} contentFit="cover" />
  ) : (
    <LinearGradient colors={Colors.gradientPrimary} style={[styles.placeholder, { width: sz, height: sz, borderRadius: sz / 2 }]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </LinearGradient>
  );

  const Wrapper = isLive ? (
    <LinearGradient colors={[Colors.live, '#FF8A00']} style={[styles.liveBorder, { width: sz + 4, height: sz + 4, borderRadius: (sz + 4) / 2, padding: 2 }]}>
      <View style={[styles.innerBorder, { borderRadius: sz / 2 }]}>{inner}</View>
    </LinearGradient>
  ) : inner;

  const container = (
    <View style={[styles.container, style]}>
      {Wrapper}
      {isOnline && !isLive && (
        <View style={[styles.onlineDot, { width: sz * 0.28, height: sz * 0.28, borderRadius: sz * 0.14, bottom: 1, right: 1 }]} />
      )}
      {isLive && (
        <View style={styles.liveTag}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{container}</TouchableOpacity>;
  return container;
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  image: {},
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFF', fontWeight: '700' },
  liveBorder: { alignItems: 'center', justifyContent: 'center' },
  innerBorder: { overflow: 'hidden', width: '100%', height: '100%' },
  onlineDot: { position: 'absolute', backgroundColor: Colors.online, borderWidth: 2, borderColor: Colors.backgroundCard },
  liveTag: { position: 'absolute', bottom: -6, backgroundColor: Colors.live, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  liveText: { color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
});
