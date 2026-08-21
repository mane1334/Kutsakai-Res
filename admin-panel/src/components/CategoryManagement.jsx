import React, { useEffect, useState } from 'react';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../services/api';

const sectionClassName =
  'admin-card p-6';
const inputClassName =
  'admin-input';
const secondaryButtonClassName =
  'admin-secondary-btn text-sm';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    if (!newCategoryName.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: newCategoryName.trim() });
      } else {
        await createCategory({ name: newCategoryName.trim() });
      }
      setNewCategoryName('');
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar categoria. Verifique se o nome já existe.');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza? Isso pode afetar pratos vinculados a esta categoria.')) return;
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError('Erro ao deletar categoria.');
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setError('');
  };

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <div>
          <p className="admin-kicker">Categorias</p>
          <h1 className="admin-page-title mt-2">Estruture o cardápio por grupos</h1>
          <p className="admin-page-copy">
            Crie, edite e organize as categorias que orientam a leitura do cardápio e a gestão dos pratos.
          </p>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="admin-kicker">
              {editingCategory ? 'Edição' : 'Nova categoria'}
            </p>
            <h2 className="admin-section-title mt-2">
              {editingCategory ? 'Atualizar categoria existente' : 'Adicionar categoria ao restaurante'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <label className="admin-field-label">Nome da categoria</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              className={inputClassName}
              placeholder="Ex.: Bebidas"
            />
          </div>

          <button
            type="submit"
            disabled={!newCategoryName.trim()}
            className="admin-primary-btn text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editingCategory ? 'Atualizar' : 'Adicionar'}
          </button>

          {editingCategory ? (
            <button type="button" onClick={handleCancel} className={secondaryButtonClassName}>
              Cancelar
            </button>
          ) : null}
        </form>

        {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="admin-kicker">Lista</p>
            <h2 className="admin-section-title mt-2">Categorias cadastradas</h2>
          </div>
          <span className="rounded-lg bg-surface-low px-4 py-2 text-sm font-bold text-emeraldpro">
            {categories.length} categorias
          </span>
        </div>

        {loading ? (
          <div className="admin-soft-panel border-dashed px-4 py-12 text-center text-sm text-ink-soft">
            Carregando categorias...
          </div>
        ) : categories.length === 0 ? (
          <div className="admin-soft-panel border-dashed px-4 py-12 text-center text-sm text-ink-soft">
            Nenhuma categoria encontrada.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-4 rounded-lg border border-[#e7c8c2] bg-surface-low p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="admin-kicker">Categoria #{category.id}</p>
                  <h3 className="mt-2 text-lg font-black text-ink">{category.name}</h3>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => handleEdit(category)} className={secondaryButtonClassName}>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    className="admin-danger-btn text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoryManagement;
