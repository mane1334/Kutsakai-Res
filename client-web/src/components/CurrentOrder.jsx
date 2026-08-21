import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { cancelOrder } from '../services/api';
import useIntervalManager from '../hooks/useIntervalManager';
import useOrderStatus from '../hooks/useOrderStatus';
import { subscribeToEvent } from '../services/socket';

const formatSeconds = (total) => {
  const seconds = Math.max(0, Number(total) || 0);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const CurrentOrder = () => {
  const [orderId, setOrderId] = useState(null);
  const [remainingPrep, setRemainingPrep] = useState(null);
  const [cancelUntil, setCancelUntil] = useState(null);
  const [remainingCancelMs, setRemainingCancelMs] = useState(0);
  const [status, setStatus] = useState(null);
  const orderIdRef = useRef(null);
  const prepTimer = useIntervalManager();
  const cancelTimer = useIntervalManager();

  const clearOrderState = () => {
    setOrderId(null);
    setRemainingPrep(null);
    setCancelUntil(null);
    setRemainingCancelMs(0);
    setStatus(null);
    try {
      sessionStorage.removeItem('currentOrderId');
      sessionStorage.removeItem('currentPrepSeconds');
      sessionStorage.removeItem('currentCancelUntil');
      sessionStorage.removeItem('currentOrderStatus');
      window.dispatchEvent(new Event('order:updated'));
    } catch {}
  };

  useEffect(() => {
    orderIdRef.current = orderId;
  }, [orderId]);

  useEffect(() => {
    const loadFromSession = () => {
      try {
        const id = sessionStorage.getItem('currentOrderId');
        const prepSeconds = Number(sessionStorage.getItem('currentPrepSeconds'));
        const storedCancelUntil = sessionStorage.getItem('currentCancelUntil');
        const savedStatus = sessionStorage.getItem('currentOrderStatus');
        setOrderId(id ? Number(id) : null);
        setRemainingPrep(Number.isFinite(prepSeconds) ? prepSeconds : null);
        setCancelUntil(storedCancelUntil || null);
        setStatus(savedStatus || null);
      } catch {}
    };

    loadFromSession();
    window.addEventListener('order:updated', loadFromSession);
    return () => window.removeEventListener('order:updated', loadFromSession);
  }, []);

  useEffect(() => {
    const unsubscribePrep = subscribeToEvent('PREP_TIME_UPDATE', (payload) => {
      if (orderIdRef.current && Number(payload.order_id) === Number(orderIdRef.current)) {
        const seconds = Number(payload.prep_time_seconds) || 0;
        setRemainingPrep(seconds);
        try { sessionStorage.setItem('currentPrepSeconds', String(seconds)); } catch {}
      }
    });

    const unsubscribeCancelled = subscribeToEvent('ORDER_CANCELLED', (payload) => {
      const payloadOrderId = payload.order_id || payload.id;
      if (orderIdRef.current && Number(payloadOrderId) === Number(orderIdRef.current)) {
        toast.warn('Seu pedido foi cancelado.');
        clearOrderState();
      }
    });

    const unsubscribeCourtesy = subscribeToEvent('COURTESY_MESSAGE', (payload) => {
      if (orderIdRef.current && Number(payload.order_id) === Number(orderIdRef.current)) {
        toast.info(payload.message || 'Pedimos desculpa pelo atraso, seu prato ficara pronto em breve.');
      }
    });

    return () => {
      unsubscribePrep();
      unsubscribeCancelled();
      unsubscribeCourtesy();
    };
  }, []);

  useEffect(() => {
    prepTimer.stop();
    if (typeof remainingPrep === 'number' && status !== 'completed') {
      prepTimer.start(() => {
        setRemainingPrep((prev) => (prev != null ? Math.max(0, prev - 1) : prev));
      }, 1000);
    }
    return () => prepTimer.stop();
  }, [remainingPrep, status]);

  useEffect(() => {
    cancelTimer.stop();
    if (cancelUntil && status !== 'completed') {
      cancelTimer.start(() => {
        const diff = new Date(cancelUntil).getTime() - Date.now();
        setRemainingCancelMs(Math.max(0, diff));
      }, 500);
    } else {
      setRemainingCancelMs(0);
    }
    return () => cancelTimer.stop();
  }, [cancelUntil, status]);

  useOrderStatus(orderId, (newStatus) => {
    setStatus((prev) => {
      if (newStatus === 'completed' && prev !== 'completed') {
        prepTimer.stop();
        cancelTimer.stop();
        setRemainingPrep(null);
        setCancelUntil(null);
        setRemainingCancelMs(0);
        toast.success('Seu prato esta pronto e a caminho!');
        try { sessionStorage.setItem('currentOrderStatus', 'completed'); } catch {}
      }
      return newStatus;
    });
  });

  const handleCancel = async () => {
    if (!orderId) return;
    try {
      await cancelOrder(orderId);
      toast.success('Pedido cancelado com sucesso.');
      clearOrderState();
    } catch (_) {
      toast.error('Nao foi possivel cancelar. Janela pode ter expirado.');
    }
  };

  if (!orderId) return null;

  return (
    <div className={`mb-6 rounded-2xl border bg-white p-4 shadow-lg ${status === 'completed' ? 'border-green-300' : 'border-yellow-300'}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className={`text-lg font-bold ${status === 'completed' ? 'text-green-800' : 'text-yellow-800'}`}>Seu pedido</h3>
        <span className={`text-sm ${status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>#{orderId}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className={status === 'completed' ? 'text-green-800' : 'text-yellow-800'}>
          {status === 'completed' ? (
            <span className="inline-flex rounded-full border border-green-300 bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Pronto</span>
          ) : (
            <>
              <div className="text-sm">Tempo de preparo</div>
              <div className="text-2xl font-extrabold">{formatSeconds(remainingPrep)}</div>
            </>
          )}
        </div>
        {status !== 'completed' ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={remainingCancelMs <= 0}
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${remainingCancelMs <= 0 ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {remainingCancelMs > 0 ? `Cancelar (${Math.ceil(remainingCancelMs / 1000)}s)` : 'Cancelar indisponivel'}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default CurrentOrder;
