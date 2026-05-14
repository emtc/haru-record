import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Image,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { persistPhoto } from '../../lib/photoStorage';
import { useSubscription } from '../../lib/subscriptionContext';

const FREE_PHOTO_LIMIT = 3;
import { Feather } from '@expo/vector-icons';
import { BG_GRADIENT, COLORS, RADIUS, CARD_SHADOW, SHADOW, ACCENT_GRADIENT, CATEGORY_GRADIENT } from '../../constants/theme';
import { Treatment, TreatmentPhoto } from '../../types';
import { getTreatmentById, getPhotosForTreatment, deleteTreatment, insertPhoto, updateTreatmentIcon, updateTreatment } from '../../lib/database';
import { getElapsed, formatDateDisplay } from '../../lib/elapsed';
import { generateId } from '../../lib/uuid';
import ElapsedBadge from '../../components/ElapsedBadge';
import { PhotoModal } from '../../components/PhotoModal';

export default function TreatmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPremium } = useSubscription();
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [photos, setPhotos] = useState<TreatmentPhoto[]>([]);
  const [pendingUris, setPendingUris] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [iconMenuVisible, setIconMenuVisible] = useState(false);
  const [memoModalVisible, setMemoModalVisible] = useState(false);
  const [editingMemo, setEditingMemo] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      const t = getTreatmentById(id);
      setTreatment(t);
      setPhotos(getPhotosForTreatment(id));
    }, [id])
  );

  async function pickIcon() {
    if (!treatment) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      const uri = persistPhoto(result.assets[0].uri);
      updateTreatmentIcon(treatment.id, uri);
      setTreatment(prev => prev ? { ...prev, iconUri: uri } : prev);
    }
  }

  function handleIconPress() {
    if (!treatment) return;
    if (treatment.iconUri) {
      setIconMenuVisible(true);
    } else {
      pickIcon();
    }
  }

  function handleIconDelete() {
    if (!treatment) return;
    setIconMenuVisible(false);
    updateTreatmentIcon(treatment.id, '');
    setTreatment(prev => prev ? { ...prev, iconUri: '' } : prev);
  }

  async function handleAddPhoto() {
    if (!treatment) return;
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

  function handlePhotoConfirm(date: string, label: string, caption: string, uris: string[]) {
    if (!treatment) return;
    const allowed = isPremium ? uris : uris.slice(0, Math.max(0, FREE_PHOTO_LIMIT - photos.length));
    const newPhotos = allowed.map(uri => ({
      id: generateId(),
      treatmentId: treatment.id,
      uri,
      label,
      date,
      caption,
      createdAt: new Date().toISOString(),
    }));
    newPhotos.forEach(p => insertPhoto(p));
    setPhotos(prev => [...prev, ...newPhotos]);
    setPendingUris([]);
  }

  function handleMemoSave() {
    if (!treatment) return;
    updateTreatment({ ...treatment, memo: editingMemo });
    setTreatment(prev => prev ? { ...prev, memo: editingMemo } : prev);
    setMemoModalVisible(false);
  }

  function handleDeleteTap() {
    setMenuVisible(false);
    Alert.alert('記録を削除', 'この記録と写真をすべて削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive', onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteTreatment(treatment!.id);
          router.back();
        },
      },
    ]);
  }

  if (!treatment) {
    return <View style={styles.root}><LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} /></View>;
  }

  const elapsed = getElapsed(treatment.date);
  const dateStr = formatDateDisplay(treatment.date);

  // 同じ日の写真をまとめる
  const photoGroups = photos.reduce<{ date: string; label: string; items: TreatmentPhoto[] }[]>((acc, photo) => {
    const existing = acc.find(g => g.date === photo.date);
    if (existing) { existing.items.push(photo); }
    else { acc.push({ date: photo.date, label: photo.label, items: [photo] }); }
    return acc;
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Nav */}
        <View style={styles.nav}>
          <Pressable style={styles.navBtn} onPress={() => router.back()} accessibilityLabel="戻る" accessibilityRole="button">
            <Feather name="chevron-left" size={20} color={COLORS.ink2} />
          </Pressable>
          <View />
          <Pressable style={styles.navBtn} onPress={() => setMenuVisible(true)} accessibilityLabel="メニュー" accessibilityRole="button">
            <Feather name="more-horizontal" size={18} color={COLORS.ink2} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Title block */}
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              {/* Icon */}
              <Pressable
                onPress={handleIconPress}
                style={styles.iconWrap}
                accessibilityLabel="アイコン画像を変更"
                accessibilityRole="button"
              >
                {treatment.iconUri ? (
                  <Image source={{ uri: treatment.iconUri }} style={styles.icon} accessibilityLabel={`${treatment.name}のアイコン`} />
                ) : (
                  <LinearGradient
                    colors={CATEGORY_GRADIENT[treatment.category] ?? CATEGORY_GRADIENT['その他']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.icon}
                    accessible={false}
                  />
                )}
                <View style={styles.iconEditBadge}>
                  <Text style={styles.iconEditText}>＋</Text>
                </View>
              </Pressable>

              {/* Meta + name */}
              <View style={styles.titleInfo}>
                <Text style={styles.metaText}>{dateStr} · {treatment.category}</Text>
                <Text style={styles.treatmentName}>{treatment.name}</Text>
                <View style={styles.clinicRow}>
                  <Feather name="map-pin" size={10} color={COLORS.ink2} />
                  <Text style={styles.clinic}>{treatment.clinic || '記載なし'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.badgeWrapper}>
              <ElapsedBadge elapsed={elapsed} gradient={CATEGORY_GRADIENT[treatment.category] ?? CATEGORY_GRADIENT['その他']} />
            </View>
          </View>

          {/* Memo */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>メモ</Text>
            <Pressable
              onPress={() => { setEditingMemo(treatment.memo); setMemoModalVisible(true); }}
              style={({ pressed }) => [styles.memoCard, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="メモを編集"
            >
              <Text style={[styles.memoText, !treatment.memo && styles.memoEmpty]}>
                {treatment.memo || 'タップしてメモを追加'}
              </Text>
              <Feather name="edit-2" size={12} color={COLORS.ink2} style={styles.memoEditIcon} />
            </Pressable>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>写真</Text>
              {photos.length > 0 && (
                <Pressable style={styles.addPhotoPill} onPress={handleAddPhoto}>
                  <Text style={styles.addPhotoPillText}>＋ 追加する</Text>
                </Pressable>
              )}
            </View>

            {photos.length === 0 ? (
              <View style={styles.emptyPhotos}>
                <Text style={styles.emptyPhotosText}>写真がありません</Text>
                <Pressable style={styles.addPhotoPill} onPress={handleAddPhoto}>
                  <Text style={styles.addPhotoPillText}>＋ 追加する</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoTimeline}>
                <View style={styles.photoRail} />
                {photoGroups.map((group, gi) => {
                  const startIdx = photoGroups.slice(0, gi).reduce((s, g) => s + g.items.length, 0);
                  return (
                    <View key={group.date} style={styles.photoGroup}>
                      <View style={styles.photoGroupHeader}>
                        <View style={styles.photoDot} />
                        <Text style={styles.photoLabel}>
                          {group.label || formatDateDisplay(group.date).substring(5, 10)}
                        </Text>
                      </View>
                      <View style={styles.photoGrid}>
                        {group.items.map((photo, j) => (
                          <Pressable
                            key={photo.id}
                            style={styles.photoGridItem}
                            onPress={() => router.push({ pathname: '/photo-viewer', params: { treatmentId: treatment.id, photoIndex: startIdx + j } })}
                            accessibilityRole="button"
                            accessibilityLabel={`${photo.label || '写真'} を表示`}
                          >
                            <Image
                              source={{ uri: photo.uri }}
                              style={styles.photoGridImg}
                              resizeMode="cover"
                              accessibilityLabel={`${photo.label || '写真'}、${photo.date}`}
                            />
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>

      {pendingUris.length > 0 && (
        <PhotoModal
          uris={pendingUris}
          treatmentDate={treatment.date}
          allowPhotoChange
          allowAddRemove
          maxPhotos={isPremium ? undefined : FREE_PHOTO_LIMIT - photos.length}
          confirmLabel="追加する"
          onConfirm={handlePhotoConfirm}
          onCancel={() => setPendingUris([])}
        />
      )}

      {/* Memo Edit Modal */}
      <Modal
        visible={memoModalVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setMemoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMemoModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKav}
          >
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>メモ</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editingMemo}
                onChangeText={setEditingMemo}
                placeholder="ダウンタイムや経過の気づきを書き留める"
                placeholderTextColor={COLORS.ink3}
                multiline
                autoFocus
                textAlignVertical="top"
              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancelBtn} onPress={() => setMemoModalVisible(false)}>
                  <Text style={styles.modalCancelText}>キャンセル</Text>
                </Pressable>
                <Pressable style={styles.modalSaveBtn} onPress={handleMemoSave}>
                  <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalSaveGradient}>
                    <Text style={styles.modalSaveText}>保存する</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Icon Action Sheet */}
      <Modal
        visible={iconMenuVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIconMenuVisible(false)}
      >
        <View style={styles.actionOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIconMenuVisible(false)} />
          <View style={styles.actionSheet}>
            <Pressable
              style={styles.actionRow}
              onPress={() => { setIconMenuVisible(false); pickIcon(); }}
            >
              <Feather name="image" size={16} color={COLORS.purple} />
              <Text style={styles.actionText}>変更する</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable style={styles.actionRow} onPress={handleIconDelete}>
              <Feather name="trash-2" size={16} color={COLORS.pink} />
              <Text style={[styles.actionText, styles.actionTextDanger]}>削除する</Text>
            </Pressable>
            <Pressable style={styles.actionCancelRow} onPress={() => setIconMenuVisible(false)}>
              <Text style={styles.actionCancelText}>キャンセル</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Action Menu */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.actionOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
          <View style={styles.actionSheet}>
            <Pressable
              style={styles.actionRow}
              onPress={() => {
                setMenuVisible(false);
                router.push({ pathname: '/edit-treatment', params: { id: treatment.id } });
              }}
            >
              <Feather name="edit-2" size={16} color={COLORS.purple} />
              <Text style={styles.actionText}>記録を編集</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable style={styles.actionRow} onPress={handleDeleteTap}>
              <Feather name="trash-2" size={16} color={COLORS.pink} />
              <Text style={[styles.actionText, styles.actionTextDanger]}>記録を削除</Text>
            </Pressable>
            <Pressable style={styles.actionCancelRow} onPress={() => setMenuVisible(false)}>
              <Text style={styles.actionCancelText}>キャンセル</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 4,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  scroll: { flex: 1 },
  titleBlock: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrap: { position: 'relative' },
  icon: { width: 72, height: 72, borderRadius: 20 },
  iconEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  iconEditText: { fontSize: 13, color: COLORS.ink2, lineHeight: 16 },
  titleInfo: { flex: 1, gap: 3 },
  metaText: { fontSize: 11, color: COLORS.ink2, letterSpacing: 0.6 },
  treatmentName: { fontSize: 20, fontWeight: '500', color: COLORS.ink, lineHeight: 28 },
  clinicRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clinic: { fontSize: 11, color: COLORS.ink2 },
  badgeWrapper: { marginTop: 20 },
  section: { paddingHorizontal: 22, marginBottom: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sectionLabel: { fontSize: 11, color: COLORS.ink2, letterSpacing: 0.8, marginBottom: 12 },
  memoCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.card,
    padding: 16,
    ...CARD_SHADOW,
  },
  memoText: { fontSize: 13, lineHeight: 22, color: '#3a3045' },
  memoEmpty: { color: COLORS.ink2 },
  memoEditIcon: { position: 'absolute', top: 14, right: 14 },
  emptyPhotos: { alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  emptyPhotosText: { fontSize: 14, color: COLORS.ink },
  addPhotoPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,95,163,0.10)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addPhotoPillText: { fontSize: 11, color: COLORS.purple, fontWeight: '500' },
  photoTimeline: { position: 'relative' },
  photoRail: {
    position: 'absolute',
    left: 4,
    top: 6,
    bottom: 6,
    width: 1,
    backgroundColor: COLORS.rail,
  },
  photoGroup: {
    gap: 10,
    paddingVertical: 8,
  },
  photoGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoLabel: { fontSize: 12, color: COLORS.ink2, flex: 1 },
  photoDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.accent2,
    zIndex: 1,
    flexShrink: 0,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 19,
  },
  photoGridItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
  },
  photoGridImg: { width: '100%', height: '100%', borderRadius: RADIUS.xs },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.50)',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 260,
  },
  actionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.50)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalKav: {},
  modalSheet: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  modalTitle: { fontSize: 10, color: COLORS.ink2, letterSpacing: 1.4, marginBottom: 12 },
  modalTextInput: {
    backgroundColor: 'rgba(120,90,140,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.ink,
    minHeight: 120,
    lineHeight: 22,
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(120,90,140,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 12, color: COLORS.ink2 },
  modalSaveBtn: { flex: 1 },
  modalSaveGradient: { paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  modalSaveText: { fontSize: 13, fontWeight: '500', color: '#fff' },

  actionSheet: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  actionText: { fontSize: 14, color: COLORS.ink },
  actionTextDanger: { color: COLORS.pink },
  actionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.separator, marginHorizontal: 4 },
  actionCancelRow: {
    marginTop: 4,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
    alignItems: 'center',
  },
  actionCancelText: { fontSize: 13, color: COLORS.ink2 },
});
