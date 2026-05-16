import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Kombin } from '../lib/types';
import { renkBul } from '../lib/outfitColor';

const CYAN = '#00D4FF';

interface Props {
  kombin: Kombin;
  tarih?: string;
  havaDerece?: number;
  havaDurum?: string;
  dil?: 'tr' | 'en';
}

function havaEmoji(durum?: string): string {
  if (!durum) return '🌡️';
  const d = durum.toLowerCase();
  if (d.includes('thunder') || d.includes('gürültü')) return '⛈️';
  if (d.includes('snow') || d.includes('kar')) return '❄️';
  if (d.includes('rain') || d.includes('yağmur') || d.includes('drizzle') || d.includes('çisenti')) return '🌧️';
  if (d.includes('cloud') || d.includes('bulut')) return '☁️';
  if (d.includes('mist') || d.includes('fog') || d.includes('sis')) return '🌫️';
  if (d.includes('clear') || d.includes('açık')) return '☀️';
  return '🌡️';
}

export default function ShareKarti({ kombin, tarih, havaDerece, havaDurum, dil = 'tr' }: Props) {
  const bugun = tarih ?? new Date().toLocaleDateString(dil === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric', month: 'long',
  });

  // Her parça için renk çıkar (palet için)
  const palet = (kombin.parcalar ?? [])
    .map(p => ({ ad: p, hex: renkBul(p) }))
    .filter(r => r.hex);

  return (
    <View style={s.kart}>
      {/* Gradient background katmanları */}
      <View style={s.bgKatman1} />
      <View style={s.bgKatman2} />
      <View style={s.bgKatman3} />

      {/* Header: logo solda, hava chip sağda */}
      <View style={s.header}>
        <View style={s.logoSatir}>
          <View style={s.logoDaire}>
            <Text style={s.logoHarf}>x</Text>
          </View>
          <Text style={s.appAd}>xmobile</Text>
        </View>
        {havaDerece !== undefined && (
          <View style={s.havaChip}>
            <Text style={s.havaEmoji}>{havaEmoji(havaDurum)}</Text>
            <Text style={s.havaDerece}>{havaDerece}°</Text>
          </View>
        )}
      </View>

      {/* Renk paleti (kombinin görsel parmak izi) */}
      {palet.length > 0 && (
        <View style={s.paletSatir}>
          {palet.map((r, i) => (
            <View
              key={i}
              style={[
                s.paletBlok,
                {
                  backgroundColor: r.hex,
                  flex: 1,
                  borderTopLeftRadius: i === 0 ? 12 : 0,
                  borderBottomLeftRadius: i === 0 ? 12 : 0,
                  borderTopRightRadius: i === palet.length - 1 ? 12 : 0,
                  borderBottomRightRadius: i === palet.length - 1 ? 12 : 0,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Başlık */}
      <Text style={s.baslik} numberOfLines={2}>{kombin.baslik}</Text>

      {/* Tarih */}
      <Text style={s.tarih}>{bugun}</Text>

      {/* Parçalar (renk noktalı chip'ler) */}
      <View style={s.parcalar}>
        {kombin.parcalar.slice(0, 6).map((p, i) => {
          const renk = renkBul(p);
          return (
            <View key={i} style={s.parcaChip}>
              {renk && <View style={[s.renkNoktasi, { backgroundColor: renk }]} />}
              <Text style={s.parcaMetin} numberOfLines={1}>{p}</Text>
            </View>
          );
        })}
      </View>

      {/* Neden (varsa) */}
      {kombin.neden ? (
        <Text style={s.neden} numberOfLines={3}>{kombin.neden}</Text>
      ) : null}

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.hashtag}>#xmobile</Text>
        <Text style={s.cta}>
          {dil === 'tr' ? 'AI moda asistanın' : 'Your AI fashion stylist'}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  kart: {
    width: 320,
    backgroundColor: '#06101F',
    borderRadius: 22,
    padding: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.18)',
  },

  // Katmanlı gradient — radial benzeri 3 daire
  bgKatman1: {
    position: 'absolute',
    top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(0,212,255,0.10)',
  },
  bgKatman2: {
    position: 'absolute',
    bottom: -80, left: -40,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(120,80,200,0.08)',
  },
  bgKatman3: {
    position: 'absolute',
    top: 80, left: 100,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(0,212,255,0.04)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  logoSatir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDaire: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,212,255,0.18)',
    borderWidth: 1, borderColor: CYAN,
    alignItems: 'center', justifyContent: 'center',
  },
  logoHarf: { fontSize: 14, fontWeight: '900', color: CYAN, lineHeight: 16 },
  appAd:    { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  havaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  havaEmoji:  { fontSize: 13 },
  havaDerece: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Renk paleti — kombinin parmak izi
  paletSatir: {
    flexDirection: 'row',
    height: 32,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  paletBlok: { height: '100%' },

  // Başlık
  baslik: {
    fontSize: 24, fontWeight: '800', color: '#fff',
    lineHeight: 30, letterSpacing: -0.5, marginBottom: 6,
  },
  tarih: {
    fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16, letterSpacing: 0.3,
  },

  // Parça chip'leri
  parcalar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  parcaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.10)',
    maxWidth: 200,
  },
  renkNoktasi: {
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  parcaMetin: { fontSize: 12, color: '#fff', fontWeight: '500' },

  // Neden
  neden: {
    fontSize: 13, color: 'rgba(255,255,255,0.55)',
    lineHeight: 19, fontStyle: 'italic', marginBottom: 18,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.10)',
    paddingTop: 12,
    marginTop: 4,
  },
  hashtag: {
    fontSize: 12, fontWeight: '800', color: CYAN, letterSpacing: 0.5,
  },
  cta: {
    fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.3,
  },
});
