import { Text, View, StyleSheet, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../lib/context';
import { useAuth } from '../lib/authContext';
import { ONBOARDING_KEY } from './onboarding';

const CYAN = '#00D4FF';

export default function Index() {
  const router = useRouter();
  const { t, renkler, temaToggle, dil, dilDegistir, karanlik } = useApp();
  const { session, yukleniyor } = useAuth();

  useEffect(() => {
    if (yukleniyor) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then(v => {
      if (!v) { router.replace('/onboarding'); return; }
      if (!session) { router.replace('/login' as any); }
    });
  }, [yukleniyor, session]);

  return (
    <View style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} backgroundColor={renkler.bg} />

      {/* Sağ üst kontroller */}
      <View style={styles.ayarlar}>
        <TouchableOpacity style={[styles.ayarBtn, { borderColor: renkler.sinir }]} onPress={temaToggle}>
          <Text style={{ fontSize: 15 }}>{karanlik ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        <View style={[styles.dilSecici, { borderColor: renkler.sinir }]}>
          {(['tr', 'en'] as const).map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.dilBtn, dil === d && { backgroundColor: CYAN }]}
              onPress={() => dilDegistir(d)}
            >
              <Text style={[styles.dilBtnText, { color: dil === d ? '#000' : renkler.metin2 }]}>
                {d.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logo */}
      <View style={styles.logoBlok}>
        <View style={styles.xKutu}>
          <Text style={styles.xHarf}>X</Text>
        </View>
        <Text style={[styles.marka, { color: renkler.metin }]}>XMOBILE</Text>
        <Text style={styles.altBaslik}>WARDROBE INTELLIGENCE</Text>
      </View>

      {/* Tagline */}
      <View style={styles.orta}>
        <Text style={[styles.tagline, { color: renkler.metin2 }]}>{t.tagline}</Text>
      </View>

      {/* Butonlar */}
      <View style={styles.alt}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.push('/wardrobe')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>{t.gardırobunuKur}</Text>
          <Text style={styles.btnArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: renkler.sinir }]}
          onPress={() => router.push('/outfits')}
          activeOpacity={0.75}
        >
          <Text style={[styles.btnSecondaryText, { color: renkler.metin2 }]}>
            ✦ {t.kombinOnerisiAl}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: renkler.sinir }]}
          onPress={() => router.push('/profile')}
          activeOpacity={0.75}
        >
          <Text style={[styles.btnSecondaryText, { color: renkler.metin2 }]}>
            ◎ {t.profilimDuzenle}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: renkler.sinir }]}
          onPress={() => router.push('/import-model' as any)}
          activeOpacity={0.75}
        >
          <Text style={[styles.btnSecondaryText, { color: renkler.metin2 }]}>
            📦 3D Model İçe Aktar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login' as any)}>
          <Text style={[styles.loginText, { color: renkler.metin2 }]}>
            {t.hesabınVarMı}{' '}
            <Text style={{ color: CYAN, fontWeight: '600' }}>{t.girisYap}</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
          <Text style={[styles.gizlilikText, { color: renkler.metin2 }]}>
            {dil === 'en' ? 'Privacy Policy' : 'Gizlilik Politikası'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, paddingHorizontal: 28 },
  ayarlar: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingTop: 60, gap: 10,
  },
  ayarBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  dilSecici:   { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  dilBtn:      { paddingHorizontal: 14, paddingVertical: 9 },
  dilBtnText:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  logoBlok:    { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 20 },
  xKutu: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  xHarf:       { fontSize: 40, fontWeight: '800', color: '#000', letterSpacing: -1 },
  marka:       { fontSize: 13, fontWeight: '800', letterSpacing: 5, marginBottom: 4 },
  altBaslik:   { fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.35)' },

  orta:        { flex: 1, justifyContent: 'center' },
  tagline:     { fontSize: 15, lineHeight: 25, textAlign: 'center' },

  alt:         { flex: 1, justifyContent: 'center', gap: 10, paddingBottom: 20 },
  btnPrimary: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 17, paddingHorizontal: 28, borderRadius: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#000', letterSpacing: 0.3 },
  btnArrow:       { fontSize: 20, color: '#000' },
  btnSecondary: {
    paddingVertical: 15, borderRadius: 50,
    alignItems: 'center', borderWidth: 1,
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '500' },
  loginText:        { textAlign: 'center', fontSize: 13, marginTop: 4 },
  gizlilikText:     { textAlign: 'center', fontSize: 11, marginTop: 2, textDecorationLine: 'underline' },
});
