import { Text, View, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.top}>
        <Text style={styles.logo}>X</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.title}>AI Furniture X</Text>
        <Text style={styles.subtitle}>Akıllı Gardırop Asistanın</Text>
        <Text style={styles.tagline}>
          Hava durumuna göre her sabah{'\n'}kişisel stil önerileri
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/wardrobe')}
        >
          <Text style={styles.buttonText}>Başla</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profilButon}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.profilButonText}>Profilimi Ayarla →</Text>
        </TouchableOpacity>

        <Text style={styles.loginText}>
          Zaten hesabın var mı? <Text style={styles.loginLink}>Giriş yap</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
  },
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  logo: {
    fontSize: 72,
    fontWeight: '700',
    letterSpacing: -2,
    color: '#000000',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 15,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  profilButon: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
  },
  profilButonText: {
    color: '#666666',
    fontSize: 15,
  },
  loginText: {
    textAlign: 'center',
    color: '#AAAAAA',
    fontSize: 14,
  },
  loginLink: {
    color: '#000000',
    fontWeight: '500',
  },
});



