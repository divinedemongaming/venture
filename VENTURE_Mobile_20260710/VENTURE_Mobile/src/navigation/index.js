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
import { View, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { Colors } from '../theme';

// ─── Legal screens ────────────────────────────────────────────────
import AgeVerificationScreen from '../screens/legal/AgeVerificationScreen';
import TermsAcceptanceScreen from '../screens/legal/TermsAcceptanceScreen';
import KidsSetupScreen from '../screens/legal/KidsSetupScreen';

// ─── Kids screens ─────────────────────────────────────────────────
import KidsHomeScreen from '../screens/kids/KidsHomeScreen';
import KidsProfileScreen from '../screens/kids/KidsProfileScreen';
import ParentalControlsScreen from '../screens/kids/ParentalControlsScreen';

// ─── Auth screens ─────────────────────────────────────────────────
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import OAuthScreen from '../screens/auth/OAuthScreen';

// ─── Main screens ──────────────────────────────────────────────────
import HomeScreen from '../screens/feed/HomeScreen';
import ExploreScreen from '../screens/feed/ExploreScreen';
import ReelsScreen from '../screens/feed/ReelsScreen';
import GamingHubScreen from '../screens/gaming/GamingHubScreen';
import LiveBrowseScreen from '../screens/live/LiveBrowseScreen';
import StoriesScreen from '../screens/stories/StoriesScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import ThreadScreen from '../screens/messages/ThreadScreen';
import NotificationsScreen from '../screens/feed/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SearchScreen from '../screens/search/SearchScreen';
import CreatorDashboardScreen from '../screens/creator/CreatorDashboardScreen';
import CreatePostScreen from '../screens/creator/CreatePostScreen';
import CreateReelScreen from '../screens/creator/CreateReelScreen';
import CreateStoryScreen from '../screens/creator/CreateStoryScreen';
import ContentLibraryScreen from '../screens/creator/ContentLibraryScreen';
import GoLiveScreen from '../screens/live/GoLiveScreen';
import LiveStreamScreen from '../screens/live/LiveStreamScreen';
import GameScreen from '../screens/gaming/GameScreen';
import ClipsScreen from '../screens/gaming/ClipsScreen';
import LeaderboardScreen from '../screens/gaming/LeaderboardScreen';
import TournamentsScreen from '../screens/gaming/TournamentsScreen';
import MonetizationScreen from '../screens/monetization/MonetizationScreen';
import SubscriptionScreen from '../screens/monetization/SubscriptionScreen';
import EarningsScreen from '../screens/monetization/EarningsScreen';
import TipScreen from '../screens/monetization/TipScreen';
import ImportScreen from '../screens/import/ImportScreen';
import ChatHubScreen from '../screens/chat/ChatHubScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import PrivacyScreen from '../screens/settings/PrivacyScreen';
import NotificationPrefsScreen from '../screens/settings/NotificationPrefsScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import VideoPlayerScreen from '../screens/media/VideoPlayerScreen';
import PostDetailScreen from '../screens/feed/PostDetailScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Kids Tab Navigator ───────────────────────────────────────────
function KidsTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: '#1A2035',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 60,
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="KidsHome"
        component={KidsHomeScreen}
        options={{ title: 'Watch', tabBarIcon: ({ color }) => <Ionicons name="play-circle" size={26} color={color} /> }}
      />
      <Tab.Screen
        name="KidsProfile"
        component={KidsProfileScreen}
        options={{ title: 'My Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>⭐</Text> }}
      />
    </Tab.Navigator>
  );
}

// Kids stack — KidsTabs + ParentalControls (accessible from settings icon in KidsHome)
function KidsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="KidsTabs" component={KidsTabs} />
      <Stack.Screen name="ParentalControls" component={ParentalControlsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ presentation: 'fullScreenModal', animation: 'fade', headerShown: false }} />
    </Stack.Navigator>
  );
}

// ─── Main Tab Navigator ───────────────────────────────────────────
function MainTabs() {
  const insets = useSafeAreaInsets();
  const unreadCount = useNotificationStore(s => s.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={{ flex: 1, backgroundColor: 'rgba(10,10,15,0.92)' }} />
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} /> }} />
      <Tab.Screen name="Explore" component={ExploreScreen}
        options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} /> }} />
      <Tab.Screen name="Gaming" component={GamingHubScreen}
        options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'game-controller' : 'game-controller-outline'} size={24} color={color} /> }} />
      <Tab.Screen name="Chat" component={ChatHubScreen}
        options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} /> }} />
      <Tab.Screen name="Messages" component={MessagesScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.primary },
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'mail' : 'mail-outline'} size={24} color={color} />,
        }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} /> }} />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ────────────────────────────────────────────────
export default function RootNavigator() {
  const { isAuthenticated, isLoading, legalAccepted, ageGroup, isKidsMode } = useAuthStore();

  if (isLoading) return null;

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: Colors.primary,
          background: Colors.background,
          card: Colors.backgroundCard,
          text: Colors.textPrimary,
          border: Colors.border,
          notification: Colors.primary,
        }
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>

        {/* ── Kids Mode: child gets only the Kids experience ── */}
        {isKidsMode ? (
          <Stack.Screen name="Kids" component={KidsNavigator} />
        ) :

        /* ── Legal gate: age not yet verified ── */
        !legalAccepted ? (
          <>
            <Stack.Screen name="AgeVerification" component={AgeVerificationScreen} />
            <Stack.Screen name="KidsSetup" component={KidsSetupScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="TermsAcceptance" component={TermsAcceptanceScreen} options={{ animation: 'slide_from_right' }} />
          </>
        ) :

        /* ── Auth gate: legal accepted but not logged in ── */
        !isAuthenticated ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="OAuth" component={OAuthScreen} />
          </>
        ) :

        /* ── Main app ── */
        (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Reels" component={ReelsScreen} options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
            <Stack.Screen name="Stories" component={StoriesScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="Thread" component={ThreadScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="UserProfile" component={ProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ContentLibrary" component={ContentLibraryScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="CreateReel" component={CreateReelScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="CreateStory" component={CreateStoryScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="GoLive" component={GoLiveScreen} options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="LiveStream" component={LiveStreamScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="LiveBrowse" component={LiveBrowseScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Game" component={GameScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Clips" component={ClipsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Tournaments" component={TournamentsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Monetization" component={MonetizationScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Subscribe" component={SubscriptionScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Earnings" component={EarningsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Tip" component={TipScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ChatHub" component={ChatHubScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Import" component={ImportScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Security" component={SecurityScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="NotificationPrefs" component={NotificationPrefsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ presentation: 'fullScreenModal', animation: 'fade', headerShown: false }} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
