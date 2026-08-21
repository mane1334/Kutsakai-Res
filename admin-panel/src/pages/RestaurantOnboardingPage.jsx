import React, { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiClock, FiLayers, FiSliders } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSettings, updateSettings } from '../services/api';

const defaultSettings = {
  restaurant_name: '',
  tables_count: 20,
  open_time: '09:00',
  close_time: '22:00',
  opening_hours: '09:00',
  closing_hours: '22:00',
  currency_symbol: 'MT',
  default_prep_time: 20,
  cancellation_window: 5,
  menu_theme: 'default',
  default_language: 'pt',
  primary_color: '#f59e0b',
  enable_ai_chat: true,
  enable_customer_ratings: true,
  enable_ads_module: true,
  screen_lock_enabled: false,
  screen_lock_pin: '',
  onboarding_completed: false,
};

const steps = [
  { id: 'basics', title: 'Identidade', description: 'Nome, mesas e horários', icon: FiClock },
  { id: 'brand', title: 'Marca', description: 'Moeda, idioma e visual', icon: FiSliders },
  { id: 'modules', title: 'Recursos', description: 'Módulos e segurança', icon: FiLayers },
];

const normalizeSettings = (data = {}) => {
  const normalized = { ...defaultSettings, ...data };
  normalized.open_time = data.open_time || data.opening_hours || normalized.open_time;
  normalized.close_time = data.close_time || data.closing_hours || normalized.close_time;
  normalized.opening_hours = normalized.open_time;
  normalized.closing_hours = normalized.close_time;
  normalized.onboarding_completed = data.onboarding_completed === true || data.onboarding_completed === 'true';
  return normalized;
};

const getChecklistItems = (settings) => [
  {
    id: 'restaurant_name',
    label: 'Nome do restaurante definido',
    done: Boolean(String(settings.restaurant_name || '').trim()),
  },
  {
    id: 'tables_count',
    label: 'Quantidade de mesas maior que zero',
    done: Number(settings.tables_count) > 0,
  },
  {
    id: 'hours',
    label: 'Horários de abertura e fechamento preenchidos',
    done: Boolean(settings.open_time) && Boolean(settings.close_time),
  },
  {
    id: 'currency_symbol',
    label: 'Símbolo da moeda configurado',
    done: Boolean(String(settings.currency_symbol || '').trim()),
  },
  {
    id: 'default_language',
    label: 'Idioma padrão definido',
    done: Boolean(String(settings.default_language || '').trim()),
  },
  {
    id: 'default_prep_time',
    label: 'Tempo padrão de preparo configurado',
    done: Number(settings.default_prep_time) > 0,
  },
  {
    id: 'cancellation_window',
    label: 'Janela de cancelamento válida',
    done: Number(settings.cancellation_window) >= 0,
  },
  {
    id: 'screen_lock_pin',
    label: 'PIN preenchido quando bloqueio está ativo',
    done: !settings.screen_lock_enabled || Boolean(String(settings.screen_lock_pin || '').trim()),
  },
];

