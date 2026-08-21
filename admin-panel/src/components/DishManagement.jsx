import React, { useEffect, useState } from 'react';
import DishForm from './DishForm.jsx';
import DishTable from './DishTable.jsx';
import { createDish, deleteDish, getDishes, updateDish } from '../services/api';

const DishManagement = () => {
  const [dishes, setDishes] = useState([]);
  const [editingDish, setEditingDish] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const data = await getDishes();
      setDishes(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Erro ao buscar pratos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDish = async (dishData) => {
    setLoading(true);
    setActionError(null);
    try {
      if (dishData.id) {
        await updateDish(dishData.id, dishData);
      } else {
        await createDish(dishData);
      }

      fetchDishes();
      setIsFormVisible(false);
      setEditingDish(null);
    } catch (err) {
      setActionError(err.message);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDish = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este prato?')) return;

    setLoading(true);
    setActionError(null);
    try {
      await deleteDish(id);
      fetchDishes();
    } catch (err) {
      setActionError(err.message);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDish = (dish) => {
    setEditingDish(dish);
    setIsFormVisible(true);
  };

  const handleAddDish = () => {
    setEditingDish(null);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingDish(null);
  };

  if (loading) return <div className="admin-card border-dashed p-8 text-center text-ink-soft">Carregando pratos...</div>;
  if (error) return <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">Erro: {error}</div>;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-kicker">Cardapio</p>
            <h1 className="admin-page-title mt-2">Gerencie pratos e disponibilidade</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
              Atualize o cardápio com mais clareza visual, controle categorias e mantenha os pratos prontos para venda.
            </p>
          </div>

          <button
            onClick={handleAddDish}
            className="admin-primary-btn"
          >
            Adicionar novo prato
          </button>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{actionError}</div>
      ) : null}

      {isFormVisible ? (
        <DishForm dish={editingDish} onSave={handleSaveDish} onCancel={handleCancelForm} />
      ) : null}

      <section className="admin-card p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="admin-kicker">Lista</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Pratos cadastrados</h2>
          </div>
          <span className="rounded-lg bg-surface-low px-4 py-2 text-sm font-bold text-emeraldpro">{dishes.length} pratos</span>
        </div>

        <DishTable dishes={dishes} onEdit={handleEditDish} onDelete={handleDeleteDish} />
      </section>
    </div>
  );
};

export default DishManagement;
