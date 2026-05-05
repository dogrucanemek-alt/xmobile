import { View, StyleSheet, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import Svg, { Circle, Rect, Path, Ellipse } from 'react-native-svg';
import { useApp } from '../lib/context';

const PROFIL_KEY = 'xmobile_profil';
const W = 200, H = 400, DISP_W = 170, DISP_H = 340;

const TEN_RENKLERI = [
  { ad: 'Açık',   renk: '#FDDBB4' },
  { ad: 'Buğday', renk: '#E8B887' },
  { ad: 'Esmer',  renk: '#C68642' },
  { ad: 'Koyu',   renk: '#8D5524' },
];
const SAC_RENKLERI = [
  { ad: 'Siyah', renk: '#1A1A1A' },
  { ad: 'Kahve', renk: '#6B3A2A' },
  { ad: 'Sarı',  renk: '#D4A843' },
  { ad: 'Kızıl', renk: '#A0391E' },
  { ad: 'Gri',   renk: '#808080' },
  { ad: 'Beyaz', renk: '#E8E8E8' },
];
const GOZ_RENKLERI = [
  { ad: 'Kahve', renk: '#6B3A2A' },
  { ad: 'Yeşil', renk: '#4A7C59' },
  { ad: 'Mavi',  renk: '#4A7CB5' },
  { ad: 'Siyah', renk: '#1A1A1A' },
];
const SAC_STILLERI = [
  { adTR: 'Kısa',  adEN: 'Short',  deger: 'kisa' },
  { adTR: 'Orta',  adEN: 'Medium', deger: 'orta' },
  { adTR: 'Uzun',  adEN: 'Long',   deger: 'uzun' },
];

function AvatarOnizleme({ tenRengi, sacRengi, gozRengi, sacStili }) {
  const uzunSac = sacStili === 'uzun';

  return (
    <Svg width={DISP_W} height={DISP_H} viewBox={`0 0 ${W} ${H}`}>
      <Ellipse cx={100} cy={392} rx={58} ry={7} fill="rgba(0,0,0,0.10)" />

      {/* Saç arka */}
      {uzunSac ? (
        <Path d="M 44 110 C 40 48, 160 48, 156 110 L 162 238 C 155 263, 45 263, 38 238 Z" fill={sacRengi} />
      ) : (
        <Path d="M 44 110 C 40 48, 160 48, 156 110" fill={sacRengi} />
      )}

      {/* Baş */}
      <Ellipse cx={100} cy={110} rx={56} ry={62} fill={tenRengi} />

      {/* Kulaklar */}
      <Ellipse cx={44}  cy={114} rx={8}  ry={10} fill={tenRengi} />
      <Ellipse cx={156} cy={114} rx={8}  ry={10} fill={tenRengi} />
      <Ellipse cx={44}  cy={114} rx={5}  ry={6}  fill="rgba(0,0,0,0.07)" />
      <Ellipse cx={156} cy={114} rx={5}  ry={6}  fill="rgba(0,0,0,0.07)" />

      {/* Yanaklar */}
      <Ellipse cx={68}  cy={124} rx={13} ry={9}  fill="rgba(255,120,100,0.18)" />
      <Ellipse cx={132} cy={124} rx={13} ry={9}  fill="rgba(255,120,100,0.18)" />

      {/* Kaşlar */}
      <Path d="M 76 88 Q 86 82 96 88"    stroke={sacRengi} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M 104 88 Q 114 82 124 88" stroke={sacRengi} strokeWidth={3} fill="none" strokeLinecap="round" />

      {/* Gözler */}
      <Ellipse cx={86}  cy={100} rx={11} ry={11} fill="white" />
      <Ellipse cx={114} cy={100} rx={11} ry={11} fill="white" />
      <Circle  cx={86}  cy={101} r={7}   fill={gozRengi} />
      <Circle  cx={114} cy={101} r={7}   fill={gozRengi} />
      <Circle  cx={86}  cy={101} r={3.5} fill="#111" />
      <Circle  cx={114} cy={101} r={3.5} fill="#111" />
      <Circle  cx={88}  cy={97}  r={2.5} fill="white" />
      <Circle  cx={116} cy={97}  r={2.5} fill="white" />

      {/* Burun */}
      <Path d="M 97 112 Q 95 122 97 124 Q 100 127 103 124 Q 105 122 103 112"
        fill="none" stroke="rgba(0,0,0,0.13)" strokeWidth={1.8} strokeLinecap="round" />

      {/* Ağız */}
      <Path d="M 88 132 Q 100 143 112 132"
        stroke="#D4706C" strokeWidth={3} fill="none" strokeLinecap="round" />

      {/* Saç ön */}
      <Path d="M 44 80 C 44 44, 156 44, 156 80 C 140 62, 60 62, 44 80 Z" fill={sacRengi} />
      {uzunSac && (
        <>
          <Path d="M 44 110 C 34 158, 32 200, 34 228"
            stroke={sacRengi} strokeWidth={14} fill="none" strokeLinecap="round" />
          <Path d="M 156 110 C 166 158, 168 200, 166 228"
            stroke={sacRengi} strokeWidth={14} fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Boyun */}
      <Rect x={88} y={168} width={24} height={20} fill={tenRengi} />

      {/* Gömlek */}
      <Rect x={50}  y={186} width={100} height={88} rx={12} fill="#4A90D9" />
      <Rect x={22}  y={188} width={28}  height={80} rx={12} fill="#4A90D9" />
      <Rect x={150} y={188} width={28}  height={80} rx={12} fill="#4A90D9" />
      <Path d="M 88 188 Q 100 202 112 188" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={2} />

      {/* Bilekler */}
      <Rect x={22}  y={256} width={28} height={14} fill={tenRengi} />
      <Rect x={150} y={256} width={28} height={14} fill={tenRengi} />

      {/* Pantolon */}
      <Rect x={50}  y={270} width={100} height={94} rx={6} fill="#2C3E50" />
      <Rect x={98}  y={296} width={4}   height={68} fill="rgba(0,0,0,0.12)" />

      {/* Ayakkabılar */}
      <Rect x={38}  y={360} width={62} height={22} rx={9} fill="#1A1A1A" />
      <Rect x={100} y={360} width={62} height={22} rx={9} fill="#1A1A1A" />
      <Rect x={38}  y={375} width={62} height={7}  rx={4} fill="rgba(0,0,0,0.28)" />
      <Rect x={100} y={375} width={62} height={7}  rx={4} fill="rgba(0,0,0,0.28)" />
    </Svg>
  );
}

export default function AvatarScreen() {
  const router = useRouter();
  const { t, renkler, dil } = useApp();

  const [tenRengi, setTenRengi] = useState('#FDDBB4');
  const [sacRengi, setSacRengi] = useState('#1A1A1A');
  const [gozRengi, setGozRengi] = useState('#6B3A2A');
  const [cinsiyet, setCinsiyet] = useState('Erkek');
  const [sacStili, setSacStili] = useState('orta');

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    try {
      const kayitli = await AsyncStorage.getItem(PROFIL_KEY);
      if (kayitli) {
        const p = JSON.parse(kayitli);
        setTenRengi(p.tenRengi || '#FDDBB4');
        setSacRengi(p.sacRengi || '#1A1A1A');
        setGozRengi(p.gozRengi || '#6B3A2A');
        setCinsiyet(p.cinsiyet || 'Erkek');
        setSacStili(p.sacStili || (p.cinsiyet === 'Kadın' ? 'uzun' : 'orta'));
      }
    } catch (e) {}
  };

  const kaydet = async () => {
    try {
      const kayitli = await AsyncStorage.getItem(PROFIL_KEY);
      const profil = kayitli ? JSON.parse(kayitli) : {};
      Object.assign(profil, { tenRengi, sacRengi, gozRengi, cinsiyet, sacStili });
      await AsyncStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
      router.back();
    } catch (e) {}
  };

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg2 }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <View style={[styles.header, { backgroundColor: renkler.bg, borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>{t.iptal}</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>
          {dil === 'en' ? 'My Avatar' : 'Avatarım'}
        </Text>
        <TouchableOpacity onPress={kaydet}>
          <Text style={[styles.kaydetBtn, { color: renkler.metin }]}>{t.kaydet}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.onizlemeBolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <AvatarOnizleme
            tenRengi={tenRengi}
            sacRengi={sacRengi}
            gozRengi={gozRengi}
            cinsiyet={cinsiyet}
            sacStili={sacStili}
          />
        </View>

        {/* Cinsiyet */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Gender' : 'Cinsiyet'}
          </Text>
          <View style={styles.chipGrup}>
            {[{ tr: 'Erkek', en: 'Male' }, { tr: 'Kadın', en: 'Female' }].map(c => (
              <TouchableOpacity
                key={c.tr}
                style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir },
                  cinsiyet === c.tr && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }
                ]}
                onPress={() => setCinsiyet(c.tr)}
              >
                <Text style={[styles.chipText, { color: renkler.metin2 },
                  cinsiyet === c.tr && { color: renkler.btnPrimaryMetin }
                ]}>
                  {dil === 'en' ? c.en : c.tr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Saç Stili */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Hair Style' : 'Saç Stili'}
          </Text>
          <View style={styles.chipGrup}>
            {SAC_STILLERI.map(s => (
              <TouchableOpacity
                key={s.deger}
                style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir },
                  sacStili === s.deger && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }
                ]}
                onPress={() => setSacStili(s.deger)}
              >
                <Text style={[styles.chipText, { color: renkler.metin2 },
                  sacStili === s.deger && { color: renkler.btnPrimaryMetin }
                ]}>
                  {dil === 'en' ? s.adEN : s.adTR}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ten Rengi */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Skin Tone' : 'Ten Rengi'}
          </Text>
          <View style={styles.renkGrup}>
            {TEN_RENKLERI.map(r => (
              <TouchableOpacity key={r.renk}
                style={[styles.renkDaire, { backgroundColor: r.renk }, tenRengi === r.renk && styles.renkSecili]}
                onPress={() => setTenRengi(r.renk)}
              >
                {tenRengi === r.renk && <Text style={styles.renkTik}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Saç Rengi */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Hair Color' : 'Saç Rengi'}
          </Text>
          <View style={styles.renkGrup}>
            {SAC_RENKLERI.map(r => (
              <TouchableOpacity key={r.renk}
                style={[styles.renkDaire, { backgroundColor: r.renk }, sacRengi === r.renk && styles.renkSecili]}
                onPress={() => setSacRengi(r.renk)}
              >
                {sacRengi === r.renk && <Text style={[styles.renkTik, { color: '#fff' }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Göz Rengi */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Eye Color' : 'Göz Rengi'}
          </Text>
          <View style={styles.renkGrup}>
            {GOZ_RENKLERI.map(r => (
              <TouchableOpacity key={r.renk}
                style={[styles.renkDaire, { backgroundColor: r.renk }, gozRengi === r.renk && styles.renkSecili]}
                onPress={() => setGozRengi(r.renk)}
              >
                {gozRengi === r.renk && <Text style={[styles.renkTik, { color: '#fff' }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 0.5,
  },
  geri:           { fontSize: 16 },
  baslik:         { fontSize: 17, fontWeight: '600' },
  kaydetBtn:      { fontSize: 16, fontWeight: '600' },
  onizlemeBolum: {
    margin: 16, borderRadius: 14, padding: 24,
    borderWidth: 0.5, alignItems: 'center',
  },
  bolum: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 18, borderWidth: 0.5,
  },
  bolumBaslik:    { fontSize: 13, marginBottom: 12 },
  chipGrup:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:           { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 0.5 },
  chipText:       { fontSize: 14 },
  renkGrup:       { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  renkDaire:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEEEEE' },
  renkSecili:     { borderWidth: 3, borderColor: '#000000' },
  renkTik:        { fontSize: 16, color: '#000000', fontWeight: 'bold' },
});
