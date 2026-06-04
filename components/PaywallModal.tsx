import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ACCENT_GRADIENT, CARD_SHADOW, COLORS, RADIUS } from '../constants/theme';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/purchases';

const PRIVACY_URL = 'https://emtc.github.io/haru-record/privacy.html';
const TERMS_URL   = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
import { useSubscription } from '../lib/subscriptionContext';
import { t } from '../lib/i18n';

type Plan = 'yearly' | 'monthly';

export function PaywallModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { refresh } = useSubscription();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) getOfferings().then(setOfferings);
  }, [visible]);

  const selectedPkg = plan === 'yearly' ? offerings?.current?.annual : offerings?.current?.monthly;

  const compareRows = [
    { feature: t('paywall.row_records'), free: t('paywall.free_records'), premium: t('paywall.premium_records') },
    { feature: t('paywall.row_photos'),  free: t('paywall.free_photos'),  premium: t('paywall.premium_photos')  },
    { feature: t('paywall.row_compare'), free: t('paywall.free_compare'), premium: t('paywall.premium_compare') },
    { feature: t('paywall.row_ads'),     free: t('paywall.free_ads'),     premium: t('paywall.premium_ads')     },
  ];

  async function handlePurchase() {
    if (!selectedPkg) {
      Alert.alert(t('paywall.loading_title'), t('paywall.loading_body'));
      return;
    }
    setLoading(true);
    try {
      await purchasePackage(selectedPkg);
      await refresh();
      onClose();
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert(t('paywall.error_title'), e?.message ?? t('paywall.error_body'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      await restorePurchases();
      await refresh();
      Alert.alert(t('paywall.done_title'), t('paywall.restore_ok'));
      onClose();
    } catch {
      Alert.alert(t('paywall.restore_err_title'), t('paywall.restore_err'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={16} color={COLORS.ink2} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <LinearGradient
              colors={ACCENT_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <MaterialCommunityIcons name="crown" size={26} color="#fff" />
            </LinearGradient>

            <Text style={styles.title}>{t('paywall.title')}</Text>
            <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>

            {/* Comparison table */}
            <View style={styles.compareCard}>
              <View style={[styles.compareRow, styles.compareHeader]}>
                <View style={styles.compareFeatureCell}>
                  <Text style={styles.compareHeaderText}>{t('paywall.feature_col')}</Text>
                </View>
                <View style={styles.compareValueCell}>
                  <Text style={styles.compareHeaderText}>{t('paywall.free_col')}</Text>
                </View>
                <View style={styles.compareValueCell}>
                  <Text style={styles.compareHeaderTextAccent}>{t('paywall.premium_col')}</Text>
                </View>
              </View>
              {compareRows.map((row, i) => (
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

            <View style={styles.planRow}>
              <Pressable
                style={[styles.planCard, plan === 'yearly' && styles.planCardActive]}
                onPress={() => setPlan('yearly')}
              >
                <View style={styles.recommendBadge}>
                  <Text style={styles.recommendText}>20% OFF</Text>
                </View>
                <Text style={[styles.planLabel, plan === 'yearly' && styles.planLabelActive]}>{t('paywall.yearly_label')}</Text>
                <Text style={[styles.planPrice, plan === 'yearly' && styles.planPriceActive]}>{t('paywall.yearly_price')}</Text>
                <Text style={[styles.planSub,   plan === 'yearly' && styles.planSubActive]}>{t('paywall.yearly_per_month')}</Text>
              </Pressable>
              <Pressable
                style={[styles.planCard, plan === 'monthly' && styles.planCardActive]}
                onPress={() => setPlan('monthly')}
              >
                <Text style={[styles.planLabel, plan === 'monthly' && styles.planLabelActive]}>{t('paywall.monthly_label')}</Text>
                <Text style={[styles.planPrice, plan === 'monthly' && styles.planPriceActive]}>{t('paywall.monthly_price')}</Text>
                <Text style={[styles.planSub,   plan === 'monthly' && styles.planSubActive]}>{t('paywall.monthly_sub')}</Text>
              </Pressable>
            </View>

            <Pressable onPress={handlePurchase} disabled={loading} style={styles.ctaWrap}>
              <LinearGradient
                colors={ACCENT_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaBtn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.ctaText}>
                      {plan === 'yearly' ? t('paywall.cta_yearly') : t('paywall.cta_monthly')}
                    </Text>
                }
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.restoreBtn} onPress={handleRestore} disabled={loading}>
              <Text style={styles.restoreText}>{t('paywall.restore')}</Text>
            </Pressable>

            <Text style={styles.legal}>{t('paywall.legal')}</Text>

            <View style={styles.legalLinks}>
              <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
                <Text style={styles.legalLink}>{t('paywall.terms')}</Text>
              </Pressable>
              <Text style={styles.legalSep}>·</Text>
              <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
                <Text style={styles.legalLink}>{t('paywall.privacy')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    paddingTop: 28,
    width: '100%',
    maxHeight: '88%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(120,90,140,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.ink2,
    textAlign: 'center',
    marginBottom: 22,
  },
  compareCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 14,
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
  compareFeatureCell: { flex: 2, paddingLeft: 14, paddingVertical: 11, justifyContent: 'center' },
  compareValueCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  compareHeaderText: { fontSize: 9, color: COLORS.ink2, letterSpacing: 1.0, fontWeight: '500' },
  compareHeaderTextAccent: { fontSize: 9, color: COLORS.purple, letterSpacing: 1.0, fontWeight: '600' },
  compareBodyText: { fontSize: 12, color: COLORS.ink },
  compareFreeText: { fontSize: 12, color: COLORS.ink2 },
  comparePremiumText: { fontSize: 12, color: COLORS.purple, fontWeight: '500' },

  planRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  planCard: {
    flex: 1,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderColor: 'rgba(120,90,140,0.15)',
    backgroundColor: '#fafafa',
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 2,
    position: 'relative',
    overflow: 'visible',
  },
  planCardActive: {
    borderColor: COLORS.accent2,
    backgroundColor: 'rgba(201,168,230,0.10)',
  },
  recommendBadge: {
    position: 'absolute',
    top: -11,
    backgroundColor: COLORS.accent2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  recommendText:    { fontSize: 9, color: '#fff', fontWeight: '600' },
  planLabel:        { fontSize: 10, color: COLORS.ink2, letterSpacing: 0.4 },
  planLabelActive:  { color: COLORS.purple },
  planPrice:        { fontSize: 20, fontWeight: '600', color: COLORS.ink, marginTop: 2 },
  planPriceActive:  { color: COLORS.purple },
  planSub:          { fontSize: 9, color: COLORS.ink3 },
  planSubActive:    { color: COLORS.ink2 },

  ctaWrap: { marginBottom: 10 },
  ctaBtn: { paddingVertical: 14, borderRadius: RADIUS.cardLg, alignItems: 'center' },
  ctaText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  restoreBtn: { alignItems: 'center', paddingVertical: 8, marginBottom: 6 },
  restoreText: { fontSize: 11, color: COLORS.ink2 },

  legal: {
    fontSize: 9,
    color: COLORS.ink3,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 10,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legalLink: { fontSize: 9, color: COLORS.ink2, textDecorationLine: 'underline' },
  legalSep:  { fontSize: 9, color: COLORS.ink3 },
});
