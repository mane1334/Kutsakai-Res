import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  FiBell,
  FiClock,
  FiDatabase,
  FiGrid,
  FiList,
  FiLogOut,
  FiSettings,
  FiShield,
  FiSliders,
  FiShoppingCart,
  FiStar,
  FiTerminal,
  FiChevronDown,
  FiChevronRight,
  FiCpu,
  FiZap,
} from 'react-icons/fi';
import Notification from '../components/Notification.jsx';
import { useAuth } from '../context/AuthContext';
import { getSettings } from '../services/api';
import { subscribeToEvent } from '../services/socket';
import AiChatDashboard from '../components/AiChatDashboard';

const adminNavItems = [
  { path: '/onboarding', label: 'Onboarding', icon: FiSliders },
  { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/current-orders', label: 'Pedidos Atuais', icon: FiShoppingCart },
  { path: '/waiter-calls', label: 'Chamadas Garçom', icon: FiBell },
  { path: '/orders', label: 'Histórico', icon: FiClock },
  { path: '/categories', label: 'Categorias', icon: FiList },
  { path: '/menu', label: 'Pratos', icon: FiList },
  { path: '/ads', label: 'Anúncios', icon: FiBell },
  { path: '/ratings', label: 'Avaliações', icon: FiStar },
  { path: '/settings', label: 'Configurações', icon: FiSettings },
  { path: '/client-channels', label: 'Clientes Web/App', icon: FiSettings },
  { path: '/database', label: 'Banco de Dados', icon: FiDatabase },
  { path: '/logs', label: 'Status do Sistema', icon: FiTerminal },
];

const adminNavGroups = [
  {
    id: 'operations',
    label: 'Painel & Vendas',
    icon: FiShoppingCart,
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
      { path: '/current-orders', label: 'Pedidos Atuais', icon: FiShoppingCart },
      { path: '/waiter-calls', label: 'Chamadas Garçom', icon: FiBell },
      { path: '/orders', label: 'Histórico', icon: FiClock },
    ],
  },
  {
    id: 'menu_marketing',
    label: 'Cardápio & Anúncios',
    icon: FiList,
    items: [
      { path: '/categories', label: 'Categorias', icon: FiList },
      { path: '/menu', label: 'Pratos', icon: FiList },
      { path: '/ads', label: 'Anúncios', icon: FiBell },
      { path: '/ratings', label: 'Avaliações', icon: FiStar },
    ],
  },
  {
    id: 'ai_consultant',
    label: 'Consultor IA',
    icon: FiCpu,
    items: [
      { action: 'open-ai-chat', label: 'Chat IA', icon: FiCpu },
      { action: 'open-ai-insights', label: 'Insights IA', icon: FiZap },
    ],
  },
  {
    id: 'settings_system',
    label: 'Configurações',
    icon: FiSettings,
    items: [
      { path: '/settings', label: 'Configurações', icon: FiSettings },
      { path: '/client-channels', label: 'Clientes Web/App', icon: FiSettings },
      { path: '/database', label: 'Banco de Dados', icon: FiDatabase },
      { path: '/logs', label: 'Status do Sistema', icon: FiTerminal },
    ],
  },
];

const superadminNavItems = [{ path: '/superadmin', label: 'Visao Global', icon: FiShield }];

