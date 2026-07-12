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
import 'react-native-gesture-handler';
import React, { useEffect, useCallback } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import FlashMessage from 'react-native-flash-message';
import { StripeProvider } from '@stripe/stripe-react-native';

import RootNavigator from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import { connectSocket, disconnectSocket } from './src/services/socket';
import { clearKidsSession } from './src/utils/kidsSession';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Suppress known non-critical warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
]);

// Notification handler — show alerts even when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppInner() {
  const { restoreSession, isAuthenticated, isLoading } = useAuthStore();

  const initialize = useCallback(async () => {
    try {
      await restoreSession();
    } finally {
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    initialize();
  }, []);

  // Connect/disconnect socket based on auth state.
  // Kids Mode must NEVER have a socket connection — it exposes online
  // status, user ID, and is a direct message/notification delivery channel.
  const { isKidsMode } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated && !isKidsMode) {
      connectSocket();
    } else {
      // Disconnect any existing socket when entering kids mode
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [isAuthenticated, isKidsMode]);

  // Register for push notifications.
  // Explicitly excluded from Kids Mode — a push token tied to a child's
  // session could be used to deliver contact attempts or reveal that
  // a child is actively using the device. Never registered in kids mode.
  useEffect(() => {
    const registerPush = async () => {
      // Hard block — no push tokens in kids mode, no exceptions
      if (isKidsMode) return;

      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-eas-project-id', // matches app.json extra.eas.projectId
        });

        // Send token to backend for notification delivery
        const { usersAPI } = require('./src/services/api');
        await usersAPI.registerPushToken(tokenData.data).catch(() => {
          // Non-fatal — app works fine without push
          console.warn('Push token registration failed');
        });
      } catch (err) {
        console.warn('Push notification setup failed:', err.message);
      }
    };

    if (isAuthenticated && !isKidsMode) registerPush();
  }, [isAuthenticated, isKidsMode]);

  // Clear kids session secret when exiting kids mode so old signatures
  // cannot be replayed. Called reactively whenever isKidsMode turns false.
  useEffect(() => {
    if (!isKidsMode) {
      clearKidsSession().catch(() => {});
    }
  }, [isKidsMode]);

  if (isLoading) return null;

  return <RootNavigator />;
}

export default function App() {
  const STRIPE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_KEY} merchantIdentifier="merchant.com.venture.creatorplatform">
          <QueryClientProvider client={queryClient}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
            <AppInner />
            <FlashMessage
              position="top"
              style={{ marginTop: 40 }}
              titleStyle={{ fontSize: 14, fontWeight: '700' }}
            />
          </QueryClientProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
