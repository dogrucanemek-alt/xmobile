import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_KEY = '9dfe03744413ccb79c529c0a3f04847f';
const CLAUDE_KEY = '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';
const SEHIR = 'Izmir,TR';

export default function Outfits() {
  const router = useRouter();
  const [hava, setHava] = useState(null);
  const [kombinler, setKombinler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

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
Bu hava ve gardıropa göre 3 farklı kombin öner. Sadece JSON döndür, başka hiçbir şey yazma:
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
      console.log('Claude yanıt:', JSON.stringify(data));
      
      if (data.content && data.content[0]) {
        const metin = data.content[0].text;
        const jsonBaslangic = metin.indexOf('{');
        const jsonBitis = metin.lastIndexOf('}') + 1;
        const jsonMetin = metin.slice(jsonBaslangic, jsonBitis);
        const parsed = JSON.parse(jsonMetin);
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

  const renkler = ['#000000', '#555555', '#888888'];

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

      <ScrollView style={styles.liste} showsVerticalScrollIndicator={false}>
        <View style={styles.havaDurumu}>
          {!hava ? (
            <ActivityIndicator color="#000000" />
          ) : (
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
            <ActivityIndicator color="#000000" size="large" />
            <Text style={styles.yukleniyorText}>AI kombinlerinizi hazırlıyor...</Text>
          </View>
        ) : kombinler.length === 0 ? (
          <View style={styles.yukleniyor}>
            <Text style={styles.yukleniyorText}>Kombin oluşturulamadı, tekrar dene.</Text>
          </View>
        ) : (
          kombinler.map((k, index) => (
            <View key={index} style={styles.kombinKart}>
              <View style={styles.kombinHeader}>
                <View style={[styles.kombinNumara, { backgroundColor: renkler[index] }]}>
                  <Text style={styles.kombinNumaraText}>{index + 1}</Text>
                </View>
                <Text style={styles.kombinBaslik}>{k.baslik}</Text>
                <View style={styles.turBadge}>
                  <Text style={styles.turText}>{k.tur}</Text>
                </View>
              </View>
              <View style={styles.parcalar}>
                {k.parcalar.map((p, i) => (
                  <View key={i} style={styles.parcaChip}>
                    <Text style={styles.parcaText}>{p}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.neden}>{k.neden}</Text>
              <TouchableOpacity style={styles.secButon}>
                <Text style={styles.secButonText}>Bu Kombini Seç</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  geri: { color: '#000000', fontSize: 20, fontWeight: '300' },
  baslik: { color: '#000000', fontSize: 17, fontWeight: '600' },
  liste: { flex: 1, padding: 16 },
  havaDurumu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
    gap: 12,
    minHeight: 72,
  },
  havaIkon: { fontSize: 36 },
  havaDerece: { fontSize: 22, fontWeight: '600', color: '#000000' },
  havaDurum: { fontSize: 13, color: '#999999', marginTop: 2 },
  havaSehir: { fontSize: 13, color: '#999999' },
  yukleniyor: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  yukleniyorText: {
    color: '#999999',
    fontSize: 14,
  },
  kombinKart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  kombinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  kombinNumara: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kombinNumaraText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  kombinBaslik: { fontSize: 15, fontWeight: '600', color: '#000000', flex: 1 },
  turBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  turText: { fontSize: 11, color: '#666666' },
  parcalar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  parcaChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  parcaText: { color: '#333333', fontSize: 13 },
  neden: { color: '#999999', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  secButon: {
    backgroundColor: '#000000',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  secButonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
});