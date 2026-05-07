import { View, StyleSheet, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import Svg, {
  Circle, Rect, Path, Ellipse,
  Defs, RadialGradient, LinearGradient, Stop,
} from 'react-native-svg';
import { useApp } from '../lib/context';

const PROFIL_KEY = 'xmobile_profil';
const W = 200, H = 400, DISP_W = 180, DISP_H = 360;

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
const SAKAL_SECENEKLERI = [
  { adTR: 'Yok',    adEN: 'None',    deger: 'yok'  },
  { adTR: 'Hafif',  adEN: 'Stubble', deger: 'hafif'},
  { adTR: 'Tam',    adEN: 'Full',    deger: 'tam'  },
];

function AvatarOnizleme({ tenRengi, sacRengi, gozRengi, sacStili, sakal }: { tenRengi: string; sacRengi: string; gozRengi: string; sacStili: string; sakal: string }) {
  const uzunSac = sacStili === 'uzun';

  return (
    <Svg width={DISP_W} height={DISP_H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        {/* Yüz 3D gradyanı */}
        <RadialGradient id="avYuz" cx="40%" cy="35%" rx="60%" ry="55%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.30} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.14} />
        </RadialGradient>
        {/* Saç gradyanı */}
        <RadialGradient id="avSac" cx="50%" cy="15%" rx="55%" ry="60%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.22} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.30} />
        </RadialGradient>
        {/* Iris gradyanı */}
        <RadialGradient id="avIris" cx="35%" cy="30%" rx="65%" ry="65%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.35} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.25} />
        </RadialGradient>
        {/* Gömlek gradyanı */}
        <LinearGradient id="avGomlek" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.18} />
        </LinearGradient>
      </Defs>

      {/* Zemin gölge */}
      <Ellipse cx={100} cy={392} rx={60} ry={8} fill="rgba(0,0,0,0.12)" />

      {/* ── SAÇ ARKA ── */}
      {uzunSac ? (
        <Path d="M 44 108 C 38 44, 162 44, 156 108 L 164 240 C 156 268, 44 268, 36 240 Z" fill={sacRengi} />
      ) : (
        <Path d="M 44 108 C 38 44, 162 44, 156 108" fill={sacRengi} />
      )}

      {/* ── BAŞ ── */}
      <Ellipse cx={100} cy={106} rx={58} ry={66} fill={tenRengi} />
      {/* Yüz 3D shading */}
      <Ellipse cx={100} cy={106} rx={58} ry={66} fill="url(#avYuz)" />

      {/* Kulaklar */}
      <Ellipse cx={42}  cy={112} rx={9}  ry={11} fill={tenRengi} />
      <Ellipse cx={158} cy={112} rx={9}  ry={11} fill={tenRengi} />
      <Ellipse cx={42}  cy={112} rx={5.5} ry={7} fill="rgba(0,0,0,0.08)" />
      <Ellipse cx={158} cy={112} rx={5.5} ry={7} fill="rgba(0,0,0,0.08)" />

      {/* Yanaklar */}
      <Ellipse cx={66}  cy={126} rx={15} ry={10} fill="rgba(240,100,80,0.18)" />
      <Ellipse cx={134} cy={126} rx={15} ry={10} fill="rgba(240,100,80,0.18)" />

      {/* ── SAKAL ── */}
      {sakal === 'hafif' && (
        <>
          <Ellipse cx={100} cy={158} rx={30} ry={14} fill={sacRengi} opacity={0.35} />
          <Ellipse cx={76}  cy={150} rx={13} ry={9}  fill={sacRengi} opacity={0.25} />
          <Ellipse cx={124} cy={150} rx={13} ry={9}  fill={sacRengi} opacity={0.25} />
        </>
      )}
      {sakal === 'tam' && (
        <>
          <Path
            d="M 58 138 Q 58 172 100 178 Q 142 172 142 138 Q 135 158 100 164 Q 65 158 58 138 Z"
            fill={sacRengi} opacity={0.75}
          />
          <Ellipse cx={72}  cy={142} rx={16} ry={11} fill={sacRengi} opacity={0.60} />
          <Ellipse cx={128} cy={142} rx={16} ry={11} fill={sacRengi} opacity={0.60} />
        </>
      )}

      {/* Kaşlar */}
      <Path d="M 72 86 Q 84 79 96 85"  stroke={sacRengi} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Path d="M 104 85 Q 116 79 128 86" stroke={sacRengi} strokeWidth={3.5} fill="none" strokeLinecap="round" />

      {/* ── GÖZLER ── */}
      {/* Sol göz */}
      <Ellipse cx={84}  cy={100} rx={13} ry={12} fill="white" />
      <Circle  cx={84}  cy={101} r={8.5} fill={gozRengi} />
      <Circle  cx={84}  cy={101} r={8.5} fill="url(#avIris)" />
      <Circle  cx={84}  cy={101} r={4}   fill="#0A0A0A" />
      <Circle  cx={87}  cy={97}  r={3}   fill="white" />
      <Circle  cx={82}  cy={104} r={1.2} fill="white" opacity={0.7} />
      {/* Sağ göz */}
      <Ellipse cx={116} cy={100} rx={13} ry={12} fill="white" />
      <Circle  cx={116} cy={101} r={8.5} fill={gozRengi} />
      <Circle  cx={116} cy={101} r={8.5} fill="url(#avIris)" />
      <Circle  cx={116} cy={101} r={4}   fill="#0A0A0A" />
      <Circle  cx={119} cy={97}  r={3}   fill="white" />
      <Circle  cx={114} cy={104} r={1.2} fill="white" opacity={0.7} />

      {/* Burun */}
      <Path d="M 96 113 Q 94 124 97 126 Q 100 129 103 126 Q 106 124 104 113"
        fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx={97}  cy={126} rx={4} ry={2.5} fill="rgba(0,0,0,0.10)" />
      <Ellipse cx={103} cy={126} rx={4} ry={2.5} fill="rgba(0,0,0,0.10)" />

      {/* Ağız */}
      <Path d="M 86 136 Q 100 148 114 136"
        stroke="#C0605A" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M 90 137 Q 100 144 110 137"
        stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} fill="none" strokeLinecap="round" />

      {/* ── SAÇ ÖN ── */}
      <Path d="M 42 76 C 42 40, 158 40, 158 76 C 142 56, 58 56, 42 76 Z" fill={sacRengi} />
      <Path d="M 42 76 C 42 40, 158 40, 158 76 C 142 56, 58 56, 42 76 Z" fill="url(#avSac)" />
      {uzunSac && (
        <>
          <Path d="M 44 108 C 33 158, 30 205, 32 232"
            stroke={sacRengi} strokeWidth={16} fill="none" strokeLinecap="round" />
          <Path d="M 44 108 C 33 158, 30 205, 32 232"
            stroke="url(#avSac)" strokeWidth={16} fill="none" strokeLinecap="round" />
          <Path d="M 156 108 C 167 158, 170 205, 168 232"
            stroke={sacRengi} strokeWidth={16} fill="none" strokeLinecap="round" />
          <Path d="M 156 108 C 167 158, 170 205, 168 232"
            stroke="url(#avSac)" strokeWidth={16} fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── BOYUN ── */}
      <Rect x={87} y={168} width={26} height={18} fill={tenRengi} />

      {/* ── GÖMLEK ── */}
      <Rect x={50}  y={184} width={100} height={90} rx={14} fill="#4A90D9" />
      <Rect x={22}  y={186} width={30}  height={82} rx={12} fill="#4A90D9" />
      <Rect x={148} y={186} width={30}  height={82} rx={12} fill="#4A90D9" />
      {/* Yaka */}
      <Path d="M 86 186 Q 100 202 114 186" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={2.5} />
      {/* Gömlek shading */}
      <Rect x={50}  y={184} width={100} height={90} rx={14} fill="url(#avGomlek)" />
      <Rect x={22}  y={186} width={30}  height={82} rx={12} fill="url(#avGomlek)" />
      <Rect x={148} y={186} width={30}  height={82} rx={12} fill="url(#avGomlek)" />

      {/* Bilekler */}
      <Rect x={22}  y={256} width={30} height={14} fill={tenRengi} />
      <Rect x={148} y={256} width={30} height={14} fill={tenRengi} />

      {/* ── PANTOLON ── */}
      <Rect x={50}  y={272} width={100} height={92} rx={8}  fill="#1E2D3D" />
      <Rect x={97}  y={296} width={6}   height={68} rx={3}  fill="rgba(0,0,0,0.15)" />
      {/* Pantolon highlight */}
      <Rect x={54}  y={274} width={42} height={88} rx={6} fill="rgba(255,255,255,0.05)" />

      {/* ── AYAKKABI ── */}
      <Rect x={36}  y={360} width={64} height={24} rx={10} fill="#111" />
      <Rect x={100} y={360} width={64} height={24} rx={10} fill="#111" />
      <Rect x={36}  y={374} width={64} height={8}  rx={5}  fill="rgba(255,255,255,0.10)" />
      <Rect x={100} y={374} width={64} height={8}  rx={5}  fill="rgba(255,255,255,0.10)" />
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
  const [sakal,    setSakal]    = useState('yok');

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
        setSacStili(p.sacStili || 'orta');
        setSakal(p.sakal       || 'yok');
      }
    } catch (e) {}
  };

  const kaydet = async () => {
    try {
      const kayitli = await AsyncStorage.getItem(PROFIL_KEY);
      const profil = kayitli ? JSON.parse(kayitli) : {};
      Object.assign(profil, { tenRengi, sacRengi, gozRengi, cinsiyet, sacStili, sakal });
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
            tenRengi={tenRengi} sacRengi={sacRengi}
            gozRengi={gozRengi}
            sacStili={sacStili} sakal={sakal}
          />
        </View>

        {/* Cinsiyet */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>{dil === 'en' ? 'Gender' : 'Cinsiyet'}</Text>
          <View style={styles.chipGrup}>
            {[{ tr: 'Erkek', en: 'Male' }, { tr: 'Kadın', en: 'Female' }].map(c => (
              <TouchableOpacity key={c.tr}
                style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir },
                  cinsiyet === c.tr && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }]}
                onPress={() => setCinsiyet(c.tr)}>
                <Text style={[styles.chipText, { color: renkler.metin2 },
                  cinsiyet === c.tr && { color: renkler.btnPrimaryMetin }]}>
                  {dil === 'en' ? c.en : c.tr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Saç Stili */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>{dil === 'en' ? 'Hair Style' : 'Saç Stili'}</Text>
          <View style={styles.chipGrup}>
            {SAC_STILLERI.map(s => (
              <TouchableOpacity key={s.deger}
                style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir },
                  sacStili === s.deger && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }]}
                onPress={() => setSacStili(s.deger)}>
                <Text style={[styles.chipText, { color: renkler.metin2 },
                  sacStili === s.deger && { color: renkler.btnPrimaryMetin }]}>
                  {dil === 'en' ? s.adEN : s.adTR}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sakal */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>{dil === 'en' ? 'Facial Hair' : 'Sakal'}</Text>
          <View style={styles.chipGrup}>
            {SAKAL_SECENEKLERI.map(s => (
              <TouchableOpacity key={s.deger}
                style={[styles.chip, { backgroundColor: renkler.chip, borderColor: renkler.sinir },
                  sakal === s.deger && { backgroundColor: renkler.btnPrimary, borderColor: renkler.btnPrimary }]}
                onPress={() => setSakal(s.deger)}>
                <Text style={[styles.chipText, { color: renkler.metin2 },
                  sakal === s.deger && { color: renkler.btnPrimaryMetin }]}>
                  {dil === 'en' ? s.adEN : s.adTR}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ten Rengi */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>{dil === 'en' ? 'Skin Tone' : 'Ten Rengi'}</Text>
          <View style={styles.renkGrup}>
            {TEN_RENKLERI.map(r => (
              <TouchableOpacity key={r.renk}
                style={[styles.renkDaire, { backgroundColor: r.renk }, tenRengi === r.renk && styles.renkSecili]}
                onPress={() => setTenRengi(r.renk)}>
                {tenRengi === r.renk && <Text style={styles.renkTik}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Saç Rengi */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>{dil === 'en' ? 'Hair Color' : 'Saç Rengi'}</Text>
          <View style={styles.renkGrup}>
            {SAC_RENKLERI.map(r => (
              <TouchableOpacity key={r.renk}
                style={[styles.renkDaire, { backgroundColor: r.renk }, sacRengi === r.renk && styles.renkSecili]}
                onPress={() => setSacRengi(r.renk)}>
                {sacRengi === r.renk && <Text style={[styles.renkTik, { color: '#fff' }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Göz Rengi */}
        <View style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
          <Text style={[styles.bolumBaslik, { color: renkler.metin2 }]}>{dil === 'en' ? 'Eye Color' : 'Göz Rengi'}</Text>
          <View style={styles.renkGrup}>
            {GOZ_RENKLERI.map(r => (
              <TouchableOpacity key={r.renk}
                style={[styles.renkDaire, { backgroundColor: r.renk }, gozRengi === r.renk && styles.renkSecili]}
                onPress={() => setGozRengi(r.renk)}>
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
    margin: 16, borderRadius: 14, padding: 20,
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
  renkSecili:     { borderWidth: 3, borderColor: '#000' },
  renkTik:        { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
