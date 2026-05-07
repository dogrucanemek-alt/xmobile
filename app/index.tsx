import { Text, View, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../lib/context';

export default function Index() {
  const router = useRouter();
  const { t, renkler, aksanRenk, temaToggle, dil, dilDegistir, karanlik } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      <View style={styles.ayarlar}>
        <TouchableOpacity
          style={[styles.ayarBtn, { borderColor: renkler.sinir2 }]}
          onPress={temaToggle}
        >
          <Text style={{ fontSize: 16 }}>{karanlik ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>

        <View style={[styles.dilSecici, { borderColor: renkler.sinir2 }]}>
          {['tr', 'en'].map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.dilBtn, dil === d && { backgroundColor: renkler.metin }]}
              onPress={() => dilDegistir(d as 'tr' | 'en')}
            >
              <Text style={[styles.dilBtnText, { color: dil === d ? renkler.bg : renkler.metin2 }]}>
                {d.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.top}>
        <View style={[styles.logoKutu, { backgroundColor: renkler.metin }]}>
          <Text style={[styles.logoX, { color: renkler.bg }]}>X</Text>
        </View>
        <Text style={[styles.logoBrand, { color: renkler.metin }]}>AI FURNITURE</Text>
        <Text style={[styles.logoSub, { color: renkler.metin2 }]}>WARDROBE INTELLIGENCE</Text>
      </View>

      <View style={styles.middle}>
        <Text style={[styles.tagline, { color: renkler.metin }]}>{t.tagline}</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: renkler.btnPrimary }]}
          onPress={() => router.push('/wardrobe')}
        >
          <Text style={[styles.btnPrimaryText, { color: renkler.btnPrimaryMetin }]}>
            {t.gardırobunuKur}
          </Text>
          <Text style={[styles.btnArrow, { color: renkler.btnPrimaryMetin }]}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: renkler.sinir2 }]}
          onPress={() => router.push('/profile')}
        >
          <Text style={[styles.btnSecondaryText, { color: renkler.metin2 }]}>
            {t.profilimDuzenle}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.loginText, { color: renkler.metin2 }]}>
          {t.hesabınVarMı} <Text style={[styles.loginLink, { color: aksanRenk }]}>{t.girisYap}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28 },
  ayarlar: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingTop: 60, gap: 10,
  },
  ayarBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 0.5,
  },
  dilSecici: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 0.5, overflow: 'hidden',
  },
  dilBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  dilBtnText: { fontSize: 12, fontWeight: '600' },
  top: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24 },
  logoKutu: {
    width: 68, height: 68, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoX: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  logoBrand: { fontSize: 12, fontWeight: '700', letterSpacing: 4, marginBottom: 4 },
  logoSub: { fontSize: 9, letterSpacing: 3 },
  middle: { flex: 1, justifyContent: 'center' },
  tagline: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  bottom: { flex: 1, justifyContent: 'center', gap: 12, paddingBottom: 20 },
  btnPrimary: {
    paddingVertical: 18, paddingHorizontal: 28, borderRadius: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  btnArrow: { fontSize: 20, fontWeight: '300' },
  btnSecondary: { paddingVertical: 16, borderRadius: 50, alignItems: 'center', borderWidth: 0.5 },
  btnSecondaryText: { fontSize: 15, fontWeight: '500' },
  loginText: { textAlign: 'center', fontSize: 13 },
  loginLink: { fontWeight: '600' },
});