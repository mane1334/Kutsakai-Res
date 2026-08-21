import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartItem, Order } from './types';
import { Theme } from './themes';
import { getOrderStatusDescription, getOrderStatusLabel } from './utils/orderStatus';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  currentOrder?: Order | null;
  onRemoveItem: (id: number) => void;
  onChangeQuantity: (id: number, quantity: number) => void;
  onSendOrder: () => void;
  onCancelOrder: () => void;
  isSending: boolean;
  theme: Theme;
  tableNumber: string;
  setTableNumber: (val: string) => void;
  currencySymbol?: string;
}

const RED = '#dc2626';

const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  cart,
  currentOrder = null,
  onRemoveItem,
  onChangeQuantity,
  onSendOrder,
  onCancelOrder,
  isSending,
  theme,
  tableNumber,
  setTableNumber,
  currencySymbol = 'MT',
}) => {
  const { width, height } = useWindowDimensions();
  const [remainingCancelSeconds, setRemainingCancelSeconds] = useState(0);
  const primaryColor = theme?.colors?.primary || RED;
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const panelWidth = Math.min(width - 28, width >= 980 ? 960 : 760);
  const panelHeight = Math.min(height - 24, width >= 980 ? 680 : height - 18);
  const currentOrderMinutes = currentOrder?.prepSeconds ? Math.max(1, Math.ceil(currentOrder.prepSeconds / 60)) : 0;
  const formatCurrency = (val: number) => `${currencySymbol} ${parseFloat(String(val)).toFixed(2)}`;

  useEffect(() => {
    if (!visible || !currentOrder?.preparingCancelUntil || currentOrder.status !== 'preparing') {
      setRemainingCancelSeconds(0);
      return;
    }

    const tick = () => {
      const diff = new Date(currentOrder.preparingCancelUntil!).getTime() - Date.now();
      setRemainingCancelSeconds(Math.max(0, Math.ceil(diff / 1000)));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [visible, currentOrder?.preparingCancelUntil, currentOrder?.status]);

  const statusBadgeText = useMemo(() => {
    if (!currentOrder) return null;
    if (currentOrder.status === 'preparing' && remainingCancelSeconds > 0) {
      return `Cancelamento: ${remainingCancelSeconds}s`;
    }
    return getOrderStatusLabel(currentOrder.status);
  }, [currentOrder, remainingCancelSeconds]);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemCategory}>{item.category_name || 'Item selecionado'}</Text>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemUnitPrice}>{formatCurrency(item.price)} cada</Text>
        {item.preparation_time ? (
          <Text style={styles.itemPrepTime}>Preparo estimado: {item.preparation_time} min</Text>
        ) : null}
      </View>

      <View style={styles.quantityRow}>
        <TouchableOpacity
          onPress={() => onChangeQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}
        >
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.qtyText}>{item.quantity}</Text>

        <TouchableOpacity onPress={() => onChangeQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>

        <Text style={styles.itemSubtotal}>{formatCurrency(item.price * item.quantity)}</Text>

        <TouchableOpacity onPress={() => onRemoveItem(item.id)} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const showPendingCart = cart.length > 0;
  const showActiveOrderState = !showPendingCart && !!currentOrder;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlaySafeArea} edges={['top', 'bottom']}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.modalShell, { width: panelWidth, height: panelHeight }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerEyebrow}>Pedido em andamento</Text>
              <Text style={styles.headerTitle}>Pedido</Text>
              {(totalItems > 0 || currentOrder) ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalItems > 0
                      ? `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`
                      : `Mesa ${tableNumber}`}
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableInputContainer}>
            <Text style={styles.tableLabel}>Numero da Mesa</Text>
            <TextInput
              style={styles.tableInput}
              keyboardType="numeric"
              value={tableNumber}
              onChangeText={setTableNumber}
              placeholder="Digite o numero da sua mesa"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {currentOrder ? (
            <View style={styles.orderStatusCard}>
              <View style={styles.orderStatusMain}>
                <View>
                  <Text style={styles.orderStatusLabel}>{getOrderStatusLabel(currentOrder.status)}</Text>
                  <Text style={styles.orderStatusTitle}>{getOrderStatusDescription(currentOrder.status)}</Text>
                </View>
                {statusBadgeText ? (
                  <View style={styles.orderStatusBadge}>
                    <Text style={styles.orderStatusBadgeText}>{statusBadgeText}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.orderMetaRow}>
                <View style={styles.orderMetaItem}>
                  <Text style={styles.orderMetaCaption}>Tempo de preparo</Text>
                  <Text style={styles.orderMetaValue}>{currentOrderMinutes} min</Text>
                </View>
                <View style={styles.orderMetaDivider} />
                <View style={styles.orderMetaItem}>
                  <Text style={styles.orderMetaCaption}>Pedido</Text>
                  <Text style={styles.orderMetaValue}>#{currentOrder.id}</Text>
                </View>
              </View>
              {currentOrder.status === 'preparing' && remainingCancelSeconds > 0 && (
                <TouchableOpacity 
                  style={{ marginTop: 14, backgroundColor: '#fef2f2', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fecdd3' }}
                  onPress={onCancelOrder}
                >
                  <Text style={{ color: '#e11d48', fontWeight: '800' }}>Cancelar Pedido ({remainingCancelSeconds}s)</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {showPendingCart ? (
            <View style={styles.body}>
              <FlatList
                data={cart}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                style={styles.list}
                ListHeaderComponent={
                  <View style={styles.summaryHero}>
                    <View style={styles.summaryHeroTop}>
                      <View>
                        <Text style={styles.summaryHeroLabel}>Resumo do Pedido</Text>
                        <Text style={styles.summaryHeroTitle}>Revise os pratos antes de finalizar</Text>
                      </View>
                      <View style={styles.summaryHeroBadge}>
                        <Text style={styles.summaryHeroBadgeText}>{totalItems} un.</Text>
                      </View>
                    </View>
                  </View>
                }
              />
            </View>
          ) : showActiveOrderState ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyBadge}>
                <Text style={styles.emptyBadgeText}>Pedido ativo</Text>
              </View>
              <Text style={styles.emptyTitle}>{getOrderStatusLabel(currentOrder.status)}</Text>
              <Text style={styles.emptySubtitle}>
                {getOrderStatusDescription(currentOrder.status)} Acompanhe o tempo estimado acima.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyBadge}>
                <Text style={styles.emptyBadgeText}>Pedido</Text>
              </View>
              <Text style={styles.emptyTitle}>Seu pedido esta vazio</Text>
              <Text style={styles.emptySubtitle}>Peca alguns pratos deliciosos para comecar.</Text>
              <TouchableOpacity
                style={[styles.emptyActionBtn, { backgroundColor: primaryColor, shadowColor: primaryColor }]}
                onPress={onClose}
              >
                <Text style={styles.emptyActionBtnText}>Voltar ao Menu</Text>
              </TouchableOpacity>
            </View>
          )}

          {showPendingCart ? (
            <View style={styles.footer}>
              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
              </View>

              <TouchableOpacity style={styles.clearBtn} onPress={() => cart.forEach((item) => onRemoveItem(item.id))}>
                <Text style={styles.clearBtnText}>Limpar Pedido</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: primaryColor, shadowColor: primaryColor }, isSending && styles.sendBtnDisabled]}
                onPress={onSendOrder}
                disabled={isSending}
              >
                {isSending ? (
                  <View style={styles.sendingRow}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.sendBtnText}>Enviando pedido...</Text>
                  </View>
                ) : (
                  <Text style={styles.sendBtnText}>Finalizar Pedido</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlaySafeArea: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.44)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalShell: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#020617',
    shadowOpacity: 0.24,
    shadowRadius: 32,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 3,
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  headerEyebrow: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.7 },
  badge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  badgeText: { color: '#dc2626', fontWeight: '900', fontSize: 13 },
  closeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  closeBtnText: { color: '#374151', fontWeight: '700', fontSize: 14 },
  tableInputContainer: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  tableLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
  tableInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: '#111827',
  },
  orderStatusCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 2,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#eef2f7',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  orderStatusMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  orderStatusLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  orderStatusTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    maxWidth: 260,
    lineHeight: 24,
  },
  orderStatusBadge: {
    backgroundColor: '#fff1f2',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  orderStatusBadgeText: { color: '#e11d48', fontWeight: '900', fontSize: 12 },
  orderMetaRow: { flexDirection: 'row', alignItems: 'center' },
  orderMetaItem: { flex: 1 },
  orderMetaCaption: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  orderMetaValue: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  orderMetaDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#e2e8f0', marginHorizontal: 14 },
  body: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: { padding: 16, paddingBottom: 16 },
  summaryHero: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eef2f7',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  summaryHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  summaryHeroLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  summaryHeroTitle: { fontSize: 17, fontWeight: '900', color: '#111827', maxWidth: 240, lineHeight: 24 },
  summaryHeroBadge: { backgroundColor: '#fff1f2', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#fecdd3' },
  summaryHeroBadgeText: { color: '#e11d48', fontWeight: '900', fontSize: 13 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eef2f7',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  itemName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 3, letterSpacing: -0.4 },
  itemUnitPrice: { fontSize: 13, color: '#64748b' },
  itemPrepTime: { fontSize: 12, color: '#92400e', marginTop: 6, fontWeight: '700' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    backgroundColor: '#f8fafc',
    borderRadius: 99,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyBtnText: { fontSize: 20, fontWeight: '700', color: '#334155' },
  qtyText: { fontSize: 19, fontWeight: '800', color: '#111827', minWidth: 26, textAlign: 'center' },
  itemSubtotal: { fontSize: 17, fontWeight: '900', color: RED, marginLeft: 10, minWidth: 88, textAlign: 'right', letterSpacing: -0.3 },
  removeBtn: {
    backgroundColor: '#fff1f2',
    borderRadius: 99,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  removeBtnText: { fontSize: 13, fontWeight: '900', color: '#e11d48' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, marginBottom: 20 },
  emptyBadgeText: { color: '#b91c1c', fontWeight: '800', fontSize: 14 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, color: '#6b7280', marginBottom: 18, textAlign: 'center', lineHeight: 22, maxWidth: 360 },
  emptyActionBtn: { paddingVertical: 14, paddingHorizontal: 26, borderRadius: 16, shadowOpacity: 0.18, shadowRadius: 12, elevation: 3 },
  emptyActionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    elevation: 10,
  },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 20, fontWeight: '700', color: '#475569' },
  totalValue: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -1 },
  clearBtn: {
    backgroundColor: '#f8fafc',
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearBtnText: { fontWeight: '800', color: '#475569', fontSize: 15 },
  sendBtn: {
    paddingVertical: 17,
    borderRadius: 20,
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  sendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

export default CartModal;
