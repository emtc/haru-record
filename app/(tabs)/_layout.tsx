import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ACCENT_GRADIENT, COLORS } from '../../constants/theme';
import { t } from '../../lib/i18n';

const FAB_SIZE = 58;
const FAB_PROTRUDE = 22;
const TAB_BG = 'rgba(253,251,255,0.96)';

type TabConfig = {
  name: string;
  labelKey: string;
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
  iconInactive: React.ComponentProps<typeof Ionicons>['name'];
};

const TABS: TabConfig[] = [
  { name: 'index',    labelKey: 'tabs.home',     iconActive: 'home',     iconInactive: 'home-outline'     },
  { name: 'calendar', labelKey: 'tabs.calendar', iconActive: 'calendar', iconInactive: 'calendar-outline' },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index]?.name;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabBar}>

        {TABS.map((tab, i) => {
          const isFocused = currentRoute === tab.name;
          const isRight = i === 1;
          return (
            <React.Fragment key={tab.name}>
              {isRight && (
                <View style={styles.fabSlot}>
                  <Pressable
                    onPress={() => router.push('/add')}
                    accessibilityLabel={t('tabs.add_label')}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.fabRing, pressed && { opacity: 0.82 }]}
                  >
                    <LinearGradient
                      colors={ACCENT_GRADIENT}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.fab}
                    >
                      <Feather name="plus" size={24} color="#fff" />
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
              <Pressable
                style={styles.tabItem}
                onPress={() => navigation.navigate(tab.name)}
              >
                <View style={isFocused ? styles.iconActiveWrap : styles.iconWrap}>
                  <Ionicons
                    name={isFocused ? tab.iconActive : tab.iconInactive}
                    size={18}
                    color={isFocused ? COLORS.purple : COLORS.ink2}
                  />
                </View>
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {t(tab.labelKey)}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}

      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="stats"   options={{ href: null }} />
      <Tabs.Screen name="mypage"  options={{ href: null }} />
      <Tabs.Screen name="two"     options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: TAB_BG,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
    overflow: 'visible',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    overflow: 'visible',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActiveWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(124,95,163,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
    color: COLORS.ink2,
    fontWeight: '300',
  },
  tabLabelActive: {
    color: COLORS.purple,
    fontWeight: '500',
  },

  // Center FAB
  fabSlot: {
    width: FAB_SIZE + 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  fabRing: {
    marginTop: -FAB_PROTRUDE,
    width: FAB_SIZE + 8,
    height: FAB_SIZE + 8,
    borderRadius: (FAB_SIZE + 8) / 2,
    backgroundColor: TAB_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
