import React, { useState, useEffect } from 'react';
import { subscribeToEvent } from '../services/socket';
import { formatMeticalDisplay } from '../utils/currency';
import { getOrders, updateOrderPrepTime, updateOrderStatus } from '../services/api';

const _HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
const _PROTOCOL = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol : 'http:';
const WS_URL = import.meta.env.VITE_WS_URL || `${_PROTOCOL === 'https:' ? 'wss' : 'ws'}://${_HOSTNAME}:3000`;

const getItemUnitPrice = (item) => {
  const price = item?.price ?? item?.unit_price ?? item?.unitPrice ?? 0;
  const n = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(n) ? 0 : n;
};

const getOrderItems = (order) => Array.isArray(order?.items) ? order.items : [];

const computeOrderTotal = (order) => {
  const declared = order?.total_price ?? order?.total ?? null;
  const declaredNum = declared != null ? Number(declared) : null;
  if (declaredNum != null && !isNaN(declaredNum)) return declaredNum;
  return getOrderItems(order).reduce((sum, it) => sum + getItemUnitPrice(it) * (Number(it?.quantity ?? 1) || 1), 0);
};

const statusLabel = (s) => ({
  pending: 'Aguardando',
  preparing: 'Em Preparo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}[s] || s);

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const readPersistedStatuses = () => {
  try {
    const raw = sessionStorage.getItem('adminOrderStatuses');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const writePersistedStatus = (orderId, status) => {
  try {
    const map = readPersistedStatuses();
    if (status == null) {
      delete map[orderId];
    } else {
      map[orderId] = status;
    }
    sessionStorage.setItem('adminOrderStatuses', JSON.stringify(map));
  } catch (e) {
    // ignore storage errors
  }
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending'); // Default filter
  const [actionMessage, setActionMessage] = useState(null);
  const [editingPrep, setEditingPrep] = useState({}); // { [orderId]: minutesString }
  const [undoableCompletions, setUndoableCompletions] = useState(new Set()); // order IDs that can be undone

  const fetchOrders = async (status) => {
    setLoading(true);
    try {
      const data = await getOrders(status && status !== 'all' ? { status } : {});
      setOrders(data.orders);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Erro ao buscar pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(filterStatus);

    const unsubNew = subscribeToEvent('NEW_ORDER', () => {
      console.log('Atualização NEW_ORDER recebida via socket service.');
      fetchOrders(filterStatus);
    });
    const unsubStatus = subscribeToEvent('ORDER_STATUS_UPDATE', () => {
      console.log('Atualização ORDER_STATUS_UPDATE recebida via socket service.');
      fetchOrders(filterStatus);
    });
    const unsubPrep = subscribeToEvent('PREP_TIME_UPDATE', () => {
      console.log('Atualização PREP_TIME_UPDATE recebida via socket service.');
      fetchOrders(filterStatus);
    });
    const unsubCancel = subscribeToEvent('ORDER_CANCELLED', () => {
      console.log('Atualização ORDER_CANCELLED recebida via socket service.');
      fetchOrders(filterStatus);
    });

    return () => {
      unsubNew(); unsubStatus(); unsubPrep(); unsubCancel();
    };
  }, [filterStatus]);

  const handleStatusChange = async (orderId, newStatus, reason = null) => {
    try {
      await updateOrderStatus(orderId, newStatus, reason);
      // Atualiza a lista imediatamente após o sucesso
      setActionMessage(`Pedido #${orderId} atualizado para "${newStatus}".`);
      // persist admin-side completed state to avoid showing prep timers after refresh
      if (newStatus === 'completed') {
        writePersistedStatus(orderId, 'completed');
      } else {
        writePersistedStatus(orderId, null);
      }
      if (newStatus === 'completed') {
        setUndoableCompletions(prev => new Set([...prev, orderId]));
        setTimeout(() => {
          setUndoableCompletions(prev => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
          });
        }, 5000);
      }
      setTimeout(() => setActionMessage(null), 3000);
      fetchOrders(filterStatus);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.')) {
      const reason = window.prompt('Motivo do cancelamento (opcional):');
      handleStatusChange(orderId, 'cancelled', reason);
    }
  };

  const handleCompleteOrder = (orderId) => {
    if (window.confirm('Tem certeza que deseja marcar este pedido como concluído?')) {
      handleStatusChange(orderId, 'completed');
    }
  };

  const handleUndoComplete = (orderId) => {
    if (window.confirm('Desfazer conclusão e voltar para "Em Preparo"?')) {
      handleStatusChange(orderId, 'preparing');
      setUndoableCompletions(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      writePersistedStatus(orderId, null);
    }
  };

  const adjustPrepTime = async (orderId, { addMinutes, setMinutes }) => {
    try {
      const body = {};
      if (typeof setMinutes === 'number') body.set_minutes = setMinutes;
      if (typeof addMinutes === 'number') body.add_minutes = addMinutes;
      await updateOrderPrepTime(orderId, body);
      setActionMessage(`Tempo de preparo atualizado para o pedido #${orderId}.`);
      setTimeout(() => setActionMessage(null), 3000);
      fetchOrders(filterStatus);
    } catch (err) {
      setError(err.message);
    }
  };

  // Read persisted admin-side statuses once per render
  const persisted = readPersistedStatuses();

  if (loading) return <div className="text-center p-8">Carregando pedidos...</div>;
  if (error) return <div className="text-center text-red-500 p-8">Erro: {error}</div>;

  const groupedOrders = orders.reduce((acc, order) => {
    const d = new Date(order.created_at);
    const dateKey = d.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      const today = new Date().toISOString().split('T')[0];
      const label = dateKey === today ? 'Hoje' : d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' });
      acc[dateKey] = { label, items: [] };
    }
    acc[dateKey].items.push(order);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedOrders).sort((a, b) => new Date(b) - new Date(a));
  const pendingCount = orders.filter((order) => order.status === 'pending').length;
  const preparingCount = orders.filter((order) => order.status === 'preparing').length;
  const completedCount = orders.filter((order) => order.status === 'completed').length;
  const averagePrepMinutes = orders.length
    ? Math.round(orders.reduce((sum, order) => sum + (Number(order.prep_time_seconds) || 0), 0) / orders.length / 60)
    : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="admin-kicker">Pedidos atuais</p>
          <h1 className="admin-page-title mt-2">Fila de producao em tempo real</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
            Gerencie mesa, status, itens e tempo de preparo com a densidade operacional do novo design.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {actionMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {actionMessage}
            </div>
          ) : null}
          <div className="rounded-xl bg-surface-low p-1">
            {[
              ['all', 'Todos'],
              ['pending', 'Pendentes'],
              ['preparing', 'Preparando'],
              ['completed', 'Concluidos'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterStatus(value)}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                  filterStatus === value ? 'bg-white text-emeraldpro shadow-sm' : 'text-ink-soft hover:bg-white/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#e7c8c2] bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-emeraldpro focus:ring-2 focus:ring-emeraldpro/10"
          >
            <option value="pending">Aguardando</option>
            <option value="preparing">Em Preparo</option>
            <option value="completed">Concluido</option>
            <option value="cancelled">Cancelado</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="admin-card p-5">
          <p className="admin-kicker">Fila de espera</p>
          <p className="mt-2 text-2xl font-black text-emeraldpro">{pendingCount} pedidos</p>
          <p className="mt-1 text-sm text-ink-soft">Aguardando confirmacao</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-kicker">Em preparo</p>
          <p className="mt-2 text-2xl font-black text-ink">{preparingCount} pedidos</p>
          <p className="mt-1 text-sm text-ink-soft">Cozinha em producao</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-kicker">Tempo medio</p>
          <p className="mt-2 text-2xl font-black text-ink">{averagePrepMinutes} min</p>
          <p className="mt-1 text-sm text-ink-soft">Baseado na lista atual</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-kicker">Concluidos</p>
          <p className="mt-2 text-2xl font-black text-emeraldpro">{completedCount}</p>
          <p className="mt-1 text-sm text-ink-soft">Pedidos finalizados</p>
        </div>
      </section>

      {orders.length === 0 ? (
        <div className="admin-card border-dashed bg-white p-12 text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mb-2 text-lg font-bold text-ink">Nenhum pedido encontrado</h3>
          <p className="text-ink-soft">Nao ha pedidos com o status "{statusLabel(filterStatus)}" no momento.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(dateKey => (
            <div key={dateKey} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7c8c2] pb-2">
                <h2 className="text-lg font-black text-ink">{groupedOrders[dateKey].label}</h2>
                <span className="text-sm font-semibold text-ink-soft">{groupedOrders[dateKey].items.length} pedidos</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupedOrders[dateKey].items.map(order => (
                  <div key={order.id} className="admin-card overflow-hidden transition hover:shadow-admin-soft">
                    <div className="border-b border-[#e7c8c2] bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="admin-kicker">Mesa {order.table_number}</p>
                          <h2 className="mt-1 text-xl font-black text-ink">Pedido #{order.id}</h2>
                          <p className="mt-1 text-sm text-ink-soft">{new Date(order.created_at).toLocaleTimeString('pt-MZ')}</p>
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[order.status] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                          {statusLabel(order.status)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-surface-low p-3">
                          <p className="admin-kicker">Total</p>
                          <p className="mt-1 text-lg font-black text-ink">{formatMeticalDisplay(computeOrderTotal(order))}</p>
                        </div>
                        <div className="rounded-lg bg-surface-low p-3">
                          <p className="admin-kicker">Preparo</p>
                          <p className="mt-1 text-lg font-black text-ink">{Math.ceil((Number(order.prep_time_seconds) || 0) / 60)} min</p>
                        </div>
                      </div>

                      {typeof order.prep_time_seconds === 'number' && (order.status === 'pending' || order.status === 'preparing') && !(persisted && String(persisted[order.id]) === 'completed') ? (
                        <div className="rounded-lg border border-[#e7c8c2] bg-white p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-bold text-ink">Tempo de preparo</span>
                            <span className="text-lg font-black text-emeraldpro">{Math.ceil(order.prep_time_seconds / 60)} min</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <button onClick={() => adjustPrepTime(order.id, { addMinutes: 5 })} className="admin-secondary-btn flex-1 px-3 py-2 text-sm" type="button">+5 min</button>
                              <button onClick={() => adjustPrepTime(order.id, { addMinutes: 10 })} className="admin-secondary-btn flex-1 px-3 py-2 text-sm" type="button">+10 min</button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                placeholder="Minutos"
                                value={editingPrep[order.id] ?? ''}
                                onChange={(e) => setEditingPrep(prev => ({ ...prev, [order.id]: e.target.value }))}
                                className="min-w-0 flex-1 rounded-lg border border-[#e7c8c2] px-3 py-2 text-sm focus:border-emeraldpro focus:ring-2 focus:ring-emeraldpro/10"
                              />
                              <button
                                onClick={() => {
                                  const val = parseFloat(editingPrep[order.id]);
                                  if (!isNaN(val)) adjustPrepTime(order.id, { setMinutes: val });
                                }}
                                className="admin-primary-btn px-4 py-2 text-sm"
                                type="button"
                              >
                                Definir
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div>
                        <h3 className="mb-2 text-sm font-black text-ink">Itens do pedido</h3>
                        <div className="space-y-2">
                          {getOrderItems(order).map((item, idx) => {
                            const unit = getItemUnitPrice(item);
                            const qty = Number(item?.quantity ?? 1) || 1;
                            const subtotal = unit * qty;
                            return (
                              <div key={idx} className="flex items-center justify-between rounded-lg bg-surface-low px-3 py-2">
                                <div className="min-w-0 flex-1">
                                  <span className="truncate text-sm font-bold text-ink">{item.name}</span>
                                  <span className="ml-2 text-sm text-ink-soft">x{qty}</span>
                                </div>
                                <span className="text-sm font-black text-ink">{formatMeticalDisplay(subtotal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-[#e7c8c2] pt-4">
                        {order.status === 'pending' ? (
                          <>
                            <button onClick={() => handleStatusChange(order.id, 'preparing')} className="admin-primary-btn px-3 py-2 text-sm" type="button">Em Preparo</button>
                            <button onClick={() => handleCancelOrder(order.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700" type="button">Cancelar</button>
                          </>
                        ) : null}
                        {order.status === 'preparing' ? (
                          <>
                            <button onClick={() => handleCompleteOrder(order.id)} className="admin-primary-btn px-3 py-2 text-sm" type="button">Concluido</button>
                            <button onClick={() => handleCancelOrder(order.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700" type="button">Cancelar</button>
                          </>
                        ) : null}
                        {order.status === 'completed' ? (
                          undoableCompletions.has(order.id) ? (
                            <button onClick={() => handleUndoComplete(order.id)} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-amber-700" type="button">Desfazer (5s)</button>
                          ) : (
                            <span className="text-sm font-semibold text-ink-soft">Concluido</span>
                          )
                        ) : null}
                        {order.status === 'cancelled' ? <span className="text-sm font-semibold text-ink-soft">Cancelado</span> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
