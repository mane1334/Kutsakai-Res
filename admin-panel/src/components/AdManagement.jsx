import React, { useEffect, useMemo, useState } from 'react';
import { PLACEHOLDER_IMG, resolveImageUrl } from '../utils/images';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const heroClassName =
  'admin-page-header';
const sectionClassName =
  'admin-card p-6';
const inputClassName =
  'admin-input';

const SortIcon = ({ active, dir }) => (
  <svg className={`ml-1 inline h-3 w-3 ${active ? 'text-slate-700' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
    {dir === 'asc' ? <path d="M3 12l7-8 7 8H3z" /> : <path d="M17 8l-7 8-7-8h14z" />}
  </svg>
);

const AdForm = ({ ad, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    if (ad) {
      setFormData({
        ...ad,
        start_date: ad.start_date ? new Date(ad.start_date).toISOString().split('T')[0] : '',
        end_date: ad.end_date ? new Date(ad.end_date).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        image_url: '',
        start_date: '',
        end_date: '',
        is_active: true,
      });
    }
  }, [ad]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    try {
      document.body.style.overflow = 'hidden';
    } catch {}
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      try {
        document.body.style.overflow = '';
      } catch {}
    };
  }, [onCancel]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    const next = { ...formErrors };
    if (name === 'title') {
      if (!value || value.trim().length < 3) next.title = 'Titulo muito curto.';
      else delete next.title;
    }
    if (name === 'content') {
      if (!value || value.trim().length < 5) next.content = 'Conteudo muito curto.';
      else delete next.content;
    }
    if (name === 'start_date' || name === 'end_date') {
      const merged = { ...formData, [name]: value };
      if (!merged.start_date) next.start_date = 'Data de inicio e obrigatoria.';
      else delete next.start_date;
      if (!merged.end_date) next.end_date = 'Data de fim e obrigatoria.';
      else delete next.end_date;
      if (merged.start_date && merged.end_date && merged.start_date > merged.end_date) {
        next.end_date = 'Fim deve ser apos o inicio.';
      }
    }
    setFormErrors(next);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!formData.title?.trim()) errors.title = 'Titulo e obrigatorio.';
    if (!formData.content?.trim()) errors.content = 'Conteudo e obrigatorio.';
    if (!formData.start_date) errors.start_date = 'Data de inicio e obrigatoria.';
    if (!formData.end_date) errors.end_date = 'Data de fim e obrigatoria.';
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errors.end_date = 'Data de fim deve ser posterior a data de inicio.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setSaveStatus(null);
      await onSave({
        ...formData,
        title: formData.title.trim(),
        content: formData.content.trim(),
        image_url: (formData.image_url || '').trim(),
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-2 sm:p-4 backdrop-blur-sm" onClick={onCancel}>
      <div 
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" 
        style={{ maxHeight: '70vh' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex-shrink-0 border-b border-slate-200 px-4 py-2 relative flex flex-col">
          <button type="button" onClick={onCancel} className="absolute right-4 top-3 text-slate-400 transition hover:text-slate-600" aria-label="Fechar">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">Anúncios</p>
          </div>
          <h2 className="text-lg font-bold pr-8">{ad ? 'Editar anúncio' : 'Novo anúncio'}</h2>
          <p className="text-slate-500 mt-0.5 text-xs">Defina título, conteúdo, vigência e visibilidade do anúncio.</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <form id="ad-form" onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* Coluna esquerda */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-0.5">Título</label>
                  <input name="title" value={formData.title} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Ex.: Promoção do fim de semana" />
                  {formErrors.title ? <p className="mt-0.5 text-xs text-rose-700">{formErrors.title}</p> : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-0.5">Conteúdo</label>
                  <textarea name="content" value={formData.content} onChange={handleChange} rows={2} className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Mensagem do anúncio"></textarea>
                  {formErrors.content ? <p className="mt-0.5 text-xs text-rose-700">{formErrors.content}</p> : null}
                </div>
              </div>

              {/* Coluna direita */}
              <div className="space-y-2">
                <div className="grid gap-2 grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">Data de início</label>
                    <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-1.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
                    {formErrors.start_date ? <p className="mt-0.5 text-xs text-rose-700">{formErrors.start_date}</p> : null}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">Data de fim</label>
                    <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-1.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
                    {formErrors.end_date ? <p className="mt-0.5 text-xs text-rose-700">{formErrors.end_date}</p> : null}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-0.5">Imagem</label>
                  <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="https://... ou /uploads/banner.jpg" />
                </div>

                <label className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-2 cursor-pointer">
                  <span className="font-medium text-slate-800 text-xs">Anúncio ativo</span>
                  <input type="checkbox" name="is_active" checked={!!formData.is_active} onChange={handleChange} className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-950" />
                </label>

                {formData.image_url ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Prévia:</span>
                    <img src={resolveImageUrl(formData.image_url)} alt="Prévia" className="h-10 w-16 object-cover rounded border border-slate-200 shadow-sm" onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }} />
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onCancel} className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" form="ad-form" disabled={saving || Object.keys(formErrors).length > 0} className={`rounded-md px-4 py-1.5 text-sm transition ${saving || Object.keys(formErrors).length > 0 ? 'cursor-not-allowed bg-amber-200 text-slate-500' : 'bg-slate-950 text-white hover:bg-slate-800'}`}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {saveStatus === 'success' ? <div className="mt-1 text-xs text-emerald-700">Anúncio salvo com sucesso.</div> : null}
          {saveStatus === 'error' ? <div className="mt-1 text-xs text-rose-700">Falha ao salvar o anúncio.</div> : null}
        </div>
      </div>
    </div>
  );
};

const AdTable = ({ ads, onEdit, onDelete }) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('title');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [query, ads]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return ads;
    return ads.filter((ad) => (ad.title || '').toLowerCase().includes(normalizedQuery) || (ad.content || '').toLowerCase().includes(normalizedQuery));
  }, [ads, query]);

  useEffect(() => {
    setPage((current) => Math.max(1, Math.min(current, Math.ceil((filtered.length || 1) / pageSize))));
  }, [filtered.length, pageSize]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dirMul = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let va;
      let vb;
      switch (sortKey) {
        case 'start_date':
          va = a.start_date ? new Date(a.start_date).getTime() : 0;
          vb = b.start_date ? new Date(b.start_date).getTime() : 0;
          break;
        case 'end_date':
          va = a.end_date ? new Date(a.end_date).getTime() : 0;
          vb = b.end_date ? new Date(b.end_date).getTime() : 0;
          break;
        case 'is_active':
          va = a.is_active ? 1 : 0;
          vb = b.is_active ? 1 : 0;
          break;
        case 'title':
        default:
          va = (a.title || '').toLowerCase();
          vb = (b.title || '').toLowerCase();
      }
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    });
    return arr;
  }, [filtered, sortDir, sortKey]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageItems = sorted.slice(startIdx, endIdx);

  const requestSort = (key) => {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderHeader = (label, key) => (
    <th className="px-4 py-3 text-left">
      <button onClick={() => requestSort(key)} className="flex items-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <span>{label}</span>
        <SortIcon active={sortKey === key} dir={sortKey === key ? sortDir : 'asc'} />
      </button>
    </th>
  );

  if (!ads || ads.length === 0) {
    return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">Nenhum anúncio cadastrado ainda.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-slate-500">Total de anúncios: {ads.length}</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none shadow-sm">
            <option value={5}>5 por pagina</option>
            <option value={10}>10 por pagina</option>
            <option value={20}>20 por pagina</option>
            <option value={50}>50 por pagina</option>
          </select>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar anúncio..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 sm:min-w-[280px]" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">Nenhum anúncio corresponde a pesquisa.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Imagem</th>
                  {renderHeader('Titulo', 'title')}
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conteudo</th>
                  {renderHeader('Inicio', 'start_date')}
                  {renderHeader('Fim', 'end_date')}
                  {renderHeader('Ativo', 'is_active')}
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((ad) => (
                  <tr key={ad.id} className="border-t border-slate-200 hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <div className="group h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <img src={ad.image_url ? resolveImageUrl(ad.image_url) : PLACEHOLDER_IMG} alt={ad.title} className="h-14 w-14 object-cover transition-transform duration-200 group-hover:scale-110" onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900"><div className="max-w-[220px] truncate" title={ad.title}>{ad.title}</div></td>
                    <td className="px-4 py-4 text-sm text-slate-700"><div className="max-w-[280px] truncate" title={ad.content}>{ad.content}</div></td>
                    <td className="px-4 py-4 text-sm text-slate-700">{ad.start_date ? new Date(ad.start_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{ad.end_date ? new Date(ad.end_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${ad.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                        {ad.is_active ? 'Sim' : 'Nao'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => onEdit(ad)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Editar</button>
                        <button onClick={() => onDelete(ad.id)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100">Deletar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div>Mostrando {total === 0 ? 0 : startIdx + 1}-{endIdx} de {total}</div>
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>Anterior</button>
              <span>Pagina {currentPage} de {totalPages}</span>
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages}>Seguinte</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AdManagement = () => {
  const [ads, setAds] = useState([]);
  const [editingAd, setEditingAd] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch(`${API_URL}/ads`);
      if (!response.ok) {
        throw new Error('Erro ao buscar anúncios.');
      }
      const data = await response.json();
      setAds(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAd = async (adData) => {
    setLoading(true);
    setActionError(null);
    try {
      const response = adData.id
        ? await fetch(`${API_URL}/ads/${adData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adData) })
        : await fetch(`${API_URL}/ads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adData) });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao salvar anúncio.' }));
        throw new Error(errorData.message);
      }
      await response.json();
      fetchAds();
      setIsFormVisible(false);
      setEditingAd(null);
    } catch (err) {
      setActionError(err.message);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este anúncio?')) return;
    setLoading(true);
    setActionError(null);
    try {
      const response = await fetch(`${API_URL}/ads/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao deletar anúncio.' }));
        throw new Error(errorData.message);
      }
      fetchAds();
    } catch (err) {
      setActionError(err.message);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Carregando anúncios...</div>;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">Erro: {error}</div>;

  return (
    <div className="admin-page">
      <section className={heroClassName}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-kicker">Anúncios</p>
            <h1 className="admin-page-title mt-2">Gerencie campanhas e comunicados</h1>
            <p className="admin-page-copy">Crie anúncios com vigência, imagem e ativação rápida para divulgar ofertas ou recados no ecossistema do restaurante.</p>
          </div>
          <button
            onClick={() => { setEditingAd(null); setIsFormVisible(true); }}
            className="admin-primary-btn text-sm"
          >
            Adicionar novo anúncio
          </button>
        </div>
      </section>

      {actionError ? <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{actionError}</div> : null}
      {isFormVisible ? <AdForm ad={editingAd} onSave={handleSaveAd} onCancel={() => { setIsFormVisible(false); setEditingAd(null); }} /> : null}

      <section className={sectionClassName}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="admin-kicker">Lista</p>
            <h2 className="admin-section-title mt-2">Anúncios cadastrados</h2>
          </div>
          <span className="rounded-lg bg-surface-low px-4 py-2 text-sm font-bold text-emeraldpro">{ads.length} anúncios</span>
        </div>

        <AdTable ads={ads} onEdit={(ad) => { setEditingAd(ad); setIsFormVisible(true); }} onDelete={handleDeleteAd} />
      </section>
    </div>
  );
};

export default AdManagement;