export default function RestaurantOnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [settings, setSettings] = useState(defaultSettings);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosaveState, setAutosaveState] = useState('idle');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentSettings = async () => {
      try {
        const data = await getSettings();
        const normalized = normalizeSettings(data);
        setSettings(normalized);
        if (normalized.onboarding_completed) {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        toast.error('Falha ao carregar o onboarding inicial.');
      } finally {
        setFetching(false);
      }
    };

    fetchCurrentSettings();
  }, [navigate]);

  useEffect(() => {
    if (fetching || settings.onboarding_completed) return undefined;

    const timeoutId = window.setTimeout(async () => {
      try {
        setAutosaveState('saving');
        await updateSettings({
          ...settings,
          opening_hours: settings.open_time,
          closing_hours: settings.close_time,
          onboarding_completed: false,
        });
        setAutosaveState('saved');
      } catch (error) {
        setAutosaveState('error');
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [fetching, settings]);

  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);
  const checklistItems = useMemo(() => getChecklistItems(settings), [settings]);
  const allChecklistDone = checklistItems.every((item) => item.done);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setSettings((prev) => {
      const next = { ...prev, [name]: nextValue };
      if (name === 'open_time') next.opening_hours = nextValue;
      if (name === 'close_time') next.closing_hours = nextValue;
      return next;
    });
  };

  const finishOnboarding = async () => {
    setSaving(true);
    try {
      await updateSettings({
        ...settings,
        opening_hours: settings.open_time,
        closing_hours: settings.close_time,
        onboarding_completed: true,
      });
      toast.success('Onboarding concluído com sucesso.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Não foi possível concluir o onboarding.');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return <div className="p-10 text-center">Preparando onboarding do restaurante...</div>;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#fffaf1_0%,_#f8fafc_45%,_#eef2ff_100%)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Onboarding Inicial</p>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold">Vamos deixar o restaurante pronto para operar.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
                Em poucos passos você define a base operacional, visual e os módulos principais do painel.
              </p>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
              Etapa {stepIndex + 1} de {steps.length}
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            {autosaveState === 'saving' ? 'Salvando progresso...' : null}
            {autosaveState === 'saved' ? 'Progresso salvo automaticamente.' : null}
            {autosaveState === 'error' ? 'Não foi possível salvar automaticamente agora.' : null}
          </div>

          <div className="mt-8 h-3 rounded-full bg-amber-100">
            <div className="h-3 rounded-full bg-amber-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const active = index === stepIndex;
              const completed = index < stepIndex;
              return (
                <div
                  key={step.id}
                  className={`rounded-3xl border p-5 ${
                    active ? 'border-amber-300 bg-white shadow-sm' : 'border-slate-200 bg-white/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${active ? 'text-amber-600' : 'text-slate-400'}`} />
                    {completed ? <FiCheckCircle className="h-5 w-5 text-emerald-600" /> : null}
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-slate-900">{step.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Checklist de conclusão</h3>
                <p className="mt-1 text-sm text-slate-600">O botão final só libera quando os itens essenciais estiverem completos.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                {checklistItems.filter((item) => item.done).length}/{checklistItems.length}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                    item.done ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <FiCheckCircle className={`h-4 w-4 ${item.done ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-[0_22px_55px_rgba(148,163,184,0.22)]">
          {stepIndex === 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nome do restaurante</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" name="restaurant_name" value={settings.restaurant_name || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Quantidade de mesas</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="1" name="tables_count" value={settings.tables_count || 20} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Abre às</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" type="time" name="open_time" value={settings.open_time || '09:00'} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Fecha às</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" type="time" name="close_time" value={settings.close_time || '22:00'} onChange={handleChange} />
              </div>
            </div>
          ) : null}

          {stepIndex === 1 ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Símbolo da moeda</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" name="currency_symbol" value={settings.currency_symbol || 'MT'} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Idioma padrão</label>
                <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" name="default_language" value={settings.default_language || 'pt'} onChange={handleChange}>
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Tema do cardápio</label>
                <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" name="menu_theme" value={settings.menu_theme || 'default'} onChange={handleChange}>
                  <option value="default">Padrão</option>
                  <option value="dark">Escuro</option>
                  <option value="brand">Marca</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Cor principal</label>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input type="color" name="primary_color" value={settings.primary_color || '#f59e0b'} onChange={handleChange} />
                  <input className="w-full outline-none" name="primary_color" value={settings.primary_color || '#f59e0b'} onChange={handleChange} />
                </div>
              </div>
            </div>
          ) : null}

          {stepIndex === 2 ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Preparo padrão (min)</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="1" name="default_prep_time" value={settings.default_prep_time || 20} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Janela de cancelamento (min)</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="0" name="cancellation_window" value={settings.cancellation_window || 5} onChange={handleChange} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-sm font-medium text-slate-700">Chat com IA</span>
                  <input type="checkbox" name="enable_ai_chat" checked={!!settings.enable_ai_chat} onChange={handleChange} />
                </label>
                <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-sm font-medium text-slate-700">Avaliações</span>
                  <input type="checkbox" name="enable_customer_ratings" checked={!!settings.enable_customer_ratings} onChange={handleChange} />
                </label>
                <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-sm font-medium text-slate-700">Anúncios</span>
                  <input type="checkbox" name="enable_ads_module" checked={!!settings.enable_ads_module} onChange={handleChange} />
                </label>
              </div>

              <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-sm font-medium text-slate-700">Ativar bloqueio de tela</span>
                <input type="checkbox" name="screen_lock_enabled" checked={!!settings.screen_lock_enabled} onChange={handleChange} />
              </label>

              {settings.screen_lock_enabled ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700">PIN de desbloqueio</label>
                  <input className="mt-2 w-full max-w-xs rounded-2xl border border-slate-200 px-4 py-3" name="screen_lock_pin" value={settings.screen_lock_pin || ''} onChange={handleChange} />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            {stepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400"
              >
                Próxima etapa
                <FiArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={saving || !allChecklistDone}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Finalizando...' : 'Concluir onboarding'}
                <FiCheckCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {!allChecklistDone ? (
            <p className="mt-4 text-sm text-amber-700">
              Complete os itens do checklist para liberar a conclusão do onboarding.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
