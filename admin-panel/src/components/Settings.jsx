import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { getSettings, updateSettings, uploadImage } from '../services/api';

const normalizeSettings = (data = {}) => {
  const normalized = { ...data };
  const openTime = data.open_time || data.opening_hours || '09:00';
  const closeTime = data.close_time || data.closing_hours || '22:00';

  normalized.open_time = openTime;
  normalized.close_time = closeTime;
  normalized.opening_hours = openTime;
  normalized.closing_hours = closeTime;

  return normalized;
};

const initialState = {
  restaurant_name: '',
  menu_theme: 'default',
  tables_count: 20,
  open_time: '09:00',
  close_time: '22:00',
  opening_hours: '09:00',
  closing_hours: '22:00',
  inactivity_timeout_minutes: 0,
  screen_lock_enabled: false,
  screen_lock_pin: '',
  currency_symbol: 'R$',
  default_prep_time: 20,
  cancellation_window: 5,
  restaurant_logo_url: '',
  primary_color: '#f59e0b',
  enable_ai_chat: true,
  enable_customer_ratings: true,
  enable_ads_module: true,
  default_language: 'pt',
};

const sectionClassName =
  'admin-card p-6';
const inputClassName =
  'admin-input';
const toggleCardClassName =
  'flex items-center justify-between rounded-lg border border-[#e7c8c2] bg-surface-low px-5 py-4 transition hover:bg-white';

