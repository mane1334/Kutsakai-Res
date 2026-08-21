import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Order } from '../types';
import { Theme } from '../themes';
import { getOrderStatusLabel } from '../utils/orderStatus';

interface OrderStatusBarProps {
    currentOrder: Order | null;
    onViewOrder: () => void;
    theme: Theme;
    t?: (key: string) => string;
}

const OrderStatusBar: React.FC<OrderStatusBarProps> = ({ currentOrder, onViewOrder, theme, t }) => {
    const tr = (key: string, fallback: string) => t?.(key) || fallback;

    if (!currentOrder) return null;

    const statusText = `Status: ${getOrderStatusLabel(currentOrder.status)}`;
    const prepMinutes = currentOrder.prepSeconds ? Math.max(1, Math.ceil(currentOrder.prepSeconds / 60)) : 0;
    const isPreparing = currentOrder.status === 'preparing';

    return (
        <View style={[styles.orderBar, isPreparing && styles.orderBarPreparing]}>
            <View style={{ flex: 1 }}>
                <Text style={styles.orderBarTitle}>{tr('your_order', 'Seu Pedido')}</Text>
                <Text style={styles.orderBarText} numberOfLines={1}>{statusText}</Text>
                {prepMinutes > 0 ? (
                    <Text style={styles.orderBarPrepText}>
                        {isPreparing
                            ? `Preparo confirmado: cerca de ${prepMinutes} min`
                            : `Tempo estimado: ${prepMinutes} min`}
                    </Text>
                ) : null}
            </View>
            <TouchableOpacity
                onPress={onViewOrder}
                style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
            >
                <Text style={styles.viewButtonText}>
                    {tr('view_order', 'Ver Pedido')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    orderBar: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 8,
        backgroundColor: '#fff1f2', // Soft light red
        borderColor: '#fca5a5', // Soft border red
    },
    orderBarPreparing: {
        borderColor: '#f87171',
        backgroundColor: '#ffe4e6',
    },
    orderBarTitle: {
        fontWeight: '800',
        fontSize: 16,
        color: '#991b1b', // Deep red title
    },
    orderBarText: {
        fontSize: 13,
        marginTop: 4,
        color: '#7f1d1d', // Dark red status
    },
    orderBarPrepText: {
        fontSize: 14,
        marginTop: 6,
        color: '#dc2626', // Bright red prep time
        fontWeight: '900',
    },
    viewButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    viewButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
});

export default OrderStatusBar;
