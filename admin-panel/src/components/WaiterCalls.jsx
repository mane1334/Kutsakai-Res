import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiBarChart2, FiCheckCircle, FiClock, FiFilter, FiPieChart, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getWaiterCalls, resolveWaiterCall } from '../services/api';
import { subscribeToEvent } from '../services/socket';

const CATEGORY_DEFINITIONS = [
  { id: 'bill', label: 'Conta', color: '#0f766e', tone: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { id: 'cleaning', label: 'Limpeza', color: '#2563eb', tone: 'border-blue-200 bg-blue-50 text-blue-800' },
  { id: 'menu', label: 'Dúvidas/Menu', color: '#d97706', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  { id: 'service', label: 'Atendimento', color: '#0ea5e9', tone: 'border-sky-200 bg-sky-50 text-sky-800' },
  { id: 'other', label: 'Outros', color: '#64748b', tone: 'border-slate-200 bg-slate-50 text-slate-800' },
];

const CATEGORY_BY_ID = CATEGORY_DEFINITIONS.reduce((acc, category) => {
  acc[category.id] = category;
  return acc;
}, {});

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getCallCategoryId = (reason) => {
  const text = normalizeText(reason);
  if (text.includes('conta') || text.includes('pagar') || text.includes('pagamento')) return 'bill';
  if (text.includes('limpeza') || text.includes('guardanapo') || text.includes('talher') || text.includes('mesa')) return 'cleaning';
  if (text.includes('duvida') || text.includes('menu') || text.includes('cardápio') || text.includes('prato')) return 'menu';
  if (text.includes('garcom') || text.includes('atendimento') || text.includes('ajuda') || text.includes('serviço')) return 'service';
  return 'other';
};

const cleanReason = (reason) => {
  const raw = String(reason || 'Chamado geral').replace(/\s+/g, ' ').trim();
  return raw
    .replace(/^[^-:]+[-:]\s*/i, '')
    .replace(/[^\p{L}\p{N}\s.,!?/-]/gu, '')
    .trim() || 'Chamado geral';
};

const parseDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const getTimeAgo = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return '';
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
};

const formatHour = (hour) => `${String(hour).padStart(2, '0')}:00`;

const enrichCall = (call) => {
  const categoryId = getCallCategoryId(call.reason);
  return {
    ...call,
    categoryId,
    category: CATEGORY_BY_ID[categoryId],
    cleanReason: cleanReason(call.reason),
  };
};

const EmptyState = ({ children }) => (
  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
    {children}
  </div>
);

const WaiterCalls = () => {
  const [pendingCalls, setPendingCalls] = useState([]);
  const [historyCalls, setHistoryCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [activeCategory, setActiveCategory] = useState('all');
  const [resolvingIds, setResolvingIds] = useState(new Set());

  const fetchCalls = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [pending, history] = await Promise.all([
        getWaiterCalls(),
        getWaiterCalls('resolved'),
      ]);
      setPendingCalls(Array.isArray(pending) ? pending.map(enrichCall) : []);
      setHistoryCalls(Array.isArray(history) ? history.map(enrichCall) : []);
    } catch (err) {
      console.error('Erro ao buscar chamadas:', err);
      toast.error('Erro ao carregar chamadas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();

    const unsubCall = subscribeToEvent('CALL_WAITER', (payload) => {
      setPendingCalls((prev) => [enrichCall(payload), ...prev.filter((call) => call.id !== payload.id)]);
    });

    const unsubResolved = subscribeToEvent('WAITER_CALL_RESOLVED', (payload) => {
      setPendingCalls((prev) => prev.filter((call) => call.id !== payload.id));
      fetchCalls({ silent: true });
    });

    return () => {
      unsubCall();
      unsubResolved();
    };
  }, []);

  const allCalls = useMemo(() => [...pendingCalls, ...historyCalls], [pendingCalls, historyCalls]);

  const stats = useMemo(() => {
    const categoryRows = CATEGORY_DEFINITIONS.map((category) => {
      const pending = pendingCalls.filter((call) => call.categoryId === category.id);
      const resolved = historyCalls.filter((call) => call.categoryId === category.id);
      return {
        ...category,
        pending: pending.length,
        resolved: resolved.length,
        total: pending.length + resolved.length,
      };
    });

    const hourlyMap = allCalls.reduce((acc, call) => {
      const date = parseDate(call.created_at);
      if (!date) return acc;
      const hour = date.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const byHour = Object.entries(hourlyMap)
      .map(([hour, count]) => ({ hour: formatHour(hour), count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    const busiestCategory = categoryRows.slice().sort((a, b) => b.total - a.total)[0];
    const oldestPending = pendingCalls
      .slice()
      .sort((a, b) => (parseDate(a.created_at)?.getTime() || 0) - (parseDate(b.created_at)?.getTime() || 0))[0];

    return {
      total: allCalls.length,
      pending: pendingCalls.length,
      resolved: historyCalls.length,
      categoryRows,
      byHour,
      busiestCategory,
      oldestPending,
    };
  }, [allCalls, historyCalls, pendingCalls]);

  const visibleCalls = useMemo(() => {
    const source = activeStatus === 'pending' ? pendingCalls : historyCalls;
    if (activeCategory === 'all') return source;
    return source.filter((call) => call.categoryId === activeCategory);
  }, [activeCategory, activeStatus, historyCalls, pendingCalls]);

  const resolveCall = async (id) => {
    setResolvingIds((prev) => new Set(prev).add(id));
    try {
      await resolveWaiterCall(id);
      setPendingCalls((prev) => prev.filter((call) => call.id !== id));
      fetchCalls({ silent: true });
      toast.success('Chamada marcada como atendida.');
    } catch (err) {
      console.error('Erro ao resolver chamada:', err);
      toast.error('Erro ao resolver chamada.');
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const resolveCategory = async (categoryId) => {
    const calls = pendingCalls.filter((call) => call.categoryId === categoryId);
    if (calls.length === 0) return;

    setResolvingIds((prev) => new Set([...prev, ...calls.map((call) => call.id)]));
    try {
      await Promise.all(calls.map((call) => resolveWaiterCall(call.id)));
      setPendingCalls((prev) => prev.filter((call) => call.categoryId !== categoryId));
      fetchCalls({ silent: true });
      toast.success(`${calls.length} chamadas de ${CATEGORY_BY_ID[categoryId].label} atendidas.`);
    } catch (err) {
      console.error('Erro ao resolver categoria:', err);
      toast.error('Erro ao resolver a categoria.');
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        calls.forEach((call) => next.delete(call.id));
        return next;
      });
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Carregando chamadas...</div>;
  }

  return (
    <div className="admin-page pb-24">
      <section className="admin-page-header">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-kicker">Garçom</p>
            <h1 className="admin-page-title mt-2">Chamadas do salão em tempo real</h1>
            <p className="admin-page-copy">
              Resolva pendências por categoria, acompanhe histórico e use análises para entender os motivos mais recorrentes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchCalls()}
            className="admin-secondary-btn text-sm"
          >
            <FiRefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="admin-card p-5">
          <p className="admin-kicker">Pendentes</p>
          <p className="mt-3 text-3xl font-black text-ink">{stats.pending}</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-kicker">Atendidas</p>
          <p className="mt-3 text-3xl font-black text-ink">{stats.resolved}</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-kicker">Categoria forte</p>
          <p className="mt-3 text-2xl font-black text-ink">{stats.busiestCategory?.label || '-'}</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-kicker">Mais antigo</p>
          <p className="mt-3 text-2xl font-black text-ink">{stats.oldestPending ? getTimeAgo(stats.oldestPending.created_at) : '-'}</p>
        </div>
      </div>

      <section className="admin-card p-6">
        <div className="mb-5 flex items-center gap-2 text-slate-900">
          <FiFilter className="h-5 w-5 text-slate-500" />
          <h2 className="text-xl font-semibold">Categorias de atendimento</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stats.categoryRows.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setActiveCategory(category.id);
                setActiveStatus(category.pending > 0 ? 'pending' : 'history');
              }}
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                activeCategory === category.id ? category.tone : 'border-slate-200 bg-white text-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{category.label}</p>
                  <p className="mt-2 text-xs text-slate-500">{category.total} chamadas no período</p>
                </div>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-700">{category.pending}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/70">
                <div
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: category.color,
                    width: `${stats.total > 0 ? Math.max((category.total / stats.total) * 100, category.total > 0 ? 8 : 0) : 0}%`,
                  }}
                />
              </div>
              <button
                type="button"
                disabled={category.pending === 0}
                onClick={(event) => {
                  event.stopPropagation();
                  resolveCategory(category.id);
                }}
                className="mt-4 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Resolver categoria
              </button>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-card p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-ink">
              <FiPieChart className="h-5 w-5 text-emeraldpro" />
              Análises e gráficos
            </h2>
            <p className="mt-1 text-sm text-ink-soft">Distribuição por categoria e horários de maior volume.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCategory('analytics')}
            className={`rounded-lg px-4 py-3 text-sm font-bold transition ${
              activeCategory === 'analytics' ? 'bg-emeraldpro text-white' : 'border border-[#e7c8c2] bg-white text-ink-soft hover:bg-surface-low'
            }`}
          >
            Ver análise detalhada
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="admin-soft-panel min-h-80 p-4">
            <h3 className="admin-kicker mb-4 flex items-center gap-2">
              <FiBarChart2 className="h-4 w-4" />
              Chamadas por categoria
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.categoryRows}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" name="Pendentes" fill="#d97706" radius={[8, 8, 0, 0]} />
                <Bar dataKey="resolved" name="Atendidas" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-soft-panel min-h-80 p-4">
            <h3 className="admin-kicker mb-4 flex items-center gap-2">
              <FiClock className="h-4 w-4" />
              Distribuição por horário
            </h3>
            {stats.byHour.length === 0 ? (
              <EmptyState>Nenhum dado de horário disponível.</EmptyState>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.byHour} dataKey="count" nameKey="hour" outerRadius={92} innerRadius={48} paddingAngle={3}>
                    {stats.byHour.map((entry, index) => (
                      <Cell key={entry.hour} fill={CATEGORY_DEFINITIONS[index % CATEGORY_DEFINITIONS.length].color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="admin-card p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="admin-section-title">
              {activeCategory === 'all'
                ? 'Todas as chamadas'
                : activeCategory === 'analytics'
                  ? 'Leitura operacional'
                  : `Categoria: ${CATEGORY_BY_ID[activeCategory]?.label}`}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {activeCategory === 'analytics'
                ? 'Use os gráficos acima para planejar equipe e reduzir repetições.'
                : 'Filtre pendentes e histórico sem sair da categoria selecionada.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={`rounded-lg px-4 py-3 text-sm font-bold transition ${activeCategory === 'all' ? 'bg-emeraldpro text-white' : 'border border-[#e7c8c2] bg-white text-ink-soft hover:bg-surface-low'}`}
              onClick={() => setActiveCategory('all')}
            >
              Todas
            </button>
            <button
              type="button"
              className={`rounded-lg px-4 py-3 text-sm font-bold transition ${activeStatus === 'pending' ? 'border border-amber-300 bg-amber-100 text-amber-900' : 'border border-[#e7c8c2] bg-white text-ink-soft hover:bg-surface-low'}`}
              onClick={() => setActiveStatus('pending')}
            >
              Pendentes ({pendingCalls.length})
            </button>
            <button
              type="button"
              className={`rounded-lg px-4 py-3 text-sm font-bold transition ${activeStatus === 'history' ? 'border border-emeraldpro bg-emeraldpro text-white' : 'border border-[#e7c8c2] bg-white text-ink-soft hover:bg-surface-low'}`}
              onClick={() => setActiveStatus('history')}
            >
              Histórico ({historyCalls.length})
            </button>
          </div>
        </div>

        {activeCategory === 'analytics' ? (
          <div className="grid gap-4 md:grid-cols-3">
            {stats.categoryRows.map((category) => (
              <div key={category.id} className="admin-soft-panel p-5">
                <p className="text-sm font-bold text-ink">{category.label}</p>
                <p className="mt-2 text-3xl font-black text-ink">{category.total}</p>
                <p className="mt-1 text-xs text-ink-soft">{category.pending} pendentes, {category.resolved} atendidas</p>
              </div>
            ))}
          </div>
        ) : visibleCalls.length === 0 ? (
          <EmptyState>
            {activeStatus === 'pending' ? 'Nenhuma chamada pendente nessa seleção.' : 'Nenhum histórico nessa seleção.'}
          </EmptyState>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleCalls.map((call) => (
              <div key={call.id} className="admin-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mesa</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">{call.table_number}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${call.category.tone}`}>
                    {call.category.label}
                  </span>
                </div>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-800">{call.cleanReason}</p>
                  <p className="mt-2 text-xs text-slate-500">{getTimeAgo(call.created_at)}</p>
                </div>
                {activeStatus === 'pending' ? (
                  <button
                    type="button"
                    disabled={resolvingIds.has(call.id)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => resolveCall(call.id)}
                  >
                    <FiCheckCircle className="h-4 w-4" />
                    {resolvingIds.has(call.id) ? 'Atendendo...' : 'Marcar como atendido'}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default WaiterCalls;