const Settings = () => {
  const [settings, setSettings] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings((prev) => ({ ...prev, ...normalizeSettings(data) }));
      } catch (error) {
        toast.error('Falha ao carregar as configurações.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, []);

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

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadImage(file);
      setSettings((prev) => ({ ...prev, restaurant_logo_url: response.path }));
      toast.success('Logo atualizada com sucesso.');
    } catch (error) {
      toast.error('Falha no upload da logo. Verifique o tamanho e o tipo do arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await updateSettings({
        ...settings,
        opening_hours: settings.open_time,
        closing_hours: settings.close_time,
      });
      toast.success('Configurações salvas com sucesso.');
    } catch (error) {
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="admin-soft-panel p-6 text-ink-soft">Carregando configurações...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Configurações</p>
          <h1 className="admin-page-title mt-2">Ajustes centrais do restaurante</h1>
          <p className="admin-page-copy">
            Organize identidade, operação, marca e módulos em uma tela mais clara para o dia a dia do painel.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-32">
        <section className={sectionClassName}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="admin-kicker">Geral</p>
              <h2 className="admin-section-title mt-2">Base do restaurante</h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="restaurant_name" className="block text-sm font-medium text-slate-700">
                Nome do restaurante
              </label>
              <input
                id="restaurant_name"
                name="restaurant_name"
                value={settings.restaurant_name || ''}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Digite o nome do restaurante"
                autoComplete="organization"
              />
            </div>

            <div>
              <label htmlFor="tables_count" className="block text-sm font-medium text-slate-700">
                Quantidade de mesas
              </label>
              <input
                id="tables_count"
                name="tables_count"
                type="number"
                min="1"
                value={settings.tables_count || 20}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="inactivity_timeout_minutes" className="block text-sm font-medium text-slate-700">
                Timeout de inatividade (min)
              </label>
              <input
                id="inactivity_timeout_minutes"
                name="inactivity_timeout_minutes"
                type="number"
                min="0"
                value={settings.inactivity_timeout_minutes || 0}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="open_time" className="block text-sm font-medium text-slate-700">
                Abre as
              </label>
              <input
                id="open_time"
                name="open_time"
                type="time"
                value={settings.open_time || '09:00'}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="close_time" className="block text-sm font-medium text-slate-700">
                Fecha as
              </label>
              <input
                id="close_time"
                name="close_time"
                type="time"
                value={settings.close_time || '22:00'}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>
          </div>
        </section>

        <section className={sectionClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Operacao</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Parâmetros de serviço</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="currency_symbol" className="block text-sm font-medium text-slate-700">
                Simbolo da moeda
              </label>
              <input
                id="currency_symbol"
                name="currency_symbol"
                value={settings.currency_symbol || 'R$'}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="default_prep_time" className="block text-sm font-medium text-slate-700">
                Preparo padrao (min)
              </label>
              <input
                id="default_prep_time"
                name="default_prep_time"
                type="number"
                min="1"
                value={settings.default_prep_time || 20}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="cancellation_window" className="block text-sm font-medium text-slate-700">
                Cancelamento (min)
              </label>
              <input
                id="cancellation_window"
                name="cancellation_window"
                type="number"
                min="0"
                value={settings.cancellation_window || 5}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="default_language" className="block text-sm font-medium text-slate-700">
                Idioma padrao
              </label>
              <select
                id="default_language"
                name="default_language"
                value={settings.default_language || 'pt'}
                onChange={handleChange}
                className={inputClassName}
              >
                <option value="pt">Portugues</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </section>

        <section className={sectionClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Marca</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Logo, tema e cor principal</h2>

          <div className="mt-6 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <label className="block text-sm font-medium text-slate-700">Logo do restaurante</label>
              <div className="mt-4 flex flex-col items-start gap-4">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  {settings.restaurant_logo_url ? (
                    <img
                      src={settings.restaurant_logo_url}
                      alt="Logo Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Sem logo</span>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} ref={fileInputRef} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                >
                  {isUploading ? 'Enviando logo...' : 'Alterar logo'}
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="menu_theme" className="block text-sm font-medium text-slate-700">
                  Tema do cardápio
                </label>
                <select
                  id="menu_theme"
                  name="menu_theme"
                  value={settings.menu_theme || 'default'}
                  onChange={handleChange}
                  className={inputClassName}
                >
                  <option value="default">Padrao</option>
                  <option value="dark">Escuro</option>
                  <option value="brand">Marca</option>
                </select>
              </div>

              <div>
                <label htmlFor="primary_color_text" className="block text-sm font-medium text-slate-700">
                  Cor principal
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <input
                    type="color"
                    id="primary_color"
                    name="primary_color"
                    value={settings.primary_color || '#f59e0b'}
                    onChange={handleChange}
                    className="h-10 w-10 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                  />
                  <input
                    id="primary_color_text"
                    name="primary_color"
                    value={settings.primary_color || '#f59e0b'}
                    onChange={handleChange}
                    className="w-full bg-transparent text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={sectionClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Modulos</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Recursos ativos no painel</h2>

          <div className="mt-6 space-y-4">
            <label htmlFor="enable_ai_chat" className={toggleCardClassName}>
              <span className="font-medium text-slate-800">Ativar chat com IA</span>
              <input
                id="enable_ai_chat"
                type="checkbox"
                name="enable_ai_chat"
                checked={!!settings.enable_ai_chat}
                onChange={handleChange}
              />
            </label>

            <label htmlFor="enable_customer_ratings" className={toggleCardClassName}>
              <span className="font-medium text-slate-800">Ativar avaliações de pratos</span>
              <input
                id="enable_customer_ratings"
                type="checkbox"
                name="enable_customer_ratings"
                checked={!!settings.enable_customer_ratings}
                onChange={handleChange}
              />
            </label>

            <label htmlFor="enable_ads_module" className={toggleCardClassName}>
              <span className="font-medium text-slate-800">Ativar modulo de anúncios</span>
              <input
                id="enable_ads_module"
                type="checkbox"
                name="enable_ads_module"
                checked={!!settings.enable_ads_module}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <section className={sectionClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Seguranca</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Bloqueio da área administrativa</h2>

          <div className="mt-6 space-y-4">
            <label htmlFor="screen_lock_enabled" className={toggleCardClassName}>
              <span className="font-medium text-slate-800">Ativar bloqueio de tela</span>
              <input
                id="screen_lock_enabled"
                type="checkbox"
                name="screen_lock_enabled"
                checked={!!settings.screen_lock_enabled}
                onChange={handleChange}
              />
            </label>

            {!!settings.screen_lock_enabled ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <label htmlFor="screen_lock_pin" className="block text-sm font-medium text-slate-700">
                  PIN de desbloqueio
                </label>
                <input
                  id="screen_lock_pin"
                  name="screen_lock_pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4,6}"
                  value={settings.screen_lock_pin || ''}
                  onChange={handleChange}
                  className={`${inputClassName} max-w-xs`}
                  placeholder="Defina o PIN"
                  autoComplete="one-time-code"
                />
              </div>
            ) : null}
          </div>
        </section>

        <div className="sticky bottom-4 admin-card p-5 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Salve os ajustes para atualizar a operação do restaurante no painel.</p>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-2xl border px-6 py-3 text-sm font-semibold shadow-lg shadow-slate-300 transition disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600 disabled:opacity-100"
              style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#0f172a' }}
            >
              {isLoading ? 'Salvando...' : 'Salvar alteracoes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
