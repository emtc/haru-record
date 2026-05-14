import React, { useRef, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { ACCENT_GRADIENT, COLORS, RADIUS } from '../constants/theme';
import { CalendarPicker } from './CalendarPicker';
import { PaywallModal } from './PaywallModal';
import { todayString, daysAfterTreatment, photoLabelFromDays, formatDateDisplay } from '../lib/elapsed';
import { persistPhoto } from '../lib/photoStorage';

export function PhotoModal({
  uris,
  treatmentDate,
  initialDate,
  initialCaption = '',
  allowPhotoChange = false,
  allowAddRemove = false,
  maxPhotos,
  onLimitReached,
  confirmLabel,
  onConfirm,
  onCancel,
  onDelete,
}: {
  uris: string[];
  treatmentDate: string;
  initialDate?: string;
  initialCaption?: string;
  allowPhotoChange?: boolean;
  allowAddRemove?: boolean;
  maxPhotos?: number;
  confirmLabel: string;
  onConfirm: (date: string, label: string, caption: string, uris: string[]) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [paywallVisible, setPaywallVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const pickerActiveRef = useRef(false);
  const [localUris, setLocalUris] = useState<string[]>(uris);

  const [photoDate, setPhotoDate] = useState(initialDate ?? todayString());
  const [caption, setCaption] = useState(initialCaption);
  const [calendarVisible, setCalendarVisible] = useState(false);

  async function handleReplacePhoto(index: number) {
    pickerActiveRef.current = true;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    pickerActiveRef.current = false;
    if (!result.canceled && result.assets.length > 0) {
      const newUri = persistPhoto(result.assets[0].uri);
      setLocalUris(prev => prev.map((u, i) => (i === index ? newUri : u)));
    }
  }

  async function handleAddMore() {
    const slotsLeft = maxPhotos != null ? maxPhotos - localUris.length : 0;
    if (maxPhotos != null && slotsLeft <= 0) {
      setPaywallVisible(true);
      return;
    }
    pickerActiveRef.current = true;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: slotsLeft,
      quality: 0.8,
    });
    pickerActiveRef.current = false;
    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map(a => persistPhoto(a.uri));
      setLocalUris(prev => {
        const combined = [...prev, ...newUris];
        return maxPhotos != null ? combined.slice(0, maxPhotos) : combined;
      });
    }
  }

  function handleRemovePhoto(index: number) {
    setLocalUris(prev => prev.filter((_, i) => i !== index));
  }

  const days = daysAfterTreatment(treatmentDate, photoDate);
  const autoLabel = photoLabelFromDays(days);

  return (
    <Modal animationType="slide" transparent statusBarTranslucent onRequestClose={() => { if (!pickerActiveRef.current) onCancel(); }}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kavWrapper}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Photo previews */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewRow}
              >
                {localUris.map((uri, i) =>
                  allowPhotoChange ? (
                    <Pressable
                      key={i}
                      style={({ pressed }) => [pressed && { opacity: 0.72 }]}
                      onPress={() => handleReplacePhoto(i)}
                    >
                      <View style={styles.previewWrap}>
                        <Image source={{ uri }} style={styles.previewImg} />
                        <View style={styles.previewEditOverlay}>
                          <Feather name="camera" size={11} color="#fff" />
                        </View>
                        {allowAddRemove && localUris.length > 1 && (
                          <Pressable
                            style={styles.previewRemoveBtn}
                            onPress={() => handleRemovePhoto(i)}
                            hitSlop={8}
                          >
                            <Feather name="x" size={10} color="#fff" />
                          </Pressable>
                        )}
                      </View>
                    </Pressable>
                  ) : (
                    <Image key={i} source={{ uri }} style={styles.previewImg} />
                  )
                )}
                {allowAddRemove && (
                  <Pressable style={styles.addMoreTile} onPress={handleAddMore}>
                    <Text style={styles.addMoreText}>＋</Text>
                  </Pressable>
                )}
              </ScrollView>

              {/* Date trigger */}
              <Text style={styles.sheetLabel}>撮影日</Text>
              <Pressable style={styles.dateTrigger} onPress={() => setCalendarVisible(true)}>
                <Text style={styles.dateTriggerText}>
                  {formatDateDisplay(photoDate)}
                </Text>
                <Feather name="calendar" size={14} color={COLORS.ink2} />
              </Pressable>

              {/* Caption */}
              <Text style={styles.sheetLabel}>コメント（任意）</Text>
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="気づきや状態を一言"
                placeholderTextColor={COLORS.ink3}
                returnKeyType="done"
              />

              {/* Buttons */}
              <View style={styles.sheetButtons}>
                {onDelete ? (
                  <Pressable style={styles.deleteBtn} onPress={onDelete}>
                    <Text style={styles.deleteText}>削除</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.skipBtn} onPress={onCancel}>
                    <Text style={styles.skipText}>キャンセル</Text>
                  </Pressable>
                )}
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => onConfirm(photoDate, autoLabel, caption, localUris)}
                >
                  <LinearGradient
                    colors={ACCENT_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.confirmBtn}
                  >
                    <Text style={styles.confirmText}>{confirmLabel}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* カレンダーポップアップ */}
      <Modal
        visible={calendarVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.calOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarVisible(false)} />
          <View style={styles.calSheet}>
            <View style={styles.calHeader}>
              <Text style={styles.calTitle}>撮影日を選ぶ</Text>
              <Pressable onPress={() => setCalendarVisible(false)} hitSlop={12}>
                <Feather name="x" size={18} color={COLORS.ink2} />
              </Pressable>
            </View>
            <CalendarPicker
              value={photoDate}
              onChange={(d) => {
                setPhotoDate(d);
                setCalendarVisible(false);
              }}
            />
          </View>
        </View>
      </Modal>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.45)',
    justifyContent: 'flex-end',
  },
  kavWrapper: {
    maxHeight: '90%',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120,90,140,0.18)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  scrollContent: { paddingBottom: 8 },
  previewRow: { gap: 8, paddingBottom: 4 },
  previewWrap: { position: 'relative' },
  previewImg: { width: 90, height: 90, borderRadius: 12 },
  previewEditOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreTile: {
    width: 90,
    height: 90,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(120,90,140,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreText: { fontSize: 22, fontWeight: '200', color: COLORS.ink2 },
  sheetLabel: {
    fontSize: 12,
    color: COLORS.ink2,
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(120,90,140,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dateTriggerText: { fontSize: 13, color: COLORS.ink },
  captionInput: {
    backgroundColor: 'rgba(120,90,140,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: COLORS.ink,
  },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 18 },
  skipBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(120,90,140,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontSize: 12, color: COLORS.ink2 },
  deleteBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(210,80,80,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { fontSize: 12, color: '#c0544a', fontWeight: '500' },
  confirmBtn: { paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  confirmText: { fontSize: 13, fontWeight: '500', color: '#fff' },

  // Calendar modal
  calOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.45)',
    justifyContent: 'flex-end',
  },
  calSheet: {
    backgroundColor: '#f8f5fb',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 40,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.ink,
    letterSpacing: 0.5,
  },
});
