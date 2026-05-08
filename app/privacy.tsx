import { Text, View, StyleSheet, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../lib/context';

const METINLER = {
  tr: {
    baslik: 'Gizlilik Politikası',
    guncelleme: 'Son güncelleme: 8 Mayıs 2026',
    bolumler: [
      {
        baslik: '1. Toplanan Veriler',
        icerik:
          'xmobile yalnızca cihazınızda saklanan aşağıdaki verileri toplar:\n\n' +
          '• Kıyafet fotoğrafları ve isimleri\n' +
          '• Profil bilgileri (ten rengi, saç rengi, göz rengi, boy, kilo, cinsiyet)\n' +
          '• Kombin geçmişi\n' +
          '• Konum bilgisi (yalnızca anlık hava durumu için, kaydedilmez)\n\n' +
          'Bu veriler cihazınızda yerel olarak saklanır ve herhangi bir sunucuya aktarılmaz.',
      },
      {
        baslik: '2. Üçüncü Taraf Hizmetler',
        icerik:
          'Uygulama aşağıdaki üçüncü taraf hizmetleri kullanmaktadır:\n\n' +
          '• Anthropic Claude API — Kombin önerileri ve kıyafet tanıma için fotoğraflar gönderilir. Anthropic Gizlilik Politikası geçerlidir (anthropic.com/privacy).\n\n' +
          '• OpenWeatherMap API — Anlık hava durumu verisi için konumunuz gönderilir. OpenWeatherMap Gizlilik Politikası geçerlidir (openweathermap.org/privacy-policy).\n\n' +
          '• Meshy API — 3D model oluşturmak için kıyafet adı gönderilir. Meshy Gizlilik Politikası geçerlidir (meshy.ai/privacy).',
      },
      {
        baslik: '3. Veri Güvenliği',
        icerik:
          'Tüm kişisel verileriniz yalnızca cihazınızın yerel depolama alanında (AsyncStorage ve dosya sistemi) tutulur. Uygulama herhangi bir kullanıcı hesabı oluşturmaz ve verilerinizi bulut sunuculara yüklemez.',
      },
      {
        baslik: '4. KVKK Uyumu',
        icerik:
          '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında verileriniz üçüncü taraflarla paylaşılmamakta, satılmamakta veya kiralanmamaktadır. Yalnızca yukarıda belirtilen üçüncü taraf API hizmetlerine ilgili veriler aktarılmaktadır.',
      },
      {
        baslik: '5. Çocukların Gizliliği',
        icerik:
          'xmobile 13 yaşın altındaki çocuklara yönelik değildir. Bilerek 13 yaş altı kişilere ait veri toplamıyoruz.',
      },
      {
        baslik: '6. Değişiklikler',
        icerik:
          'Bu politika zaman zaman güncellenebilir. Değişiklikler uygulama güncellemesiyle birlikte yürürlüğe girer.',
      },
      {
        baslik: '7. İletişim',
        icerik:
          'Gizlilik politikamızla ilgili sorularınız için:\ndogrucanemek@gmail.com',
      },
    ],
  },
  en: {
    baslik: 'Privacy Policy',
    guncelleme: 'Last updated: May 8, 2026',
    bolumler: [
      {
        baslik: '1. Data We Collect',
        icerik:
          'xmobile collects only the following data stored locally on your device:\n\n' +
          '• Clothing photos and names\n' +
          '• Profile information (skin tone, hair color, eye color, height, weight, gender)\n' +
          '• Outfit history\n' +
          '• Location (only for instant weather data, never stored)\n\n' +
          'All data is stored locally on your device and is never sent to our servers.',
      },
      {
        baslik: '2. Third-Party Services',
        icerik:
          'The app uses the following third-party services:\n\n' +
          '• Anthropic Claude API — Photos are sent for outfit suggestions and clothing recognition. Anthropic\'s Privacy Policy applies (anthropic.com/privacy).\n\n' +
          '• OpenWeatherMap API — Your location is sent for real-time weather data. OpenWeatherMap\'s Privacy Policy applies (openweathermap.org/privacy-policy).\n\n' +
          '• Meshy API — Clothing names are sent to generate 3D models. Meshy\'s Privacy Policy applies (meshy.ai/privacy).',
      },
      {
        baslik: '3. Data Security',
        icerik:
          'All your personal data is stored only in your device\'s local storage (AsyncStorage and file system). The app does not create any user accounts and does not upload your data to cloud servers.',
      },
      {
        baslik: '4. Data Sharing',
        icerik:
          'Your data is not sold, traded, or rented to any third parties. Data is only shared with the third-party APIs listed above, solely to provide app functionality.',
      },
      {
        baslik: '5. Children\'s Privacy',
        icerik:
          'xmobile is not directed at children under 13. We do not knowingly collect personal information from children under 13.',
      },
      {
        baslik: '6. Changes',
        icerik:
          'This policy may be updated from time to time. Changes take effect with the next app update.',
      },
      {
        baslik: '7. Contact',
        icerik:
          'For questions about our privacy policy:\ndogrucanemek@gmail.com',
      },
    ],
  },
};

export default function Privacy() {
  const router = useRouter();
  const { renkler, dil } = useApp();
  const metin = METINLER[dil];

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg2 }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <View style={[styles.header, { backgroundColor: renkler.bg, borderBottomColor: renkler.sinir }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.geriBtn}>
          <Text style={[styles.geri, { color: renkler.metin }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>{metin.baslik}</Text>
        <View style={styles.geriBtn} />
      </View>

      <ScrollView style={styles.icerik} showsVerticalScrollIndicator={false}>
        <Text style={[styles.guncelleme, { color: renkler.metin2 }]}>{metin.guncelleme}</Text>

        {metin.bolumler.map((b, i) => (
          <View key={i} style={[styles.bolum, { backgroundColor: renkler.kart, borderColor: renkler.sinir }]}>
            <Text style={[styles.bolumBaslik, { color: renkler.metin }]}>{b.baslik}</Text>
            <Text style={[styles.bolumIcerik, { color: renkler.metin2 }]}>{b.icerik}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 0.5,
  },
  geriBtn:      { width: 40, alignItems: 'flex-start' },
  geri:         { fontSize: 28, fontWeight: '300' },
  baslik:       { fontSize: 17, fontWeight: '600' },
  icerik:       { flex: 1, padding: 16 },
  guncelleme:   { fontSize: 12, marginBottom: 16, textAlign: 'center' },
  bolum: {
    borderRadius: 14, padding: 18, marginBottom: 10, borderWidth: 0.5,
  },
  bolumBaslik:  { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  bolumIcerik:  { fontSize: 14, lineHeight: 22 },
});
