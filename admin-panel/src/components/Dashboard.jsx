import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiAlertCircle,
  FiBarChart,
  FiBell,
  FiClock,
  FiDollarSign,
  FiPieChart,
  FiShoppingCart,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getAnalytics, getOrders, getWaiterCalls } from '../services/api';
import { subscribeToEvent } from '../services/socket';
import { formatMeticalDisplay } from '../utils/currency';
import { Link } from 'react-router-dom';

const COLORS = ['#0f766e', '#2563eb', '#d97706', '#0ea5e9', '#dc2626', '#0891b2'];
const STATUS_LABELS = {
  pending: 'Aguardando',
  preparing: 'Em preparo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};
const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  preparing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => formatMeticalDisplay(toNumber(value));

const formatHour = (value) => {
  const hour = String(value ?? '').padStart(2, '0');
  return `${hour}:00`;
};

const formatDateShort = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const timeAgo = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 60) return `${diffSeconds}s atrás`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min atrás`;
  return `${Math.floor(diffSeconds / 3600)}h atrás`;
};

const mergeCalls = (currentCalls, incomingCall) => {
  const normalizedCall = {
    ...incomingCall,
    id: incomingCall.id ?? `${incomingCall.table_number}-${incomingCall.created_at ?? Date.now()}`,
  };
  const deduped = currentCalls.filter((call) => call.id !== normalizedCall.id);
  return [normalizedCall, ...deduped].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, accent }) => (
  <div className="admin-card flex min-h-[154px] flex-col justify-between p-5 transition hover:shadow-admin-soft">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="admin-kicker">{title}</p>
        <p className="mt-3 break-words text-[1.7rem] font-black leading-tight text-ink">{value}</p>
      </div>
      <div className={`shrink-0 rounded-lg p-3 ${accent}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <p className="text-sm text-ink-soft">{subtitle}</p>
  </div>
);

