import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/context';

const CYAN = '#00D4FF';

const TABS: Record<string, { active: string; inactive: string; tr: string; en: string }> = {
  outfits:  { active: 'shirt',       inactive: 'shirt-outline',       tr: 'Kombin',   en: 'Outfits'  },
  wardrobe: { active: 'grid',        inactive: 'grid-outline',        tr: 'Gardırop', en: 'Wardrobe' },
  discover: { active: 'compass',     inactive: 'compass-outline',     tr: 'Keşfet',   en: 'Discover' },
  ai:       { active: 'sparkles',    inactive: 'sparkles-outline',    tr: 'AI',       en: 'AI'       },
  profile:  { active: 'person',      inactive: 'person-outline',      tr: 'Profil',   en: 'Profile'  },
};

export default function PillTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { renkler, dil } = useApp();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]} pointerEvents="box-none">
      <View style={[styles.pill, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TABS[route.name];
          if (!tab) return null;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={[styles.tab, focused && styles.tabActive]}
              activeOpacity={0.75}
            >
              <Ionicons
                name={(focused ? tab.active : tab.inactive) as any}
                size={21}
                color={focused ? CYAN : renkler.metin2}
              />
              <Text style={[styles.label, { color: focused ? CYAN : renkler.metin2 }]}>
                {dil === 'en' ? tab.en : tab.tr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 40,
    borderWidth: 0.5,
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 2,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 14,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 32,
    gap: 3,
  },
  tabActive: {
    backgroundColor: 'rgba(0,212,255,0.1)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
