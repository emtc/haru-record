import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarPicker } from '../components/CalendarPicker';
import { ACCENT_GRADIENT, BG_GRADIENT, COLORS } from '../constants/theme';
import { insertTreatment, markOnboardingSeen } from '../lib/database';
import { todayString } from '../lib/elapsed';
import { generateId } from '../lib/uuid';
import { Category } from '../types';
import { t, tCategory } from '../lib/i18n';

const { width: W } = Dimensions.get('window');
const TOTAL = 7;
// 0:B  1-3:A(step 0-2)  4:C-0  5:C-1  6:C-2

const DOTS_H = 28;
const SLOT_H = 42;

// ─── PetalMark ───────────────────────────────────────────────────────────
function PetalMark({ size = 20, white = false }: { size?: number; white?: boolean }) {
  const w = Math.round(size * 0.55);
  if (white) {
    return <View style={{ width: w, height: size, borderRadius: w / 2, backgroundColor: 'rgba(255,255,255,0.88)' }} />;
  }
  return (
    <LinearGradient
      colors={ACCENT_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ width: w, height: size, borderRadius: w / 2 }}
    />
  );
}

// ─── 7-dot progress indicator ─────────────────────────────────────────────
function ProgressDots({ current }: { current: number }) {
  return (
    <View style={pg.dotsRow}>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <View key={i} style={[pg.dot, i === current && pg.dotActive]} />
      ))}
    </View>
  );
}

// ─── Shared logo header ─────────────────────────────────────────────────
function LogoHeader({ onClose }: { onClose: () => void }) {
  return (
    <View style={pg.logoRow}>
      <PetalMark size={20} />
      <Text style={pg.logoText}>haru record</Text>
      <Pressable onPress={onClose} hitSlop={12} style={pg.closeBtn}>
        <Feather name="x" size={18} color={COLORS.ink2} />
      </Pressable>
    </View>
  );
}

