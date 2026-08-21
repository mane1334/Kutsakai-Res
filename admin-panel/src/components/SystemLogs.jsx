import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { subscribeToEvent } from '../services/socket';

const HealthCheck = () => {
  const [healthReport, setHealthReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchHealth = () => {
    apiClient
      .get('/health')
      .then((response) => {
        setHealthReport(response.data);
        setError(null);
      })
      .catch((err) => {
        const report = err.response?.data;
        if (report && report.services) {
          setHealthReport(report);
        } else {
          setError('A API principal está inacessível.');
          setHealthReport(null);
        }
      });
  };

  useEffect(() => {
    fetchHealth();
    const intervalId = setInterval(fetchHealth, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const overallStatusText = healthReport?.status === 'healthy' ? 'Todos os sistemas operacionais' : 'Um ou mais sistemas com problemas';
  const overallStatusColor = healthReport?.status === 'healthy' ? 'text-emerald-700' : 'text-orange-600';

  return (
    <section className="admin-card p-6">
      <h2 className="admin-section-title">Diagnóstico de serviços</h2>
      {healthReport ? <p className={`mt-2 text-sm font-semibold ${overallStatusColor}`}>{overallStatusText}</p> : null}
      {error ? <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</div> : null}
      {!error && !healthReport ? <div className="mt-6 text-sm text-ink-soft">Verificando saúde dos sistemas...</div> : null}
      {healthReport ? (
        <div className="mt-6 space-y-3">
          {healthReport.services.map((service) => (
            <div key={service.name} className="flex items-center justify-between rounded-lg border border-[#e7c8c2] bg-surface-low px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`inline-block h-3 w-3 rounded-full ${service.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="font-medium text-slate-800">{service.name}</span>
              </div>
              <div className="text-right">
                <span className={`font-semibold ${service.status === 'ok' ? 'text-emerald-700' : 'text-rose-700'}`}>{service.status === 'ok' ? 'Operacional' : 'Erro'}</span>
                {service.details ? <p className="text-xs text-slate-500" title={service.details}>{service.details}</p> : null}
              </div>
            </div>
          ))}
          <p className="text-right text-xs text-slate-400">Ultima verificacao: {new Date(healthReport.timestamp).toLocaleTimeString()}</p>
        </div>
      ) : null}
    </section>
  );
};

function SystemLogs() {
  const [stdout, setStdout] = useState('Aguardando logs do servidor...');
  const [stderr, setStderr] = useState('Aguardando logs do servidor...');

  useEffect(() => {
    const unsubscribe = subscribeToEvent('LOG_DATA', (payload) => {
      const { source, content } = payload;
      if (source === 'stdout') {
        setStdout(content || ' ');
      } else if (source === 'stderr') {
        setStderr(content || ' ');
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <div>
          <p className="admin-kicker">Sistema</p>
          <h1 className="admin-page-title mt-2">Saúde dos serviços e logs em tempo real</h1>
          <p className="admin-page-copy">Diagnóstico rápido do ambiente com leitura de serviços, saída padrão e erros do sistema.</p>
        </div>
      </section>

      <HealthCheck />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="admin-card p-6">
          <h2 className="admin-section-title">Saída padrão</h2>
          <pre className="mt-4 h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-white">
            <code>{stdout}</code>
          </pre>
        </section>

        <section className="admin-card p-6">
          <h2 className="admin-section-title text-rose-700">Erros</h2>
          <pre className="mt-4 h-96 overflow-auto rounded-lg bg-rose-50 p-4 text-sm text-rose-800">
            <code>{stderr}</code>
          </pre>
        </section>
      </div>
    </div>
  );
}

export default SystemLogs;
