import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_KEY = '9dfe03744413ccb79c529c0a3f04847f';
const CLAUDE_KEY = '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';
const SEHIR = 'Izmir,TR';

const AvatarKombin = ({ kombin, index }) => {
  const renkler = {
    'Üst': '#4A90D9',
    'Alt': '#2C3E50',
    'Dış Giyim': '#8B7355',
    'Ayakkabı': '#5D4037',
    'Aksesuar': '#9B59B6',
  };

  return (
    <View style={avatar.container}>
      {/* Baş */}
      <View style={avatar.bas} />
      {/* Boyun */}
      <View style={avatar.boyun} />
      {/* Üst giysi */}
      <View style={[avatar.ust, { backgroundColor: renkler['Üst'] }]}>
        <Text style={avatar.kiyafetYazi} numberOfLines={1}>
          {kombin.parcalar.find(p => p.toLowerCase().includes('gömlek') || p.toLowerCase().includes('tişört') || p.toLowerCase().includes('ceket') || p.toLowerCase().includes('bluz') || p.toLowerCase().includes('kazak')) || kombin.parcalar[0] || ''}
        </Text>
      </View>
      {/* Kol sol */}
      <View style={[avatar.kolSol, { backgroundColor: renkler['Üst'] }]} />
      {/* Kol sağ */}
      <View style={[avatar.kolSag, { backgroundColor: renkler['Üst'] }]} />
      {/* Alt giysi */}
      <View style={[avatar.alt, { backgroundColor: renkler['Alt'] }]}>
        <Text style={avatar.kiyafetYazi} numberOfLines={1}>
          {kombin.parcalar.find(p => p.toLowerCase().includes('pantolon') || p.toLowerCase().includes('etek') || p.toLowerCase().includes('şort') || p.toLowerCase().includes('jean')) || kombin.parcalar[1] || ''}
        </Text>
      </View>
      {/* Bacak sol */}
      <View style={[avatar.bacakSol, { backgroundColor: renkler['Alt'] }]} />
      {/* Bacak sağ */}
      <View style={[avatar.bacakSag, { backgroundColor: renkler['Alt'] }]} />
      {/* Ayakkabı sol */}
      <View style={avatar.ayakkabiSol} />
      {/* Ayakkabı sağ */}
      <View style={avatar.ayakkabiSag} />
    </View>
  );
};

export default function Outfits() {
  const router = useRouter();
  const [hava, setHava] = useState(null);
  const [kombinler, setKombinler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliIndex, setSeciliIndex] = useState(0);

  useEffect(() => {
    baslat();
  }, []);

  const baslat = async () => {
    try {
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

      {/* Hava Durumu */}
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
        <>
          {/* Avatar Bölümü */}
          <View style={styles.avatarBolum}>
            {seciliKombin && <AvatarKombin kombin={seciliKombin} index={seciliIndex} />}
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

          {/* Kombin Seçici */}
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

          {/* Parçalar */}
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
        </>
      )}
    </View>
  );
}

const avatar = StyleSheet.create({
  container: {
    width: 120,
    height: 200,
    position: 'relative',
    alignSelf: 'center',
  },
  bas: {
    position: 'absolute',
    top: 0,
    left: 42,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5D0A9',
    borderWidth: 1,
    borderColor: '#E0B899',
  },
  boyun: {
    position: 'absolute',
    top: 33,
    left: 52,
    width: 16,
    height: 10,
    backgroundColor: '#F5D0A9',
  },
  ust: {
    position: 'absolute',
    top: 42,
    left: 28,
    width: 64,
    height: 55,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  kolSol: {
    position: 'absolute',
    top: 44,
    left: 10,
    width: 20,
    height: 48,
    borderRadius: 8,
  },
  kolSag: {
    position: 'absolute',
    top: 44,
    right: 10,
    width: 20,
    height: 48,
    borderRadius: 8,
  },
  alt: {
    position: 'absolute',
    top: 95,
    left: 28,
    width: 64,
    height: 60,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bacakSol: {
    position: 'absolute',
    top: 153,
    left: 28,
    width: 28,
    height: 35,
    borderRadius: 4,
  },
  bacakSag: {
    position: 'absolute',
    top: 153,
    left: 64,
    width: 28,
    height: 35,
    borderRadius: 4,
  },
  ayakkabiSol: {
    position: 'absolute',
    top: 185,
    left: 24,
    width: 32,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#2C2C2C',
  },
  ayakkabiSag: {
    position: 'absolute',
    top: 185,
    left: 60,
    width: 32,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#2C2C2C',
  },
  kiyafetYazi: {
    fontSize: 7,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', margin: 16, borderRadius: 14,
    padding: 16, borderWidth: 0.5, borderColor: '#EEEEEE', gap: 12, minHeight: 72,
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
  seciciSatir: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12,
  },
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
  parcaChip: {
    backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  parcaText: { color: '#333333', fontSize: 13 },
  secButon: {
    backgroundColor: '#000000', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  secButonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
});
