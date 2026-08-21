import React, { useEffect, useMemo, useState } from 'react';
import { formatMeticalDisplay } from '../utils/currency';
import { PLACEHOLDER_IMG, resolveImageUrl } from '../utils/images';

const SortIcon = ({ active, dir }) => (
  <svg className={`ml-1 inline h-3 w-3 ${active ? 'text-slate-700' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
    {dir === 'asc' ? <path d="M3 12l7-8 7 8H3z" /> : <path d="M17 8l-7 8-7-8h14z" />}
  </svg>
);

const DishTable = ({ dishes, onEdit, onDelete }) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [query, dishes]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return dishes;
    return dishes.filter((dish) => (dish.name || '').toLowerCase().includes(normalizedQuery));
  }, [dishes, query]);

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
        case 'price':
          va = parseFloat(a.price || 0);
          vb = parseFloat(b.price || 0);
          break;
        case 'is_available':
          va = a.is_available ? 1 : 0;
          vb = b.is_available ? 1 : 0;
          break;
        case 'name':
        default:
          va = (a.name || '').toLowerCase();
          vb = (b.name || '').toLowerCase();
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

  const renderHeader = (label, key, align = 'left') => (
    <th className={`px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button onClick={() => requestSort(key)} className="flex items-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <span>{label}</span>
        <SortIcon active={sortKey === key} dir={sortKey === key ? sortDir : 'asc'} />
      </button>
    </th>
  );

  const getGalleryCount = (dish) => {
    if (Array.isArray(dish.image_urls)) return dish.image_urls.length;
    if (typeof dish.image_urls !== 'string' || !dish.image_urls.trim()) return dish.image_url ? 1 : 0;
    try {
      const parsed = JSON.parse(dish.image_urls);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).length;
    } catch (_) { }
    return dish.image_urls.split('\n').filter(Boolean).length;
  };

  if (!dishes || dishes.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
        Nenhum prato cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-slate-500">Total de pratos: {dishes.length}</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none shadow-sm"
          >
            <option value={5}>5 por pagina</option>
            <option value={10}>10 por pagina</option>
            <option value={20}>20 por pagina</option>
            <option value={50}>50 por pagina</option>
          </select>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar prato..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 sm:min-w-[280px]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
          Nenhum prato corresponde a pesquisa.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Imagem</th>
                  {renderHeader('Nome', 'name')}
                  {renderHeader('Preco', 'price')}
                  {renderHeader('Disponivel', 'is_available')}
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((dish) => (
                  <tr key={dish.id} className="border-t border-slate-200 hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <div className="group h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <img
                          src={dish.image_url ? resolveImageUrl(dish.image_url) : PLACEHOLDER_IMG}
                          alt={dish.name}
                          className="h-14 w-14 object-cover transition-transform duration-200 group-hover:scale-110"
                          onError={(event) => {
                            event.currentTarget.src = PLACEHOLDER_IMG;
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      <div className="max-w-[240px] truncate" title={dish.name}>
                        {dish.name}
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {getGalleryCount(dish)} foto(s)
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">{formatMeticalDisplay(dish.price)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          dish.is_available
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        {dish.is_available ? 'Sim' : 'Nao'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onEdit(dish)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(dish.id)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
                        >
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Mostrando {total === 0 ? 0 : startIdx + 1}-{endIdx} de {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
              >
                Anterior
              </button>
              <span>Pagina {currentPage} de {totalPages}</span>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
              >
                Seguinte
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DishTable;
