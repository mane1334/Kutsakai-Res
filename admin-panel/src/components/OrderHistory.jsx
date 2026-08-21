import React, { useEffect, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { subscribeToEvent } from '../services/socket';
import { formatMeticalDisplay } from '../utils/currency';
import { exportOrdersCsv, getOrders } from '../services/api';

const PAGE_SIZE = 10;

const statusOptions = {
  all: 'Todos',
  pending: 'Aguardando',
  preparing: 'Em preparo',
  completed: 'Concluido',
  cancelled: 'Cancelado',
};

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  preparing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const OrderCard = ({ order }) => (
  <div className="admin-card p-5 transition hover:shadow-admin-soft">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="admin-kicker">Pedido #{order.id}</p>
        <h3 className="mt-2 text-lg font-black text-ink">Mesa {order.table_number}</h3>
      </div>
      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[order.status] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
        {statusOptions[order.status] || order.status}
      </span>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-[#e7c8c2] bg-surface-low px-4 py-3">
        <p className="admin-kicker">Data</p>
        <p className="mt-2 text-sm font-bold text-ink">{new Date(order.created_at).toLocaleString('pt-MZ')}</p>
      </div>
      <div className="rounded-lg border border-[#e7c8c2] bg-surface-low px-4 py-3">
        <p className="admin-kicker">Total</p>
        <p className="mt-2 text-sm font-black text-ink">{formatMeticalDisplay(order.total_price)}</p>
      </div>
    </div>

    <div className="mt-5">
      <h4 className="admin-kicker">Itens</h4>
      <div className="mt-3 space-y-2">
        {Array.isArray(order.items) && order.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between rounded-lg bg-surface-low px-4 py-3">
            <span className="text-sm font-bold text-ink">{item.name}</span>
            <span className="text-sm text-ink-soft">x{item.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);

  const fetchOrders = (pageNum, status) => {
    setLoading(true);
    const params = {
      limit: PAGE_SIZE,
      offset: pageNum * PAGE_SIZE,
      ...(status && status !== 'all' ? { status } : {}),
    };

    getOrders(params)
      .then((data) => {
        setOrders((prevOrders) => (pageNum === 0 ? data.orders : [...prevOrders, ...data.orders]));
        setHasMore(data.orders.length === PAGE_SIZE);
        setError(null);
      })
      .catch((err) => setError(err?.response?.data?.error || err.message || 'Erro ao buscar historico de pedidos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(0);
    setOrders([]);
    fetchOrders(0, statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (page > 0) {
      fetchOrders(page, statusFilter);
    }

    const unsubNew = subscribeToEvent('NEW_ORDER', () => fetchOrders(0, statusFilter));
    const unsubStatus = subscribeToEvent('ORDER_STATUS_UPDATE', () => fetchOrders(0, statusFilter));

    return () => {
      unsubNew();
      unsubStatus();
    };
  }, [page]);

  const handleExport = () => {
    exportOrdersCsv(statusFilter !== 'all' ? { status: statusFilter } : {})
      .catch((err) => setError(err?.response?.data?.error || err.message || 'Erro ao exportar historico de pedidos'));
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-kicker">Histórico</p>
            <h1 className="admin-page-title mt-2">Pedidos processados e em andamento</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
              Filtre por status, acompanhe os registros e exporte o historico do restaurante quando precisar.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="admin-primary-btn disabled:opacity-50"
            disabled={loading}
          >
            <FiDownload className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </section>

      <section className="admin-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(statusOptions).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                statusFilter === key
                  ? 'border border-[#ffe4e6] bg-[#ffe4e6] text-emeraldpro shadow-sm'
                  : 'border border-[#e7c8c2] bg-white text-ink-soft hover:bg-surface-low'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </section>

      {loading && orders.length === 0 ? (
        <div className="admin-card border-dashed px-4 py-12 text-center text-sm text-ink-soft">
          Carregando historico...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-12 text-center text-sm text-rose-700">{error}</div>
      ) : orders.length === 0 ? (
        <div className="admin-card border-dashed px-4 py-12 text-center text-sm text-ink-soft">
          Nenhum pedido encontrado com este status.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <button
            className="admin-primary-btn disabled:opacity-60"
            onClick={() => setPage((current) => current + 1)}
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default OrderHistory;
