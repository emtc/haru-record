import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, ACCENT_GRADIENT, RADIUS } from '../constants/theme';

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function CategoryChip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.wrapper}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {active ? (
        <LinearGradient
          colors={ACCENT_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chip}
        >
          <Text style={styles.activeText}>{label}</Text>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.7)']}
          style={[styles.chip, styles.inactiveChip]}
        >
          <Text style={styles.inactiveText}>{label}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexShrink: 0 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.chip,
  },
  inactiveChip: {
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
  },
  activeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  inactiveText: {
    fontSize: 11,
    color: COLORS.ink2,
    fontWeight: '300',
  },
});
