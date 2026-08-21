import React, { useEffect, useRef, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Ionicons from 'react-native-vector-icons/Ionicons';

const audioRecorderPlayer = new (AudioRecorderPlayer as any)();

interface ChatModalProps {
    visible: boolean;
    onClose: () => void;
    apiUrl: string;
    restaurantId?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ visible, onClose, apiUrl, restaurantId = '1' }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: string; content: string; audio_url?: string }[]>([
        { role: 'assistant', content: 'Ola! Sou seu assistente virtual. Pergunte-me sobre os pratos do cardapio!' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const requestAudioPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Permissao de Gravacao de Audio',
                        message: 'Este aplicativo precisa de acesso ao microfone para gravacao de voz.',
                        buttonNeutral: 'Perguntar Depois',
                        buttonNegative: 'Cancelar',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                if (__DEV__) console.warn(err);
                return false;
            }
        }
        return true;
    };

    const playResponse = async (url: string) => {
        try {
            const fullUrl = url.startsWith('http') ? url : `${apiUrl.replace('/api', '')}${url}`;
            await audioRecorderPlayer.startPlayer(fullUrl);
            audioRecorderPlayer.addPlayBackListener((e: any) => {
                if (e.currentPosition === e.duration) {
                    audioRecorderPlayer.stopPlayer();
                }
            });
        } catch (err) {
            if (__DEV__) console.error('Erro ao reproduzir audio:', err);
        }
    };

    const onStartRecord = async () => {
        const hasPermission = await requestAudioPermission();
        if (!hasPermission) {
            setChatHistory((prev) => [...prev, { role: 'assistant', content: 'Permissao de microfone negada.' }]);
            return;
        }

        try {
            const path = Platform.select({
                ios: 'hello.m4a',
                android: 'sdcard/hello.mp4',
            });
            await audioRecorderPlayer.startRecorder(path!);
            setIsRecording(true);
        } catch (err) {
            if (__DEV__) console.error('Erro ao iniciar gravacao:', err);
        }
    };

    const onStopRecord = async () => {
        try {
            const result = await audioRecorderPlayer.stopRecorder();
            setIsRecording(false);

            const formData = new FormData();
            const fileUri = Platform.OS === 'android' ? `file://${result}` : result;
            formData.append('audio', {
                uri: fileUri,
                type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
                name: Platform.OS === 'ios' ? 'audio.m4a' : 'audio.mp4',
            } as any);

            setIsLoading(true);
            const response = await fetch(`${apiUrl}/chat/voice`, {
                method: 'POST',
                headers: { 'x-restaurant-id': restaurantId },
                body: formData,
            });
            const data = await response.json();
            setChatHistory((prev) => [...prev, { role: 'user', content: data.transcription || 'Audio enviado.' }]);
            if (data.reply) {
                setChatHistory((prev) => [...prev, { role: 'assistant', content: data.reply, audio_url: data.audio_url }]);
                if (data.audio_url) playResponse(data.audio_url);
            }
        } catch (err) {
            setChatHistory((prev) => [...prev, { role: 'assistant', content: 'Erro ao processar audio.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMessage = { role: 'user', content: message };
        setChatHistory((prev) => [...prev, userMessage]);
        const currentMsg = message;
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-restaurant-id': restaurantId },
                body: JSON.stringify({ message: currentMsg }),
            });
            const data = await response.json();
            setChatHistory((prev) => [...prev, { role: 'assistant', content: data.reply, audio_url: data.audio_url }]);
            if (data.audio_url) playResponse(data.audio_url);
        } catch (error) {
            setChatHistory((prev) => [...prev, { role: 'assistant', content: 'Desculpe, estou com problemas. Tente novamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [chatHistory]);

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.chatHeader}>
                    <View style={styles.headerInfo}>
                        <Text style={styles.chatTitle}>Gemeos AI</Text>
                        <View style={styles.onlineBadge}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>Online</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            audioRecorderPlayer.stopPlayer();
                            onClose();
                        }}
                        style={styles.closeBtn}
                    >
                        <Text style={styles.closeBtnText}>Voltar</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.chatHistory}
                    contentContainerStyle={styles.chatHistoryContent}
                >
                    {chatHistory.map((msg, index) => (
                        <View key={index} style={[styles.messageRow, msg.role === 'user' ? styles.userRow : styles.aiRow]}>
                            <View style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                                <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.aiText]}>{msg.content}</Text>

                                {msg.audio_url && (
                                    <TouchableOpacity onPress={() => playResponse(msg.audio_url!)} style={styles.audioBtn}>
                                        <Text style={styles.audioBtnText}>Ouvir resposta</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}

                    {isLoading && (
                        <View style={styles.aiRow}>
                            <View style={[styles.messageBubble, styles.loadingBubble]}>
                                <ActivityIndicator size="small" color="#dc2626" />
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.chatInputContainer}>
                    <TouchableOpacity
                        style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                        onPressIn={onStartRecord}
                        onPressOut={onStopRecord}
                    >
                        <Ionicons name={isRecording ? 'radio-button-on' : 'mic'} size={20} color="#fff" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.chatInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder={isLoading ? 'Aguarde...' : 'Pergunte algo...'}
                        placeholderTextColor="#9ca3af"
                        onSubmitEditing={handleSend}
                        editable={!isRecording && !isLoading}
                    />

                    <TouchableOpacity
                        style={[styles.sendBtn, (!message.trim() || isRecording || isLoading) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={isRecording || !message.trim() || isLoading}
                    >
                        <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const RED_WEB = '#dc2626';
const BLUE_WEB = '#2563eb';
const DARK_BG = '#020617';
const DARK_PANEL = '#0f172a';
const DARK_BUBBLE = '#1e293b';
const DARK_BORDER = '#334155';

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: DARK_BG },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: DARK_PANEL,
        borderBottomWidth: 1,
        borderColor: DARK_BORDER,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        elevation: 5,
    },
    headerInfo: { flexDirection: 'column' },
    chatTitle: { fontSize: 22, fontWeight: '900', color: '#f8fafc' },
    onlineBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
    onlineText: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
    closeBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: DARK_BORDER, borderRadius: 999 },
    closeBtnText: { fontSize: 13, color: '#f8fafc', fontWeight: '700' },
    chatHistory: { flex: 1, backgroundColor: DARK_BG },
    chatHistoryContent: { paddingBottom: 30, paddingTop: 18, paddingHorizontal: 14 },
    messageRow: { marginBottom: 16, paddingHorizontal: 16, width: '100%' },
    userRow: { alignItems: 'flex-end' },
    aiRow: { alignItems: 'flex-start' },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
        maxWidth: '62%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    userBubble: { backgroundColor: BLUE_WEB, borderBottomRightRadius: 4, shadowColor: BLUE_WEB, shadowOpacity: 0.2, shadowRadius: 10 },
    aiBubble: { backgroundColor: DARK_BUBBLE, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: DARK_BORDER },
    loadingBubble: { backgroundColor: DARK_BUBBLE, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1, borderColor: DARK_BORDER },
    messageText: { fontSize: 16, lineHeight: 22 },
    userText: { color: '#fff', fontWeight: '500' },
    aiText: { color: '#fff', fontWeight: '500' },
    audioBtn: { marginTop: 10, backgroundColor: DARK_BORDER, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' },
    audioBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        borderTopWidth: 1,
        borderColor: DARK_BORDER,
        backgroundColor: DARK_PANEL,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 8,
    },
    recordBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: DARK_BORDER,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    recordBtnActive: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: RED_WEB },
    recordBtnText: { fontSize: 11, color: '#f8fafc', fontWeight: '800' },
    chatInput: {
        flex: 1,
        backgroundColor: DARK_BUBBLE,
        borderRadius: 26,
        paddingHorizontal: 20,
        paddingVertical: 12,
        color: '#f8fafc',
        fontSize: 16,
        marginRight: 10,
        borderWidth: 1,
        borderColor: DARK_BORDER,
    },
    sendBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: RED_WEB,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: RED_WEB,
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    sendBtnDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0, elevation: 0 },
    sendIcon: { color: '#fff', fontSize: 12, fontWeight: '900' },
});

export default ChatModal;
