import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { colors } from '../src/constants';
import { initDatabase } from '../src/database';
import { useLogStore, useTargetStore, useSettingsStore } from '../src/stores';
import { initNotificationChannel } from '../src/services/notifications';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [hydrated, setHydrated] = useState(useSettingsStore.persist.hasHydrated());
  const setDbReady = useSettingsStore((s) => s.setDbReady);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Wait for zustand persist hydration before making routing decisions
  useEffect(() => {
    if (hydrated) return;
    const unsub = useSettingsStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, [hydrated]);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database
        await initDatabase();
        setDbReady(true);
        await initNotificationChannel();

        // Load initial data into stores
        await Promise.all([
          useLogStore.getState().getTodayLogs(),
          useTargetStore.getState().loadTargets(),
        ]);

        setAppReady(true);
      } catch (error) {
        console.error('[Hayat] Failed to initialize app:', error);
        // Still set ready so user sees something (error state could be added)
        setAppReady(true);
      }
    }

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (appReady && fontsLoaded && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [appReady, fontsLoaded, hydrated]);

  if (!appReady || !fontsLoaded || !hydrated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="body-fill"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      {!onboardingComplete && <Redirect href="/onboarding" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
