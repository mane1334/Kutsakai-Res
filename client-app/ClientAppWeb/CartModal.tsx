import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';
import { CartItem } from './types';
import { Theme } from './themes';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (id: number) => void;
  onChangeQuantity: (id: number, quantity: number) => void;
  onSendOrder: () => void;
  isSending: boolean;
  theme: Theme;
  tableNumber: string;
  setTableNumber: (val: string) => void;
}

const CartModal: React.FC<CartModalProps> = ({
  visible, onClose, cart, onRemoveItem, onChangeQuantity, onSendOrder, isSending, theme,
  tableNumber, setTableNumber
}) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const formatCurrency = (val: number) => `MT ${parseFloat(String(val)).toFixed(2)}`;

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemContainer}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemUnitPrice}>{formatCurrency(item.price)} cada</Text>
      </View>
      <View style={styles.quantityRow}>
        <TouchableOpacity
          onPress={() => onChangeQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          style={[styles.qtyBtn, item.quantity <= 1 && { opacity: 0.4 }]}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => onChangeQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>

        <Text style={styles.itemSubtotal}>{formatCurrency(item.price * item.quantity)}</Text>

        <TouchableOpacity onPress={() => onRemoveItem(item.id)} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header - Espelha o "🛒 Seu Carrinho" da Web */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.headerTitle}>🛒 Seu Carrinho</Text>
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕  Fechar</Text>
          </TouchableOpacity>
        </View>

        {/* Input de Mesa - Igual ao Cart.jsx da Web */}
        <View style={styles.tableInputContainer}>
          <Text style={styles.tableLabel}>Número da Mesa</Text>
          <TextInput
            style={styles.tableInput}
            keyboardType="numeric"
            value={tableNumber}
            onChangeText={setTableNumber}
            placeholder="Digite o número da sua mesa"
          />
        </View>

        {/* Lista de pratos */}
        {cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>Seu carrinho está vazio</Text>
            <Text style={styles.emptySubtitle}>Peça alguns pratos deliciosos!</Text>
          </View>
        ) : (
          <FlatList
            data={cart}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Rodapé com Total e Botão Finalizar - Estilo Web */}
        {cart.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => cart.forEach(i => onRemoveItem(i.id))}
            >
              <Text style={styles.clearBtnText}>Limpar Carrinho</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
              onPress={onSendOrder}
              disabled={isSending}
            >
              {isSending ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.sendBtnText}>Enviando Pedido...</Text>
                </View>
              ) : (
                <Text style={styles.sendBtnText}>Finalizar Pedido</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const RED = '#dc2626';
const GREEN = '#16a34a';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 20,
    borderBottomWidth: 1, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 3,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  badge: { marginLeft: 10, backgroundColor: RED, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  closeBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
  closeBtnText: { color: '#374151', fontWeight: '700', fontSize: 14 },

  tableInputContainer: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f3f4f6' },
  tableLabel: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  tableInput: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, color: '#111827',
  },

  listContent: { padding: 16, paddingBottom: 20 },
  itemContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 2,
  },
  itemName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 2 },
  itemUnitPrice: { fontSize: 13, color: '#6b7280' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { backgroundColor: '#f3f4f6', borderRadius: 99, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 20, fontWeight: '600', color: '#374151' },
  qtyText: { fontSize: 18, fontWeight: '700', color: '#111827', minWidth: 24, textAlign: 'center' },
  itemSubtotal: { fontSize: 18, fontWeight: '800', color: RED, marginLeft: 10, minWidth: 80, textAlign: 'right' },
  removeBtn: { backgroundColor: '#fee2e2', borderRadius: 99, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  removeBtnText: { fontSize: 16 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1f2937', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7280' },

  footer: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30,
    borderTopWidth: 1, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, elevation: 10,
  },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 20, fontWeight: '600', color: '#4b5563' },
  totalValue: { fontSize: 32, fontWeight: '900', color: '#111827' },
  clearBtn: {
    backgroundColor: '#f3f4f6', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', marginBottom: 12,
  },
  clearBtnText: { fontWeight: '700', color: '#4b5563', fontSize: 15 },
  sendBtn: {
    backgroundColor: GREEN, paddingVertical: 18, borderRadius: 14, alignItems: 'center',
    shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 },
});

export default CartModal;
