import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../themes';

interface OrderCompletedModalProps {
  visible: boolean;
  onClose: () => void;
  theme: Theme;
  t: (key: any) => string;
}

const OrderCompletedModal: React.FC<OrderCompletedModalProps> = ({ visible, onClose, theme, t }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          
          {/* Header Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '20' }]}>
             <Ionicons name="restaurant" size={60} color={theme.colors.success} />
          </View>
          
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <Text style={[styles.successText, { color: theme.colors.success }]}>Pedido Finalizado</Text>
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            O seu pedido foi concluído!
          </Text>
          
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            O garçom já está a trazer o seu prato para a sua mesa! 🏃‍♂️🍽️
          </Text>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  successText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderCompletedModal;
