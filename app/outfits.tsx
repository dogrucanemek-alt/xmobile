import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_KEY = '9dfe03744413ccb79c529c0a3f04847f';
const CLAUDE_KEY = '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';
const SEHIR = 'Izmir,TR';

const renkBul = (parcaAdi) => {
  const ad = (parcaAdi || '').toLowerCase();
  if (ad.includes('beyaz')) return '#F5F5F5';
  if (ad.includes('siyah')) return '#1A1A1A';
  if (ad.includes('lacivert')) return '#1B2A4A';
  if (ad.includes('mavi')) return '#2E6DA4';
  if (ad.includes('kirmizi') || ad.includes('kırmızı')) return '#C0392B';
  if (ad.includes('yesil') || ad.includes('yeşil')) return '#27AE60';
  if (ad.includes('sari') || ad.includes('sarı')) return '#F1C40F';
  if (ad.includes('gri')) return '#7F8C8D';
  if (ad.includes('bej') || ad.includes('krem')) return '#D4B896';
  if (ad.includes('kahve') || ad.includes('bordo')) return '#6B3A2A';
  if (ad.includes('pembe')) return '#E91E8C';
  if (ad.includes('turuncu')) return '#E67E22';
  if (ad.includes('mor')) return '#8E44AD';
  return '#4A90D9';
};

const AvatarKombin = ({ kombin, profil }) => {
  const tenRengi = profil?.tenRengi || '#FDDBB4';
  const sacRengi = profil?.sacRengi || '#1A1A1A';

  const ustParca = kombin.parcalar.find(p =>
    p.toLowerCase().includes('gömlek') || p.toLowerCase().includes('gomlek') ||
    p.toLowerCase().includes('tişört') || p.toLowerCase().includes('tisort') ||
    p.toLowerCase().includes('kazak') || p.toLowerCase().includes('bluz') ||
    p.toLowerCase().includes('ceket')
  ) || kombin.parcalar[0];

  const altParca = kombin.parcalar.find(p =>
    p.toLowerCase().includes('pantolon') || p.toLowerCase().includes('etek') ||
    p.toLowerCase().includes('şort') || p.toLowerCase().includes('short') ||
    p.toLowerCase().includes('jean')
  ) || kombin.parcalar[1];

  const disParca = kombin.parcalar.find(p =>
    p.toLowerCase().includes('mont') || p.toLowerCase().includes('kaban') ||
    p.toLowerCase().includes('trençkot') || p.toLowerCase().includes('trenkot') ||
    p.toLowerCase().includes('yağmurluk') || p.toLowerCase().includes('yagmurluk')
  );

  const ustRenk = renkBul(ustParca);
  const altRenk = renkBul(altParca);
  const disRenk = disParca ? renkBul(disParca) : null;

  return (
    <View style={av.container}>
      <View style={[av.sac, { backgroundColor: sacRengi }]} />
      <View style={[av.bas, { backgroundColor: tenRengi }]}>
        <View style={av.gozSatir}>
          <View style={av.goz} />
          <View style={av.goz} />
        </View>
        <View style={av.agiz} />
      </View>
      <View style={[av.boyun, { backgroundColor: tenRengi }]} />
      {disRenk && (
        <>
          <View style={[av.disGovde, { backgroundColor: disRenk }]} />
          <View style={[av.disKolSol, { backgroundColor: disRenk }]} />
          <View style={[av.disKolSag, { backgroundColor: disRenk }]} />
        </>
      )}
      <View style={[av.ust, { backgroundColor: ustRenk, borderWidth: ustRenk === '#F5F5F5' ? 1 : 0, borderColor: '#DDDDDD' }]} />
      <View style={[av.kolSol, { backgroundColor: disRenk || ustRenk }]} />
      <View style={[av.kolSag, { backgroundColor: disRenk || ustRenk }]} />
      <View style={[av.alt, { backgroundColor: altRenk }]} />
      <View style={[av.bacakSol, { backgroundColor: altRenk }]} />
      <View style={[av.bacakSag, { backgroundColor: altRenk }]} />
      <View style={av.ayakSol} />
      <View style={av.ayakSag} />
    </View>
  );
};

