import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.icon}>⚠️</Text>
          <Text style={s.title}>Bir şeyler ters gitti</Text>
          <Text style={s.msg}>{this.state.error?.message ?? 'Bilinmeyen hata'}</Text>
          <TouchableOpacity style={s.btn} onPress={this.reset}>
            <Text style={s.btnText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  icon:      { fontSize: 48, marginBottom: 16 },
  title:     { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#0A0A0A' },
  msg:       { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  btn:       { backgroundColor: '#0A0A0A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '600' },
});
