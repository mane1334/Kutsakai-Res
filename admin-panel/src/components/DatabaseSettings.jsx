import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { exportDatabase, getDatabaseStatus, importDatabase, setupDatabase, testDatabaseConnection } from '../services/api';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const inputClassName =
  'admin-input';
const sectionClassName =
  'admin-card p-6';

const DatabaseSettings = () => {
  const [dbConfig, setDbConfig] = useState({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'restaurantes',
    username: 'postgres',
    password: '',
    ssl: false,
  });
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    type: 'unknown',
    error: null,
    tables: [],
    size: null,
    rowCounts: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupFile, setBackupFile] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getDatabaseStatus();
      setDbStatus(status);
      if (status.config) {
        setDbConfig((prev) => ({ ...prev, ...status.config }));
      }
      toast.success('Status do banco atualizado.');
    } catch {
      toast.error('Falha ao buscar status do banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setDbConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testDatabaseConnection(dbConfig);
      if (result.success) {
        toast.success('Conexão com banco de dados bem-sucedida.');
        setDbStatus((prev) => ({ ...prev, connected: true, error: null }));
      } else {
        toast.error(`Falha na conexao: ${result.error}`);
        setDbStatus((prev) => ({ ...prev, connected: false, error: result.error }));
      }
    } catch (error) {
      toast.error('Erro ao testar conexao.');
      setDbStatus((prev) => ({ ...prev, connected: false, error: error.message }));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSetupDatabase = async () => {
    setIsSettingUp(true);
    try {
      const result = await setupDatabase(dbConfig);
      if (result.success) {
        toast.success('Banco de dados configurado com sucesso.');
        await checkDatabaseStatus();
      } else {
        toast.error(`Erro na configuracao: ${result.error}`);
      }
    } catch {
      toast.error('Erro ao configurar banco de dados.');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportDatabase();
      toast.success('Exportacao iniciada.');
    } catch (error) {
      toast.error(error.error || 'Falha ao exportar o banco de dados.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!backupFile) {
      toast.warn('Selecione um arquivo de backup.');
      return;
    }
    const confirmed = window.confirm('Esta acao ira sobrescrever completamente o banco atual. Deseja continuar?');
    if (!confirmed) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('backupFile', backupFile);
    try {
      const result = await importDatabase(formData);
      toast.success(result.message || 'Banco de dados importado com sucesso.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setBackupFile(null);
      setTimeout(checkDatabaseStatus, 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Falha ao importar o banco de dados.');
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusColor = () => {
    if (dbStatus.connected) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (dbStatus.error) return 'border-rose-200 bg-rose-50 text-rose-700';
    return 'border-amber-200 bg-amber-50 text-amber-700';
  };

  const getStatusText = () => {
    if (dbStatus.connected) return 'Conectado';
    if (dbStatus.error) return 'Erro de conexao';
    return 'Desconhecido';
  };

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-kicker">Banco de dados</p>
            <h1 className="admin-page-title mt-2">Conexão, backup e estrutura do ambiente</h1>
            <p className="admin-page-copy">
              Revise o estado atual do banco, exporte backups, importe restaurações e ajuste a conexão manual quando for necessário.
            </p>
          </div>
          <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${getStatusColor()}`}>{getStatusText()}</div>
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="admin-section-title">Status atual</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="admin-soft-panel p-4">
            <p className="admin-kicker">Tipo</p>
            <p className="mt-2 font-bold text-ink">{dbStatus.type || 'Não configurado'}</p>
          </div>
          <div className="admin-soft-panel p-4">
            <p className="admin-kicker">Conexão</p>
            <p className="mt-2 font-bold text-ink">{dbStatus.connected ? 'Ativa' : 'Inativa'}</p>
          </div>
          <div className="admin-soft-panel p-4">
            <p className="admin-kicker">Tamanho</p>
            <p className="mt-2 font-bold text-ink">{formatBytes(dbStatus.size)}</p>
          </div>
          <div className="admin-soft-panel p-4">
            <p className="admin-kicker">Tabelas</p>
            <p className="mt-2 font-bold text-ink">{dbStatus.tables?.length || 0} encontradas</p>
          </div>
        </div>

        {dbStatus.rowCounts?.length > 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Registros principais</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {dbStatus.rowCounts.map(({ table, count }) => (
                <div key={table} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <span className="font-semibold capitalize">{table}</span>: {count}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {dbStatus.error ? <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{dbStatus.error}</div> : null}
      </section>

      <section className={sectionClassName}>
        <h2 className="text-2xl font-semibold text-slate-950">Backup e restauração</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-sm text-indigo-700">Exporte o banco de dados atual como um arquivo de backup.</p>
            <button onClick={handleExport} disabled={isExporting || isImporting} className="mt-4 rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-50">
              {isExporting ? 'Exportando...' : 'Exportar dados'}
            </button>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-800">Importe um arquivo de backup para restaurar o banco de dados.</p>
            <div className="mt-4 flex flex-col gap-3">
              <input ref={fileInputRef} type="file" onChange={(event) => setBackupFile(event.target.files?.[0] || null)} accept=".sql" className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-50" />
              <button onClick={handleImport} disabled={!backupFile || isImporting || isExporting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                {isImporting ? 'Importando...' : 'Importar backup'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Configuração manual</h2>
            <p className="mt-2 text-sm text-slate-600">Abra os parametros avancados somente quando precisar alterar a conexao.</p>
          </div>
          <button onClick={() => setShowAdvanced((current) => !current)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            {showAdvanced ? 'Ocultar opcoes' : 'Mostrar opcoes'}
          </button>
        </div>

        {showAdvanced ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo de banco</label>
              <select name="type" value={dbConfig.type} onChange={handleChange} className={inputClassName}>
                <option value="postgresql">PostgreSQL</option>
                <option value="sqlite">SQLite (Local)</option>
                <option value="mysql">MySQL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Host</label>
              <input type="text" name="host" value={dbConfig.host} onChange={handleChange} className={inputClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Porta</label>
              <input type="number" name="port" value={dbConfig.port} onChange={handleChange} className={inputClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome do banco</label>
              <input type="text" name="database" value={dbConfig.database} onChange={handleChange} className={inputClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Usuario</label>
              <input type="text" name="username" value={dbConfig.username} onChange={handleChange} className={inputClassName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <input type="password" name="password" value={dbConfig.password} onChange={handleChange} className={inputClassName} />
            </div>
            <label className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <span className="font-medium text-slate-800">Usar SSL</span>
              <input type="checkbox" name="ssl" checked={!!dbConfig.ssl} onChange={handleChange} />
            </label>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-4">
          <button onClick={handleTestConnection} disabled={isTesting || isSettingUp || isLoading} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
            {isTesting ? 'Testando...' : 'Testar conexao'}
          </button>
          <button onClick={handleSetupDatabase} disabled={!dbStatus.connected || isSettingUp || isLoading} className="rounded-2xl border border-slate-950 bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            {isSettingUp ? 'Salvando...' : 'Salvar e aplicar'}
          </button>
          <button onClick={checkDatabaseStatus} disabled={isLoading} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50">
            {isLoading ? 'Atualizando...' : 'Atualizar status'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default DatabaseSettings;
