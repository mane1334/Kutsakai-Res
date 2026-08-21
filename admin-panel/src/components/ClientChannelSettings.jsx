import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getSettings, updateSettings } from '../services/api';

const defaults = {
  tables_count: 20,
  open_time: '09:00',
  close_time: '22:00',
  inactivity_timeout_minutes: 0,
  default_language: 'pt',
};

const normalize = (data = {}) => ({
  ...defaults,
  ...data,
  open_time: data.open_time || data.opening_hours || defaults.open_time,
  close_time: data.close_time || data.closing_hours || defaults.close_time,
});

export default function ClientChannelSettings() {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSettings();
        setSettings(normalize(data));
      } catch (error) {
        toast.error('Falha ao carregar configurações dos clientes.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateSettings({
        tables_count: settings.tables_count,
        open_time: settings.open_time,
        close_time: settings.close_time,
        opening_hours: settings.open_time,
        closing_hours: settings.close_time,
        inactivity_timeout_minutes: settings.inactivity_timeout_minutes,
        default_language: settings.default_language,
      });
      toast.success('Configurações dos clientes atualizadas.');
    } catch (error) {
      toast.error('Nao foi possivel salvar as configurações dos clientes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando configurações dos clientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Clientes Web e App</h1>
        <p className="text-gray-600 mt-1">Controles usados diretamente pelo client web e pelo client app.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="tables_count" className="block text-sm font-medium text-gray-700">Numero de Mesas</label>
            <input id="tables_count" name="tables_count" type="number" min="1" value={settings.tables_count} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="mt-1 text-xs text-gray-500">Usado no client web para limite de mesas e chamada do garcom.</p>
          </div>

          <div>
            <label htmlFor="inactivity_timeout_minutes" className="block text-sm font-medium text-gray-700">Protecao por Inatividade (min)</label>
            <input id="inactivity_timeout_minutes" name="inactivity_timeout_minutes" type="number" min="0" value={settings.inactivity_timeout_minutes} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="mt-1 text-xs text-gray-500">Controla o bloqueio ou descanso automatico no web e no app.</p>
          </div>

          <div>
            <label htmlFor="open_time" className="block text-sm font-medium text-gray-700">Horario de Abertura</label>
            <input id="open_time" name="open_time" type="time" value={settings.open_time} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label htmlFor="close_time" className="block text-sm font-medium text-gray-700">Horario de Fechamento</label>
            <input id="close_time" name="close_time" type="time" value={settings.close_time} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="mt-1 text-xs text-gray-500">Tambem salva os aliases `opening_hours` e `closing_hours` para compatibilidade com o app.</p>
          </div>

          <div>
            <label htmlFor="default_language" className="block text-sm font-medium text-gray-700">Idioma Padrao</label>
            <select id="default_language" name="default_language" value={settings.default_language} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="pt">Portugues</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}
