import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { ACCENT_GRADIENT, BG_GRADIENT, COLORS, RADIUS, CARD_SHADOW } from '../constants/theme';
import { CATEGORIES, Category } from '../types';
import { getTreatmentById, updateTreatment } from '../lib/database';
import { formatDateDisplay } from '../lib/elapsed';
import { CalendarPicker } from '../components/CalendarPicker';
import { t, tCategory } from '../lib/i18n';

export default function EditTreatmentScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = id ? getTreatmentById(id) : null;

  const [category, setCategory] = useState<Category>(existing?.category ?? '脱毛');
  const [name, setName] = useState(existing?.name ?? '');
  const [date, setDate] = useState(existing?.date ?? '');
  const [clinic, setClinic] = useState(existing?.clinic ?? '');
  const [memo, setMemo] = useState(existing?.memo ?? '');
  const [calendarVisible, setCalendarVisible] = useState(false);

  const canSave = name.trim().length > 0 && date.length === 10;

  function handleSave() {
    if (!canSave || !existing) return;
    updateTreatment({
      ...existing,
      name: name.trim(),
      category,
      date,
      clinic: clinic.trim(),
      memo: memo.trim(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <View style={[styles.safe, { paddingBottom: insets.bottom }]}>
        <View style={[styles.nav, { paddingTop: insets.top + 10 }]}>
          <View style={styles.navSide}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.navCancel}>{t('edit.cancel')}</Text>
            </Pressable>
          </View>
          <Text style={styles.navTitle}>{t('edit.title')}</Text>
          <View style={styles.navSideRight}>
            <Pressable onPress={handleSave} disabled={!canSave}>
              <Text style={[styles.navSave, !canSave && styles.navSaveDisabled]}>{t('edit.save')}</Text>
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            <FieldLabel>{t('add.category')}</FieldLabel>
            <View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <Pressable key={c} onPress={() => setCategory(c)}>
                  {category === c ? (
                    <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip}>
                      <Text style={styles.chipActiveText}>{tCategory(c)}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chipInactive}>
                      <Text style={styles.chipInactiveText}>{tCategory(c)}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            <FieldLabel required>{t('add.name')}</FieldLabel>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('edit.name_ph')}
              placeholderTextColor={COLORS.ink3}
            />

            <FieldLabel required>{t('add.date')}</FieldLabel>
            <Pressable style={styles.dateTrigger} onPress={() => setCalendarVisible(true)}>
              <Text style={[styles.dateTriggerText, !date && styles.datePlaceholder]}>
                {date.length === 10 ? formatDateDisplay(date) : t('add.date_ph')}
              </Text>
              <Feather name="calendar" size={14} color={COLORS.ink2} />
            </Pressable>

            <FieldLabel>{t('add.clinic')}</FieldLabel>
            <TextInput
              style={styles.input}
              value={clinic}
              onChangeText={setClinic}
              placeholder={t('add.clinic_ph')}
              placeholderTextColor={COLORS.ink3}
            />

            <FieldLabel>{t('add.memo')}</FieldLabel>
            <TextInput
              style={[styles.input, styles.memo]}
              value={memo}
              onChangeText={setMemo}
              placeholder={t('add.memo_ph')}
              placeholderTextColor={COLORS.ink3}
              multiline
              numberOfLines={4}
            />

          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Calendar modal */}
      <Modal
        visible={calendarVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.calModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarVisible(false)} />
          <View style={styles.calModalSheet}>
            <View style={styles.calModalHeader}>
              <Text style={styles.calModalTitle}>{t('edit.date_modal_title')}</Text>
              <Pressable onPress={() => setCalendarVisible(false)} hitSlop={12}>
                <Feather name="x" size={18} color={COLORS.ink2} />
              </Pressable>
            </View>
            <CalendarPicker
              value={date}
              onChange={(d) => {
                setDate(d);
                setCalendarVisible(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{children}</Text>
      {required && <Text style={styles.requiredMark}>*</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  navSide: { flex: 1 },
  navSideRight: { flex: 1, alignItems: 'flex-end' },
  navCancel: { fontSize: 12, color: COLORS.ink2 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '500', color: COLORS.ink },
  navSave: { fontSize: 12, fontWeight: '500', color: COLORS.purple },
  navSaveDisabled: { opacity: 0.35 },
  scroll: { flex: 1 },
  scrollContent: { padding: 22, paddingTop: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6, marginTop: 16 },
  requiredMark: { fontSize: 10, color: COLORS.accent2, lineHeight: 14 },
  label: {
    fontSize: 11,
    color: COLORS.ink2,
    letterSpacing: 0.8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipActiveText: { fontSize: 11, color: '#fff', fontWeight: '500' },
  chipInactive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
  },
  chipInactiveText: { fontSize: 11, color: COLORS.ink2, fontWeight: '300' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: COLORS.ink,
    shadowColor: '#7c5fa3',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  memo: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: '#7c5fa3',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  dateTriggerText: { fontSize: 13, color: COLORS.ink },
  datePlaceholder: { color: COLORS.ink3 },

  // Calendar modal
  calModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.45)',
    justifyContent: 'flex-end',
  },
  calModalSheet: {
    backgroundColor: '#f8f5fb',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 40,
  },
  calModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calModalTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.ink,
    letterSpacing: 0.5,
  },
});