const SectionCard = ({ title, icon: Icon, subtitle, children, action }) => (
  <section className="admin-card p-6">
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black text-ink">
          <Icon className="h-5 w-5 text-emeraldpro" />
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({ message }) => (
  <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-[#e7c8c2] bg-surface-low px-4 text-center text-sm text-ink-soft">
    {message}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-2 font-medium text-slate-900">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.dataKey === 'faturamento' ? formatCurrency(entry.value) : toNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const openAiPanel = (tab = 'chat') => {
    window.dispatchEvent(new CustomEvent('admin:open-ai', { detail: { tab } }));
  };

  const fetchDashboardData = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const [analyticsData, pendingCallsData, pendingOrdersData, preparingOrdersData] = await Promise.all([
        getAnalytics(),
        getWaiterCalls(),
        getOrders({ status: 'pending', limit: 5 }),
        getOrders({ status: 'preparing', limit: 5 }),
      ]);

      const combinedOrders = [...(pendingOrdersData.orders || []), ...(preparingOrdersData.orders || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);

      setAnalytics(analyticsData);
      setWaiterCalls(Array.isArray(pendingCallsData) ? pendingCallsData : []);
      setRecentOrders(combinedOrders);
      setLastUpdated(new Date());
    } catch (error) {
      const message = error?.response?.data?.error || error.message || 'Erro ao carregar a dashboard.';
      toast.error(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const intervalId = setInterval(() => {
      fetchDashboardData({ silent: true });
    }, 60000);

    const unsubCall = subscribeToEvent('CALL_WAITER', (payload) => {
      toast.warn(`Mesa ${payload.table_number} está chamando o garçom.`);
      setWaiterCalls((prev) => mergeCalls(prev, payload));
      setLastUpdated(new Date());
    });

    const unsubResolved = subscribeToEvent('WAITER_CALL_RESOLVED', ({ id }) => {
      setWaiterCalls((prev) => prev.filter((call) => call.id !== id));
      setLastUpdated(new Date());
    });

    const refreshAnalytics = () => {
      fetchDashboardData({ silent: true });
    };

    const unsubNewOrder = subscribeToEvent('NEW_ORDER', refreshAnalytics);
    const unsubOrderUpdated = subscribeToEvent('ORDER_UPDATED', refreshAnalytics);
    const unsubOrderCancelled = subscribeToEvent('ORDER_CANCELLED', refreshAnalytics);

    return () => {
      clearInterval(intervalId);
      unsubCall();
      unsubResolved();
      unsubNewOrder();
      unsubOrderUpdated();
      unsubOrderCancelled();
    };
  }, []);

  const metrics = useMemo(() => {
    const ordersByDay = analytics?.ordersByDay || [];
    const filteredSummary = analytics?.filteredSummary || {};
    const totalOrdersPeriod = toNumber(filteredSummary.total_pedidos) || ordersByDay.reduce((sum, item) => sum + toNumber(item.pedidos), 0);
    const cancelledOrders = ordersByDay.reduce((sum, item) => sum + toNumber(item.pedidos_cancelados), 0);
    const lostRevenue = ordersByDay.reduce((sum, item) => sum + toNumber(item.faturamento_perdido), 0);
    const activeOrders = recentOrders.filter((order) => ['pending', 'preparing'].includes(order.status)).length;
    const avgTicket = totalOrdersPeriod > 0 ? toNumber(filteredSummary.faturamento) / totalOrdersPeriod : 0;

    return {
      activeOrders,
      totalOrdersPeriod,
      cancelledOrders,
      lostRevenue,
      avgTicket,
      avgServiceMinutes: Math.round(toNumber(analytics?.avgServiceTime) / 60),
    };
  }, [analytics, recentOrders]);

  const salesTrend = useMemo(
    () =>
      (analytics?.ordersByDay || []).map((item) => ({
        ...item,
        day: formatDateShort(item.day),
        faturamento: toNumber(item.faturamento),
        pedidos: toNumber(item.pedidos),
      })),
    [analytics]
  );

  const categoryRevenue = useMemo(
    () =>
      (analytics?.revenueByCategory || [])
        .map((item) => ({ ...item, revenue: toNumber(item.revenue) }))
        .filter((item) => item.revenue > 0),
    [analytics]
  );

  const peakHours = useMemo(
    () =>
      (analytics?.peakHours || []).map((item) => ({
        ...item,
        hour: formatHour(item.hour),
        count: toNumber(item.count),
      })),
    [analytics]
  );

  const topRated = useMemo(
    () =>
      (analytics?.topRated || []).map((dish) => ({
        ...dish,
        avg_rating: toNumber(dish.avg_rating),
        count: toNumber(dish.count),
      })),
    [analytics]
  );

  const topDishes = useMemo(
    () =>
      (analytics?.topDishes || []).map((dish) => ({
        ...dish,
        total: toNumber(dish.total),
      })),
    [analytics]
  );

  const waitCallsByReason = useMemo(() => {
    const counts = waiterCalls.reduce((acc, call) => {
      const key = call.reason || 'Chamado geral';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [waiterCalls]);

  const isEmptyDashboard = useMemo(() => {
    const hasRevenue = toNumber(analytics?.dailySummary?.faturamento_dia) > 0 || toNumber(analytics?.monthlySummary?.faturamento_mes) > 0;
    const hasOrders = recentOrders.length > 0 || toNumber(analytics?.filteredSummary?.total_pedidos) > 0;
    const hasTopItems = topDishes.length > 0 || topRated.length > 0;
    const hasCalls = waiterCalls.length > 0;
    return !hasRevenue && !hasOrders && !hasTopItems && !hasCalls;
  }, [analytics, recentOrders, topDishes, topRated, waiterCalls]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          <p className="text-sm text-slate-500">Carregando dados reais da operação...</p>
        </div>
      </div>
    );
  }

  if (isEmptyDashboard) {
    return (
      <>
        <div className="admin-page pb-28">
          <div className="mx-auto max-w-5xl">
            <section className="admin-card p-6">
              <p className="admin-kicker">Primeiros passos</p>
              <h1 className="admin-page-title mt-2">Seu dashboard ainda está vazio, e isso é normal.</h1>
              <p className="admin-page-copy">
                Assim que o restaurante começar a operar, esta tela vai mostrar vendas, pedidos, horários fortes e destaque dos pratos.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openAiPanel('insights')}
                  className="admin-primary-btn text-sm"
                >
                  Abrir insights IA
                </button>
                <button
                  type="button"
                  onClick={() => openAiPanel('chat')}
                  className="admin-secondary-btn text-sm"
                >
                  Abrir chat IA
                </button>
              </div>
            </section>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="admin-card p-6">
                <p className="admin-kicker">1. Base do cardápio</p>
                <h2 className="admin-section-title mt-3">Cadastre categorias e pratos</h2>
                <p className="mt-3 text-sm leading-6 text-ink-soft">Monte a estrutura inicial para receber pedidos reais.</p>
                <div className="mt-5 flex gap-3">
                  <Link to="/categories" className="admin-primary-btn px-4 py-2 text-sm">
                    Categorias
                  </Link>
                  <Link to="/menu" className="admin-secondary-btn px-4 py-2 text-sm">
                    Pratos
                  </Link>
                </div>
              </div>

              <div className="admin-card p-6">
                <p className="admin-kicker">2. Operação</p>
                <h2 className="admin-section-title mt-3">Revise configurações essenciais</h2>
                <p className="mt-3 text-sm leading-6 text-ink-soft">Horários, idioma, tempo de preparo e módulos ativos.</p>
                <div className="mt-5">
                  <Link to="/settings" className="admin-primary-btn px-4 py-2 text-sm">
                    Abrir configurações
                  </Link>
                </div>
              </div>

              <div className="admin-card p-6">
                <p className="admin-kicker">3. Divulgação</p>
                <h2 className="admin-section-title mt-3">Prepare canais e anúncios</h2>
                <p className="mt-3 text-sm leading-6 text-ink-soft">Deixe web/app prontos e publique campanhas quando quiser.</p>
                <div className="mt-5 flex gap-3">
                  <Link to="/client-channels" className="admin-secondary-btn px-4 py-2 text-sm">
                    Canais
                  </Link>
                  <Link to="/ads" className="admin-secondary-btn px-4 py-2 text-sm">
                    Anúncios
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="admin-page pb-28">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Admin Panel</p>
          <h1 className="admin-page-title mt-2">Dashboard operacional</h1>
          <p className="admin-page-copy">
            Receita, pedidos, chamadas e qualidade do serviço com base nos dados atuais do backend.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="admin-secondary-btn text-sm"
          >
            Atualizar agora
          </button>
          <button
            type="button"
            onClick={() => openAiPanel('insights')}
            className="admin-primary-btn text-sm"
          >
            Insights IA
          </button>
          <button
            type="button"
            onClick={() => openAiPanel('chat')}
            className="admin-secondary-btn text-sm"
          >
            Chat IA
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Faturamento Hoje"
          value={formatCurrency(analytics?.dailySummary?.faturamento_dia)}
          subtitle={`${toNumber(analytics?.dailySummary?.total_pedidos_dia)} pedidos concluídos ou em aberto hoje`}
          icon={FiDollarSign}
          accent="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Pedidos Ativos"
          value={metrics.activeOrders}
          subtitle={`${recentOrders.filter((order) => order.status === 'preparing').length} em preparo agora`}
          icon={FiShoppingCart}
          accent="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(metrics.avgTicket)}
          subtitle={`${metrics.totalOrdersPeriod} pedidos considerados nos últimos 7 dias`}
          icon={FiTrendingUp}
          accent="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Chamadas Pendentes"
          value={waiterCalls.length}
          subtitle={waiterCalls[0] ? `Mais recente: mesa ${waiterCalls[0].table_number}` : 'Nenhuma chamada pendente'}
          icon={FiBell}
          accent="bg-rose-50 text-rose-700"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="admin-card px-5 py-4">
          <p className="admin-kicker">Mês atual</p>
          <p className="mt-3 text-2xl font-black text-ink">{formatCurrency(analytics?.monthlySummary?.faturamento_mes)}</p>
          <p className="mt-1 text-sm text-ink-soft">{toNumber(analytics?.monthlySummary?.total_pedidos_mes)} pedidos neste mês</p>
        </div>
        <div className="admin-card px-5 py-4">
          <p className="admin-kicker">Tempo médio</p>
          <p className="mt-3 text-2xl font-black text-ink">
            {metrics.avgServiceMinutes > 0 ? `${metrics.avgServiceMinutes} min` : 'Sem base'}
          </p>
          <p className="mt-1 text-sm text-ink-soft">Calculado a partir de pedidos concluídos</p>
        </div>
        <div className="admin-card px-5 py-4">
          <p className="admin-kicker">Cancelamentos</p>
          <p className="mt-3 text-2xl font-black text-ink">{metrics.cancelledOrders}</p>
          <p className="mt-1 text-sm text-ink-soft">Perda estimada: {formatCurrency(metrics.lostRevenue)}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          title="Tendência de vendas"
          icon={FiBarChart}
          subtitle="Últimos 7 dias com faturamento e volume de pedidos"
          action={
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {lastUpdated ? `Atualizado às ${lastUpdated.toLocaleTimeString('pt-BR')}` : 'Sem atualização'}
            </span>
          }
        >
          {salesTrend.length === 0 ? (
            <EmptyState message="Ainda não há pedidos suficientes para montar a série de vendas." />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={salesTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="faturamento" name="Faturamento" fill="#0f766e" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" dataKey="pedidos" name="Pedidos" type="monotone" stroke="#2563eb" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Chamadas de garçom" icon={FiBell} subtitle="Pendências registradas e persistidas no backend">
          {waiterCalls.length === 0 ? (
            <EmptyState message="Nenhuma chamada pendente no momento." />
          ) : (
            <div className="space-y-3">
              {waiterCalls.slice(0, 5).map((call) => (
                <div key={call.id} className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-rose-900">Mesa {call.table_number}</p>
                      <p className="mt-1 text-sm text-rose-700">{call.reason || 'Chamado geral'}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-rose-700">
                      {timeAgo(call.created_at)}
                    </span>
                  </div>
                </div>
              ))}
              {waitCallsByReason.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-sm font-medium text-slate-700">Motivos mais frequentes</p>
                  <div className="space-y-3">
                    {waitCallsByReason.map((item) => (
                      <div key={item.reason}>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>{item.reason}</span>
                          <span>{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-rose-500"
                            style={{ width: `${Math.max((item.count / waiterCalls.length) * 100, 8)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Pedidos em curso" icon={FiClock} subtitle="Fila operacional recente">
          {recentOrders.length === 0 ? (
            <EmptyState message="Não há pedidos pendentes ou em preparo." />
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">Mesa {order.table_number}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Pedido #{order.id} - {Array.isArray(order.items) ? order.items.length : 0} itens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(order.total_price)}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(order.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard title="Receita por categoria" icon={FiPieChart} subtitle="Participação das categorias no faturamento recente">
          {categoryRevenue.length === 0 ? (
            <EmptyState message="Sem vendas por categoria no período recente." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {categoryRevenue.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Fluxo por horário" icon={FiClock} subtitle="Quantidade de pedidos por hora">
          {peakHours.length === 0 ? (
            <EmptyState message="Ainda não há distribuição de pedidos por horário." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={peakHours}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" name="Pedidos" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Qualidade e destaque" icon={FiStar} subtitle="Pratos mais pedidos e melhor avaliados">
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">Mais pedidos</p>
              {topDishes.length === 0 ? (
                <EmptyState message="Sem dados de itens vendidos ainda." />
              ) : (
                <div className="space-y-3">
                  {topDishes.slice(0, 4).map((dish, index) => (
                    <div key={`${dish.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700">
                          {index + 1}
                        </span>
                        <span className="font-medium text-slate-800">{dish.name}</span>
                      </div>
                      <span className="text-sm text-slate-500">{dish.total} un.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">Melhor avaliados</p>
              {topRated.length === 0 ? (
                <EmptyState message="Ainda não há avaliações suficientes." />
              ) : (
                <div className="space-y-3">
                  {topRated.slice(0, 4).map((dish, index) => (
                    <div key={`${dish.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{dish.name}</p>
                        <p className="text-xs text-slate-500">{dish.count} avaliações</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-amber-700">
                        <FiStar className="h-4 w-4" />
                        {dish.avg_rating.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <FiAlertCircle className="h-4 w-4" />
          <span className="font-medium">Leitura operacional atual</span>
        </div>
        <p className="mt-2">
          A dashboard agora usa dados persistidos de <code>/analytics</code>, <code>/waiter-calls</code> e <code>/orders</code>.
          Chamadas pendentes continuam em tela após refresh e a fila operacional reflete pedidos reais em aberto.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
