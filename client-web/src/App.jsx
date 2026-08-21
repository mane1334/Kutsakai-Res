import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  callWaiter,
  cancelOrder,
  getAds,
  getAiGreeting,
  getMenu,
  getSettings,
  login,
  postOrder,
  setOnUnauthorized,
  streamChatMessage,
} from './services/api';
import { subscribeToEvent } from './services/socket';
import { formatCurrency } from './utils/currency';
import { PLACEHOLDER_IMG, resolveImageUrl } from './utils/images';
import { normalizeDish } from './utils/text';

const CATEGORY_NAMES = {
  1: 'Entradas',
  2: 'Pratos principais',
  3: 'Sobremesas',
  4: 'Bebidas',
};

const DEFAULT_SETTINGS = {
  restaurant_name: 'Restaurante',
  restaurant_logo_url: '',
  open_time: '00:00',
  close_time: '23:59',
  tables_count: 50,
};

const formatSeconds = (total) => {
  const seconds = Math.max(0, Number(total) || 0);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const isOpenNow = (settings) => {
  const open = settings?.open_time || '00:00';
  const close = settings?.close_time || '23:59';
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(oh || 0, om || 0, 0, 0);
  end.setHours(ch || 23, cm || 59, 0, 0);
  return now >= start && now <= end;
};

const loadStoredCart = () => {
  try {
    return JSON.parse(localStorage.getItem('interactive_cart') || '[]');
  } catch {
    return [];
  }
};

const saveStoredCart = (cart) => {
  try {
    localStorage.setItem('interactive_cart', JSON.stringify(cart));
  } catch {}
};

const saveOrderSession = (order) => {
  try {
    sessionStorage.setItem('currentOrderId', String(order.id));
    sessionStorage.setItem('currentPrepSeconds', String(order.prepSeconds || 0));
    sessionStorage.setItem('currentOrderStatus', order.status || 'pending');
    if (order.cancelUntil) sessionStorage.setItem('currentCancelUntil', String(order.cancelUntil));
  } catch {}
};

const clearOrderSession = () => {
  try {
    sessionStorage.removeItem('currentOrderId');
    sessionStorage.removeItem('currentPrepSeconds');
    sessionStorage.removeItem('currentOrderStatus');
    sessionStorage.removeItem('currentCancelUntil');
  } catch {}
};

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dishes, setDishes] = useState([]);
  const [ads, setAds] = useState([]);
  const [cart, setCart] = useState(loadStoredCart);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDish, setSelectedDish] = useState(null);
  const [tableNumber, setTableNumber] = useState(1);
  const [order, setOrder] = useState(null);
  const [remainingPrep, setRemainingPrep] = useState(null);
  const [remainingCancelMs, setRemainingCancelMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Ola! Posso ajudar com o cardapio e os pedidos.' },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const orderRef = useRef(null);
  const streamControllerRef = useRef(null);

  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setOnUnauthorized(() => {
      setToken('');
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('interactive_cart');
      clearOrderSession();
      setCart([]);
      setOrder(null);
    });
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const username = loginUsername.trim();
    const password = loginPassword.trim();
    if (!username || !password) {
      setLoginError('Por favor, preencha todos os campos.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    try {
      const response = await login(username, password);
      const { token: newCtxToken, user: newCtxUser } = response;
      localStorage.setItem('token', newCtxToken);
      localStorage.setItem('user', JSON.stringify(newCtxUser));
      setToken(newCtxToken);
      setUser(newCtxUser);
      toast.success(`Bem-vindo, ${newCtxUser.username}!`);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('interactive_cart');
    clearOrderSession();
    setCart([]);
    setOrder(null);
    setToken('');
    setUser(null);
    toast.info('Sessão encerrada.');
  };

  const open = isOpenNow(settings);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  const categories = useMemo(() => {
    const ids = Array.from(new Set(dishes.map((dish) => dish.category_id).filter(Boolean)));
    return ids.map((id) => ({ id: String(id), name: CATEGORY_NAMES[id] || `Categoria ${id}` }));
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    if (selectedCategory === 'all') return dishes;
    return dishes.filter((dish) => String(dish.category_id) === selectedCategory);
  }, [dishes, selectedCategory]);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    saveStoredCart(cart);
  }, [cart]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [settingsData, menuData, adsData] = await Promise.all([
          getSettings().catch(() => DEFAULT_SETTINGS),
          getMenu(),
          getAds().catch(() => []),
        ]);

        setSettings({ ...DEFAULT_SETTINGS, ...(settingsData || {}) });
        setDishes(Array.isArray(menuData) ? menuData.map(normalizeDish) : []);
        setAds(Array.isArray(adsData) ? adsData.filter((ad) => ad.is_active) : []);

        try {
          const id = sessionStorage.getItem('currentOrderId');
          if (id) {
            const prepSeconds = Number(sessionStorage.getItem('currentPrepSeconds')) || 0;
            const cancelUntil = sessionStorage.getItem('currentCancelUntil') || null;
            const status = sessionStorage.getItem('currentOrderStatus') || 'pending';
            setOrder({ id: Number(id), prepSeconds, cancelUntil, status });
            setRemainingPrep(prepSeconds);
          }
        } catch {}
      } catch (err) {
        setError(err.message || 'Erro ao carregar o client web.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => streamControllerRef.current?.abort();
  }, [token]);

  useEffect(() => {
    if (ads.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentAdIndex((current) => (current + 1) % ads.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [ads.length]);

  useEffect(() => {
    const unsubPrep = subscribeToEvent('PREP_TIME_UPDATE', (payload) => {
      const activeOrder = orderRef.current;
      if (activeOrder?.id && Number(payload.order_id) === Number(activeOrder.id)) {
        const seconds = Number(payload.prep_time_seconds) || 0;
        const next = { ...activeOrder, prepSeconds: seconds };
        setOrder(next);
        setRemainingPrep(seconds);
        saveOrderSession(next);
      }
    });

    const unsubStatus = subscribeToEvent('ORDER_STATUS_UPDATE', (payload) => {
      const activeOrder = orderRef.current;
      if (activeOrder?.id && Number(payload.id) === Number(activeOrder.id)) {
        const status = payload.status || activeOrder.status;
        const next = { ...activeOrder, status };
        setOrder(next);
        saveOrderSession(next);
        if (status === 'completed') {
          toast.success('Seu pedido esta pronto.');
          setRemainingPrep(null);
          setRemainingCancelMs(0);
        }
      }
    });

    const unsubCancelled = subscribeToEvent('ORDER_CANCELLED', (payload) => {
      const activeOrder = orderRef.current;
      const payloadId = payload.order_id || payload.id;
      if (activeOrder?.id && Number(payloadId) === Number(activeOrder.id)) {
        toast.warn('Seu pedido foi cancelado.');
        setOrder(null);
        setRemainingPrep(null);
        setRemainingCancelMs(0);
        clearOrderSession();
      }
    });

    const unsubCourtesy = subscribeToEvent('COURTESY_MESSAGE', (payload) => {
      const activeOrder = orderRef.current;
      if (activeOrder?.id && Number(payload.order_id) === Number(activeOrder.id)) {
        toast.info(payload.message || 'Seu pedido sera atualizado em breve.');
      }
    });

    return () => {
      unsubPrep();
      unsubStatus();
      unsubCancelled();
      unsubCourtesy();
    };
  }, []);

  useEffect(() => {
    if (!order?.cancelUntil || order.status === 'completed') {
      setRemainingCancelMs(0);
      return undefined;
    }

    const tick = () => {
      setRemainingCancelMs(Math.max(0, new Date(order.cancelUntil).getTime() - Date.now()));
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [order?.cancelUntil, order?.status]);

  useEffect(() => {
    if (typeof remainingPrep !== 'number' || order?.status === 'completed') return undefined;
    const timer = setInterval(() => {
      setRemainingPrep((current) => (current != null ? Math.max(0, current - 1) : current));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingPrep, order?.status]);

  const addToCart = (dish) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === dish.id);
      if (existing) {
        return current.map((item) => (item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...dish, quantity: 1 }];
    });
    toast.success(`${dish.name} adicionado ao carrinho.`);
  };

  const updateQuantity = (id, quantity) => {
    setCart((current) => current.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)));
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;
    if (!open) {
      toast.error('Estamos fechados no momento.');
      return;
    }

    try {
      const response = await postOrder({
        table_number: Number(tableNumber) || 1,
        items: cart.map((item) => ({ dish_id: item.id, quantity: item.quantity })),
      });
      const nextOrder = {
        id: response.order_id,
        prepSeconds: Number(response.prep_time_seconds) || 0,
        cancelUntil: response.cancel_until || null,
        status: 'pending',
      };
      setOrder(nextOrder);
      setRemainingPrep(nextOrder.prepSeconds);
      setCart([]);
      saveOrderSession(nextOrder);
      toast.success('Pedido enviado com sucesso.');
    } catch {
      toast.error('Nao foi possivel enviar o pedido.');
    }
  };

  const cancelCurrentOrder = async () => {
    if (!order?.id) return;
    try {
      await cancelOrder(order.id);
      setOrder(null);
      setRemainingPrep(null);
      setRemainingCancelMs(0);
      clearOrderSession();
      toast.success('Pedido cancelado.');
    } catch {
      toast.error('Janela de cancelamento expirada ou pedido indisponivel.');
    }
  };

  const requestWaiter = async (reason = 'Chamado Geral') => {
    try {
      await callWaiter(Number(tableNumber) || 1, reason);
      toast.success('Garcom chamado.');
    } catch {
      toast.error('Nao foi possivel chamar o garcom.');
    }
  };

  const sendChat = async (event) => {
    event?.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    streamControllerRef.current?.abort();
    setChatMessages((current) => [...current, { sender: 'user', text: message }, { sender: 'ai', text: '...' }]);
    setChatInput('');
    setChatLoading(true);

    const controller = new AbortController();
    streamControllerRef.current = controller;
    let streamedText = '';

    try {
      await streamChatMessage(message, {
        signal: controller.signal,
        onEvent: (payload) => {
          if (payload.type === 'chunk') {
            streamedText += payload.content || '';
            setChatMessages((current) => {
              const next = [...current];
              const index = next.map((item) => item.sender).lastIndexOf('ai');
              if (index >= 0) next[index] = { sender: 'ai', text: streamedText };
              return next;
            });
          }
        },
      });
      if (!streamedText.trim()) {
        setChatMessages((current) => current.map((item, index) => (
          index === current.length - 1 ? { sender: 'ai', text: 'Nao recebi resposta agora. Tente novamente.' } : item
        )));
      }
    } catch {
      setChatMessages((current) => current.map((item, index) => (
        index === current.length - 1 ? { sender: 'ai', text: 'Falha ao conectar ao assistente.' } : item
      )));
    } finally {
      setChatLoading(false);
      streamControllerRef.current = null;
    }
  };

  const loadGreeting = async () => {
    try {
      const response = await getAiGreeting();
      if (response?.greeting) setChatMessages([{ sender: 'ai', text: response.greeting }]);
    } catch {}
  };

  useEffect(() => {
    loadGreeting();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-100 border-t-red-600" />
          <p className="font-semibold text-slate-800">Carregando client web...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-red-700">Erro ao abrir o cardapio</h1>
          <p className="mt-3 text-slate-600">{error}</p>
          <button className="mt-6 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-900/10 blur-[120px]" />
        
        <ToastContainer position="top-right" autoClose={3000} newestOnTop theme="dark" />

        <div className="w-full max-w-md border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8 shadow-2xl relative z-10 transition-all duration-300">
          <div className="mb-8 text-center">
            <div className="inline-block bg-gradient-to-r from-red-600 to-amber-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-white mb-4">
              Acesso Restrito
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">
              Restaurante <span className="text-red-500">Digital</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400 font-medium">
              Autentique-se para configurar esta mesa
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError ? (
              <div className="border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-400">
                {loginError}
              </div>
            ) : null}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2" htmlFor="username">
                Nome de Usuário
              </label>
              <input
                id="username"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-red-600 transition-colors placeholder-slate-600"
                placeholder="Ex: admin"
                disabled={loginLoading}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-red-600 transition-colors placeholder-slate-600"
                placeholder="••••••••"
                disabled={loginLoading}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-widest py-4 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loginLoading ? 'Conectando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentAd = ads[currentAdIndex];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <ToastContainer position="top-right" autoClose={3000} newestOnTop theme="light" />

      <header className="bg-gradient-to-r from-red-800 via-red-700 to-red-600 text-white shadow-xl relative">
        {user ? (
          <div className="absolute top-4 right-4 flex items-center gap-3 bg-black/25 px-3 py-1.5 text-xs">
            <span className="font-semibold text-white/80">
              Usuário: <strong className="text-white">{user.username}</strong>
            </span>
            <span className="text-white/45">|</span>
            <button
              onClick={handleLogout}
              className="font-black uppercase tracking-wider text-red-200 hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>
        ) : null}
        <div className="mx-auto max-w-7xl px-4 py-8 text-center md:py-10">
          {settings.restaurant_logo_url ? (
            <img
              src={resolveImageUrl(settings.restaurant_logo_url)}
              alt={settings.restaurant_name}
              className="mx-auto mb-4 h-16 w-auto rounded-xl bg-white/10 object-contain p-1"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{settings.restaurant_name || 'Restaurante'}</h1>
          <p className="mt-3 text-lg text-white/90">Sabor que encanta, momentos que ficam.</p>
          <div className="mt-5 inline-flex rounded-full bg-white/15 px-5 py-2 text-sm font-bold uppercase tracking-[0.24em]">
            Cardapio digital
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
      </header>

      {!open ? (
        <div className="bg-yellow-100 px-4 py-3 text-center text-sm font-bold text-yellow-900">
          Estamos fechados. Horario: {settings.open_time || '00:00'} - {settings.close_time || '23:59'}.
        </div>
      ) : null}

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-white/70 bg-white p-4 shadow-xl md:p-6">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Nosso Cardapio</h2>
          </div>

          <div className="sticky top-0 z-10 -mx-2 mb-6 bg-white/95 px-2 py-2 backdrop-blur">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${selectedCategory === 'all' ? 'border-red-600 bg-red-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
                onClick={() => setSelectedCategory('all')}
              >
                Todos ({dishes.length})
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${selectedCategory === category.id ? 'border-red-600 bg-red-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {filteredDishes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
              Nenhum prato disponivel nesta categoria.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDishes.map((dish) => (
                <article key={dish.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                  <button className="block w-full text-left" onClick={() => setSelectedDish(dish)}>
                    <img
                      src={dish.image_url ? resolveImageUrl(dish.image_url) : PLACEHOLDER_IMG}
                      alt={dish.name}
                      className="h-48 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = PLACEHOLDER_IMG;
                      }}
                    />
                  </button>
                  <div className="p-4">
                    <h3 className="text-xl font-black text-slate-900">{dish.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">{dish.description || 'Sem descricao.'}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-lg font-black text-red-600">{formatCurrency(dish.price)}</p>
                      <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white" onClick={() => addToCart(dish)}>
                        Pedir
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">Carrinho</h2>
              <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-700">{totalItems} itens</span>
            </div>
            <label className="mb-2 block text-sm font-bold text-slate-600" htmlFor="table">
              Numero da mesa
            </label>
            <input
              id="table"
              type="number"
              min="1"
              max={Number(settings.tables_count) || 50}
              value={tableNumber}
              onChange={(event) => setTableNumber(Number(event.target.value) || 1)}
              className="mb-5 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
            />

            {order ? (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-amber-900">Pedido #{order.id}</p>
                    <p className="text-sm text-amber-800">
                      {order.status === 'completed' ? 'Pronto' : `Preparo: ${formatSeconds(remainingPrep)}`}
                    </p>
                  </div>
                  {order.status !== 'completed' ? (
                    <button
                      className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-400"
                      disabled={remainingCancelMs <= 0}
                      onClick={cancelCurrentOrder}
                    >
                      {remainingCancelMs > 0 ? `Cancelar ${Math.ceil(remainingCancelMs / 1000)}s` : 'Sem cancelamento'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Carrinho vazio.
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-slate-500">{formatCurrency(item.price)} cada</p>
                      </div>
                      <p className="font-black text-red-600">{formatCurrency(Number(item.price || 0) * item.quantity)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button className="h-8 w-8 rounded-full bg-slate-200 font-black" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                        <span className="min-w-8 text-center font-black">{item.quantity}</span>
                        <button className="h-8 w-8 rounded-full bg-slate-200 font-black" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="text-sm font-bold text-red-600" onClick={() => removeFromCart(item.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-200 pt-4 text-xl font-black">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <button className="w-full rounded-2xl bg-green-600 px-4 py-3 font-black text-white" onClick={submitOrder}>
                  Finalizar pedido
                </button>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-xl font-black">Precisa de ajuda?</h2>
            <p className="mt-2 text-sm text-slate-500">Chame o garcom para sua mesa.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-2xl bg-yellow-500 px-3 py-3 text-sm font-black text-white" onClick={() => requestWaiter('Chamado Geral')}>
                Garcom
              </button>
              <button className="rounded-2xl bg-slate-800 px-3 py-3 text-sm font-black text-white" onClick={() => requestWaiter('Conta - Pedir a Conta')}>
                Conta
              </button>
            </div>
          </section>
        </aside>
      </main>

      <footer className="mt-4 bg-slate-950 px-4 py-8 text-center text-white">
        <div className="mx-auto max-w-7xl">
          {currentAd ? (
            <div className="mb-8 rounded-3xl bg-red-700 p-5">
              <img
                src={currentAd.image_url ? resolveImageUrl(currentAd.image_url) : PLACEHOLDER_IMG}
                alt={currentAd.title}
                className="mx-auto max-h-44 rounded-2xl object-contain"
                onError={(event) => {
                  event.currentTarget.src = PLACEHOLDER_IMG;
                }}
              />
              <h3 className="mt-4 text-2xl font-black">{currentAd.title}</h3>
              <p className="mt-2 text-red-100">{currentAd.content}</p>
            </div>
          ) : null}
          <p className="text-slate-300">Obrigado por escolher nosso restaurante.</p>
          <p className="mt-2 text-sm text-slate-500">Sistema de Pedidos Digital</p>
        </div>
      </footer>

      <button
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl font-black text-white shadow-2xl"
        onClick={() => setChatOpen((value) => !value)}
        aria-label="Abrir chat"
      >
        {chatOpen ? 'X' : '?'}
      </button>

      {chatOpen ? (
        <section className="fixed bottom-24 right-4 z-40 flex h-[480px] w-[calc(100vw-2rem)] max-w-sm flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="rounded-t-3xl bg-slate-900 p-4 text-white">
            <h2 className="text-lg font-black">Assistente virtual</h2>
            <p className="text-xs text-slate-300">Pergunte sobre pratos e pedidos.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {chatMessages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.sender === 'user' ? 'bg-red-600 text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <form className="flex gap-2 border-t border-slate-200 p-3" onSubmit={sendChat}>
            <input
              className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500"
              placeholder={chatLoading ? 'Aguarde...' : 'Digite sua pergunta'}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              disabled={chatLoading}
            />
            <button className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60" disabled={chatLoading || !chatInput.trim()}>
              Enviar
            </button>
          </form>
        </section>
      ) : null}

      {selectedDish ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedDish(null)}>
          <article className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={selectedDish.image_url ? resolveImageUrl(selectedDish.image_url) : PLACEHOLDER_IMG}
              alt={selectedDish.name}
              className="h-72 w-full object-cover"
              onError={(event) => {
                event.currentTarget.src = PLACEHOLDER_IMG;
              }}
            />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">{selectedDish.name}</h2>
                  <p className="mt-3 text-slate-600">{selectedDish.description || 'Sem descricao.'}</p>
                </div>
                <button className="rounded-full bg-slate-100 px-3 py-2 font-black" onClick={() => setSelectedDish(null)}>
                  X
                </button>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-2xl font-black text-red-600">{formatCurrency(selectedDish.price)}</p>
                <button className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white" onClick={() => addToCart(selectedDish)}>
                  Adicionar ao carrinho
                </button>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}

export default App;
