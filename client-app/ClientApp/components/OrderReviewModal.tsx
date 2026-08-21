import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import StarRating from './StarRating';

interface OrderReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
}

const OrderReviewModal: React.FC<OrderReviewModalProps> = ({ visible, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if (rating === 0) {
            Alert.alert('Avaliacao', 'Por favor, selecione uma nota de 1 a 5.');
            return;
        }
        onSubmit(rating, comment);
        setRating(0);
        setComment('');
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Como foi seu pedido?</Text>
                    <Text style={styles.subtitle}>Ajude-nos a melhorar nossos servicos.</Text>

                    <View style={styles.stars}>
                        <StarRating rating={rating} onRate={setRating} size={40} />
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Deixe um comentario (opcional)..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={3}
                        value={comment}
                        onChangeText={setComment}
                    />

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitText}>Enviar Avaliacao</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Pular</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    container: { width: '90%', backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 15, elevation: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24, textAlign: 'center' },
    stars: { marginBottom: 24 },
    input: { width: '100%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, color: '#111827', textAlignVertical: 'top', minHeight: 80, marginBottom: 20, borderWidth: 1, borderColor: '#d1d5db' },
    submitButton: { width: '100%', backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { padding: 10 },
    cancelText: { color: '#6b7280', fontSize: 14, fontWeight: '700' },
});

export default OrderReviewModal;
