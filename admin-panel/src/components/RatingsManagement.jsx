import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getRatings, getRatingsSummary } from '../services/api';
import { subscribeToEvent } from '../services/socket';

const Star = ({ filled }) => (
  <svg className="h-5 w-5" fill={filled ? '#fbbf24' : '#e5e7eb'} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const StaticStarRating = ({ rating }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, index) => (
      <Star key={index} filled={index < rating} />
    ))}
  </div>
);

const PIE_COLORS = ['#10b981', '#84cc16', '#facc15', '#fb923c', '#f87171'];

const RatingsManagement = () => {
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState({ averageRatingsPerDish: [], ratingDistribution: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratingsData, summaryData] = await Promise.all([getRatings(), getRatingsSummary()]);
        setRatings(ratingsData);
        setSummary(summaryData);
      } catch {
        toast.error('Falha ao carregar dados das avaliações.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const unsubNewRating = subscribeToEvent('NEW_RATING', () => {
      fetchData();
      toast.info('Nova avaliação recebida.');
    });

    return () => unsubNewRating();
  }, []);

  const formattedDistribution = summary.ratingDistribution
    .map((item) => ({ name: `${item.rating} estrelas`, value: Number(item.count) }))
    .sort((a, b) => b.name.localeCompare(a.name));

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s atras`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min atras`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atras`;
    return `${Math.floor(diff / 86400)} dias atras`;
  };

  if (isLoading) {
    return <div className="admin-soft-panel border-dashed p-8 text-center text-ink-soft">Carregando avaliações...</div>;
  }

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <div>
          <p className="admin-kicker">Avaliações</p>
          <h1 className="admin-page-title mt-2">Percepção dos clientes sobre pratos e atendimento</h1>
          <p className="admin-page-copy">Acompanhe médias, distribuição de notas e comentários em um painel visual mais claro.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="admin-card p-6 lg:col-span-3">
          <h2 className="admin-section-title">Média de avaliação por prato</h2>
          {summary.averageRatingsPerDish.length === 0 ? (
            <div className="admin-soft-panel mt-6 flex h-[320px] items-center justify-center border-dashed text-sm text-ink-soft">
              Ainda não há média suficiente para montar o gráfico.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={summary.averageRatingsPerDish} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dish_name" interval={0} angle={-35} textAnchor="end" height={90} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average_rating" name="Média" fill="#6d2430" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="admin-card p-6 lg:col-span-2">
          <h2 className="admin-section-title">Distribuição das notas</h2>
          {formattedDistribution.length === 0 ? (
            <div className="admin-soft-panel mt-6 flex h-[320px] items-center justify-center border-dashed text-sm text-ink-soft">
              Ainda não há distribuição de notas para exibir.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <PieChart>
                <Pie activeIndex={activeIndex} data={formattedDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={105} dataKey="value" nameKey="name" onMouseEnter={onPieEnter}>
                  {formattedDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <section className="admin-card p-6">
        <h2 className="admin-section-title">Todas as avaliações</h2>
        {ratings.length === 0 ? (
          <div className="admin-soft-panel mt-6 border-dashed px-4 py-12 text-center text-sm text-ink-soft">
            Nenhuma avaliação foi recebida ainda.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="rounded-lg border border-[#e7c8c2] bg-surface-low p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                      {(rating.dish_name || 'R').charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{rating.dish_name || 'Restaurante'}</p>
                      <div className="mt-2">
                        <StaticStarRating rating={rating.rating} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{rating.rating}/5 estrelas</p>
                    </div>
                  </div>

                  <div className="text-sm text-slate-500">
                    <div>{new Date(rating.created_at).toLocaleDateString('pt-MZ')}</div>
                    <div className="mt-1 font-semibold text-amber-700">{getTimeAgo(rating.created_at)}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm italic text-slate-600">
                  "{rating.comment || 'Nenhum comentario fornecido.'}"
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RatingsManagement;
