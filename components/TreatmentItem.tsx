import React from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, CARD_SHADOW, RADIUS, CATEGORY_GRADIENT } from '../constants/theme';
import { Treatment, ElapsedTime } from '../types';
import ElapsedBadge from './ElapsedBadge';

interface Props {
  treatment: Treatment;
  elapsed: ElapsedTime;
  isFirst: boolean;
  onPress: () => void;
  photoUri?: string;
}

export default function TreatmentItem({ treatment, elapsed, isFirst, onPress, photoUri }: Props) {
  const dateShort = treatment.date.replace(/-/g, '.').substring(2);
  const catGradient = CATEGORY_GRADIENT[treatment.category] ?? CATEGORY_GRADIENT['その他'];

  return (
    <View style={[styles.row, isFirst && styles.rowFirst]}>
      {/* Timeline dot */}
      <View style={styles.dotCol}>
        <View style={[styles.dot, isFirst && styles.dotActive]} />
      </View>

      {/* Card */}
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }]}
        onPress={onPress}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            accessibilityLabel={`${treatment.name}の写真`}
          />
        ) : (
          <LinearGradient
            colors={catGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.photo}
            accessible={false}
          />
        )}

        <View style={styles.info}>
          <Text style={styles.meta} numberOfLines={1}>
            {dateShort} · {treatment.category}
          </Text>
          <Text style={styles.name} numberOfLines={1}>{treatment.name}</Text>
        </View>

        <ElapsedBadge elapsed={elapsed} compact gradient={catGradient} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
  },
  rowFirst: {},
  dotCol: {
    width: 24,
    alignItems: 'center',
    zIndex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.accent2,
  },
  dotActive: {
    backgroundColor: COLORS.accent2,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    ...CARD_SHADOW,
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: 13,
  },
  info: { flex: 1, minWidth: 0 },
  meta: { fontSize: 11, color: COLORS.ink2, letterSpacing: 0.2 },
  name: { fontSize: 14, fontWeight: '500', color: COLORS.ink, marginTop: 2 },
});
