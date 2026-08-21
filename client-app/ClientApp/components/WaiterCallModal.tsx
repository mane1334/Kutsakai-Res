import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface WaiterCallModalProps {
    visible: boolean;
    onClose: () => void;
    onCall: (reason: string) => void;
    t?: (key: string) => string;
}

const WaiterCallModal: React.FC<WaiterCallModalProps> = ({ visible, onClose, onCall, t }) => {
    const tr = (key: string, fallback: string) => t?.(key) || fallback;

    const options = [
        { title: tr('bill', 'Conta'), subtitle: tr('bill_subtitle', 'Pedir a Conta'), value: 'billing' },
        { title: tr('cleaning', 'Mesa'), subtitle: tr('cleaning_subtitle', 'Limpeza / Guardanapos'), value: 'cleaning' },
        { title: tr('question', 'Ajuda'), subtitle: tr('question_subtitle', 'Dúvida no Menu'), value: 'question' },
        { title: tr('other', 'Mais'), subtitle: tr('other_subtitle', 'Outros'), value: 'other' },
    ];

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={styles.container} activeOpacity={1} onPress={() => {}}>
                    <View style={styles.headerGlow} pointerEvents="none" />
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>{tr('service', 'Atendimento')}</Text>
                    </View>

                    <Text style={styles.title}>{tr('call_waiter_title', 'Como podemos ajudar?')}</Text>
                    <Text style={styles.subtitle}>
                        {tr('call_waiter_subtitle', 'Escolha rapidamente o motivo e nossa equipe será notificada para atender sua mesa.')}
                    </Text>

                    <View style={styles.grid}>
                        {options.map((opt) => (
                            <TouchableOpacity key={opt.value} style={styles.card} onPress={() => onCall(opt.subtitle)} activeOpacity={0.9}>
                                <View style={styles.cardIconDot} />
                                <Text style={styles.cardTitle}>{opt.title}</Text>
                                <Text style={styles.cardSubtitle}>{opt.subtitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.88}>
                        <Text style={styles.cancelText}>{tr('cancel', 'Cancelar')}</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 560,
        backgroundColor: '#ffffff',
        borderRadius: 34,
        paddingHorizontal: 28,
        paddingTop: 28,
        paddingBottom: 26,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eef2f7',
        shadowColor: '#0f172a',
        shadowOpacity: 0.24,
        shadowRadius: 28,
        elevation: 14,
        overflow: 'hidden',
    },
    headerGlow: {
        position: 'absolute',
        top: -30,
        width: 220,
        height: 110,
        borderRadius: 999,
        backgroundColor: 'rgba(249,115,22,0.12)',
    },
    headerBadge: {
        backgroundColor: '#fff7ed',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fed7aa',
    },
    headerBadgeText: { color: '#c2410c', fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
    title: {
        fontSize: 24,
        color: '#0f172a',
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: -0.7,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 26,
        maxWidth: 380,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
    },
    card: {
        width: 142,
        minHeight: 136,
        backgroundColor: '#fffaf5',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#fdba74',
        paddingHorizontal: 12,
        paddingVertical: 20,
        shadowColor: '#fb923c',
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
    },
    cardIconDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#f59e0b',
        marginBottom: 2,
    },
    cardTitle: { fontSize: 18, fontWeight: '900', color: '#c2410c', letterSpacing: -0.4 },
    cardSubtitle: { color: '#9a3412', fontWeight: '700', textAlign: 'center', lineHeight: 22 },
    cancelButton: {
        marginTop: 28,
        paddingVertical: 14,
        paddingHorizontal: 38,
        backgroundColor: '#f8fafc',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cancelText: { color: '#475569', fontSize: 16, fontWeight: '800' },
});

export default WaiterCallModal;
