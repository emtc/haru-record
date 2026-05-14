import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { ACCENT_GRADIENT, COLORS, RADIUS, CARD_SHADOW } from '../constants/theme';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const NOW_YEAR = new Date().getFullYear();
const YEAR_RANGE = Array.from({ length: 12 }, (_, i) => NOW_YEAR - 4 + i);

function buildCalendar(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export function CalendarPicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const init = value ? new Date(value + 'T00:00:00') : new Date();
  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const cells = buildCalendar(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }
  function handleYearSelect(y: number) {
    setYear(y);
    setYearPickerVisible(false);
  }

  return (
    <View style={styles.cal}>
      <View style={styles.calHeader}>
        <Pressable style={styles.calNavBtn} onPress={prevMonth}>
          <Feather name="chevron-left" size={14} color={COLORS.ink2} />
        </Pressable>
        <Pressable style={styles.calMonthBtn} onPress={() => setYearPickerVisible(true)}>
          <Text style={styles.calMonth}>{year}.{String(month + 1).padStart(2, '0')}</Text>
          <Feather name="chevron-down" size={11} color={COLORS.ink2} />
        </Pressable>
        <Pressable style={styles.calNavBtn} onPress={nextMonth}>
          <Feather name="chevron-right" size={14} color={COLORS.ink2} />
        </Pressable>
      </View>

      <View style={styles.calWeekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={d} style={[styles.calWeekDay, i === 0 && styles.sun, i === 6 && styles.sat]}>{d}</Text>
        ))}
      </View>

      <View style={styles.calGrid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`e-${i}`} style={styles.calCell} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = key === value;
          return (
            <Pressable key={key} style={styles.calCell} onPress={() => onChange(key)}>
              {isSelected ? (
                <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.calSelectedCircle}>
                  <Text style={styles.calSelectedDay}>{day}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.calDayWrapper}>
                  <Text style={styles.calDay}>{day}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Inline absolute year picker — avoids nested Modal issues on Android */}
      {yearPickerVisible && (
        <View style={styles.yearOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setYearPickerVisible(false)} />
          <View style={styles.yearSheet}>
            <Text style={styles.yearSheetTitle}>年を選ぶ</Text>
            <View style={styles.yearGrid}>
              {YEAR_RANGE.map(y => {
                const isActive = y === year;
                return (
                  <Pressable
                    key={y}
                    style={[styles.yearItem, isActive && styles.yearItemActive]}
                    onPress={() => handleYearSelect(y)}
                  >
                    {isActive ? (
                      <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.yearItemGradient}>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cal: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.card,
    padding: 12,
    ...CARD_SHADOW,
    position: 'relative',
    overflow: 'visible',
  },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calNavBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  calMonthBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calMonth: { fontSize: 13, fontWeight: '500', color: COLORS.ink, letterSpacing: 0.5 },
  calWeekRow: { flexDirection: 'row', marginBottom: 4 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 12, color: COLORS.ink2 },
  sun: { color: '#d28aa8' },
  sat: { color: '#9a8ec5' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calSelectedCircle: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  calSelectedDay: { fontSize: 12, color: '#fff', fontWeight: '500' },
  calDayWrapper: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  calDay: { fontSize: 12, color: COLORS.ink, fontWeight: '300' },

  // Inline year picker overlay
  yearOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    borderRadius: RADIUS.card,
    backgroundColor: 'rgba(30,20,40,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearSheet: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    width: '90%',
  },
  yearSheetTitle: {
    fontSize: 12, color: COLORS.ink2, letterSpacing: 1.2,
    marginBottom: 16, textAlign: 'center',
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  yearItem: {
    width: 72, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(124,95,163,0.06)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  yearItemActive: { backgroundColor: 'transparent' },
  yearItemGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  yearItemText: { fontSize: 13, color: COLORS.ink2 },
  yearItemTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },
});
