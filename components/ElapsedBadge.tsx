import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../constants/theme';
import { ElapsedTime } from '../types';

interface Props {
  elapsed: ElapsedTime;
  compact?: boolean;
  gradient: [string, string];
}

export default function ElapsedBadge({ elapsed, compact = false, gradient }: Props) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactLabel}>経過</Text>
        <View style={styles.compactRow}>
          {elapsed.months > 0 ? (
            <>
              <Text style={styles.compactNum}>{elapsed.months}</Text>
              <Text style={styles.compactUnit}>ヶ月</Text>
              {elapsed.days > 0 && (
                <>
                  <Text style={styles.compactNum}>{elapsed.days}</Text>
                  <Text style={styles.compactUnit}>日</Text>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.compactNum}>{elapsed.totalDays}</Text>
              <Text style={styles.compactUnit}>日</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.badge}
    >
      <Text style={styles.badgeLabel}>経過</Text>
      <View style={styles.badgeRow}>
        {elapsed.months > 0 ? (
          <>
            <Text style={styles.bigNum}>{elapsed.months}</Text>
            <Text style={styles.unit}>ヶ月</Text>
            {elapsed.days > 0 && (
              <>
                <Text style={styles.midNum}>{elapsed.days}</Text>
                <Text style={styles.unit}>日</Text>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.bigNum}>{elapsed.totalDays}</Text>
            <Text style={styles.unit}>日</Text>
          </>
        )}
      </View>
      <Text style={styles.totalDays}>{elapsed.totalDays}d</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  badgeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginRight: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, flex: 1 },
  bigNum: { fontSize: 30, fontWeight: '300', color: '#fff', letterSpacing: -1 },
  midNum: { fontSize: 22, fontWeight: '300', color: '#fff', marginLeft: 4 },
  unit: { fontSize: 12, color: '#fff' },
  totalDays: { fontSize: 10, color: 'rgba(255,255,255,0.85)' },

  compactContainer: { alignItems: 'flex-end', minWidth: 56 },
  compactLabel: { fontSize: 10, color: COLORS.ink2 },
  compactRow: { flexDirection: 'row', alignItems: 'baseline', gap: 1, justifyContent: 'flex-end' },
  compactNum: { fontSize: 20, fontWeight: '500', letterSpacing: -0.3, color: COLORS.ink },
  compactUnit: { fontSize: 11, color: COLORS.ink2 },
});
