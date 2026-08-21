import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, Alert, NativeModules } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { buildApiUrl, fetchWithTimeout, normalizeServerHost } from '../utils/network';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (ip: string, vpsIp: string, table: string, restaurantId: string, theme: string, language: string) => void;
    initialIp: string;
    initialVpsIp?: string;
    initialTable: string;
    initialRestaurantId: string;
    currentTheme: string;
    currentLanguage: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, onSave, initialIp, initialVpsIp = '', initialTable, initialRestaurantId, currentTheme, currentLanguage }) => {
    const [tempIp, setTempIp] = useState(initialIp);
    const [tempVpsIp, setTempVpsIp] = useState(initialVpsIp);
    const [tempTable, setTempTable] = useState(initialTable);
    const [tempRestaurantId, setTempRestaurantId] = useState(initialRestaurantId);
    const [selectedTheme, setSelectedTheme] = useState(currentTheme);
    const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState('');
    const [testStatus, setTestStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: '',
    });

    useEffect(() => {
        if (visible) {
            setTempIp(initialIp);
            setTempVpsIp(initialVpsIp);
            setTempTable(initialTable);
            setTempRestaurantId(initialRestaurantId);
            setSelectedTheme(currentTheme);
            setSelectedLanguage(currentLanguage);
            setTestStatus({ type: 'idle', message: '' });
        }
    }, [visible, initialIp, initialVpsIp, initialTable, initialRestaurantId, currentTheme, currentLanguage]);

    const normalizedHost = normalizeServerHost(tempIp);
    const previewUrl = normalizedHost ? `${buildApiUrl(normalizedHost)}/health` : '';

    const scanNetwork = async () => {
        setIsScanning(true);
        setScanProgress('Iniciando busca...');
        try {
            const state = await NetInfo.fetch();
            if (!state.isConnected || !state.details || !('ipAddress' in state.details)) {
                throw new Error('Sem conexao Wi-Fi ativa.');
            }

            const ip = (state.details as any).ipAddress;
            const subnet = ip.substring(0, ip.lastIndexOf('.'));
            setScanProgress(`Escaneando ${subnet}.x ...`);

            const checkIp = async (i: number) => {
                const target = `${subnet}.${i}`;
                try {
                    const response = await fetchWithTimeout(`${buildApiUrl(target)}/health`, {}, 500);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.status === 'healthy' || data.status === 'degraded') {
                            return target;
                        }
                    }
                } catch (e) { }
                return null;
            };

            for (let block = 1; block <= 255; block += 25) {
                setScanProgress(`Buscando em ${subnet}.${block}-${Math.min(255, block + 24)}...`);
                const promises = [];
                for (let i = block; i < block + 25 && i <= 255; i++) {
                    promises.push(checkIp(i));
                }
                const results = await Promise.all(promises);
                const found = results.find((r) => r !== null);
                if (found) {
                    setTempIp(found);
                    setScanProgress('Servidor encontrado.');
                    setTimeout(() => {
                        setIsScanning(false);
                        setScanProgress('');
                    }, 1000);
                    return;
                }
            }
            setScanProgress('Servidor nao encontrado na rede.');
        } catch (err: any) {
            Alert.alert('Erro no Scan', err.message || 'Falha ao buscar rede.');
        } finally {
            setTimeout(() => {
                setIsScanning(false);
                setScanProgress('');
            }, 2000);
        }
    };

    const testConnection = async () => {
        if (!normalizedHost) {
            setTestStatus({ type: 'error', message: 'Digite um IP válido antes de testar.' });
            return;
        }

        setTestStatus({ type: 'loading', message: 'Testando conexão...' });

        try {
            const response = await fetchWithTimeout(previewUrl, {}, 6000);
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const statusText = data?.status ? `status: ${data.status}` : 'Resposta recebida';
            setTestStatus({ type: 'success', message: `Conectado com sucesso (${statusText}).` });
        } catch (error: any) {
            setTestStatus({
                type: 'error',
                message: `Falha ao conectar: ${error?.message || 'erro desconhecido'}`,
            });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.lockOverlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Configuracoes</Text>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>IP do Servidor</Text>
                            <TouchableOpacity
                                onPress={scanNetwork}
                                disabled={isScanning}
                                style={styles.scanButton}
                            >
                                <Text style={styles.scanButtonText}>{isScanning ? 'Buscando...' : 'Auto-Scan'}</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={tempIp}
                            onChangeText={setTempIp}
                            placeholder="Ex: 192.168.1.10"
                            placeholderTextColor="#94a3b8"
                            autoCorrect={false}
                            autoCapitalize="none"
                            selectTextOnFocus={true}
                        />
                        {scanProgress !== '' && (
                            <Text style={styles.progressText}>{scanProgress}</Text>
                        )}
                        {previewUrl !== '' && (
                            <Text style={styles.previewText}>URL de teste: {previewUrl}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>IP do VPS (Fallback)</Text>
                        <TextInput
                            style={styles.input}
                            value={tempVpsIp}
                            onChangeText={setTempVpsIp}
                            placeholder="Ex: 104.248.55.120"
                            placeholderTextColor="#94a3b8"
                            autoCorrect={false}
                            autoCapitalize="none"
                            selectTextOnFocus={true}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Numero da Mesa</Text>
                        <TextInput
                            style={styles.input}
                            value={tempTable}
                            onChangeText={setTempTable}
                            keyboardType="numeric"
                            selectTextOnFocus={true}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ID do Restaurante (Tenant)</Text>
                        <TextInput
                            style={styles.input}
                            value={tempRestaurantId}
                            onChangeText={setTempRestaurantId}
                            keyboardType="numeric"
                            selectTextOnFocus={true}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Idioma</Text>
                        <View style={styles.langRow}>
                            {['pt', 'en'].map((lang) => (
                                <TouchableOpacity
                                    key={lang}
                                    style={[
                                        styles.langButton,
                                        selectedLanguage === lang && styles.langButtonSelected
                                    ]}
                                    onPress={() => setSelectedLanguage(lang)}
                                >
                                    <Text style={[styles.langButtonText, selectedLanguage === lang && styles.langButtonTextSelected]}>
                                        {lang === 'pt' ? 'Portugues' : 'English'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tema Visual</Text>
                        <View style={styles.langRow}>
                            {[
                                { id: 'light', name: 'Original' },
                                { id: 'dark', name: 'Dark' },
                                { id: 'luxury', name: 'Luxury' },
                                { id: 'forest', name: 'Forest' },
                                { id: 'ocean', name: 'Ocean' },
                                { id: 'sunset', name: 'Sunset' }
                            ].map((theme) => (
                                <TouchableOpacity
                                    key={theme.id}
                                    style={[
                                        styles.langButton,
                                        selectedTheme === theme.id && styles.langButtonSelected
                                    ]}
                                    onPress={() => setSelectedTheme(theme.id)}
                                >
                                    <Text style={[styles.langButtonText, selectedTheme === theme.id && styles.langButtonTextSelected]}>
                                        {theme.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => onSave(normalizeServerHost(tempIp), normalizeServerHost(tempVpsIp), tempTable.trim(), tempRestaurantId.trim(), selectedTheme, selectedLanguage)}
                    >
                        <Text style={styles.saveButtonText}>Salvar e Conectar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={testConnection}
                    >
                        <Text style={styles.testButtonText}>Testar Conexão</Text>
                    </TouchableOpacity>

                    {testStatus.type !== 'idle' && (
                        <Text
                            style={[
                                styles.testStatusText,
                                testStatus.type === 'success' ? styles.testStatusSuccess : null,
                                testStatus.type === 'error' ? styles.testStatusError : null,
                            ]}
                        >
                            {testStatus.message}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={[styles.cancelButton, { marginTop: 20 }]}
                        onPress={() => {
                            Alert.alert(
                                'Sair do Modo Kiosk',
                                'Tem certeza que deseja sair do aplicativo?',
                                [
                                    { text: 'Cancelar', style: 'cancel' },
                                    {
                                        text: 'Sair e Destravar',
                                        style: 'destructive',
                                        onPress: () => NativeModules.KioskModule?.exitApp()
                                    }
                                ]
                            );
                        }}
                    >
                        <Text style={[styles.cancelButtonText, { color: '#ef4444' }]}>Sair do App (Admin)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Fechar Configuracoes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,24,39,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 },
    container: { width: '90%', maxWidth: 1120, padding: 24, paddingVertical: 32, backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 20, elevation: 10 },
    title: { marginBottom: 24, fontSize: 22, color: '#111827', fontWeight: 'bold' },
    inputGroup: { width: '100%', marginBottom: 20 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { color: '#374151', fontWeight: 'bold', fontSize: 15, marginBottom: 8 },
    input: { backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#111827', fontSize: 16, borderWidth: 1, borderColor: '#d1d5db' },
    scanButton: { backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#fdba74' },
    scanButtonText: { color: '#c2410c', fontSize: 12, fontWeight: 'bold' },
    progressText: { color: '#6b7280', fontSize: 10, marginTop: 4, textAlign: 'center' },
    previewText: { color: '#6b7280', fontSize: 12, marginTop: 8 },
    langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    langButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
    langButtonSelected: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    langButtonText: { color: '#374151', fontWeight: 'bold' },
    langButtonTextSelected: { color: '#fff' },
    saveButton: { width: '100%', backgroundColor: '#4f46e5', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    testButton: { width: '100%', backgroundColor: '#f3f4f6', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
    testButtonText: { color: '#111827', fontWeight: 'bold', fontSize: 15 },
    testStatusText: { marginTop: 12, textAlign: 'center', color: '#6b7280', fontSize: 14 },
    testStatusSuccess: { color: '#15803d' },
    testStatusError: { color: '#dc2626' },
    cancelButton: { alignItems: 'center' },
    cancelButtonText: { color: '#6b7280', fontSize: 16 },
});

export default SettingsModal;
