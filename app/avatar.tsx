import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRef } from 'react';

const RPM_URL = 'https://xmobile.readyplayer.me/avatar?frameApi';

export default function AvatarScreen() {
  const router = useRouter();
  const webViewRef = useRef(null);

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

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: RPM_URL }}
        style={styles.webview}
        onMessage={handleMessage}
        injectedJavaScript={injectedJS}
        startInLoadingState
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
  container:  { flex: 1 },
  webview:    { flex: 1 },
  yukleniyor: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});