import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import MobileAds, { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';
import { openDb, getHasSeenOnboarding, getLastAdShownDate, setLastAdShownDate } from '../lib/database';
import { initPurchases } from '../lib/purchases';
import { SubscriptionProvider, useSubscription } from '../lib/subscriptionContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const APP_OPEN_AD_UNIT_ID = 'ca-app-pub-2989531368920692/7457350049';
const AD_INTERVAL_DAYS = 3;

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      openDb();
      initPurchases();
      // 初期化と最低表示時間を並行して待つ（長い方に合わせる）
      await Promise.all([
        MobileAds().initialize(),
        new Promise(resolve => setTimeout(resolve, 500)),
      ]);
      await SplashScreen.hideAsync();
      if (!getHasSeenOnboarding()) {
        router.replace('/onboarding');
      }
    }
    init();
  }, []);

  return (
    <SubscriptionProvider>
      <Stack>
        <Stack.Screen name="(tabs)"         options={{ headerShown: false }} />
        <Stack.Screen name="add"            options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="treatment/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="edit-treatment" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="photo-viewer"   options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="paywall"        options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="onboarding"    options={{ headerShown: false, animation: 'none' }} />
      </Stack>
      <StartupAd />
    </SubscriptionProvider>
  );
}

function StartupAd() {
  const { isPremium, isLoading } = useSubscription();

  useEffect(() => {
    if (isLoading || isPremium) return;

    const lastShown = getLastAdShownDate();
    if (lastShown) {
      const daysSince = (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < AD_INTERVAL_DAYS) return;
    }

    const ad = AppOpenAd.createForAdRequest(APP_OPEN_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      ad.show();
      setLastAdShownDate(new Date().toISOString());
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {});

    ad.load();

    return () => {
      unsubLoaded();
      unsubError();
    };
  }, [isLoading, isPremium]);

  return null;
}
