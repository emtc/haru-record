import React, { useState } from 'react';
import {
  Image,
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
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { persistPhoto } from '../lib/photoStorage';
import { Feather } from '@expo/vector-icons';
import { ACCENT_GRADIENT, BG_GRADIENT, COLORS, CARD_SHADOW } from '../constants/theme';
import { CATEGORIES, Category, Treatment } from '../types';
import { insertTreatment, insertPhoto } from '../lib/database';
import { todayString, formatDateDisplay } from '../lib/elapsed';
import { generateId } from '../lib/uuid';
import { PhotoModal } from '../components/PhotoModal';
import { CalendarPicker } from '../components/CalendarPicker';
import { useSubscription } from '../lib/subscriptionContext';

const FREE_PHOTO_LIMIT = 3;


type PhotoDraft = { uri: string; label: string; caption: string; date: string };


// ── Main screen ──────────────────────────────────────────────────────────────

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const { isPremium } = useSubscription();
  const [category, setCategory] = useState<Category>('脱毛');
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayString());
  const [clinic, setClinic] = useState('');
  const [memo, setMemo] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [pendingUris, setPendingUris] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const canSave = name.trim().length > 0 && date.length === 10;

  async function pickPhoto() {
    if (!isPremium && photos.length >= FREE_PHOTO_LIMIT) {
      router.push('/paywall');
      return;
    }
    const remaining = isPremium ? 0 : FREE_PHOTO_LIMIT - photos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPendingUris(result.assets.map(a => persistPhoto(a.uri)));
    }
  }

  function handlePhotoConfirm(photoDate: string, label: string, caption: string, uris: string[]) {
    const allowed = isPremium ? uris : uris.slice(0, Math.max(0, FREE_PHOTO_LIMIT - photos.length));
    setPhotos(prev => [...prev, ...allowed.map(uri => ({ uri, label, caption, date: photoDate }))]);
    setPendingUris([]);
  }

  function handlePhotoEdit(photoDate: string, label: string, caption: string, uris: string[]) {
    if (editingIndex === null) return;
    const uri = uris[0] ?? photos[editingIndex]?.uri ?? '';
    setPhotos(prev => prev.map((p, i) => i === editingIndex ? { ...p, uri, label, caption, date: photoDate } : p));
    setEditingIndex(null);
  }

  function handlePhotoDelete() {
    if (editingIndex === null) return;
    setPhotos(prev => prev.filter((_, i) => i !== editingIndex));
    setEditingIndex(null);
  }

  function handleSave() {
    if (!canSave) return;
    const treatmentId = generateId();
    const treatment: Treatment = {
      id: treatmentId,
      name: name.trim(),
      category,
      date,
      clinic: clinic.trim(),
      memo: memo.trim(),
      iconUri: '',
      createdAt: new Date().toISOString(),
    };
    insertTreatment(treatment);
    photos.forEach(photo => {
      insertPhoto({
        id: generateId(),
        treatmentId,
        uri: photo.uri,
        label: photo.label,
        date: photo.date,
        caption: photo.caption,
        createdAt: new Date().toISOString(),
      });
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
              <Text style={styles.navCancel}>キャンセル</Text>
            </Pressable>
          </View>
          <Text style={styles.navTitle}>新しい記録</Text>
          <View style={styles.navSideRight}>
            <Pressable onPress={handleSave} disabled={!canSave}>
              <Text style={[styles.navSave, !canSave && styles.navSaveDisabled]}>保存</Text>
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            <FieldLabel>カテゴリ</FieldLabel>
            <View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <Pressable key={c} onPress={() => setCategory(c)}>
                  {category === c ? (
                    <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip}>
                      <Text style={styles.chipActiveText}>{c}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chipInactive}>
                      <Text style={styles.chipInactiveText}>{c}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            <FieldLabel required>施術名</FieldLabel>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="例：医療脱毛 5回目"
              placeholderTextColor={COLORS.ink3}
            />

            <FieldLabel required>施術日</FieldLabel>
            <Pressable style={styles.dateTrigger} onPress={() => setCalendarVisible(true)}>
              <Text style={[styles.dateTriggerText, !date && styles.datePlaceholder]}>
                {date.length === 10 ? formatDateDisplay(date) : '日付を選択'}
              </Text>
              <Feather name="calendar" size={14} color={COLORS.ink2} />
            </Pressable>

            <FieldLabel>クリニック・施術者</FieldLabel>
            <TextInput
              style={styles.input}
              value={clinic}
              onChangeText={setClinic}
              placeholder="例：東京美容クリニック 新宿院"
              placeholderTextColor={COLORS.ink3}
            />

            <FieldLabel>メモ</FieldLabel>
            <TextInput
              style={[styles.input, styles.memo]}
              value={memo}
              onChangeText={setMemo}
              placeholder="ダウンタイムや経過の気づきを書き留める"
              placeholderTextColor={COLORS.ink3}
              multiline
              numberOfLines={4}
            />

            <FieldLabel>写真</FieldLabel>
            <View style={styles.photoRow}>
              <Pressable style={styles.photoAdd} onPress={pickPhoto}>
                <Text style={styles.photoAddText}>＋</Text>
              </Pressable>
              {photos.map((p, i) => (
                <Pressable key={i} onPress={() => setEditingIndex(i)}>
                  <View style={styles.photoThumb}>
                    <Image source={{ uri: p.uri }} style={styles.photoThumbImg} />
                    {p.label ? (
                      <View style={styles.photoLabelBadge}>
                        <Text style={styles.photoLabelText}>{p.label}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* カレンダーモーダル */}
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
              <Text style={styles.calModalTitle}>施術日を選ぶ</Text>
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

      {/* 新規追加モーダル */}
      {pendingUris.length > 0 && (
        <PhotoModal
          uris={pendingUris}
          treatmentDate={date}
          allowPhotoChange
          allowAddRemove
          maxPhotos={isPremium ? undefined : FREE_PHOTO_LIMIT - photos.length}
          confirmLabel="追加する"
          onConfirm={handlePhotoConfirm}
          onCancel={() => setPendingUris([])}
        />
      )}

      {/* 編集モーダル */}
      {editingIndex !== null && photos[editingIndex] && (
        <PhotoModal
          uris={[photos[editingIndex].uri]}
          treatmentDate={date}
          initialDate={photos[editingIndex].date}
          initialCaption={photos[editingIndex].caption}
          allowPhotoChange
          confirmLabel="保存する"
          onConfirm={handlePhotoEdit}
          onCancel={() => setEditingIndex(null)}
          onDelete={handlePhotoDelete}
        />
      )}
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

  // Photos
  photoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  photoAdd: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(120,90,140,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: { fontSize: 22, fontWeight: '200', color: COLORS.ink2 },
  photoThumb: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden' },
  photoThumbImg: { width: '100%', height: '100%' },
  photoLabelBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  photoLabelText: { fontSize: 8, color: '#fff', fontWeight: '500' },
});
