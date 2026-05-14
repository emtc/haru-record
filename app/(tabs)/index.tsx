import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ACCENT_GRADIENT, BG_GRADIENT, COLORS } from '../../constants/theme';
import { FilterCategory, Treatment } from '../../types';
import { getAllTreatments, openDb } from '../../lib/database';
import { getElapsed } from '../../lib/elapsed';
import CategoryChip from '../../components/CategoryChip';
import TreatmentItem from '../../components/TreatmentItem';
import { useSubscription } from '../../lib/subscriptionContext';

const FILTERS: FilterCategory[] = ['すべて', '整形', '脱毛', 'スキンケア', '注入', 'その他'];

export default function HomeScreen() {
  const { isPremium } = useSubscription();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('すべて');
  const [sortAsc, setSortAsc] = useState(false);

  // Initialize DB once
  useEffect(() => { openDb(); }, []);

  useFocusEffect(
    useCallback(() => {
      setTreatments(getAllTreatments());
    }, [])
  );

  const filtered = (activeFilter === 'すべて'
    ? treatments
    : treatments.filter(t => t.category === activeFilter)
  ).slice().sort((a, b) => sortAsc
    ? a.date.localeCompare(b.date)
    : b.date.localeCompare(a.date)
  );

  const isEmpty = treatments.length === 0;

  return (
    <View style={styles.root}>
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ロゴ行 — 右端に ☆/★（グラデーション●）で会員ステータスを表示 */}
        <View style={styles.logoRow}>
          <View style={styles.logoBlock}>
            <LinearGradient
              colors={ACCENT_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.petalMark}
            />
            <Text style={styles.logoText}>haru record</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* DEV: オンボーディングプレビュー（確認後に削除） */}
            <Pressable onPress={() => router.push('/onboarding')} hitSlop={12} style={styles.devBtn}>
              <Text style={styles.devBtnText}>OB</Text>
            </Pressable>
            {isPremium ? (
              <LinearGradient
                colors={ACCENT_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.starCircle}
              >
                <MaterialCommunityIcons name="crown" size={15} color="#fff" />
              </LinearGradient>
            ) : (
              <Pressable onPress={() => router.push('/paywall')} hitSlop={8}>
                <View style={styles.starCircleOutline}>
                  <MaterialCommunityIcons name="crown-outline" size={15} color={COLORS.purple} />
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Category chips — always rendered to maintain stable layout */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map(f => (
            <CategoryChip
              key={f}
              label={f}
              active={activeFilter === f}
              onPress={() => setActiveFilter(f)}
            />
          ))}
        </ScrollView>

        {isEmpty ? (
          <EmptyState />
        ) : (
          /* 件数・ソートをリストと同じ ScrollView に入れて一体化 */
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.yearRow}>
              <Text style={styles.year}>全{filtered.length}件</Text>
              <Pressable onPress={() => setSortAsc(v => !v)}>
                <Text style={styles.sort}>{sortAsc ? '古い順 ↑' : '新しい順 ↓'}</Text>
              </Pressable>
            </View>
            <View style={styles.listContent}>
              <View style={styles.rail} />
              {filtered.map((t, i) => (
                <TreatmentItem
                  key={t.id}
                  treatment={t}
                  elapsed={getElapsed(t.date)}
                  isFirst={i === 0}
                  onPress={() => router.push(`/treatment/${t.id}`)}
                  photoUri={t.iconUri || undefined}
                />
              ))}
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>

    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyIcon}>
        <View style={styles.emptyInner} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>最初の記録を、{'\n'}そっと残してみませんか。</Text>
      <Text style={styles.emptySubtitle}>
        施術日からの経過日数と写真を、{'\n'}haru-record が静かに見守ります。
      </Text>
      <Pressable onPress={() => router.push('/add')}>
        <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>＋ 施術を追加</Text>
        </LinearGradient>
      </Pressable>
      <Text style={styles.emptyHint}>あとからいつでも編集できます</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 6,
  },
  logoBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  petalMark: { width: 11, height: 20, borderRadius: 6 },
  logoText: { fontSize: 20, fontWeight: '300', color: COLORS.ink, letterSpacing: -0.3 },
  starCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCircleOutline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(124,95,163,0.35)',
  },
  devBtn: { backgroundColor: 'rgba(120,90,140,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  devBtnText: { fontSize: 11, fontWeight: '600', color: COLORS.purple },
  chipsScroll: { flexGrow: 0, flexShrink: 0 },
  chips: { paddingHorizontal: 22, paddingBottom: 24, paddingTop: 16, gap: 6 },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 22,
    paddingBottom: 10,
  },
  year: { fontSize: 12, color: COLORS.ink2, letterSpacing: 0.4 },
  sort: { fontSize: 12, color: COLORS.ink2 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingTop: 8, position: 'relative' },
  rail: {
    position: 'absolute',
    left: 30,
    top: 12,
    bottom: 12,
    width: 1,
    backgroundColor: COLORS.rail,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  emptyInner: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#fff' },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.ink,
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 27,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.ink2,
    lineHeight: 19.8,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '500', color: '#fff' },
  emptyHint: { fontSize: 10, color: COLORS.ink2, marginTop: 10 },
});
