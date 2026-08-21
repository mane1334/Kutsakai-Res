import React, { useEffect, useState } from 'react';
import { getMenu } from '../services/api';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';
import { useCartDispatch } from '../CartContext';
import { resolveImageUrl, PLACEHOLDER_IMG } from '../utils/images';
import { normalizeDish } from '../utils/text';
import DishModal from './DishModal';

const categories = {
  1: 'Entradas',
  2: 'Pratos Principais',
  3: 'Sobremesas',
  4: 'Bebidas'
};

const DishList = ({ footer = null }) => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDish, setSelectedDish] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useCartDispatch();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await getMenu();
        const normalized = Array.isArray(data) ? data.map(normalizeDish) : [];
        setDishes(normalized);
      } catch (e) {
        setError(e.message);
        toast.error('Erro ao carregar o cardápio.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const filteredDishes = selectedCategory === 'all'
    ? dishes
    : dishes.filter((dish) => dish.category_id === Number.parseInt(selectedCategory, 10));

  const openModal = (dish) => {
    setSelectedDish(dish);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDish(null);
    setIsModalOpen(false);
  };

  const handleAddToCart = () => {
    if (!selectedDish) return;
    dispatch({ type: 'ADD_ITEM', dish: selectedDish });
    toast.success(`${selectedDish.name} foi para o carrinho!`);
  };

  const addDishToCart = (dish) => {
    dispatch({ type: 'ADD_ITEM', dish });
    toast.success(`${dish.name} foi para o carrinho!`);
  };

  const categoryCount = (categoryId) => dishes.filter((dish) => String(dish.category_id) === String(categoryId)).length;

  const renderShell = (content) => (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_18px_48px_rgba(15,23,42,0.10)] backdrop-blur-sm">
      <div className="border-b border-gray-100 px-5 py-5 md:px-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-800 md:text-4xl">Nosso Cardápio</h2>
      </div>
      {content}
    </section>
  );

  const renderCards = (items) => (
    <div key={selectedCategory} className="stagger grid grid-cols-1 gap-6 pb-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((dish) => (
        <article
          key={dish.id}
          className="fade-in overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-xl transition-all duration-300 ease-in-out hover:scale-[1.02]"
        >
          <div className="dish-image relative cursor-pointer" onClick={() => openModal(dish)}>
            <img
              src={resolveImageUrl(dish.image_url) || PLACEHOLDER_IMG}
              alt={dish.name}
              className="h-48 w-full object-cover transition-all duration-300 hover:brightness-110"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_IMG;
              }}
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 hover:bg-black/20">
              <span className="rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-gray-700 opacity-0 transition-opacity duration-300">
                Ver Detalhes
              </span>
            </div>
          </div>
          <div className="p-5">
            <h3
              className="mb-2 cursor-pointer text-2xl font-bold text-gray-900 transition-colors hover:text-red-600"
              onClick={() => openModal(dish)}
            >
              {dish.name}
            </h3>
            <p className="mb-4 line-clamp-3 text-sm text-gray-700">{dish.description}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xl font-extrabold text-red-600">{formatCurrency(dish.price)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(dish)}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors duration-300 hover:bg-gray-200"
                >
                  Ver Mais
                </button>
                <button
                  onClick={() => addDishToCart(dish)}
                  className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-md transition-colors duration-300 hover:bg-red-700"
                >
                  Pedir
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  if (loading) {
    return renderShell(
      <div className="min-h-0 flex-1 px-5 py-5 md:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-xl">
              <div className="skeleton h-48 w-full"></div>
              <div className="space-y-3 p-5">
                <div className="skeleton h-6 w-2/3 rounded"></div>
                <div className="skeleton h-4 w-full rounded"></div>
                <div className="skeleton h-4 w-5/6 rounded"></div>
                <div className="flex items-center justify-between pt-2">
                  <div className="skeleton h-6 w-24 rounded"></div>
                  <div className="flex gap-2">
                    <div className="skeleton h-9 w-20 rounded-full"></div>
                    <div className="skeleton h-9 w-20 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return renderShell(
      <div className="flex flex-1 items-center justify-center px-5 py-10 md:px-8">
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return renderShell(
    <>
      <div className="min-h-0 flex-1 px-5 py-4 md:px-8">
        <div className="sticky top-0 z-10 -mx-1 mb-5 bg-white/95 px-1 pb-3 pt-1 backdrop-blur-sm">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                selectedCategory === 'all'
                  ? 'border-red-600 bg-red-600 text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50'
              }`}
            >
              Todos os Pratos
            </button>
            {Object.entries(categories).map(([categoryId, categoryName]) => (
              <button
                key={categoryId}
                onClick={() => setSelectedCategory(categoryId)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === categoryId
                    ? 'border-red-600 bg-red-600 text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50'
                }`}
              >
                <span>{categoryName}</span>
                <span
                  className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                    selectedCategory === categoryId
                      ? 'bg-white/20 text-white'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {categoryCount(categoryId)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredDishes.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-gray-200 bg-gray-50 px-6 text-center">
            <div className="text-lg text-gray-500">Nenhum prato encontrado nesta categoria.</div>
          </div>
        ) : (
          renderCards(filteredDishes)
        )}

        {footer ? <div className="pt-4">{footer}</div> : null}
      </div>

      <DishModal
        dish={selectedDish}
        isOpen={isModalOpen}
        onClose={closeModal}
        onAddToCart={handleAddToCart}
      />
    </>
  );
};

export default DishList;
