import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { ACCENT_GRADIENT, BG_GRADIENT, CARD_SHADOW, COLORS, RADIUS } from '../constants/theme';
import { getPhotosForTreatment, getTreatmentById, deletePhoto, updatePhoto } from '../lib/database';
import { useSubscription } from '../lib/subscriptionContext';
import { formatDateDisplay } from '../lib/elapsed';
import { TreatmentPhoto } from '../types';
import { PhotoModal } from '../components/PhotoModal';
import { t } from '../lib/i18n';

const { width: SCREEN_W } = Dimensions.get('window');
const THUMB_SIZE = 52;
const PICK_THUMB = (SCREEN_W - 44 - 16) / 3; // 3-column grid in picker

export default function PhotoViewerScreen() {
  const insets = useSafeAreaInsets();
  const { treatmentId, photoIndex } = useLocalSearchParams<{
    treatmentId: string;
    photoIndex: string;
  }>();

  const treatment = treatmentId ? getTreatmentById(treatmentId) : null;
  const [photos, setPhotos] = useState<TreatmentPhoto[]>(
    () => (treatmentId ? getPhotosForTreatment(treatmentId) : [])
  );
  const initial = Math.min(parseInt(photoIndex ?? '0', 10), Math.max(0, photos.length - 1));
  const [current, setCurrent] = useState(initial);
  const [comparePhoto, setComparePhoto] = useState<TreatmentPhoto | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const { isPremium } = useSubscription();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const mainRef = useRef<FlatList>(null);
  const stripRef = useRef<FlatList>(null);

  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx != null) {
        setCurrent(idx);
        stripRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      }
    },
    []
  );

  const viewConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  function goTo(idx: number) {
    mainRef.current?.scrollToIndex({ index: idx, animated: true });
    setCurrent(idx);
  }

  const navPaddingTop = insets.top + 8;
  const bottomPad = insets.bottom + 10;

  if (photos.length === 0) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
        <View style={[styles.nav, { paddingTop: navPaddingTop }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="chevron-left" size={20} color={COLORS.ink2} />
          </Pressable>
        </View>
      </View>
    );
  }

  const photo = photos[current];
  const pickerPhotos = photos.filter((_, i) => i !== current);

  function handlePickerSelect(p: TreatmentPhoto) {
    setComparePhoto(p);
    setPickerVisible(false);
  }

  function handleEditConfirm(date: string, label: string, caption: string, uris: string[]) {
    const p = photos[current];
    const uri = uris[0] ?? p.uri;
    updatePhoto({ id: p.id, uri, date, label, caption });
    setPhotos(prev => prev.map(ph => ph.id === p.id ? { ...ph, uri, date, label, caption } : ph));
    setEditVisible(false);
  }

  function handleDelete() {
    setMenuVisible(false);
    const p = photos[current];
    Alert.alert(t('photo_viewer.delete_title'), t('photo_viewer.delete_message'), [
      { text: t('photo_viewer.delete_cancel'), style: 'cancel' },
      {
        text: t('photo_viewer.delete_confirm'), style: 'destructive', onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deletePhoto(p.id);
          const newPhotos = photos.filter(ph => ph.id !== p.id);
          if (newPhotos.length === 0) {
            router.back();
          } else {
            const newCurrent = Math.min(current, newPhotos.length - 1);
            setPhotos(newPhotos);
            setCurrent(newCurrent);
            setComparePhoto(null);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />

      {/* ── Nav bar ── */}
      <View style={[styles.nav, { paddingTop: navPaddingTop }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => comparePhoto ? setComparePhoto(null) : router.back()}
        >
          <Feather
            name={comparePhoto ? 'x' : 'chevron-left'}
            size={20}
            color={COLORS.ink2}
          />
        </Pressable>
        <View style={styles.navCenter}>
          {treatment && (
            <Text style={styles.navTitle} numberOfLines={1}>{treatment.name}</Text>
          )}
          <Text style={styles.counter}>
            {comparePhoto ? t('photo_viewer.compare_mode') : `${current + 1} / ${photos.length}`}
          </Text>
        </View>
        <Pressable style={styles.menuBtn} onPress={() => setMenuVisible(true)} accessibilityLabel={t('photo_viewer.menu_a11y')} accessibilityRole="button">
          <Feather name="more-horizontal" size={18} color={COLORS.ink2} />
        </Pressable>
      </View>

      {comparePhoto ? (
        /* ── Comparison view ── */
        <View style={styles.compareContainer}>
          {/* Left: current photo */}
          <View style={styles.compareHalf}>
            <Image source={{ uri: photo.uri }} style={styles.compareImg} resizeMode="contain" />
            <View style={styles.compareOverlay}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.62)']}
                style={styles.compareGradient}
              >
                {photo.label ? (
                  <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.compareBadge}>
                    <Text style={styles.compareBadgeText}>{photo.label}</Text>
                  </LinearGradient>
                ) : null}
                <Text style={styles.compareDate}>{formatDateDisplay(photo.date)}</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.compareDivider} />

          {/* Right: selected compare photo */}
          <View style={styles.compareHalf}>
            <Image source={{ uri: comparePhoto.uri }} style={styles.compareImg} resizeMode="contain" />
            <View style={styles.compareOverlay}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.62)']}
                style={styles.compareGradient}
              >
                {comparePhoto.label ? (
                  <LinearGradient colors={ACCENT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.compareBadge}>
                    <Text style={styles.compareBadgeText}>{comparePhoto.label}</Text>
                  </LinearGradient>
                ) : null}
                <Text style={styles.compareDate}>{formatDateDisplay(comparePhoto.date)}</Text>
              </LinearGradient>
            </View>
            {pickerPhotos.length > 0 && (
              <Pressable style={styles.changeBtn} onPress={() => setPickerVisible(true)}>
                <Feather name="refresh-cw" size={10} color="#fff" />
                <Text style={styles.changeBtnText}>{t('photo_viewer.change')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        /* ── Normal view ── */
        <>
          <FlatList
            ref={mainRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initial}
            getItemLayout={(_, index) => ({
              length: SCREEN_W,
              offset: SCREEN_W * index,
              index,
            })}
            onViewableItemsChanged={onViewable}
            viewabilityConfig={viewConfig}
            keyExtractor={item => item.id}
            style={styles.photoList}
            renderItem={({ item, index }) => (
              <View style={styles.photoPage}>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.photo}
                  resizeMode="contain"
                  accessibilityLabel={`${t('photo_viewer.photo_a11y', { n: index + 1, total: photos.length })}${item.label ? `, ${item.label}` : ''}`}
                />
              </View>
            )}
          />

          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoTop}>
              <Text style={styles.infoDate}>{formatDateDisplay(photo.date)}</Text>
              {photo.label ? (
                <LinearGradient
                  colors={ACCENT_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.labelBadge}
                >
                  <Text style={styles.labelBadgeText}>{photo.label}</Text>
                </LinearGradient>
              ) : null}
            </View>
            {photo.caption ? (
              <Text style={styles.captionText}>{photo.caption}</Text>
            ) : null}
          </View>

          {/* 比較ボタン */}
          {pickerPhotos.length > 0 && (
            <Pressable
              style={styles.compareBtn}
              onPress={() => {
                if (!isPremium) { router.push('/paywall'); return; }
                setPickerVisible(true);
              }}
            >
              <Feather name="columns" size={12} color={COLORS.purple} />
              <Text style={styles.compareBtnText}>{t('photo_viewer.compare_btn')}</Text>
              {!isPremium && <Feather name="lock" size={10} color={COLORS.purple} />}
            </Pressable>
          )}

          {/* Filmstrip */}
          {photos.length > 1 ? (
            <View style={[styles.filmstrip, { paddingBottom: bottomPad }]}>
              <FlatList
                ref={stripRef}
                data={photos}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.stripContent}
                getItemLayout={(_, index) => ({
                  length: THUMB_SIZE + 6,
                  offset: (THUMB_SIZE + 6) * index,
                  index,
                })}
                renderItem={({ item, index }) => {
                  const isActive = index === current;
                  return (
                    <Pressable
                      onPress={() => goTo(index)}
                      style={styles.thumbWrap}
                      accessibilityLabel={t('photo_viewer.thumb_a11y', { n: index + 1 })}
                      accessibilityRole="button"
                    >
                      <Image
                        source={{ uri: item.uri }}
                        style={[styles.thumb, isActive && styles.thumbActiveImg]}
                      />
                      {isActive && (
                        <LinearGradient
                          colors={ACCENT_GRADIENT}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.thumbBorder}
                        />
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
          ) : (
            <View style={{ height: bottomPad + 10 }} />
          )}
        </>
      )}

      {/* ── Photo picker modal ── */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerVisible(false)} />
          <View style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>{t('photo_viewer.picker_title')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.pickerGrid}>
                {pickerPhotos.map(p => (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [styles.pickThumbWrap, pressed && { opacity: 0.75 }]}
                    onPress={() => handlePickerSelect(p)}
                  >
                    <Image source={{ uri: p.uri }} style={styles.pickThumb} />
                    {p.label ? (
                      <View style={styles.pickLabel}>
                        <Text style={styles.pickLabelText} numberOfLines={1}>{p.label}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Pressable style={styles.pickerCancelRow} onPress={() => setPickerVisible(false)}>
              <Text style={styles.pickerCancelText}>{t('photo_viewer.picker_cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Edit modal ── */}
      {editVisible && treatment && photos[current] && (
        <PhotoModal
          uris={[photos[current].uri]}
          treatmentDate={treatment.date}
          initialDate={photos[current].date}
          initialCaption={photos[current].caption}
          allowPhotoChange
          confirmLabel={t('photo_viewer.edit_confirm')}
          onConfirm={handleEditConfirm}
          onCancel={() => setEditVisible(false)}
        />
      )}

      {/* ── Action menu ── */}
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
              onPress={() => { setMenuVisible(false); setEditVisible(true); }}
            >
              <Feather name="edit-2" size={16} color={COLORS.purple} />
              <Text style={styles.actionText}>{t('photo_viewer.action_edit')}</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable style={styles.actionRow} onPress={handleDelete}>
              <Feather name="trash-2" size={16} color={COLORS.pink} />
              <Text style={[styles.actionText, styles.actionTextDanger]}>{t('photo_viewer.action_delete')}</Text>
            </Pressable>
            <Pressable style={styles.actionCancelRow} onPress={() => setMenuVisible(false)}>
              <Text style={styles.actionCancelText}>{t('photo_viewer.action_cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Nav
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  navCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  navTitle: { fontSize: 13, fontWeight: '600', color: COLORS.ink, letterSpacing: 0.4 },
  counter: { fontSize: 10, color: COLORS.ink2, letterSpacing: 1.2, marginTop: 2 },

  // Normal mode - main photo
  photoList: { flex: 1 },
  photoPage: { width: SCREEN_W, flex: 1, alignItems: 'center', justifyContent: 'center' },
  photo: { width: SCREEN_W, height: '100%' as any },

  // Info card
  infoCard: {
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: RADIUS.card,
    padding: 14,
    ...CARD_SHADOW,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoDate: { fontSize: 12, color: COLORS.ink2, letterSpacing: 0.6, flex: 1 },
  labelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  labelBadgeText: { fontSize: 10, color: '#fff', fontWeight: '500' },
  captionText: { fontSize: 13, color: COLORS.ink, marginTop: 8, lineHeight: 20 },

  // Compare button (below info card)
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(124,95,163,0.09)',
    marginBottom: 10,
  },
  compareBtnText: { fontSize: 11, color: COLORS.purple, fontWeight: '500' },

  // Filmstrip
  filmstrip: { paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.separator },
  stripContent: { paddingHorizontal: 18, gap: 6 },
  thumbWrap: { position: 'relative' },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12, opacity: 0.45 },
  thumbActiveImg: { opacity: 1 },
  thumbBorder: {
    position: 'absolute',
    top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 14,
    zIndex: -1,
  },

  // Comparison view
  compareContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#111' },
  compareHalf: { flex: 1, position: 'relative' },
  compareImg: { width: '100%', height: '100%' },
  compareDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  compareOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  compareGradient: { paddingHorizontal: 10, paddingBottom: 20, paddingTop: 36, gap: 5 },
  compareBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  compareBadgeText: { fontSize: 9, color: '#fff', fontWeight: '500' },
  compareDate: { fontSize: 10, color: 'rgba(255,255,255,0.85)' },
  changeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  changeBtnText: { fontSize: 10, color: '#fff', fontWeight: '500' },

  // Picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    maxHeight: '70%',
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120,90,140,0.18)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.ink,
    marginBottom: 14,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  pickThumbWrap: {
    width: PICK_THUMB,
    borderRadius: 10,
    overflow: 'hidden',
  },
  pickThumb: { width: '100%', aspectRatio: 1 },
  pickLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  pickLabelText: { fontSize: 8, color: '#fff', fontWeight: '500' },
  pickerCancelRow: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
    marginTop: 4,
  },
  pickerCancelText: { fontSize: 13, color: COLORS.ink2 },

  // Menu button
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },

  // Action sheet
  actionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.50)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
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
