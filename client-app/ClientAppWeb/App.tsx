import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import {
  Alert,
  AppState,
  Modal,
  NativeModules,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const STORAGE_KEY_URL = 'client_web_url';
const DEFAULT_URL = Platform.select({
  android: 'http://10.0.2.2:3002',
  ios: 'http://localhost:3002',
  default: 'http://localhost:3002'
});

const { KioskModule } = NativeModules;

const App = () => {
  const webRef = useRef<WebView>(null);
  const [url, setUrl] = useState(DEFAULT_URL || 'http://localhost:3002');
  const [inputUrl, setInputUrl] = useState(url);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadUrl = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_URL);
      if (stored) {
        setUrl(stored);
        setInputUrl(stored);
      }
    };
    loadUrl();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const startKiosk = () => {
      KioskModule?.startKiosk?.();
    };

    startKiosk();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') startKiosk();
    });

    return () => {
      sub.remove();
    };
  }, []);

  const openSettings = () => {
    setInputUrl(url);
    setSettingsOpen(true);
  };

  const saveSettings = async () => {
    const cleaned = inputUrl.trim();
    if (cleaned.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEY_URL, cleaned);
      setUrl(cleaned);
      setLoadError(null);
    }
    setSettingsOpen(false);
  };

  const reload = () => {
    setLoadError(null);
    webRef.current?.reload();
  };

  const handleExit = () => {
    Alert.alert(
      'Sair do modo kiosk',
      'Escolha uma ação para sair temporariamente do app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Destravar',
          style: 'default',
          onPress: () => KioskModule?.stopKiosk?.()
        },
        {
          text: 'Sair do app',
          style: 'destructive',
          onPress: () => {
            KioskModule?.stopKiosk?.();
            KioskModule?.exitApp?.();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Client Web</Text>
          <View style={styles.topBarActions}>
            <TouchableOpacity onPress={reload} style={styles.actionButton}>
              <Text style={styles.actionText}>Recarregar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openSettings} style={styles.actionButton}>
              <Text style={styles.actionText}>Configurar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExit} style={[styles.actionButton, styles.exitButton]}>
              <Text style={styles.actionText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loadError ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorTitle}>Falha ao carregar o app web</Text>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={openSettings} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Ajustar URL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={reload} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webRef}
            source={{ uri: url }}
            onError={(event) => setLoadError(event.nativeEvent.description)}
            onHttpError={(event) => setLoadError(`HTTP ${event.nativeEvent.statusCode}`)}
            startInLoadingState
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        )}

        <Modal visible={settingsOpen} transparent animationType="fade" onRequestClose={() => setSettingsOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>URL do Client Web</Text>
              <TextInput
                value={inputUrl}
                onChangeText={setInputUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="http://192.168.0.10:3002"
                placeholderTextColor="#6b7280"
                style={styles.input}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setSettingsOpen(false)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveSettings} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>
                Dica: use o IP da sua rede local, por exemplo `http://192.168.x.x:3002`
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: { color: '#f9fafb', fontSize: 16, fontWeight: '700' },
  topBarActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  exitButton: {
    backgroundColor: '#7f1d1d'
  },
  actionText: { color: '#e5e7eb', fontSize: 12, fontWeight: '600' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { color: '#f9fafb', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  errorText: { color: '#cbd5f5', marginBottom: 16, textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8
  },
  primaryButtonText: { color: '#f9fafb', fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10
  },
  secondaryButtonText: { color: '#e5e7eb', fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '88%', backgroundColor: '#0f172a', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#f9fafb', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    marginBottom: 16
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  hint: { color: '#9ca3af', fontSize: 12, marginTop: 12 }
});

export default App;
