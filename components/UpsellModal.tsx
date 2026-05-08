import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

interface UpsellModalProps {
  visible: boolean;
  onKapat: () => void;
  aylikKullanim?: number;
  limit?: number;
}

export default function UpsellModal({ visible, onKapat, aylikKullanim, limit }: UpsellModalProps) {
  const temel = limit !== undefined && limit > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.kart}>
          <Text style={styles.icon}>🧊</Text>
          <Text style={styles.baslik}>3D Görüntüleme</Text>
          <Text style={styles.baslik2}>PRO ÖZELLİĞİ</Text>

          {temel ? (
            <Text style={styles.aciklama}>
              Bu ay {aylikKullanim}/{limit} 3D modelini kullandın.{'\n'}
              Sınırsız 3D için Pro'ya geç.
            </Text>
          ) : (
            <Text style={styles.aciklama}>
              Kıyafetlerini gerçek zamanlı döndürülebilir 3D modellerle görselleştir.{'\n\n'}
              Ücretsiz planda bu özellik mevcut değil.
            </Text>
          )}

          <View style={styles.ozellikler}>
            {['Sınırsız 3D model', 'Sınırsız fal.ai 2D render', 'Öncelikli kombin önerisi'].map(o => (
              <View key={o} style={styles.ozellikSatir}>
                <Text style={styles.ozellikIkon}>✓</Text>
                <Text style={styles.ozellikText}>{o}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.proBtn}>
            <Text style={styles.proBtnText}>Pro'ya Geç →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onKapat} style={styles.iptalBtn}>
            <Text style={styles.iptalText}>Şimdi değil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  kart: {
    backgroundColor: '#0A0A14', borderRadius: 24,
    padding: 28, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
  },
  icon:       { fontSize: 44, marginBottom: 12 },
  baslik:     { color: '#fff', fontSize: 20, fontWeight: '700' },
  baslik2:    { color: '#00D4FF', fontSize: 11, fontWeight: '600', letterSpacing: 2, marginTop: 4, marginBottom: 16 },
  aciklama:   { color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  ozellikler: { alignSelf: 'stretch', marginBottom: 24, gap: 10 },
  ozellikSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ozellikIkon:  { color: '#00D4FF', fontSize: 14, fontWeight: '700', width: 18 },
  ozellikText:  { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  proBtn: {
    backgroundColor: '#00D4FF', borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center',
    marginBottom: 12,
  },
  proBtnText:  { color: '#000', fontSize: 16, fontWeight: '700' },
  iptalBtn:    { paddingVertical: 8 },
  iptalText:   { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
});
