import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Order, CartItem } from '../types';
import { fetchWithTimeout } from '../utils/network';
import { normalizeOrderStatus } from '../utils/orderStatus';

interface UseOrderProps {
    apiUrl: string;
    tableNumber: string;
    restaurantId: string;
    onOrderSent?: () => void;
}

interface UseOrderReturn {
    currentOrder: Order | null;
    isSendingOrder: boolean;
    sendOrder: (cart: CartItem[]) => Promise<boolean>;
    cancelOrder: () => Promise<void>;
    setCurrentOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    checkOrderStatus: (orderId: number, apiUrlOverride?: string, restaurantIdOverride?: string) => Promise<void>;
}

export const useOrder = ({ apiUrl, tableNumber, restaurantId, onOrderSent }: UseOrderProps): UseOrderReturn => {
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isSendingOrder, setIsSendingOrder] = useState(false);

    const sendOrder = useCallback(async (cart: CartItem[]): Promise<boolean> => {
        if (cart.length === 0) return false;
        if (!apiUrl) {
            Alert.alert('Erro', 'Servidor nÃ£o configurado.');
            return false;
        }

        setIsSendingOrder(true);
        try {
            const items = cart.map(item => ({
                dish_id: item.id,
                quantity: item.quantity,
            }));

            const response = await fetchWithTimeout(`${apiUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-restaurant-id': restaurantId,
                },
                body: JSON.stringify({
                    table_number: parseInt(tableNumber),
                    items,
                }),
            });

            if (!response.ok) throw new Error('Erro ao enviar pedido');

            const data = await response.json();
            setCurrentOrder({
                id: data.order_id,
                prepSeconds: Number(data.prep_time_seconds) || 0,
                cancelUntil: data.cancel_until,
                status: normalizeOrderStatus(data.status),
            });

            onOrderSent?.();
            return true;
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível enviar o pedido.');
            return false;
        } finally {
            setIsSendingOrder(false);
        }
    }, [apiUrl, tableNumber, restaurantId, onOrderSent]);

    const cancelOrder = useCallback(async () => {
        if (!currentOrder) return;
        if (!apiUrl) {
            Alert.alert('Erro', 'Servidor nÃ£o configurado.');
            return;
        }

        try {
            await fetchWithTimeout(`${apiUrl}/orders/${currentOrder.id}/cancel`, {
                method: 'POST',
                headers: { 'x-restaurant-id': restaurantId },
            });
            setCurrentOrder(null);
        } catch (e) {
            Alert.alert('Erro', 'Falha ao cancelar.');
        }
    }, [apiUrl, currentOrder, restaurantId]);

    const checkOrderStatus = useCallback(async (orderId: number, apiUrlOverride = apiUrl, restaurantIdOverride = restaurantId) => {
        if (!apiUrlOverride) return;

        try {
            const res = await fetchWithTimeout(`${apiUrlOverride}/orders/${orderId}`, {
                headers: { 'x-restaurant-id': restaurantIdOverride }
            });
            if (res.ok) {
                const data = await res.json();
                const status = normalizeOrderStatus(data.status);
                if (status === 'completed' || status === 'cancelled') {
                    if (status === 'cancelled') {
                        setCurrentOrder(null);
                        Alert.alert('Aviso', 'Seu pedido anterior foi cancelado.');
                    } else if (status === 'completed') {
                        setCurrentOrder(null);
                    }
                } else {
                    setCurrentOrder(prev => {
                        if (!prev) return null;
                        let preparingCancelUntil = prev.preparingCancelUntil;
                        if (status === 'preparing' && !preparingCancelUntil) {
                            preparingCancelUntil = new Date(Date.now() + 30000).toISOString();
                        }
                        return {
                            ...prev,
                            prepSeconds: Number(data.prep_time_seconds) || prev.prepSeconds,
                            cancelUntil: data.cancel_until,
                            status,
                            preparingCancelUntil,
                        };
                    });
                }
            } else {
                setCurrentOrder(null);
            }
        } catch (e) {
            if (__DEV__) console.log('Error checking order status', e);
        }
    }, [apiUrl, restaurantId]);

    return {
        currentOrder,
        isSendingOrder,
        sendOrder,
        cancelOrder,
        setCurrentOrder,
        checkOrderStatus,
    };
};

export default useOrder;
