import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRef, useState } from 'react';

const RPM_URL = 'https://readyplayer.me/avatar?frameApi';

export default function AvatarScreen() {
  const router = useRouter();
  const webViewRef = useRef(null);
  const [hata, setHata] = useState(false);

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.source === 'readyplayerme' && data?.eventName === 'v1.avatar.exported') {
        const avatarUrl = data.data.url;
        const profil = await AsyncStorage.getItem('xmobile_profil');
        const profilObj = profil ? JSON.parse(profil) : {};
        profilObj.avatarUrl = avatarUrl;
        await AsyncStorage.setItem('xmobile_profil', JSON.stringify(profilObj));
        router.back();
      }
    } catch (e) {}
  };

  const injectedJS = `
    window.addEventListener('message', (event) => {
      if (event.data?.source === 'readyplayerme') {
        window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
      }
    });
    document.addEventListener('message', (event) => {
      if (event.data?.source === 'readyplayerme') {
        window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
      }
    });
    true;
  `;

  if (hata) {
    return (
      <View style={styles.hataKonteyner}>
        <Text style={styles.hataIkon}>🌐</Text>
        <Text style={styles.hataBaslik}>İnternet Bağlantısı Gerekiyor</Text>
        <Text style={styles.hataMetin}>
          Avatar oluşturmak için internete bağlı bir Wi-Fi veya mobil veri gerekiyor.
        </Text>
        <TouchableOpacity style={styles.geriBtn} onPress={() => router.back()}>
          <Text style={styles.geriBtnText}>Geri Dön</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tekrarBtn} onPress={() => setHata(false)}>
          <Text style={styles.tekrarBtnText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: RPM_URL }}
        style={styles.webview}
        onMessage={handleMessage}
        injectedJavaScript={injectedJS}
        startInLoadingState
        onError={() => setHata(true)}
        onHttpError={() => setHata(true)}
        renderLoading={() => (
          <View style={styles.yukleniyor}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  webview:          { flex: 1 },
  yukleniyor:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hataKonteyner:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  hataIkon:         { fontSize: 56 },
  hataBaslik:       { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  hataMetin:        { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  geriBtn:          { marginTop: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1A1A1A' },
  geriBtnText:      { color: '#FFF', fontSize: 15, fontWeight: '600' },
  tekrarBtn:        { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#CCC' },
  tekrarBtnText:    { fontSize: 15, color: '#333' },
});
