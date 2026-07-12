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
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VentureButton from '../../components/common/VentureButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to\nVENTURE',
    subtitle: 'The ultimate platform for content creators — built around gaming culture, community, and creator freedom.',
    icon: 'rocket-outline',
    gradient: ['#7C3AED', '#4C1D95'],
    accent: '#9D5CF5',
  },
  {
    id: '2',
    title: 'Create Without\nLimits',
    subtitle: 'Post, reel, story, stream, clip — every format you love. Your content, your rules, no algorithm surprises.',
    icon: 'create-outline',
    gradient: ['#0891B2', '#164E63'],
    accent: '#06B6D4',
  },
  {
    id: '3',
    title: 'Build Your\nGaming Empire',
    subtitle: 'Share clips, go live, run tournaments, and connect with players across every platform and game.',
    icon: 'game-controller-outline',
    gradient: ['#059669', '#064E3B'],
    accent: '#10B981',
  },
  {
    id: '4',
    title: 'Bring Your\nCommunity Over',
    subtitle: 'Import followers from YouTube, Twitch, TikTok, Instagram, and Twitter in minutes. Start where you left off.',
    icon: 'people-outline',
    gradient: ['#D97706', '#78350F'],
    accent: '#F59E0B',
  },
  {
    id: '5',
    title: 'Get Paid\nYour Way',
    subtitle: 'Subscriptions, tips, superchats, merch. You keep 85% of everything. Zero gatekeeping.',
    icon: 'cash-outline',
    gradient: ['#7C3AED', '#06B6D4'],
    accent: '#9D5CF5',
  },
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const renderSlide = ({ item, index }) => (
    <View style={styles.slide}>
      <LinearGradient colors={item.gradient} style={styles.iconContainer}>
        <Ionicons name={item.icon} size={72} color="#FFF" />
      </LinearGradient>

      <View style={styles.slideText}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <LinearGradient colors={['#0A0A0F', '#111118', '#0A0A0F']} style={styles.container}>
      {/* Logo */}
      <View style={[styles.logoRow, { paddingTop: insets.top + 16 }]}>
        <LinearGradient colors={Colors.gradientPrimary} style={styles.logoIcon}>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFF" />
        </LinearGradient>
        <Text style={styles.logoText}>VENTURE</Text>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        style={styles.flatList}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA Buttons */}
      <View style={[styles.buttons, { paddingBottom: insets.bottom + 16 }]}>
        {isLast ? (
          <>
            <VentureButton
              title="Create Account"
              onPress={() => navigation.navigate('Register')}
              fullWidth
              size="lg"
            />
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginBtnText}>Already have an account? <Text style={styles.loginBtnTextBold}>Sign In</Text></Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={styles.nextBtn} activeOpacity={0.8}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.nextBtnGradient}>
                <Ionicons name="arrow-forward" size={22} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.xl },
  logoIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  logoText: { color: Colors.textPrimary, fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.black, letterSpacing: 3 },
  flatList: { flex: 1 },
  slide: { width, flex: 1, paddingHorizontal: Spacing['2xl'], alignItems: 'center', justifyContent: 'center' },
  iconContainer: { width: 140, height: 140, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['3xl'] },
  slideText: { alignItems: 'center' },
  slideTitle: { color: Colors.textPrimary, fontSize: Typography.sizes['4xl'], fontWeight: Typography.weights.black, textAlign: 'center', lineHeight: 44, marginBottom: Spacing.base },
  slideSubtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.md, textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.xl },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border, marginHorizontal: 3 },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  buttons: { paddingHorizontal: Spacing['2xl'] },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn: { padding: Spacing.md },
  skipText: { color: Colors.textMuted, fontSize: Typography.sizes.md },
  nextBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  nextBtnGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  loginBtn: { alignItems: 'center', marginTop: Spacing.base, padding: Spacing.sm },
  loginBtnText: { color: Colors.textSecondary, fontSize: Typography.sizes.md },
  loginBtnTextBold: { color: Colors.primary, fontWeight: '700' },
});
