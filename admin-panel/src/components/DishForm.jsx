import React, { useState, useEffect } from 'react';
import { resolveImageUrl, PLACEHOLDER_IMG } from '../utils/images';
import { uploadImage, getCategories } from '../services/api'; // getCategories imported

const parseImageUrls = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (_) { }
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
};

const DishForm = ({ dish, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '', // Default empty, wait for load
    image_url: '',
    image_urls: [],
    is_available: true,
    is_spicy: false,
    is_vegetarian: false,
    is_gluten_free: false,
  });
  const [categories, setCategories] = useState([]); // New state
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    // Fetch categories
    getCategories().then(setCategories).catch(console.error);

    if (dish) {
      setFormData({ ...dish, image_urls: parseImageUrls(dish.image_urls) });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        image_urls: [],
        is_available: true,
        is_spicy: false,
        is_vegetarian: false,
        is_gluten_free: false,
      });
    }
  }, [dish]);

  // Set default category if creating new and categories loaded
  useEffect(() => {
    if (!dish && categories.length > 0 && !formData.category_id) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [categories, dish]);

  // Fechar com ESC e bloquear scroll do body enquanto o modal estiver aberto
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    try {
      document.body.style.overflow = 'hidden';
    } catch { }
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      try { document.body.style.overflow = ''; } catch { }
    };
  }, [onCancel]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const nextValue = type === 'checkbox' ? checked : value;
      // Precedência: se já há um caminho local ("/...") e o usuário digitar uma URL externa,
      // mantém o caminho local.
      if (
        name === 'image_url' &&
        typeof nextValue === 'string' &&
        nextValue &&
        !nextValue.startsWith('/') &&
        typeof prev.image_url === 'string' &&
        prev.image_url.startsWith('/')
      ) {
        return prev;
      }
      return {
        ...prev,
        [name]: nextValue,
      };
    });
    // validação ao digitar
    const nextErrors = { ...formErrors };
    if (name === 'name') {
      if (!value || (typeof value === 'string' && value.trim().length < 2)) nextErrors.name = 'Informe um nome válido.'; else delete nextErrors.name;
    }
    if (name === 'price') {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) nextErrors.price = 'Preço deve ser maior que 0.'; else delete nextErrors.price;
    }
    setFormErrors(nextErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name) errors.name = 'Nome é obrigatório.';
    if (!formData.price || formData.price <= 0) errors.price = 'Preço deve ser um número positivo.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const toSave = {
      ...formData,
      name: formData.name.trim(),
      image_url: (formData.image_url || '').trim(),
      image_urls: parseImageUrls(formData.image_urls),
    };
    try {
      setSaving(true);
      setSaveStatus(null);
      await onSave(toSave);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    try {
      const { path } = await uploadImage(file);
      // Ao enviar arquivo, sempre priorizar o caminho local retornado
      setFormData(prev => ({
        ...prev,
        image_url: path || prev.image_url,
        image_urls: Array.from(new Set([...(parseImageUrls(prev.image_urls)), path].filter(Boolean))),
      }));
    } catch (err) {
      console.error('Erro no upload da imagem:', err);
      setUploadError('Falha ao enviar a imagem. Tente novamente.');
    } finally {
      setUploading(false);
      // permite reenviar o mesmo arquivo caso o usuário selecione o mesmo nome
      try { e.target.value = ''; } catch (_) { }
    }
  };

  const addGalleryUrl = () => {
    const normalized = galleryUrl.trim();
    if (!normalized) return;
    setFormData(prev => ({
      ...prev,
      image_urls: Array.from(new Set([...parseImageUrls(prev.image_urls), normalized])),
      image_url: prev.image_url || normalized,
    }));
    setGalleryUrl('');
  };

  const removeGalleryUrl = (url) => {
    setFormData(prev => {
      const nextGallery = parseImageUrls(prev.image_urls).filter((item) => item !== url);
      return {
        ...prev,
        image_urls: nextGallery,
        image_url: prev.image_url === url ? (nextGallery[0] || '') : prev.image_url,
      };
    });
  };

  const setCoverImage = (url) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const galleryImages = parseImageUrls(formData.image_urls);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-2 sm:p-4" onClick={onCancel}>
      <div 
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" 
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 border-b px-4 py-2 flex items-start gap-2.5">
          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded bg-blue-50 text-blue-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-bold pr-8">{dish ? 'Editar Prato' : 'Adicionar Prato'}</h2>
            <p className="text-gray-500 mt-0.5 text-xs">Preencha os detalhes do prato e defina a disponibilidade.</p>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <form id="dish-form" onSubmit={handleSubmit} className="space-y-1.5">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* Coluna esquerda */}
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-0.5">Categoria</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-0.5">Nome</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ex.: Frango Grelhado"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full rounded-md border p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-0.5">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-0.5">Descrição</label>
                  <textarea
                    name="description"
                    placeholder="Breve descrição do prato"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-0.5">Preço</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full rounded-md border p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${formErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.price && <p className="text-red-500 text-xs mt-0.5">{formErrors.price}</p>}
                </div>

                <label className="flex w-full cursor-pointer items-center rounded-md border border-gray-300 p-2 hover:bg-gray-50">
                  <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <span className="text-sm text-gray-700 font-medium">Disponível no cardápio</span>
                </label>

                {/* Dietary Tags */}
                <div className="rounded-md border border-gray-300 p-2">
                  <span className="block text-xs text-gray-600 font-semibold mb-1">Tags Alimentares</span>
                  <div className="grid grid-cols-3 gap-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input type="checkbox" name="is_spicy" checked={formData.is_spicy} onChange={handleChange} className="w-3.5 h-3.5 text-red-500 focus:ring-red-500 border-gray-300 rounded" />
                      <span>🌶️ Picante</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input type="checkbox" name="is_vegetarian" checked={formData.is_vegetarian} onChange={handleChange} className="w-3.5 h-3.5 text-green-500 focus:ring-green-500 border-gray-300 rounded" />
                      <span>🥬 Veg.</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input type="checkbox" name="is_gluten_free" checked={formData.is_gluten_free} onChange={handleChange} className="w-3.5 h-3.5 text-yellow-500 focus:ring-yellow-500 border-gray-300 rounded" />
                      <span>🌾 S/ Glúten</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Coluna direita */}
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-0.5">Imagem de capa</label>
                  <input
                    type="text"
                    name="image_url"
                    placeholder="https://... ou /uploads/imagem.jpg"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">Capa dos cards. Use URL ou escolha da galeria.</p>
                </div>

                <div className="rounded-md border border-gray-300 p-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm text-gray-700 font-medium">Galeria de fotos ({galleryImages.length})</label>
                    <button
                      type="button"
                      onClick={() => setShowGallery(!showGallery)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                    >
                      {showGallery ? 'Ocultar' : 'Ver galeria'}
                    </button>
                  </div>

                  {showGallery && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={galleryUrl}
                          onChange={(event) => setGalleryUrl(event.target.value)}
                          placeholder="https://... ou /uploads/foto.jpg"
                          className="min-w-0 flex-1 rounded-md border border-gray-300 p-1.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addGalleryUrl}
                          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Add
                        </button>
                      </div>

                      {galleryImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1.5">
                          {galleryImages.map((url) => (
                            <div key={url} className="rounded-md border border-slate-200 bg-slate-50 p-1.5">
                              <img
                                src={resolveImageUrl(url)}
                                alt="Foto"
                                className="h-10 w-full rounded object-cover"
                                onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }}
                              />
                              <div className="mt-1 flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setCoverImage(url)}
                                  className={`flex-1 rounded px-1 py-0.5 text-[10px] font-bold ${formData.image_url === url ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-700 border border-slate-200'}`}
                                >
                                  Capa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeGalleryUrl(url)}
                                  className="rounded bg-rose-50 px-1 py-0.5 text-[10px] font-bold text-rose-700"
                                >
                                  Del
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-500">
                          Nenhuma foto extra adicionada.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Enviar arquivo</label>
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="block w-full text-xs text-gray-700 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploading && (
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="animate-spin h-3.5 w-3.5 mr-1 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        Enviando...
                      </div>
                    )}
                    {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}
                  </div>
                </div>

                {formData.image_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Prévia:</span>
                    <img
                      src={resolveImageUrl(formData.image_url)}
                      alt="Prévia"
                      className="h-10 w-14 rounded border object-cover shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMG;
                        try { window.dispatchEvent(new CustomEvent('admin:toast', { detail: { type: 'error', message: 'Falha ao carregar a imagem. Verifique a URL.' } })); } catch { }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
        <div className="flex-shrink-0 border-t bg-gray-50 px-4 py-2.5">
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="dish-form"
              disabled={saving || Object.keys(formErrors).length > 0}
              className={`px-4 py-1.5 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${saving || Object.keys(formErrors).length > 0 ? 'bg-blue-300 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {saveStatus === 'success' && (
            <div className="mt-1 text-xs text-green-700">Prato salvo com sucesso.</div>
          )}
          {saveStatus === 'error' && (
            <div className="mt-1 text-xs text-red-700">Falha ao salvar o prato. Tente novamente.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishForm;