// ─── Mini preview cards ───────────────────────────────────────────────────
function MiniListPreview() {
  const rows = [
    { name: t('onboarding.mini_row1_name'), sub: t('onboarding.mini_row1_sub'), days: '60', color: '#f5b0d8' },
    { name: t('onboarding.mini_row2_name'), sub: t('onboarding.mini_row2_sub'), days: '16', color: '#b0b4f4' },
    { name: t('onboarding.mini_row3_name'), sub: t('onboarding.mini_row3_sub'), days: '4',  color: '#eea8ec' },
  ];
  return (
    <View style={[mini.card, { transform: [{ rotate: '-2deg' }] }]}>
      {rows.map((r, i) => (
        <View key={i} style={mini.listRow}>
          <View style={[mini.swatch, { backgroundColor: r.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={mini.rowSub}>{r.sub}</Text>
            <Text style={mini.rowName} numberOfLines={1}>{r.name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={mini.daysLabel}>{t('onboarding.mini_elapsed')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={mini.daysNum}>{r.days}</Text>
              <Text style={mini.daysUnit}>{t('onboarding.mini_unit')}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function MiniPhotoPreview() {
  return (
    <View style={[mini.card, { transform: [{ rotate: '1.5deg' }] }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <View style={mini.dot} />
        <Text style={mini.rowSub}>{t('onboarding.mini_today')}</Text>
      </View>
      <LinearGradient colors={['#fcd5e3', '#e7d6f0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mini.photoLg} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 6 }}>
        <View style={[mini.dot, { opacity: 0.45 }]} />
        <Text style={mini.rowSub}>{t('onboarding.mini_1mo')}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <LinearGradient colors={['#f7dde6', '#f0e3f3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mini.photoSm} />
        <LinearGradient colors={['#f0e0ea', '#e3d8f0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mini.photoSm} />
      </View>
    </View>
  );
}

const WEEK_KEYS = ['weekdays.sun', 'weekdays.mon', 'weekdays.tue', 'weekdays.wed', 'weekdays.thu', 'weekdays.fri', 'weekdays.sat'];
const MARKED = new Set([4, 11, 21]);

function MiniCalendarPreview() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <View style={[mini.card, { transform: [{ rotate: '-1.5deg' }] }]}>
      <Text style={mini.monthLabel}>2026.05</Text>
      <View style={mini.calGrid}>
        {WEEK_KEYS.map(key => (
          <View key={key} style={mini.calCell}>
            <Text style={mini.weekDay}>{t(key)}</Text>
          </View>
        ))}
        {days.map(day => {
          const isToday = day === 14;
          const isMarked = MARKED.has(day);
          return (
            <View key={day} style={mini.calCell}>
              {isToday ? (
                <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mini.calBubble}>
                  <Text style={[mini.calDay, { color: '#fff' }]}>{day}</Text>
                </LinearGradient>
              ) : (
                <View style={mini.calBubble}>
                  <Text style={mini.calDay}>{day}</Text>
                  {isMarked && <View style={mini.calDot} />}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Page B: value prop ───────────────────────────────────────────────────
function PageB({ pageIndex, goNext, skip, onClose, topPad, bottomPad }: {
  pageIndex: number; goNext: () => void; skip: () => void; onClose: () => void;
  topPad: number; bottomPad: number;
}) {
  const features = [
    { icon: 'edit-3' as const,   label: t('onboarding.feature0_label'), sub: t('onboarding.feature0_sub') },
    { icon: 'camera' as const,   label: t('onboarding.feature1_label'), sub: t('onboarding.feature1_sub') },
    { icon: 'activity' as const, label: t('onboarding.feature2_label'), sub: t('onboarding.feature2_sub') },
  ];

  return (
    <View style={[pg.slide, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}>
      <LogoHeader onClose={onClose} />

      <View style={{ flex: 1, justifyContent: 'center', gap: 22 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={pg.eyebrow}>{t('onboarding.eyebrow')}</Text>
          <Text style={pg.headline}>{t('onboarding.headline')}</Text>
        </View>
        <View style={{ gap: 10 }}>
          {features.map((f, i) => (
            <View key={i} style={pg.featureRow}>
              <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pg.featureIcon}>
                <Feather name={f.icon} size={18} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={pg.featureLabel}>{f.label}</Text>
                <Text style={pg.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: DOTS_H, justifyContent: 'center', alignItems: 'center' }}>
        <ProgressDots current={pageIndex} />
      </View>
      <Pressable onPress={goNext} style={{ width: '100%' }}>
        <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pg.btn}>
          <Text style={pg.btnText}>{t('onboarding.start')}</Text>
          <Feather name="arrow-right" size={15} color="#fff" style={{ marginLeft: 6 }} />
        </LinearGradient>
      </Pressable>
      <View style={{ height: SLOT_H, justifyContent: 'center', alignItems: 'center' }}>
        <Pressable onPress={skip} hitSlop={12}>
          <Text style={pg.slotText}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Pages A: UI preview ──────────────────────────────────────────────────
const A_SLIDE_KEYS = [
  { Preview: MiniListPreview,     headlineKey: 'onboarding.slide0_headline', bodyKey: 'onboarding.slide0_body' },
  { Preview: MiniPhotoPreview,    headlineKey: 'onboarding.slide1_headline', bodyKey: 'onboarding.slide1_body' },
  { Preview: MiniCalendarPreview, headlineKey: 'onboarding.slide2_headline', bodyKey: 'onboarding.slide2_body' },
];

function PageA({ step, pageIndex, goNext, skip, onClose, topPad, bottomPad }: {
  step: number; pageIndex: number; goNext: () => void; skip: () => void; onClose: () => void;
  topPad: number; bottomPad: number;
}) {
  const { Preview, headlineKey, bodyKey } = A_SLIDE_KEYS[step];
  const isLast = step === 2;

  return (
    <View style={[pg.slide, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}>
      <LogoHeader onClose={onClose} />

      <View style={pg.centerArea}>
        <Preview />
        <View style={{ alignItems: 'center' }}>
          <Text style={pg.slideHeadline}>{t(headlineKey)}</Text>
          <Text style={pg.slideBody}>{t(bodyKey)}</Text>
        </View>
      </View>

      <View style={{ height: DOTS_H, justifyContent: 'center', alignItems: 'center' }}>
        <ProgressDots current={pageIndex} />
      </View>
      <Pressable onPress={goNext} style={{ width: '100%' }}>
        <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pg.btn}>
          <Text style={pg.btnText}>{isLast ? t('onboarding.slide2_next') : t('onboarding.next')}</Text>
          {!isLast && <Feather name="arrow-right" size={15} color="#fff" style={{ marginLeft: 6 }} />}
        </LinearGradient>
      </Pressable>
      <View style={{ height: SLOT_H, justifyContent: 'center', alignItems: 'center' }}>
        <Pressable onPress={skip} hitSlop={12}>
          <Text style={pg.slotText}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Page C-0: welcome card ───────────────────────────────────────────────
function PageC0({ pageIndex, goNext, onClose, topPad, bottomPad }: {
  pageIndex: number; goNext: () => void; onClose: () => void; topPad: number; bottomPad: number;
}) {
  return (
    <View style={[pg.slide, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}>
      <LogoHeader onClose={onClose} />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={c0.sampleCard}>
          <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={c0.cardIcon}>
            <PetalMark size={28} white />
          </LinearGradient>
          <Text style={c0.cardDate}>{t('onboarding.c0_date')}</Text>
          <Text style={c0.cardName}>{t('onboarding.c0_name')}</Text>
          <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={c0.cardBadge}>
            <Text style={c0.badgeSmall}>{t('onboarding.c0_elapsed')}</Text>
            <Text style={c0.badgeBig}>0</Text>
            <Text style={c0.badgeUnit}>{t('onboarding.c0_unit')}</Text>
          </LinearGradient>
        </View>
        <Text style={[pg.slideHeadline, { marginTop: 28 }]}>{t('onboarding.c0_headline')}</Text>
        <Text style={[pg.slideBody, { marginTop: 12 }]}>{t('onboarding.c0_body')}</Text>
      </View>

      <View style={{ height: DOTS_H, justifyContent: 'center', alignItems: 'center' }}>
        <ProgressDots current={pageIndex} />
      </View>
      <Pressable onPress={goNext} style={{ width: '100%' }}>
        <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pg.btn}>
          <Text style={pg.btnText}>{t('onboarding.c0_add')}</Text>
        </LinearGradient>
      </Pressable>
      <View style={{ height: SLOT_H, justifyContent: 'center', alignItems: 'center' }}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={pg.slotText}>{t('onboarding.c0_later')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Page C-1: category picker ────────────────────────────────────────────
const CATS: { key: Category; subKey: string; color: string }[] = [
  { key: '脱毛',       subKey: 'onboarding.cat_hair_sub',    color: '#f5b0d8' },
  { key: 'スキンケア', subKey: 'onboarding.cat_skin_sub',    color: '#eea8ec' },
  { key: '注入',       subKey: 'onboarding.cat_inject_sub',  color: '#b0b4f4' },
  { key: '整形',       subKey: 'onboarding.cat_surgery_sub', color: '#c8a8f0' },
  { key: 'その他',     subKey: 'onboarding.cat_other_sub',   color: '#c4b4f0' },
];

function PageC1({ pageIndex, goNext, onClose, sel, setSel, topPad, bottomPad }: {
  pageIndex: number; goNext: () => void; onClose: () => void;
  sel: Category | null; setSel: (k: Category) => void;
  topPad: number; bottomPad: number;
}) {
  return (
    <View style={[pg.slide, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}>
      <LogoHeader onClose={onClose} />

      <Text style={c1.question}>{t('onboarding.c1_question')}</Text>
      <Text style={c1.questionSub}>{t('onboarding.c1_sub')}</Text>

      <View style={c1.catGrid}>
        {CATS.map(c => {
          const active = sel === c.key;
          return (
            <Pressable key={c.key} onPress={() => setSel(c.key)} style={[c1.catCard, active && c1.catCardActive]}>
              <View style={[c1.catSwatch, { backgroundColor: c.color }]} />
              <View>
                <Text style={c1.catLabel}>{tCategory(c.key)}</Text>
                <Text style={c1.catSub}>{t(c.subKey)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ height: DOTS_H, justifyContent: 'center', alignItems: 'center' }}>
        <ProgressDots current={pageIndex} />
      </View>
      <Pressable onPress={goNext} disabled={!sel} style={{ width: '100%', opacity: sel ? 1 : 0.4 }}>
        <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pg.btn}>
          <Text style={pg.btnText}>{t('onboarding.next')}</Text>
          <Feather name="arrow-right" size={15} color="#fff" style={{ marginLeft: 6 }} />
        </LinearGradient>
      </Pressable>
      <View style={{ height: SLOT_H }} />
    </View>
  );
}

// ─── Page C-2: name + date + save ────────────────────────────────────────
const CAT_COLOR: Record<Category, string> = {
  '整形':      '#c8a8f0',
  '脱毛':      '#f5b0d8',
  'スキンケア': '#eea8ec',
  '注入':      '#b0b4f4',
  'その他':    '#c4b4f0',
};

function PageC2({ pageIndex, save, onClose, category, name, setName, date, setDate, topPad, bottomPad }: {
  pageIndex: number; save: () => void; onClose: () => void;
  category: Category | null;
  name: string; setName: (s: string) => void;
  date: string; setDate: (s: string) => void;
  topPad: number; bottomPad: number;
}) {
  const canSave = name.trim().length > 0 && category != null;

  return (
    <View style={[pg.slide, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}>
      <LogoHeader onClose={onClose} />

      <Text style={c1.question}>{t('onboarding.c2_question')}</Text>
      <Text style={c1.questionSub}>{t('onboarding.c2_sub')}</Text>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {category && (
          <View style={c2.catChip}>
            <View style={[c2.catChipDot, { backgroundColor: CAT_COLOR[category] }]} />
            <Text style={c2.catChipText}>{tCategory(category)}</Text>
          </View>
        )}

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('onboarding.c2_ph')}
          placeholderTextColor={COLORS.ink3}
          style={c2.input}
          returnKeyType="done"
        />

        <CalendarPicker value={date} onChange={setDate} />
      </ScrollView>

      <View style={{ height: DOTS_H, justifyContent: 'center', alignItems: 'center' }}>
        <ProgressDots current={pageIndex} />
      </View>
      <Pressable onPress={save} disabled={!canSave} style={{ width: '100%', opacity: canSave ? 1 : 0.4 }}>
        <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pg.btn}>
          <Text style={pg.btnText}>{t('onboarding.c2_save')}</Text>
        </LinearGradient>
      </Pressable>
      <View style={{ height: SLOT_H }} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────
const DATA = Array.from({ length: TOTAL }, (_, i) => i);

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);

  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [treatmentName, setTreatmentName] = useState('');
  const [treatmentDate, setTreatmentDate] = useState(() => todayString());

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      currentIndexRef.current = viewableItems[0].index;
      setCurrentIndex(viewableItems[0].index);
      Keyboard.dismiss();
    }
  }).current;

  function scrollTo(idx: number) {
    flatRef.current?.scrollToIndex({ index: idx, animated: true });
  }

  function goNext() {
    const next = currentIndexRef.current + 1;
    if (next < TOTAL) scrollTo(next);
    else finish();
  }

  function jumpToC() {
    scrollTo(4);
  }

  function finish() {
    markOnboardingSeen();
    router.replace('/(tabs)');
  }

  function saveRecord() {
    if (!selectedCat || !treatmentName.trim()) return;
    insertTreatment({
      id: generateId(),
      name: treatmentName.trim(),
      category: selectedCat,
      date: treatmentDate,
      clinic: '',
      memo: '',
      iconUri: '',
      createdAt: new Date().toISOString(),
    });
    finish();
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <FlatList
        ref={flatRef}
        data={DATA}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        scrollEnabled={!(currentIndex === 5 && !selectedCat)}
        extraData={{ selectedCat, treatmentName, treatmentDate, currentIndex }}
        style={{ flex: 1 }}
        renderItem={({ item: idx }) => {
          let page: React.ReactNode;
          if (idx === 0) {
            page = <PageB pageIndex={idx} goNext={goNext} skip={jumpToC} onClose={finish} topPad={insets.top} bottomPad={insets.bottom} />;
          } else if (idx <= 3) {
            page = <PageA step={idx - 1} pageIndex={idx} goNext={goNext} skip={jumpToC} onClose={finish} topPad={insets.top} bottomPad={insets.bottom} />;
          } else if (idx === 4) {
            page = <PageC0 pageIndex={idx} goNext={goNext} onClose={finish} topPad={insets.top} bottomPad={insets.bottom} />;
          } else if (idx === 5) {
            page = <PageC1 pageIndex={idx} goNext={goNext} onClose={finish} sel={selectedCat} setSel={setSelectedCat} topPad={insets.top} bottomPad={insets.bottom} />;
          } else {
            page = <PageC2 pageIndex={idx} save={saveRecord} onClose={finish} category={selectedCat} name={treatmentName} setName={setTreatmentName} date={treatmentDate} setDate={setTreatmentDate} topPad={insets.top} bottomPad={insets.bottom} />;
          }
          return <View style={{ width: W, flex: 1 }}>{page}</View>;
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
});

const pg = StyleSheet.create({
  slide: {
    width: W,
    flex: 1,
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  logoText: { fontSize: 16, fontWeight: '300', color: COLORS.ink, letterSpacing: -0.3 },
  closeBtn: { position: 'absolute', right: 0, padding: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, color: COLORS.ink2, marginBottom: 12 },
  headline: { fontSize: 24, fontWeight: '500', color: COLORS.ink, textAlign: 'center', lineHeight: 36, letterSpacing: -0.4 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#b48cc8',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 13, fontWeight: '500', color: COLORS.ink },
  featureSub: { fontSize: 10, color: COLORS.ink2, marginTop: 2 },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 28 },
  slideHeadline: { fontSize: 22, fontWeight: '500', color: COLORS.ink, textAlign: 'center', lineHeight: 34, letterSpacing: -0.4 },
  slideBody: { fontSize: 12, color: COLORS.ink2, textAlign: 'center', lineHeight: 22, marginTop: 10 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(124,95,163,0.18)' },
  dotActive: { width: 20, backgroundColor: COLORS.purple },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#c9a8e6',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },
  slotText: { fontSize: 12, color: COLORS.ink2 },
});

const mini = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    width: 220,
    shadowColor: '#7c5fa3',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  swatch: { width: 30, height: 30, borderRadius: 8 },
  rowSub: { fontSize: 8, color: COLORS.ink2 },
  rowName: { fontSize: 11, fontWeight: '500', color: COLORS.ink, marginTop: 1 },
  daysLabel: { fontSize: 7, color: COLORS.ink2 },
  daysNum: { fontSize: 15, fontWeight: '300', color: COLORS.ink },
  daysUnit: { fontSize: 8, color: COLORS.ink2, marginLeft: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.purple },
  photoLg: { width: '100%', height: 88, borderRadius: 10 },
  photoSm: { flex: 1, height: 50, borderRadius: 8 },
  monthLabel: { fontSize: 9, fontWeight: '500', color: COLORS.ink, marginBottom: 6 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 2 },
  weekDay: { fontSize: 7, color: COLORS.ink2 },
  calBubble: { width: 20, height: 20, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  calDay: { fontSize: 8, color: COLORS.ink },
  calDot: { position: 'absolute', bottom: 1, width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.pink },
});

const c0 = StyleSheet.create({
  sampleCard: {
    width: 220,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#7c5fa3',
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  cardIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardDate: { fontSize: 10, color: COLORS.ink2 },
  cardName: { fontSize: 15, fontWeight: '500', color: COLORS.ink },
  cardBadge: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 4,
  },
  badgeSmall: { fontSize: 9, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.8, marginRight: 2 },
  badgeBig: { fontSize: 24, fontWeight: '300', color: '#fff', letterSpacing: -0.8 },
  badgeUnit: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginLeft: 1 },
});

const c1 = StyleSheet.create({
  question: { fontSize: 20, fontWeight: '500', color: COLORS.ink, lineHeight: 30, marginTop: 16 },
  questionSub: { fontSize: 11, color: COLORS.ink2, marginTop: 4, marginBottom: 18 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: (W - 24 * 2 - 10) / 2,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catCardActive: {
    backgroundColor: '#fff',
    borderColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  catSwatch: { width: 22, height: 22, borderRadius: 7 },
  catLabel: { fontSize: 13, fontWeight: '500', color: COLORS.ink },
  catSub: { fontSize: 9, color: COLORS.ink2, marginTop: 1 },
});

const c2 = StyleSheet.create({
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(120,90,140,0.12)',
  },
  catChipDot: { width: 10, height: 10, borderRadius: 5 },
  catChipText: { fontSize: 13, fontWeight: '500', color: COLORS.ink },
  input: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.ink,
    borderWidth: 1,
    borderColor: 'rgba(120,90,140,0.12)',
    marginBottom: 12,
  },
});
