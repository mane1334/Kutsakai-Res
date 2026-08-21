import React, { useEffect, useState } from 'react';
import { FiRefreshCw, FiZap } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getAiInsights } from '../services/api';
import { formatMeticalDisplay } from '../utils/currency';

const formatCurrency = (value) => formatMeticalDisplay(Number(value) || 0);

function AiInsights() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Analisando restaurante...');

  useEffect(() => {
    let interval;
    if (loading || refreshing) {
      const statuses = [
        'Acessando banco de dados...',
        'Calculando faturamento...',
        'Analisando pratos mais vendidos...',
        'Verificando avaliações dos clientes...',
        'Identificando gargalos de tempo...',
        'Gerando recomendações estratégicas...'
      ];
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % statuses.length;
        setLoadingStatus(statuses[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading, refreshing]);

  const loadInsights = async ({ silent = false } = {}) => {
    try {
      if (silent || data) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAiInsights();
      setData(response);
    } catch (error) {
      const message = error?.response?.data?.error || error.message || 'Erro ao carregar insights da IA.';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-900">
          <FiZap className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Insights da IA</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10">
          <div className="flex items-center gap-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
            <span className="text-sm font-medium text-slate-600 animate-pulse">{loadingStatus}</span>
          </div>
          <div className="mt-8 w-full space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const items = Array.isArray(data?.items) ? data.items : [];
  const summary = data?.context_summary || {};

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <FiZap className="h-5 w-5 text-amber-500" />
            Insights da IA
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Recomendações acionáveis com base em vendas, avaliações e operação dos últimos 30 dias.
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-3">
            {refreshing && (
              <span className="text-xs font-medium italic text-amber-600 animate-pulse">
                {loadingStatus}
              </span>
            )}
            <button
              type="button"
              onClick={() => loadInsights({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-50"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        )}
      </div>

      {data && (
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pedidos</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{Number(summary.total_orders) || 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Faturamento</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.total_revenue)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tempo médio</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {summary.avg_service_time ? `${Math.round(Number(summary.avg_service_time) / 60)} min` : 'Sem base'}
            </p>
          </div>
        </div>
      )}

      {!data ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <FiZap className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Clique no botão abaixo para gerar insights estratégicos com IA.
          </p>
          <button
            type="button"
            onClick={() => loadInsights()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 active:scale-95"
          >
            <FiZap className="h-4 w-4" />
            Gerar Insights Agora
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          A IA ainda não conseguiu gerar recomendações para este restaurante com os dados atuais.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${index}-${item}`} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm leading-6 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AiInsights;
