import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { cancelOrder, postOrder } from '../services/api';
import { useCartDispatch, useCartState } from '../CartContext';
import { useSettings } from '../SettingsContext';
import useIntervalManager from '../hooks/useIntervalManager';
import useOrderStatus from '../hooks/useOrderStatus';
import { subscribeToEvent } from '../services/socket';
import { formatCurrency } from '../utils/currency';

const formatSeconds = (total) => {
  const seconds = Math.max(0, Number(total) || 0);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const isOpenNow = (settings) => {
  const open = settings?.open_time || '00:00';
  const close = settings?.close_time || '23:59';
  const now = new Date();
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const openDate = new Date(now);
  const closeDate = new Date(now);
  openDate.setHours(oh, om, 0, 0);
  closeDate.setHours(ch, cm, 0, 0);
  return now >= openDate && now <= closeDate;
};

const clearStoredOrder = () => {
  try {
    sessionStorage.removeItem('currentOrderId');
    sessionStorage.removeItem('currentPrepSeconds');
    sessionStorage.removeItem('currentOrderStatus');
    sessionStorage.removeItem('currentCancelUntil');
    window.dispatchEvent(new Event('order:updated'));
  } catch {}
};

const Cart = () => {
  const cartItems = useCartState();
  const dispatch = useCartDispatch();
  const { settings, loading: settingsLoading } = useSettings();
  const [isOrdering, setIsOrdering] = useState(false);
  const [tableNumber, setTableNumber] = useState(1);
  const [currentOrder, setCurrentOrder] = useState({ id: null, prepSeconds: null, cancelUntil: null });
  const [remainingPrep, setRemainingPrep] = useState(null);
  const [remainingCancelMs, setRemainingCancelMs] = useState(0);
  const [orderStatus, setOrderStatus] = useState(null);
  const currentOrderRef = useRef(currentOrder);
  const lastOrderIdRef = useRef(null);
  const prepTimer = useIntervalManager();
  const cancelTimer = useIntervalManager();

  useEffect(() => {
    currentOrderRef.current = currentOrder;
  }, [currentOrder]);

  useEffect(() => {
    const unsubscribeCourtesy = subscribeToEvent('COURTESY_MESSAGE', (payload) => {
      if (lastOrderIdRef.current && Number(payload.order_id) === Number(lastOrderIdRef.current)) {
        toast.info(payload.message || 'Pedimos desculpa pelo atraso, seu prato ficara pronto em breve.');
      }
    });

    const unsubscribePrep = subscribeToEvent('PREP_TIME_UPDATE', (payload) => {
      const order = currentOrderRef.current;
      if (order?.id && Number(payload.order_id) === Number(order.id)) {
        const secs = Number(payload.prep_time_seconds) || 0;
        setCurrentOrder((prev) => ({ ...prev, prepSeconds: secs }));
        setRemainingPrep(secs);
      }
    });

    const unsubscribeCancelled = subscribeToEvent('ORDER_CANCELLED', (payload) => {
      const order = currentOrderRef.current;
      const payloadOrderId = payload.order_id || payload.id;
      if (order?.id && Number(payloadOrderId) === Number(order.id)) {
        toast.warn('Seu pedido foi cancelado.');
        setCurrentOrder({ id: null, prepSeconds: null, cancelUntil: null });
        setRemainingPrep(null);
        setRemainingCancelMs(0);
        clearStoredOrder();
      }
    });

    return () => {
      unsubscribeCourtesy();
      unsubscribePrep();
      unsubscribeCancelled();
    };
  }, []);

  useEffect(() => {
    prepTimer.stop();
    if (typeof remainingPrep === 'number' && orderStatus !== 'completed') {
      prepTimer.start(() => {
        setRemainingPrep((prev) => (prev != null ? Math.max(0, prev - 1) : prev));
      }, 1000);
    }
    return () => prepTimer.stop();
  }, [remainingPrep, orderStatus]);

  useEffect(() => {
    cancelTimer.stop();
    if (currentOrder?.cancelUntil && orderStatus !== 'completed') {
      cancelTimer.start(() => {
        const diff = new Date(currentOrder.cancelUntil).getTime() - Date.now();
        setRemainingCancelMs(Math.max(0, diff));
      }, 500);
    } else {
      setRemainingCancelMs(0);
    }
    return () => cancelTimer.stop();
  }, [currentOrder?.cancelUntil, orderStatus]);

  useOrderStatus(currentOrder?.id, (newStatus) => {
    setOrderStatus((prev) => {
      if (newStatus === 'completed' && prev !== 'completed') {
        setRemainingPrep(null);
        setRemainingCancelMs(0);
        try { sessionStorage.setItem('currentOrderStatus', 'completed'); } catch {}
      }
      return newStatus;
    });
  });

  const totalPrice = useMemo(() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0), [cartItems]);
  const totalItems = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !tableNumber) return;
    if (!isOpenNow(settings)) {
      toast.error('Estamos fechados. Retorne no horario de funcionamento.');
      return;
    }

    setIsOrdering(true);
    try {
      const items = cartItems.map((item) => ({ dish_id: item.id, quantity: item.quantity }));
      const response = await postOrder({ table_number: tableNumber, items });
      if (response?.order_id) {
        const prep = Number(response.prep_time_seconds) || 0;
        const cancelUntil = response.cancel_until || null;
        lastOrderIdRef.current = response.order_id;
        setCurrentOrder({ id: response.order_id, prepSeconds: prep, cancelUntil });
        setRemainingPrep(prep);
        try {
          sessionStorage.setItem('currentOrderId', String(response.order_id));
          sessionStorage.setItem('currentPrepSeconds', String(prep));
          sessionStorage.setItem('currentOrderStatus', 'preparing');
          if (cancelUntil) sessionStorage.setItem('currentCancelUntil', String(cancelUntil));
          window.dispatchEvent(new Event('order:updated'));
        } catch {}
      }
      toast.success('Pedido realizado com sucesso! A cozinha ja foi notificada.');
      dispatch({ type: 'CLEAR' });
    } catch (_) {
      toast.error('Erro ao realizar o pedido. Tente novamente.');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!currentOrder?.id) return;
    try {
      await cancelOrder(currentOrder.id);
      toast.success('Pedido cancelado com sucesso.');
      setCurrentOrder({ id: null, prepSeconds: null, cancelUntil: null });
      setRemainingPrep(null);
      setRemainingCancelMs(0);
      clearStoredOrder();
    } catch (_) {
      toast.error('Nao foi possivel cancelar. Janela pode ter expirado.');
    }
  };

  if (settingsLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
        <div className="mb-4 h-7 w-36 rounded skeleton" />
        <div className="space-y-3">
          <div className="h-10 w-full rounded skeleton" />
          <div className="h-20 w-full rounded skeleton" />
          <div className="h-10 w-full rounded skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Carrinho</h2>
        <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700">
          {totalItems} {totalItems === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <label htmlFor="tableNumber" className="mb-2 block text-sm font-medium text-gray-700">
        Numero da mesa
      </label>
      <input
        type="number"
        id="tableNumber"
        min="1"
        max={Number(settings?.tables_count) || 50}
        value={tableNumber}
        onChange={(event) => setTableNumber(Number.parseInt(event.target.value, 10) || 1)}
        className="mb-5 w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
      />

      {currentOrder?.id ? (
        <div className={`mb-4 rounded-xl border p-3 ${orderStatus === 'completed' ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`font-semibold ${orderStatus === 'completed' ? 'text-green-800' : 'text-yellow-800'}`}>Pedido #{currentOrder.id}</p>
              {orderStatus === 'completed' ? (
                <span className="mt-1 inline-flex rounded-full border border-green-300 bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Pronto</span>
              ) : (
                <p className="text-sm text-yellow-700">Preparo: {formatSeconds(remainingPrep)}</p>
              )}
            </div>
            {orderStatus !== 'completed' ? (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={remainingCancelMs <= 0}
                className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${remainingCancelMs <= 0 ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {remainingCancelMs > 0 ? `Cancelar (${Math.ceil(remainingCancelMs / 1000)}s)` : 'Cancelar indisponivel'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {cartItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
          <p className="text-base font-semibold text-gray-700">Seu carrinho esta vazio</p>
          <p className="mt-1 text-sm text-gray-500">Adicione pratos para finalizar o pedido.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(item.price)} cada</p>
                  </div>
                  <p className="font-bold text-red-600">{formatCurrency(item.price * item.quantity)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button type="button" className="h-8 w-8 rounded-full bg-gray-200 font-bold" onClick={() => dispatch({ type: 'CHANGE_QUANTITY', id: item.id, quantity: item.quantity - 1 })}>-</button>
                    <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                    <button type="button" className="h-8 w-8 rounded-full bg-gray-200 font-bold" onClick={() => dispatch({ type: 'CHANGE_QUANTITY', id: item.id, quantity: item.quantity + 1 })}>+</button>
                  </div>
                  <button type="button" className="text-sm font-semibold text-red-600" onClick={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}>Remover</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 flex items-center justify-between border-t border-gray-200 pt-4 text-xl font-bold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <button type="button" onClick={() => dispatch({ type: 'CLEAR' })} className="mb-3 w-full rounded-xl bg-gray-200 px-4 py-3 font-bold text-gray-800 transition hover:bg-gray-300">
            Limpar carrinho
          </button>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isOrdering}
            className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white shadow-md transition hover:bg-green-700 disabled:opacity-60"
          >
            {isOrdering ? 'Enviando pedido...' : 'Finalizar pedido'}
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;
