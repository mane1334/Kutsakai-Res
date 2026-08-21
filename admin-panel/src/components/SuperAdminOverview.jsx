import React, { useEffect, useMemo, useState } from 'react';
import {
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMail,
  FiMapPin,
  FiPieChart,
  FiPower,
  FiSearch,
  FiShoppingBag,
  FiStar,
  FiTrendingDown,
  FiTrendingUp,
  FiXCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  getSuperadminOverview,
  getSuperadminRestaurantDetail,
  updateSuperadminRestaurantStatus,
} from '../services/api';
import { formatMeticalDisplay } from '../utils/currency';

const periodOptions = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '365d', label: '12 meses' },
  { value: 'all', label: 'Histórico' },
];

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => formatMeticalDisplay(toNumber(value));

const sectionCardClassName =
  'rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]';
const softPanelClassName = 'rounded-2xl border border-slate-200 bg-slate-50/80 p-4';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const GrowthPill = ({ value }) => {
  const positive = value >= 0;
  const Icon = positive ? FiTrendingUp : FiTrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(toNumber(value)).toFixed(1)}%
    </span>
  );
};

const SummaryCard = ({ title, value, subtitle, icon: Icon, accent }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className={`rounded-2xl p-3 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const StarDisplay = ({ rating, size = 'sm' }) => {
  const full = Math.floor(toNumber(rating));
  const sizeClass = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={`${sizeClass} ${star <= full ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
};

export default function SuperAdminOverview() {
  const [filters, setFilters] = useState({ search: '', status: 'all', period: '30d' });
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await getSuperadminOverview({
        search: filters.search || undefined,
        status: filters.status,
        period: filters.period,
        compare_ids: compareIds.join(',') || undefined,
      });
      setData(response);

      const firstRestaurantId = response.restaurants?.[0]?.id ?? null;
      if (!selectedRestaurantId && firstRestaurantId) {
        setSelectedRestaurantId(firstRestaurantId);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Falha ao carregar a visão do superadmin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [filters.search, filters.status, filters.period, compareIds.join(',')]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedRestaurantId) {
        setDetail(null);
        return;
      }

      try {
        setDetailLoading(true);
        const response = await getSuperadminRestaurantDetail(selectedRestaurantId, {
          period: filters.period,
        });
        setDetail(response.restaurant);
      } catch (error) {
        toast.error(error?.response?.data?.error || 'Falha ao carregar detalhes do restaurante.');
      } finally {
        setDetailLoading(false);
      }
    };

    loadDetail();
  }, [selectedRestaurantId, filters.period]);

  const restaurants = data?.restaurants || [];
  const summary = data?.summary || {};
  const comparisons = data?.comparisons || [];
  const topDishesNetwork = data?.top_dishes_network || [];
  const networkRatings = data?.network_ratings || {};
  const categoryInsights = data?.category_insights || [];
  const cancellationByRestaurant = data?.cancellation_by_restaurant || [];

  const topRestaurants = useMemo(
    () => [...restaurants].sort((a, b) => toNumber(b.metrics?.total_sales) - toNumber(a.metrics?.total_sales)).slice(0, 5),
    [restaurants]
  );

  const handleCompareToggle = (restaurantId) => {
    setCompareIds((prev) => {
      if (prev.includes(restaurantId)) {
        return prev.filter((id) => id !== restaurantId);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), restaurantId];
      }
      return [...prev, restaurantId];
    });
  };

  const handleStatusToggle = async (restaurant) => {
    try {
      setStatusUpdatingId(restaurant.id);
      await updateSuperadminRestaurantStatus(restaurant.id, !restaurant.is_active);
      toast.success(restaurant.is_active ? 'Restaurante desativado.' : 'Restaurante ativado.');
      await fetchOverview();
      if (selectedRestaurantId === restaurant.id) {
        const response = await getSuperadminRestaurantDetail(restaurant.id, { period: filters.period });
        setDetail(response.restaurant);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Falha ao alterar status do restaurante.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
          <p className="text-sm text-slate-500">Montando o cockpit de rede...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* === HEADER === */}
      <div className="admin-card p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="admin-kicker">Superadmin</p>
            <h1 className="admin-page-title mt-2">Gestão real da rede de restaurantes</h1>
            <p className="admin-page-copy">
              Pratos campeões, avaliações, categorias lucrativas e operação de cada unidade numa só tela.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-lg border border-[#e7c8c2] bg-white px-4 py-3">
              <FiSearch className="h-4 w-4 text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Buscar restaurante"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded-lg border border-[#e7c8c2] bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} className="text-slate-900">
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.period}
              onChange={(event) => setFilters((prev) => ({ ...prev, period: event.target.value }))}
              className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value} className="text-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* === KPIs === */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Restaurantes Filtrados"
          value={summary.total_restaurants || 0}
          subtitle={`${summary.active_restaurants || 0} ativos - ${summary.inactive_restaurants || 0} inativos`}
          icon={FiShoppingBag}
          accent="bg-blue-50 text-blue-700"
        />
        <SummaryCard
          title="Vendas do Período"
          value={formatCurrency(summary.total_sales)}
          subtitle={`${summary.total_orders || 0} pedidos válidos`}
          icon={FiDollarSign}
          accent="bg-emerald-50 text-emerald-700"
        />
        <SummaryCard
          title="Crescimento"
          value={`${toNumber(summary.sales_growth).toFixed(1)}%`}
          subtitle="comparado ao período anterior equivalente"
          icon={FiTrendingUp}
          accent="bg-amber-50 text-amber-700"
        />
        <SummaryCard
          title="Avaliação Média"
          value={toNumber(networkRatings.average_rating).toFixed(1)}
          subtitle={`${networkRatings.total_ratings || 0} avaliações na rede`}
          icon={FiStar}
          accent="bg-amber-50 text-amber-700"
        />
      </div>

      {/* === TOP PRATOS DA REDE + AVALIAÇÕES === */}
      <div className="mb-8 grid gap-6 xl:grid-cols-2">
        <section className={sectionCardClassName}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-2.5">
              <FiAward className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Melhores pratos da rede</h2>
              <p className="mt-0.5 text-sm text-slate-500">Top 10 pratos por quantidade vendida em toda a rede</p>
            </div>
          </div>

          {topDishesNetwork.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Ainda não há vendas suficientes para montar o ranking.
            </div>
          ) : (
            <div className="space-y-3">
              {topDishesNetwork.map((dish, index) => (
                <div key={dish.name} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${index < 3 ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-600'}`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{dish.name}</p>
                    <p className="text-xs text-slate-500">
                      {dish.restaurant_count} {dish.restaurant_count === 1 ? 'restaurante' : 'restaurantes'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{dish.quantity} un.</p>
                    <p className="text-xs text-emerald-700">{formatCurrency(dish.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={sectionCardClassName}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-50 p-2.5">
              <FiStar className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Qualidade da rede</h2>
              <p className="mt-0.5 text-sm text-slate-500">Avaliações globais e pratos melhor / pior avaliados</p>
            </div>
          </div>

          {networkRatings.total_ratings === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Ainda não há avaliações na rede.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-6 rounded-2xl bg-amber-50 px-5 py-4">
                <div>
                  <p className="text-4xl font-bold text-amber-900">{toNumber(networkRatings.average_rating).toFixed(1)}</p>
                  <StarDisplay rating={networkRatings.average_rating} size="lg" />
                </div>
                <div className="flex-1 space-y-1.5">
                  {(networkRatings.distribution || []).map((d) => (
                    <div key={d.rating} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-right font-medium text-slate-600">{d.rating}</span>
                      <div className="h-2 flex-1 rounded-full bg-amber-100">
                        <div
                          className="h-2 rounded-full bg-amber-500 transition-all"
                          style={{ width: `${networkRatings.total_ratings > 0 ? (d.count / networkRatings.total_ratings) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-6 text-slate-500">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <FiTrendingUp className="h-4 w-4" /> Mais bem avaliados
                  </p>
                  <div className="space-y-2">
                    {(networkRatings.top_rated || []).slice(0, 5).map((dish) => (
                      <div key={dish.name} className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                        <span className="text-sm font-medium text-slate-800 truncate max-w-[60%]">{dish.name}</span>
                        <div className="flex items-center gap-1">
                          <FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold text-slate-700">{toNumber(dish.avg_rating).toFixed(1)}</span>
                          <span className="text-xs text-slate-400">({dish.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-700">
                    <FiTrendingDown className="h-4 w-4" /> Precisam de atenção
                  </p>
                  <div className="space-y-2">
                    {(networkRatings.worst_rated || []).slice(0, 5).map((dish) => (
                      <div key={dish.name} className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
                        <span className="text-sm font-medium text-slate-800 truncate max-w-[60%]">{dish.name}</span>
                        <div className="flex items-center gap-1">
                          <FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold text-slate-700">{toNumber(dish.avg_rating).toFixed(1)}</span>
                          <span className="text-xs text-slate-400">({dish.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* === CATEGORIAS + CANCELAMENTOS === */}
      <div className="mb-8 grid gap-6 xl:grid-cols-2">
        <section className={sectionCardClassName}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-2.5">
              <FiPieChart className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Categorias mais lucrativas</h2>
              <p className="mt-0.5 text-sm text-slate-500">Receita por tipo de prato em toda a rede</p>
            </div>
          </div>

          {categoryInsights.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Sem dados de categorias no período.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryInsights.map((cat, index) => {
                const maxRevenue = categoryInsights[0]?.revenue || 1;
                const percentage = (cat.revenue / maxRevenue) * 100;
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500'];
                return (
                  <div key={cat.name} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">{cat.name}</span>
                      <div className="text-right">
                        <span className="font-semibold text-slate-900">{formatCurrency(cat.revenue)}</span>
                        <span className="ml-2 text-xs text-slate-500">{cat.quantity} un.</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full transition-all ${colors[index % colors.length]}`}
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className={sectionCardClassName}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-rose-50 p-2.5">
              <FiXCircle className="h-5 w-5 text-rose-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Taxa de cancelamento</h2>
              <p className="mt-0.5 text-sm text-slate-500">Cancelamentos e perda de receita por restaurante</p>
            </div>
          </div>

          {cancellationByRestaurant.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Sem dados de cancelamentos.
            </div>
          ) : (
            <div className="space-y-3">
              {cancellationByRestaurant.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.cancellation_rate > 15 ? 'bg-rose-50 text-rose-700' : item.cancellation_rate > 5 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {toNumber(item.cancellation_rate).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{item.cancelled_orders} cancelados de {item.total_orders}</span>
                    {item.lost_revenue > 0 ? (
                      <span className="text-rose-600">Perda: {formatCurrency(item.lost_revenue)}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* === GESTÃO DE RESTAURANTES + COMPARAÇÃO === */}
      <div className="mb-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={sectionCardClassName}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Gestão de restaurantes</h2>
              <p className="mt-1 text-sm text-slate-500">Liste, pesquise, compare e altere o status operacional de cada unidade.</p>
            </div>
          </div>

          <div className="space-y-4">
            {restaurants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Nenhum restaurante encontrado com os filtros atuais.
              </div>
            ) : (
              restaurants.map((restaurant) => {
                const selected = selectedRestaurantId === restaurant.id;
                return (
                  <div key={restaurant.id} className={`rounded-3xl border p-4 transition ${selected ? 'border-amber-300 bg-amber-50/60 shadow-sm' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-950">{restaurant.name}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${restaurant.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {restaurant.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                          {restaurant.cuisine_type ? (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              {restaurant.cuisine_type}
                            </span>
                          ) : null}
                          <GrowthPill value={restaurant.metrics?.sales_growth} />
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {restaurant.owner_name || 'Responsável não informado'} - {restaurant.phone_number || 'Sem número'}
                          {restaurant.email ? (
                            <span className="inline-flex items-center gap-1 ml-2">
                              <FiMail className="h-3 w-3" /> {restaurant.email}
                            </span>
                          ) : null}
                        </p>
                        {restaurant.address ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            <FiMapPin className="h-3 w-3" /> {restaurant.address}
                          </p>
                        ) : null}
                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Vendas</p>
                            <p className="mt-2 font-semibold text-slate-900">{formatCurrency(restaurant.metrics?.total_sales)}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Pedidos</p>
                            <p className="mt-2 font-semibold text-slate-900">{restaurant.metrics?.total_orders || 0}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Ticket</p>
                            <p className="mt-2 font-semibold text-slate-900">{formatCurrency(restaurant.metrics?.average_ticket)}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Último pedido</p>
                            <p className="mt-2 font-semibold text-slate-900">{formatDate(restaurant.metrics?.last_order_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedRestaurantId(restaurant.id)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Ver detalhe
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompareToggle(restaurant.id)}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition ${compareIds.includes(restaurant.id) ? 'border border-amber-500 bg-amber-500 text-slate-950' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          {compareIds.includes(restaurant.id) ? 'Na comparação' : 'Comparar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(restaurant)}
                          disabled={statusUpdatingId === restaurant.id}
                          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-60 ${restaurant.is_active ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                        >
                          <FiPower className="h-4 w-4" />
                          {statusUpdatingId === restaurant.id ? 'Atualizando...' : restaurant.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className={sectionCardClassName}>
          <h2 className="text-lg font-semibold text-slate-900">Comparação entre restaurantes</h2>
          <p className="mt-1 text-sm text-slate-500">Selecione até 4 unidades da lista para comparar lado a lado.</p>

          <div className="mt-5 space-y-4">
            {comparisons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Escolha restaurantes na lista para montar a comparação.
              </div>
            ) : (
              comparisons.map((restaurant) => (
                <div key={restaurant.id} className={softPanelClassName}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{restaurant.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{restaurant.is_active ? 'Operando normalmente' : 'Restaurante inativo'}</p>
                    </div>
                    <GrowthPill value={restaurant.sales_growth} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                      <p className="text-slate-500">Vendas</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(restaurant.total_sales)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                      <p className="text-slate-500">Pedidos</p>
                      <p className="mt-1 font-semibold text-slate-900">{restaurant.total_orders}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                      <p className="text-slate-500">Ticket</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(restaurant.average_ticket)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* === DETALHE + RANKING === */}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className={sectionCardClassName}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Detalhe do restaurante</h2>
              <p className="mt-1 text-sm text-slate-500">Entre no detalhe operacional e comercial da unidade selecionada.</p>
            </div>
            {detail?.is_active ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Ativo</span>
            ) : (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Inativo</span>
            )}
          </div>

          {detailLoading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-16 text-center text-sm text-slate-500">
              Carregando detalhe da unidade...
            </div>
          ) : !detail ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-16 text-center text-sm text-slate-500">
              Selecione um restaurante para abrir o detalhe.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className={softPanelClassName}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Vendas</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(detail.metrics?.total_sales)}</p>
                </div>
                <div className={softPanelClassName}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pedidos</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{detail.metrics?.total_orders || 0}</p>
                </div>
                <div className={softPanelClassName}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ticket Médio</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(detail.metrics?.average_ticket)}</p>
                </div>
                <div className={softPanelClassName}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Crescimento</p>
                  <div className="mt-2">
                    <GrowthPill value={detail.metrics?.sales_growth} />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <FiClock className="h-4 w-4" />
                    Dias mais lucrativos
                  </h3>
                  <div className="mt-4 space-y-3">
                    {(detail.metrics?.best_days || []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        Ainda não há dias lucrativos neste período.
                      </div>
                    ) : (
                      detail.metrics.best_days.map((day) => (
                        <div key={`${detail.id}-${day.day}`} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{formatDate(day.day)}</p>
                            <p className="text-sm text-slate-500">{day.orders} pedidos</p>
                          </div>
                          <p className="font-semibold text-amber-900">{formatCurrency(day.revenue)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <FiCheckCircle className="h-4 w-4" />
                    Pedidos campeões
                  </h3>
                  <div className="mt-4 space-y-3">
                    {(detail.metrics?.best_selling_items || []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        Ainda não há itens líderes neste período.
                      </div>
                    ) : (
                      detail.metrics.best_selling_items.map((item) => (
                        <div key={`${detail.id}-${item.name}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-500">{item.quantity} unidades</p>
                          </div>
                          <p className="font-semibold text-slate-900">{formatCurrency(item.revenue)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className={sectionCardClassName}>
          <h2 className="text-lg font-semibold text-slate-900">Ranking e melhores dias</h2>
          <p className="mt-1 text-sm text-slate-500">Leitura rápida dos destaques da rede no período filtrado.</p>

          <div className="mt-5 space-y-4">
            {topRestaurants.map((restaurant, index) => (
              <div key={restaurant.id} className={softPanelClassName}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">{restaurant.name}</p>
                      <p className="text-sm text-slate-500">{restaurant.metrics?.total_orders || 0} pedidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(restaurant.metrics?.total_sales)}</p>
                    <GrowthPill value={restaurant.metrics?.sales_growth} />
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-3xl bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-emerald-800">
                <FiCalendar className="h-4 w-4" />
                <h3 className="font-semibold">Melhores dias da rede</h3>
              </div>
              <div className="mt-4 space-y-3">
                {(summary.most_profitable_days || []).length === 0 ? (
                  <p className="text-sm text-emerald-700">Ainda não há dias lucrativos consolidados.</p>
                ) : (
                  summary.most_profitable_days.map((day) => (
                    <div key={`${day.restaurant_id}-${day.day}`} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{day.restaurant_name}</p>
                        <p className="text-sm text-slate-500">{formatDate(day.day)}</p>
                      </div>
                      <p className="font-semibold text-emerald-900">{formatCurrency(day.revenue)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
