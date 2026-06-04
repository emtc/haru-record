import React, { useCallback, useMemo, useRef, useState } from 'react';
import { InteractionManager, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ACCENT_GRADIENT, BG_GRADIENT, CARD_SHADOW,
  CATEGORY_GRADIENT, COLORS, RADIUS,
} from '../../constants/theme';
import { Treatment } from '../../types';
import { getAllTreatments } from '../../lib/database';
import { formatDateDisplay, daysAfterTreatment } from '../../lib/elapsed';
import { t, tCategory } from '../../lib/i18n';

const WEEKDAY_KEYS = ['weekdays.sun', 'weekdays.mon', 'weekdays.tue', 'weekdays.wed', 'weekdays.thu', 'weekdays.fri', 'weekdays.sat'];
const NOW = new Date();
const TODAY_YEAR  = NOW.getFullYear();
const TODAY_MONTH = NOW.getMonth();
const TODAY_DAY   = NOW.getDate();
const TODAY_KEY   = toKey(TODAY_YEAR, TODAY_MONTH, TODAY_DAY);
const YEAR_RANGE  = Array.from({ length: 12 }, (_, i) => TODAY_YEAR - 4 + i);

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildCells(year: number, month: number): (number | null)[] {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export default function CalendarScreen() {
  const [year, setYear]                     = useState(TODAY_YEAR);
  const [month, setMonth]                   = useState(TODAY_MONTH);
  const [treatments, setTreatments]         = useState<Treatment[]>(() => getAllTreatments());
  const [selectedDate, setSelectedDate]     = useState(TODAY_KEY);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const isFirstFocus = useRef(true);

  useFocusEffect(useCallback(() => {
    if (isFirstFocus.current) { isFirstFocus.current = false; return; }
    const task = InteractionManager.runAfterInteractions(() => {
      setTreatments(getAllTreatments());
    });
    return () => task.cancel();
  }, []));

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const treatmentByDate = useMemo(() => {
    const map = new Map<string, Treatment[]>();
    treatments.forEach(tr => {
      const list = map.get(tr.date) ?? [];
      list.push(tr);
      map.set(tr.date, list);
    });
    return map;
  }, [treatments]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const visibleTreatments = useMemo(() =>
    treatments
      .filter(tr => tr.date <= selectedDate)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [treatments, selectedDate],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={BG_GRADIENT}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable onPress={() => setYearPickerVisible(true)}>
            <Text style={styles.headerLabel}>CALENDAR</Text>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>
                {year}.{String(month + 1).padStart(2, '0')}
              </Text>
              <Feather name="chevron-down" size={14} color={COLORS.ink2} style={{ marginBottom: 2 }} />
            </View>
          </Pressable>
          <View style={styles.navButtons}>
            <Pressable style={styles.navBtn} onPress={prevMonth} accessibilityLabel={t('calendar.prev_month')}>
              <Feather name="chevron-left" size={14} color={COLORS.ink2} />
            </Pressable>
            <Pressable style={styles.navBtn} onPress={nextMonth} accessibilityLabel={t('calendar.next_month')}>
              <Feather name="chevron-right" size={14} color={COLORS.ink2} />
            </Pressable>
          </View>
        </View>

        {/* ── Weekday row ────────────────────────────────── */}
        <View style={styles.weekRow}>
          {WEEKDAY_KEYS.map((key, i) => (
            <Text
              key={key}
              style={[styles.weekDay, i === 0 && styles.sunday, i === 6 && styles.saturday]}
            >
              {t(key)}
            </Text>
          ))}
        </View>

        {/* ── Calendar grid ──────────────────────────────── */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`e-${i}`} style={styles.cell} />;

            const key          = toKey(year, month, day);
            const hasTreatment = treatmentByDate.has(key);
            const isToday      = year === TODAY_YEAR && month === TODAY_MONTH && day === TODAY_DAY;
            const isSelected   = selectedDate === key;
            const col          = i % 7;

            return (
              <Pressable key={key} style={styles.cell} onPress={() => setSelectedDate(key)}>
                {isToday ? (
                  <LinearGradient
                    colors={ACCENT_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.dayCircle, isSelected && styles.todayRing]}
                  >
                    <Text style={styles.dayToday}>{day}</Text>
                    {hasTreatment && <View style={[styles.dot, styles.dotToday]} />}
                  </LinearGradient>
                ) : isSelected ? (
                  <View style={[styles.dayCircle, styles.dayCircleSelected]}>
                    <Text style={[
                      styles.dayNum,
                      col === 0 && styles.sunText,
                      col === 6 && styles.satText,
                      styles.dayNumSelected,
                    ]}>
                      {day}
                    </Text>
                    {hasTreatment && <View style={[styles.dot, styles.dotSelected]} />}
                  </View>
                ) : (
                  <View style={styles.dayCircle}>
                    <Text style={[
                      styles.dayNum,
                      col === 0 && styles.sunText,
                      col === 6 && styles.satText,
                    ]}>
                      {day}
                    </Text>
                    {hasTreatment && <View style={styles.dot} />}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Divider ────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Bottom section ─────────────────────────────── */}
        <ScrollView
          style={styles.bottomSection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedDateText}>{formatDateDisplay(selectedDate)}</Text>
          </View>

          {visibleTreatments.length > 0 ? (
            visibleTreatments.map(tr => {
              const days = daysAfterTreatment(tr.date, selectedDate);
              return (
                <Pressable
                  key={tr.id}
                  style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
                  onPress={() => router.push(`/treatment/${tr.id}`)}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={CATEGORY_GRADIENT[tr.category] ?? CATEGORY_GRADIENT['その他']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryTile}
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{tr.name}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {tCategory(tr.category)}{tr.clinic ? ` · ${tr.clinic}` : ''}
                    </Text>
                  </View>
                  <View style={styles.elapsedBadge}>
                    {days === 0 ? (
                      <Text style={styles.elapsedDay}>{t('calendar.today')}</Text>
                    ) : (
                      <>
                        <Text style={styles.elapsedNum}>{days}</Text>
                        <Text style={styles.elapsedUnit}>{t('calendar.day_unit')}</Text>
                      </>
                    )}
                  </View>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{t('calendar.empty')}</Text>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── Year picker ────────────────────────────────────── */}
      <Modal
        visible={yearPickerVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <View style={styles.yearOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setYearPickerVisible(false)} />
          <View style={styles.yearSheet}>
            <Text style={styles.yearSheetTitle}>{t('calendar.year_title')}</Text>
            <View style={styles.yearGrid}>
              {YEAR_RANGE.map(y => {
                const isActive = y === year;
                return (
                  <Pressable
                    key={y}
                    style={[styles.yearItem, isActive && styles.yearItemActive]}
                    onPress={() => { setYear(y); setYearPickerVisible(false); }}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={ACCENT_GRADIENT}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.yearItemGradient}
                      >
                        <Text style={styles.yearItemTextActive}>{y}</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={styles.yearItemText}>{y}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 6,
  },
  headerLabel: { fontSize: 10, color: COLORS.ink2, letterSpacing: 1.6 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  headerTitle: { fontSize: 22, fontWeight: '500', color: COLORS.ink, marginTop: 4 },
  navButtons: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  navBtn: {
    width: 30, height: 30, borderRadius: RADIUS.xs,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...CARD_SHADOW,
  },

  // ── Weekday row
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 4,
  },
  weekDay:  { flex: 1, textAlign: 'center', fontSize: 11, color: COLORS.ink2 },
  sunday:   { color: '#d28aa8' },
  saturday: { color: '#9a8ec5' },

  // ── Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18 },

  cell: {
    width: `${100 / 7}%` as any,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Day circle
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: 'rgba(124,95,163,0.12)' },
  todayRing: {
    shadowColor: '#9a6fcc',
    shadowOpacity: 0.45,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  dayNum:         { fontSize: 12, color: COLORS.ink, fontWeight: '300' },
  dayNumSelected: { color: COLORS.purple, fontWeight: '500' },
  dayToday:       { fontSize: 12, color: '#fff', fontWeight: '500' },
  sunText:        { color: '#d28aa8' },
  satText:        { color: '#9a8ec5' },

  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent2,
  },
  dotToday:    { backgroundColor: 'rgba(255,255,255,0.85)' },
  dotSelected: { backgroundColor: COLORS.purple },

  // ── Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.separator,
    marginHorizontal: 22,
    marginTop: 8,
  },

  // ── Bottom
  bottomSection: { flex: 1, paddingHorizontal: 22 },

  selectedHeader: {
    paddingTop: 14,
    paddingBottom: 10,
  },
  selectedDateText: { fontSize: 13, fontWeight: '500', color: COLORS.ink },

  card: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...CARD_SHADOW,
  },
  categoryTile: { width: 36, height: 36, borderRadius: 10 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 13, fontWeight: '500', color: COLORS.ink },
  cardSub:  { fontSize: 11, color: COLORS.ink2, marginTop: 2 },

  elapsedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,95,163,0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 46,
  },
  elapsedNum:  { fontSize: 16, fontWeight: '500', color: COLORS.purple, lineHeight: 18 },
  elapsedUnit: { fontSize: 9, color: COLORS.ink2 },
  elapsedDay:  { fontSize: 12, fontWeight: '500', color: COLORS.purple },

  emptyText: { fontSize: 11, color: COLORS.ink2, textAlign: 'center', marginTop: 28 },

  // ── Year picker
  yearOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  yearSheet: { backgroundColor: '#fff', borderRadius: 20, padding: 22 },
  yearSheetTitle: {
    fontSize: 12, color: COLORS.ink2, letterSpacing: 1.0,
    marginBottom: 16, textAlign: 'center',
  },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  yearItem: {
    width: 72, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(124,95,163,0.06)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  yearItemActive:      { backgroundColor: 'transparent' },
  yearItemGradient:    { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  yearItemText:        { fontSize: 13, color: COLORS.ink2 },
  yearItemTextActive:  { fontSize: 13, color: '#fff', fontWeight: '600' },
});
