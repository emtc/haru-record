import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import MobileAds, { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { openDb, getHasSeenOnboarding, getLastAdShownDate, setLastAdShownDate } from '../lib/database';
import { initPurchases } from '../lib/purchases';
import { SubscriptionProvider, useSubscription } from '../lib/subscriptionContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const APP_OPEN_AD_UNIT_ID = 'ca-app-pub-2989531368920692/7457350049';
const AD_INTERVAL_DAYS = 3; // 何日おきに表示するか

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      openDb();
      initPurchases();
      // ATT ダイアログ（iOS のみ）— AdMob 初期化より先に実行
      if (Platform.OS === 'ios') {
        await requestTrackingPermissionsAsync();
      }
      // AdMob 初期化（ATT 結果を自動反映）
      await MobileAds().initialize();
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

    // 前回表示から AD_INTERVAL_DAYS 日未満なら表示しない
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

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      // 広告取得失敗は無視してアプリを通常通り起動
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubError();
    };
  }, [isLoading, isPremium]);

  return null;
}
