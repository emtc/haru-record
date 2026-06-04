import { Platform } from 'react-native';

// RevenueCat ダッシュボード → Apps → API keys で取得したキーを設定してください
// iOS:     app.revenuecat.com → プロジェクト → iOS app → API keys → Public app-specific keys
// Android: app.revenuecat.com → プロジェクト → Android app → API keys
const RC_IOS_KEY     = 'appl_gTYgmmwQhUPodJmBhUMgNAXSJXt';
const RC_ANDROID_KEY = 'goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

const API_KEY = Platform.select({ ios: RC_IOS_KEY, android: RC_ANDROID_KEY }) ?? '';

export const ENTITLEMENT_ID = 'premium';

// ネイティブモジュールが存在しない場合（Expo Go / 開発環境）はモックを使用
let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').default;
} catch {
  // Expo Go など、カスタムビルドなし環境ではスキップ
}

export function initPurchases(): void {
  if (!Purchases) return;
  try {
    Purchases.setLogLevel('WARN');
    Purchases.configure({ apiKey: API_KEY });
  } catch (e) {
    console.warn('[Purchases] init failed:', e);
  }
}

export async function checkPremium(): Promise<boolean> {
  if (!Purchases) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

export async function getOfferings() {
  if (!Purchases) return null;
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: any) {
  if (!Purchases) throw new Error('購入機能はリリースビルドでのみ利用できます。');
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  if (!Purchases) throw new Error('購入機能はリリースビルドでのみ利用できます。');
  return Purchases.restorePurchases();
}


export function addCustomerInfoUpdateListener(callback: (isPremium: boolean) => void): () => void {
  if (!Purchases) return () => {};
  const listener = Purchases.addCustomerInfoUpdateListener((info: any) => {
    callback(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
  });
  return () => listener?.remove?.() ?? listener?.();
}
