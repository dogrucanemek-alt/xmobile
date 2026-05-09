import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { route: '/',         icon: '⬡',  label: 'Ana Sayfa' },
  { route: '/wardrobe', icon: '👔', label: 'Gardırop'  },
  { route: '/outfits',  icon: '✦',  label: 'Kombin'    },
  { route: '/jarvis',   icon: 'J',  label: 'Jarvis'    },
  { route: '/profile',  icon: '◎',  label: 'Profil'    },
];

const CYAN = '#00D4FF';

export default function GlassPillNav() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        {TABS.map(tab => {
          const aktif = pathname === tab.route;
          return (
            <TouchableOpacity
              key={tab.route}
              style={[styles.tab, aktif && styles.tabAktif]}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.icon, aktif && styles.iconAktif]}>{tab.icon}</Text>
              {aktif && <Text style={styles.label}>{tab.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none' as any,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,4,15,0.82)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
    gap: 6,
  },
  tabAktif: {
    backgroundColor: CYAN,
  },
  icon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.35)',
  },
  iconAktif: {
    color: '#000',
    fontWeight: '900',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
});