export default function Outfits() {
  const router = useRouter();
  const [hava, setHava] = useState(null);
  const [kombinler, setKombinler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliIndex, setSeciliIndex] = useState(0);
  const [profil, setProfil] = useState(null);

  useEffect(() => {
    baslat();
  }, []);

  const baslat = async () => {
    try {
      const profilVeri = await AsyncStorage.getItem('xmobile_profil');
      if (profilVeri) setProfil(JSON.parse(profilVeri));
      const havaVeri = await havaAl();
      const kiyafetler = await kiyafetleriAl();
      await kombinOner(havaVeri, kiyafetler);
    } catch (e) {
      setYukleniyor(false);
    }
  };

  const havaAl = async () => {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${SEHIR}&appid=${WEATHER_KEY}&units=metric&lang=tr`
    );
    const data = await res.json();
    const havaVeri = {
      derece: Math.round(data.main.temp),
      durum: data.weather[0].description,
      nem: data.main.humidity,
      hissedilen: Math.round(data.main.feels_like),
    };
    setHava(havaVeri);
    return havaVeri;
  };

  const kiyafetleriAl = async () => {
    const kayitli = await AsyncStorage.getItem('xmobile_kiyafetler');
    return kayitli ? JSON.parse(kayitli) : [];
  };

  const kombinOner = async (havaVeri, kiyafetler) => {
    const kiyafetListesi = kiyafetler
      .map(k => `${k.ad} (${k.tur}, ${k.sezon})`)
      .join(', ');

    const prompt = `Sen bir kişisel stil danışmanısın.
Hava durumu: ${havaVeri.derece}°C, ${havaVeri.durum}, hissedilen ${havaVeri.hissedilen}°C, nem %${havaVeri.nem}
Gardırop: ${kiyafetListesi}
Bu hava ve gardıropa göre 3 farklı kombin öner. Sadece JSON döndür:
{"kombinler":[{"baslik":"başlık","tur":"İş","parcalar":["kıyafet1","kıyafet2"],"neden":"1 cümle açıklama"}]}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.content && data.content[0]) {
        const metin = data.content[0].text;
        const jsonBaslangic = metin.indexOf('{');
        const jsonBitis = metin.lastIndexOf('}') + 1;
        const parsed = JSON.parse(metin.slice(jsonBaslangic, jsonBitis));
        setKombinler(parsed.kombinler);
      }
    } catch (e) {
      console.log('Hata:', e);
    }
    setYukleniyor(false);
  };

  const havaIkon = () => {
    if (!hava) return '🌡️';
    const d = hava.durum.toLowerCase();
    if (d.includes('yağmur') || d.includes('rain')) return '🌧️';
    if (d.includes('kar') || d.includes('snow')) return '❄️';
    if (d.includes('bulut') || d.includes('cloud')) return '⛅';
    if (d.includes('açık') || d.includes('clear')) return '☀️';
    return '🌤️';
  };

  const seciliKombin = kombinler[seciliIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>Bugünkü Kombinler</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.havaDurumu}>
        {!hava ? <ActivityIndicator color="#000" /> : (
          <>
            <Text style={styles.havaIkon}>{havaIkon()}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.havaDerece}>{hava.derece}°C</Text>
              <Text style={styles.havaDurum}>{hava.durum}</Text>
            </View>
            <Text style={styles.havaSehir}>İzmir</Text>
          </>
        )}
      </View>

      {yukleniyor ? (
        <View style={styles.yukleniyor}>
          <ActivityIndicator color="#000" size="large" />
          <Text style={styles.yukleniyorText}>AI kombinlerinizi hazırlıyor...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.avatarBolum}>
            {seciliKombin && <AvatarKombin kombin={seciliKombin} profil={profil} />}
            {seciliKombin && (
              <View style={styles.avatarBilgi}>
                <Text style={styles.avatarBaslik}>{seciliKombin.baslik}</Text>
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>{seciliKombin.tur}</Text>
                </View>
                <Text style={styles.avatarNeden}>{seciliKombin.neden}</Text>
              </View>
            )}
          </View>

          <View style={styles.seciciSatir}>
            {kombinler.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.seciciBtn, seciliIndex === i && styles.seciciBtnSecili]}
                onPress={() => setSeciliIndex(i)}
              >
                <Text style={[styles.seciciBtnText, seciliIndex === i && styles.seciciBtnTextSecili]}>
                  {i + 1}. {k.tur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {seciliKombin && (
            <View style={styles.parcalarBolum}>
              <Text style={styles.parcalarBaslik}>Bu Kombin</Text>
              <View style={styles.parcalar}>
                {seciliKombin.parcalar.map((p, i) => (
                  <View key={i} style={styles.parcaChip}>
                    <Text style={styles.parcaText}>{p}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.secButon}>
                <Text style={styles.secButonText}>Bu Kombini Seç ✓</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const av = StyleSheet.create({
  container: { width: 110, height: 200, position: 'relative' },
  sac: { position: 'absolute', top: 0, left: 27, width: 56, height: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  bas: { position: 'absolute', top: 10, left: 27, width: 56, height: 50, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  gozSatir: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  goz: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1A1A1A' },
  agiz: { width: 14, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.25)' },
  boyun: { position: 'absolute', top: 57, left: 47, width: 16, height: 10 },
  disGovde: { position: 'absolute', top: 65, left: 14, width: 82, height: 60, borderRadius: 8 },
  disKolSol: { position: 'absolute', top: 67, left: 0, width: 16, height: 50, borderRadius: 8 },
  disKolSag: { position: 'absolute', top: 67, right: 0, width: 16, height: 50, borderRadius: 8 },
  ust: { position: 'absolute', top: 65, left: 20, width: 70, height: 58, borderRadius: 6 },
  kolSol: { position: 'absolute', top: 67, left: 4, width: 18, height: 48, borderRadius: 8 },
  kolSag: { position: 'absolute', top: 67, right: 4, width: 18, height: 48, borderRadius: 8 },
  alt: { position: 'absolute', top: 121, left: 20, width: 70, height: 45, borderRadius: 4 },
  bacakSol: { position: 'absolute', top: 164, left: 20, width: 30, height: 22, borderRadius: 4 },
  bacakSag: { position: 'absolute', top: 164, left: 60, width: 30, height: 22, borderRadius: 4 },
  ayakSol: { position: 'absolute', top: 183, left: 16, width: 34, height: 12, borderRadius: 4, backgroundColor: '#1A1A1A' },
  ayakSag: { position: 'absolute', top: 183, left: 56, width: 34, height: 12, borderRadius: 4, backgroundColor: '#1A1A1A' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5',
  },
  geri: { color: '#000000', fontSize: 20, fontWeight: '300' },
  baslik: { color: '#000000', fontSize: 17, fontWeight: '600' },
  havaDurumu: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    margin: 16, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: '#EEEEEE',
    gap: 12, minHeight: 72,
  },
  havaIkon: { fontSize: 32 },
  havaDerece: { fontSize: 20, fontWeight: '600', color: '#000000' },
  havaDurum: { fontSize: 13, color: '#999999', marginTop: 2 },
  havaSehir: { fontSize: 13, color: '#999999' },
  yukleniyor: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  yukleniyorText: { color: '#999999', fontSize: 14 },
  avatarBolum: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 14,
    padding: 20, borderWidth: 0.5, borderColor: '#EEEEEE',
    flexDirection: 'row', alignItems: 'center', gap: 20,
  },
  avatarBilgi: { flex: 1 },
  avatarBaslik: { fontSize: 17, fontWeight: '600', color: '#000000', marginBottom: 6 },
  avatarBadge: {
    backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10,
  },
  avatarBadgeText: { fontSize: 11, color: '#666666' },
  avatarNeden: { fontSize: 13, color: '#999999', lineHeight: 20 },
  seciciSatir: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  seciciBtn: {
    flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#FFFFFF',
    alignItems: 'center', borderWidth: 0.5, borderColor: '#EEEEEE',
  },
  seciciBtnSecili: { backgroundColor: '#000000', borderColor: '#000000' },
  seciciBtnText: { fontSize: 12, color: '#666666', fontWeight: '500' },
  seciciBtnTextSecili: { color: '#FFFFFF' },
  parcalarBolum: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    borderRadius: 14, padding: 18, borderWidth: 0.5, borderColor: '#EEEEEE',
  },
  parcalarBaslik: { fontSize: 13, color: '#999999', marginBottom: 10 },
  parcalar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  parcaChip: { backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  parcaText: { color: '#333333', fontSize: 13 },
  secButon: { backgroundColor: '#000000', borderRadius: 10, padding: 14, alignItems: 'center' },
  secButonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
});
