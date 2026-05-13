import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import type { Kombin } from '../lib/types';

const CYAN   = '#00D4FF';
const W      = Dimensions.get('window').width - 48;
const H      = W * (16 / 9);

interface Props {
  kombin: Kombin;
  tarih?: string;
  havaDerece?: number;
  havaDurum?: string;
  dil?: 'tr' | 'en';
}

export default function StoryKarti({ kombin, tarih, havaDerece, havaDurum, dil = 'tr' }: Props) {
  const bugun = tarih ?? new Date().toLocaleDateString(dil === 'tr' ? 'tr-TR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <View style={s.kart}>
      <View style={s.bg} />
      <View style={s.accentTop} />
      <View style={s.accentBot} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.logoDaire}>
          <Text style={s.logoHarf}>x</Text>
        </View>
        <View>
          <Text style={s.appAd}>xmobile</Text>
          <Text style={s.appSlogan}>{dil === 'tr' ? 'AI Moda Asistanı' : 'AI Fashion Assistant'}</Text>
        </View>
      </View>

      {/* Center content */}
      <View style={s.merkez}>
        <Text style={s.etiket}>{dil === 'tr' ? "BUGÜNÜN KOMBİNİ" : "TODAY'S OUTFIT"}</Text>
        <Text style={s.baslik} numberOfLines={3}>{kombin.baslik}</Text>

        {(havaDerece !== undefined || tarih) && (
          <View style={s.bilgiSatir}>
            {havaDerece !== undefined && (
              <View style={s.bilgiChip}>
                <Text style={s.bilgiText}>{havaDerece}°C {havaDurum ?? ''}</Text>
              </View>
            )}
            <View style={s.bilgiChip}>
              <Text style={s.bilgiText}>{bugun}</Text>
            </View>
          </View>
        )}

        <View style={s.divider} />

        {/* Pieces */}
        <View style={s.parcalar}>
          {kombin.parcalar.slice(0, 6).map((p, i) => (
            <View key={i} style={s.parcaChip}>
              <Text style={s.parcaMetin}>{p}</Text>
            </View>
          ))}
        </View>

        {kombin.neden ? (
          <Text style={s.neden} numberOfLines={4}>{kombin.neden}</Text>
        ) : null}
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerMetin}>
          {dil === 'tr' ? 'xmobile ile stilini keşfet' : 'Discover your style with xmobile'}
        </Text>
        <View style={s.cizgi} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  kart: {
    width: W, height: H,
    borderRadius: 24, overflow: 'hidden',
    backgroundColor: '#050D1A',
    justifyContent: 'space-between',
    padding: 28,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050D1A',
  },
  accentTop: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  accentBot: {
    position: 'absolute', bottom: -80, left: -40,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(0,212,255,0.05)',
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoDaire: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 1.5, borderColor: CYAN,
    alignItems: 'center', justifyContent: 'center',
  },
  logoHarf:  { fontSize: 20, fontWeight: '900', color: CYAN },
  appAd:     { fontSize: 16, fontWeight: '800', color: '#fff' },
  appSlogan: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },

  merkez: { flex: 1, justifyContent: 'center', gap: 16 },
  etiket: {
    fontSize: 10, fontWeight: '800', letterSpacing: 3,
    color: CYAN, opacity: 0.7,
  },
  baslik: {
    fontSize: 32, fontWeight: '900', color: '#fff',
    lineHeight: 38, letterSpacing: -0.5,
  },
  bilgiSatir: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  bilgiChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bilgiText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  divider: { height: 0.5, backgroundColor: 'rgba(0,212,255,0.2)' },
  parcalar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  parcaChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 0.5, borderColor: 'rgba(0,212,255,0.25)',
  },
  parcaMetin: { fontSize: 13, color: CYAN, fontWeight: '500' },
  neden: {
    fontSize: 14, color: 'rgba(255,255,255,0.45)',
    lineHeight: 22, fontStyle: 'italic',
  },

  footer: { alignItems: 'center', gap: 10 },
  footerMetin: { fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 },
  cizgi: { width: 40, height: 2, borderRadius: 1, backgroundColor: CYAN, opacity: 0.3 },
});
