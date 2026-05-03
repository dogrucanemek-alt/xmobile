import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

const API_KEY = '9dfe03744413ccb79c529c0a3f04847f';
const SEHIR = 'Izmir,TR';

export default function Outfits() {
  const router = useRouter();
  const [hava, setHava] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${SEHIR}&appid=${API_KEY}&units=metric&lang=tr`)
      .then(res => res.json())
      .then(data => {
        setHava({
          derece: Math.round(data.main.temp) + '°C',
          durum: data.weather[0].description,
          nem: data.main.humidity,
          hissedilen: Math.round(data.main.feels_like) + '°C',
        });
        setYukleniyor(false);
      })
      .catch(() => setYukleniyor(false));
  }, []);

  const havaIkon = () => {
    if (!hava) return '🌡️';
    const d = hava.durum.toLowerCase();
    if (d.includes('yağmur') || d.includes('rain')) return '🌧️';
    if (d.includes('kar') || d.includes('snow')) return '❄️';
    if (d.includes('bulut') || d.includes('cloud')) return '⛅';
    if (d.includes('açık') || d.includes('clear')) return '☀️';
    return '🌤️';
  };

  const kombinler = [
    {
      id: 1,
      baslik: 'İş',
      parcalar: ['Beyaz Gömlek', 'Lacivert Pantolon', 'Siyah Ceket'],
      neden: hava ? `${hava.derece} için ideal. Toplantıya uygun şık görünüm.` : '...',
      renk: '#000000',
    },
    {
      id: 2,
      baslik: 'Günlük',
      parcalar: ['Beyaz Gömlek', 'Lacivert Pantolon'],
      neden: hava ? `Hissedilen ${hava.hissedilen}. Rahat ve sade bir seçim.` : '...',
      renk: '#555555',
    },
    {
      id: 3,
      baslik: 'Dışarı',
      parcalar: ['Beyaz Gömlek', 'Lacivert Pantolon', 'Bej Trençkot'],
      neden: hava ? `Nem %${hava.nem}. Trençkot tam bu hava için doğru seçim.` : '...',
      renk: '#888888',
    },
  ];

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
          {yukleniyor ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Text style={styles.havaIkon}>{havaIkon()}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.havaDerece}>{hava?.derece ?? '--'}</Text>
                <Text style={styles.havaDurum}>{hava?.durum ?? 'Veri alınamadı'}</Text>
              </View>
              <Text style={styles.havaSehir}>İzmir</Text>
            </>
          )}
        </View>

        {kombinler.map((k, index) => (
          <View key={k.id} style={styles.kombinKart}>
            <View style={styles.kombinHeader}>
              <View style={styles.kombinNumara}>
                <Text style={styles.kombinNumaraText}>{index + 1}</Text>
              </View>
              <Text style={styles.kombinBaslik}>Kombin {index + 1} — {k.baslik}</Text>
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
        ))}
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
  },
  havaIkon: { fontSize: 36 },
  havaDerece: { fontSize: 22, fontWeight: '600', color: '#000000' },
  havaDurum: { fontSize: 13, color: '#999999', marginTop: 2 },
  havaSehir: { fontSize: 13, color: '#999999' },
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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kombinNumaraText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  kombinBaslik: { fontSize: 15, fontWeight: '600', color: '#000000' },
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
