import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Kombin } from '../lib/types';

const CYAN = '#00D4FF';

interface Props {
  kombin: Kombin;
  tarih?: string;
  havaDerece?: number;
  havaDurum?: string;
  dil?: 'tr' | 'en';
}

// Rendered by captureRef in outfits — pure layout, no interactivity
export default function ShareKarti({ kombin, tarih, havaDerece, havaDurum, dil = 'tr' }: Props) {
  const bugun = tarih ?? new Date().toLocaleDateString(dil === 'tr' ? 'tr-TR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <View style={s.kart}>
      {/* Gradient background strips */}
      <View style={s.gradientTop} />
      <View style={s.gradientBot} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.logoDaire}>
          <Text style={s.logoHarf}>x</Text>
        </View>
        <Text style={s.appAd}>xmobile</Text>
      </View>

      {/* Outfit title */}
      <Text style={s.baslik} numberOfLines={2}>{kombin.baslik}</Text>

      {/* Date + weather */}
      <View style={s.bilgiSatir}>
        <Text style={s.bilgiMetin}>{bugun}</Text>
        {havaDerece !== undefined && (
          <Text style={s.bilgiMetin}>  {havaDerece}°C {havaDurum ?? ''}</Text>
        )}
      </View>

      {/* Outfit pieces */}
      <View style={s.parcalar}>
        {kombin.parcalar.slice(0, 5).map((p, i) => (
          <View key={i} style={s.parcaChip}>
            <Text style={s.parcaMetin}>{p}</Text>
          </View>
        ))}
      </View>

      {/* Why text */}
      {kombin.neden ? (
        <Text style={s.neden} numberOfLines={3}>{kombin.neden}</Text>
      ) : null}

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerMetin}>
          {dil === 'tr' ? 'xmobile ile kombini yap' : 'Styled with xmobile'}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  kart: {
    width: 320, minHeight: 480,
    backgroundColor: '#050D1A',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 120,
    backgroundColor: 'rgba(0,212,255,0.07)',
  },
  gradientBot: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'rgba(0,212,255,0.04)',
  },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28,
  },
  logoDaire: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderWidth: 1, borderColor: CYAN,
    alignItems: 'center', justifyContent: 'center',
  },
  logoHarf: { fontSize: 16, fontWeight: '800', color: CYAN },
  appAd:    { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  baslik: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    lineHeight: 33, letterSpacing: -0.5, marginBottom: 12,
  },

  bilgiSatir: { flexDirection: 'row', marginBottom: 20 },
  bilgiMetin: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },

  parcalar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  parcaChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderWidth: 0.5, borderColor: 'rgba(0,212,255,0.3)',
  },
  parcaMetin: { fontSize: 13, color: CYAN, fontWeight: '500' },

  neden: {
    fontSize: 14, color: 'rgba(255,255,255,0.55)',
    lineHeight: 21, fontStyle: 'italic', marginBottom: 20,
  },

  footer: {
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 14, alignItems: 'center',
  },
  footerMetin: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },
});
