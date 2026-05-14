import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ACCENT_GRADIENT, BG_GRADIENT, CARD_SHADOW, COLORS, RADIUS } from '../constants/theme';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/purchases';
import { useSubscription } from '../lib/subscriptionContext';

// ↓ 公開前にプライバシーポリシー・利用規約のURLを設定してください
const PRIVACY_URL = 'https://example.com/privacy';
const TERMS_URL   = 'https://example.com/terms';

const COMPARE_ROWS = [
  { feature: '記録の作成',           free: '◯',      premium: '◯'   },
  { feature: '写真の追加',           free: '3枚まで', premium: '無制限' },
  { feature: '写真のBefore/After比較', free: '—', premium: '◯' },
  { feature: '広告',                free: 'あり',   premium: 'なし' },
];

type Plan = 'yearly' | 'monthly';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { refresh } = useSubscription();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getOfferings().then(setOfferings);
  }, []);

  const monthlyPkg  = offerings?.current?.monthly;
  const yearlyPkg   = offerings?.current?.annual;
  const selectedPkg = plan === 'yearly' ? yearlyPkg : monthlyPkg;

  async function handlePurchase() {
    if (!selectedPkg) {
      Alert.alert('読み込み中', '購入情報を取得しています。しばらくお待ちください。');
      return;
    }
    setLoading(true);
    try {
      await purchasePackage(selectedPkg);
      await refresh();
      router.back();
    } catch (e: any) {
      if (!e?.userCancelled) {
        Alert.alert('購入エラー', e?.message ?? '購入に失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      await restorePurchases();
      await refresh();
      Alert.alert('完了', '購入情報を復元しました。');
      router.back();
    } catch {
      Alert.alert('エラー', '復元に失敗しました。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />

      {/* Close button — safe area 考慮 */}
      <Pressable
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        accessibilityLabel="閉じる"
        accessibilityRole="button"
      >
        <Feather name="x" size={18} color={COLORS.ink2} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Icon */}
        <LinearGradient
          colors={ACCENT_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <MaterialCommunityIcons name="crown" size={34} color="#fff" />
        </LinearGradient>

        <Text style={styles.title}>プレミアムプラン</Text>
        <Text style={styles.subtitle}>美容記録をもっと自由に</Text>

        {/* Comparison table */}
        <View style={styles.compareCard}>
          <View style={[styles.compareRow, styles.compareHeader]}>
            <View style={styles.compareFeatureCell}>
              <Text style={styles.compareHeaderText}>機能</Text>
            </View>
            <View style={styles.compareValueCell}>
              <Text style={styles.compareHeaderText}>無料</Text>
            </View>
            <View style={styles.compareValueCell}>
              <Text style={styles.compareHeaderTextAccent}>プレミアム</Text>
            </View>
          </View>
          {COMPARE_ROWS.map((row, i) => (
            <View key={i} style={[styles.compareRow, i > 0 && styles.compareRowBorder]}>
              <View style={styles.compareFeatureCell}>
                <Text style={styles.compareBodyText}>{row.feature}</Text>
              </View>
              <View style={styles.compareValueCell}>
                <Text style={styles.compareFreeText}>{row.free}</Text>
              </View>
              <View style={styles.compareValueCell}>
                <Text style={styles.comparePremiumText}>{row.premium}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.planRow}>
          {/* 年額 */}
          <Pressable
            style={[styles.planCard, plan === 'yearly' && styles.planCardActive]}
            onPress={() => setPlan('yearly')}
          >
            <View style={styles.recommendBadge}>
              <Text style={styles.recommendText}>20% OFF</Text>
            </View>
            <Text style={[styles.planLabel, plan === 'yearly' && styles.planLabelActive]}>年額プラン</Text>
            <Text style={[styles.planPrice, plan === 'yearly' && styles.planPriceActive]}>¥4,800</Text>
            <Text style={[styles.planSub,   plan === 'yearly' && styles.planSubActive]}>月々 ¥400</Text>
          </Pressable>

          {/* 月額 */}
          <Pressable
            style={[styles.planCard, plan === 'monthly' && styles.planCardActive]}
            onPress={() => setPlan('monthly')}
          >
            <Text style={[styles.planLabel, plan === 'monthly' && styles.planLabelActive]}>月額プラン</Text>
            <Text style={[styles.planPrice, plan === 'monthly' && styles.planPriceActive]}>¥500</Text>
            <Text style={[styles.planSub,   plan === 'monthly' && styles.planSubActive]}>月払い</Text>
          </Pressable>
        </View>

        {/* CTA */}
        <Pressable style={styles.ctaWrap} onPress={handlePurchase} disabled={loading}>
          <LinearGradient
            colors={ACCENT_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBtn}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>
                  {plan === 'yearly' ? '年額 ¥4,800 で始める' : '月額 ¥500 で始める'}
                </Text>
            }
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.restoreBtn} onPress={handleRestore} disabled={loading}>
          <Text style={styles.restoreText}>購入を復元する</Text>
        </Pressable>

        <Text style={styles.legal}>
          プランはいつでもキャンセル可能です。{'\n'}
          支払いはApple IDに請求されます。
        </Text>

        {/* 利用規約・プライバシーポリシー（App Store 審査要件） */}
        <View style={styles.legalLinks}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.legalLink}>利用規約</Text>
          </Pressable>
          <Text style={styles.legalSep}>·</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.legalLink}>プライバシーポリシー</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(120,90,140,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.ink,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.ink2,
    marginBottom: 36,
  },

  compareCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 20,
    ...CARD_SHADOW,
  },
  compareHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,90,140,0.12)',
  },
  compareRow: { flexDirection: 'row' },
  compareRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120,90,140,0.08)',
  },
  compareFeatureCell: { flex: 2, paddingLeft: 16, paddingVertical: 12, justifyContent: 'center' },
  compareValueCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  compareHeaderText: { fontSize: 10, color: COLORS.ink2, letterSpacing: 1.0, fontWeight: '500' },
  compareHeaderTextAccent: { fontSize: 10, color: COLORS.purple, letterSpacing: 1.0, fontWeight: '600' },
  compareBodyText: { fontSize: 13, color: COLORS.ink },
  compareFreeText: { fontSize: 13, color: COLORS.ink2 },
  comparePremiumText: { fontSize: 13, color: COLORS.purple, fontWeight: '500' },

  planRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderColor: 'rgba(120,90,140,0.15)',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 3,
    position: 'relative',
    overflow: 'visible',
  },
  planCardActive: {
    borderColor: COLORS.accent2,
    backgroundColor: 'rgba(201,168,230,0.10)',
  },
  recommendBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: COLORS.accent2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  recommendText: { fontSize: 10, color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  planLabel:       { fontSize: 11, color: COLORS.ink2, letterSpacing: 0.4 },
  planLabelActive: { color: COLORS.purple },
  planPrice:       { fontSize: 22, fontWeight: '600', color: COLORS.ink, marginTop: 4 },
  planPriceActive: { color: COLORS.purple },
  planSub:         { fontSize: 10, color: COLORS.ink3 },
  planSubActive:   { color: COLORS.ink2 },

  ctaWrap: { width: '100%', marginBottom: 14 },
  ctaBtn: {
    paddingVertical: 16,
    borderRadius: RADIUS.cardLg,
    alignItems: 'center',
  },
  ctaText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },

  restoreBtn: { paddingVertical: 10, marginBottom: 12 },
  restoreText: { fontSize: 12, color: COLORS.ink2 },

  legal: {
    fontSize: 10,
    color: COLORS.ink3,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: { fontSize: 10, color: COLORS.ink2, textDecorationLine: 'underline' },
  legalSep:  { fontSize: 10, color: COLORS.ink3 },
});