function getPageTitle(pathname, role) {
  if (role === 'superadmin') {
    return pathname === '/superadmin' ? 'Painel Superadmin' : 'Superadmin';
  }

  switch (pathname) {
    case '/dashboard':
      return 'Dashboard do Restaurante';
    case '/onboarding':
      return 'Onboarding do Restaurante';
    case '/current-orders':
      return 'Gestão de Pedidos Atuais';
    case '/waiter-calls':
      return 'Chamadas Garçom';
    case '/orders':
      return 'Histórico de Pedidos';
    case '/categories':
      return 'Categorias';
    case '/menu':
      return 'Gerenciamento de Cardápio';
    case '/ads':
      return 'Gestão de Anúncios';
    case '/ratings':
      return 'Gestão de Avaliações';
    case '/settings':
      return 'Configurações Gerais';
    case '/client-channels':
      return 'Clientes Web e App';
    case '/database':
      return 'Configuração do Banco de Dados';
    case '/logs':
      return 'Status do Sistema';
    default:
      return 'Painel';
  }
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const persisted = localStorage.getItem('admin_sidebar_open');
      if (typeof window !== 'undefined' && window.innerWidth >= 768) return true;
      if (persisted === null) return true;
      return persisted === '1';
    } catch {
      return true;
    }
  });
  const [settings, setSettings] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [locked, setLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingCalls, setPendingCalls] = useState(0);
  const location = useLocation();
  const isSuperadmin = user?.role === 'superadmin';
  const pageTitle = getPageTitle(location.pathname, user?.role);
  const navItems = isSuperadmin
    ? superadminNavItems
    : onboardingCompleted
      ? adminNavItems.filter((item) => item.path !== '/onboarding')
      : adminNavItems.filter((item) => item.path === '/onboarding');

  const showGroups = !isSuperadmin && onboardingCompleted;

  const [expandedGroups, setExpandedGroups] = useState({
    operations: true,
    menu_marketing: false,
    ai_consultant: false,
    settings_system: false,
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  useEffect(() => {
    if (!showGroups) return;
    const activeGroup = adminNavGroups.find((group) =>
      group.items.some((item) => item.path === location.pathname)
    );
    if (activeGroup) {
      setExpandedGroups((prev) => ({
        ...prev,
        [activeGroup.id]: true,
      }));
    }
  }, [location.pathname, showGroups]);
  useEffect(() => {
    if (isSuperadmin) {
      return undefined;
    }

    let unsubscribers = [];

    (async () => {
      try {
        const data = await getSettings();
        setSettings(data);
        const onboardingValue = data?.onboarding_completed;
        setOnboardingCompleted(
          onboardingValue === undefined || onboardingValue === null
            ? true
            : onboardingValue === true || onboardingValue === 'true'
        );
        const isLockEnabled = data?.screen_lock_enabled === true || data?.screen_lock_enabled === 'true';
        const persistedLocked = sessionStorage.getItem('admin_locked') === '1';
        if (isLockEnabled && persistedLocked) {
          setLocked(true);
        }
      } catch (error) {
        console.error('Falha ao buscar configurações do admin:', error);
      }
    })();

    unsubscribers = [
      subscribeToEvent('NEW_ORDER', (payload) => {
        setNotification({ text: `Novo pedido da mesa ${payload.table_number}!`, type: 'info' });
      }),
      subscribeToEvent('CALL_WAITER', (payload) => {
        setNotification({ text: `Mesa ${payload.table_number} chamando: ${payload.reason || 'Garcom'}!`, type: 'warning' });
        setPendingCalls((prev) => prev + 1);
      }),
      subscribeToEvent('WAITER_CALL_RESOLVED', () => {
        setPendingCalls((prev) => Math.max(0, prev - 1));
      }),
      subscribeToEvent('PREP_TIME_UPDATE', (payload) => {
        setNotification({ text: `Tempo de preparo ajustado para o pedido #${payload.order_id}`, type: 'info' });
      }),
      subscribeToEvent('ORDER_CANCELLED', (payload) => {
        setNotification({ text: `Pedido #${payload.id} foi cancelado.`, type: 'warning' });
      }),
    ];

    const onToast = (event) => {
      const detail = event.detail || {};
      const text = detail.message || detail.text;
      const type = detail.type || 'success';
      if (text) setNotification({ text, type });
    };

    window.addEventListener('admin:toast', onToast);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      window.removeEventListener('admin:toast', onToast);
    };
  }, [isSuperadmin]);

  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_open', sidebarOpen ? '1' : '0');
    } catch {
      return undefined;
    }
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-surface text-ink">
      <Notification message={notification?.text} type={notification?.type || 'success'} onClear={() => setNotification(null)} />

      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-30 flex w-64 transform flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="admin-sidebar-header h-16 flex items-center px-6">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xl font-black text-white leading-tight">{isSuperadmin ? 'Superadmin' : 'Gestão Pro'}</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-100/80 leading-none">Admin v1.0</p>
            </div>
            {isSuperadmin ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
                Global
              </span>
            ) : null}
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {showGroups ? (
            adminNavGroups.map((group) => {
              const isExpanded = !!expandedGroups[group.id];
              const GroupIcon = group.icon;
              const hasActiveChild = group.items.some((item) => item.path === location.pathname);

              return (
                <div key={group.id} className="flex flex-col mb-1">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 transition-all active:scale-[0.99] text-left cursor-pointer ${
                      hasActiveChild
                        ? 'text-white font-bold bg-white/5'
                        : 'admin-sidebar-link'
                    }`}
                    type="button"
                  >
                    <GroupIcon className="h-4 w-4 stroke-[1.65]" />
                    <span className="flex-1 font-semibold text-sm">{group.label}</span>
                    {isExpanded ? (
                      <FiChevronDown className="h-4 w-4 stroke-[1.65]" />
                    ) : (
                      <FiChevronRight className="h-4 w-4 stroke-[1.65]" />
                    )}
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden mt-1 pl-4 border-l border-white/10 ml-5 space-y-1 ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      if (item.action === 'open-ai-chat') {
                        return (
                          <button
                            key="ai-chat"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('admin:open-ai', { detail: { tab: 'chat' } }));
                              setSidebarOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all active:scale-[0.99] text-xs admin-sidebar-link text-left cursor-pointer"
                            type="button"
                          >
                            <Icon className="h-3.5 w-3.5 stroke-[1.65]" />
                            <span className="flex-1 font-medium">{item.label}</span>
                          </button>
                        );
                      }
                      if (item.action === 'open-ai-insights') {
                        return (
                          <button
                            key="ai-insights"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('admin:open-ai', { detail: { tab: 'insights' } }));
                              setSidebarOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all active:scale-[0.99] text-xs admin-sidebar-link text-left cursor-pointer"
                            type="button"
                          >
                            <Icon className="h-3.5 w-3.5 stroke-[1.65]" />
                            <span className="flex-1 font-medium">{item.label}</span>
                          </button>
                        );
                      }

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all active:scale-[0.99] text-xs ${
                              isActive
                                ? 'admin-sidebar-link-active'
                                : 'admin-sidebar-link'
                            }`
                          }
                        >
                          <Icon className="h-3.5 w-3.5 stroke-[1.65]" />
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.path === '/waiter-calls' && pendingCalls > 0 ? (
                            <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              {pendingCalls}
                            </span>
                          ) : null}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3.5 py-3 transition-all active:scale-[0.99] ${
                    isActive
                      ? 'admin-sidebar-link-active'
                      : 'admin-sidebar-link'
                  }`
                }
              >
                <Icon className="h-4 w-4 stroke-[1.65]" />
                <span className="flex-1 font-medium">{label}</span>
                {path === '/waiter-calls' && pendingCalls > 0 ? (
                  <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {pendingCalls}
                  </span>
                ) : null}
              </NavLink>
            ))
          )}

        </nav>

        <div className="border-t border-white/10 p-4 flex items-center justify-between gap-3 bg-black/15">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xs shrink-0 select-none border border-white/5">
              {(user?.username || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate" title={user?.username}>
                {user?.username || 'Usuário'}
              </span>
              <span className="text-[9px] text-rose-100/50 truncate uppercase tracking-wider font-semibold">
                {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-rose-100 hover:bg-white/10 hover:text-white transition-all cursor-pointer shrink-0"
            title="Sair do Painel"
            type="button"
          >
            <FiLogOut className="h-4 w-4 stroke-[1.65]" />
          </button>
        </div>
      </aside>

      {sidebarOpen ? <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" /> : null}

      <div className={`flex-1 flex flex-col transition-[padding] duration-200 ease-in-out ${sidebarOpen ? 'md:pl-64' : 'md:pl-0'}`}>
        <header className="sticky top-0 z-20 admin-header">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center justify-center rounded-lg p-2 text-rose-100 transition hover:bg-white/10 hover:text-white"
                onClick={() => setSidebarOpen((value) => !value)}
                aria-label={sidebarOpen ? 'Esconder menu' : 'Mostrar menu'}
                title={sidebarOpen ? 'Esconder menu' : 'Mostrar menu'}
                type="button"
              >
                {sidebarOpen ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <div className="min-w-0 border-l border-white/15 pl-3">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-rose-200/60">Sabor & Gestão</p>
                <p className="truncate text-base font-black text-white">{pageTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isSuperadmin && (settings?.screen_lock_enabled === true || settings?.screen_lock_enabled === 'true') ? (
                <button
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.98] cursor-pointer"
                  onClick={() => {
                    setLocked(true);
                    sessionStorage.setItem('admin_locked', '1');
                  }}
                  aria-label="Bloquear tela"
                  type="button"
                >
                  Bloquear
                </button>
              ) : null}
            </div>
          </div>
        </header>

        {locked ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-[#e7c8c2] bg-white p-6 shadow-2xl">
              <h2 className="mb-4 text-xl font-bold text-slate-950">Tela bloqueada</h2>
              <p className="mb-4 text-slate-600">Insira o PIN para desbloquear</p>
              <input
                type="password"
                inputMode="numeric"
                className="mb-4 w-full rounded-lg border border-[#e7c8c2] px-4 py-3 outline-none transition focus:border-[#6d2430] focus:ring-4 focus:ring-rose-900/10"
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value)}
                placeholder="PIN"
              />
              <div className="flex justify-end gap-2">
                <button
                  className="admin-secondary-btn"
                  onClick={() => {
                    setPinInput('');
                    setLocked(true);
                    sessionStorage.setItem('admin_locked', '1');
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="admin-primary-btn"
                  onClick={() => {
                    const pin = settings?.screen_lock_pin ?? '';
                    if (pin && pinInput === pin) {
                      setLocked(false);
                      setPinInput('');
                      sessionStorage.removeItem('admin_locked');
                    } else {
                      alert('PIN incorreto');
                    }
                  }}
                  type="button"
                >
                  Desbloquear
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <AiChatDashboard />
      </div>
    </div>
  );
}
