import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { View, Text, Alert, NativeModules, AppState as RNAppState, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import CartModal from './CartModal';
import { Dish, AdItem, Settings } from './types';
import { themes } from './themes';
import { translations, Language, TranslationKey } from './translations';
import { saveState, loadState } from './persistence';
import { buildApiUrl, buildBaseUrl, buildWsUrl, fetchWithTimeout, normalizeServerHost } from './utils/network';
import { normalizeOrderStatus } from './utils/orderStatus';

// Hooks
import { useCart } from './hooks/useCart';
import { useOrder } from './hooks/useOrder';
import { useInactivityLock } from './hooks/useInactivityLock';

// Components
import ChatModal from './components/ChatModal';
import SettingsModal from './components/SettingsModal';
import AdCarousel from './components/AdCarousel';
import OrderReviewModal from './components/OrderReviewModal';
import WaiterCallModal from './components/WaiterCallModal';
import OrderCompletedModal from './components/OrderCompletedModal';
import OrderStatusBar from './components/OrderStatusBar';
import Toast from './components/Toast';

// Screens
import HomeScreen from './screens/HomeScreen';
import DishDetailsScreen from './screens/DishDetailsScreen';

const { KioskModule } = NativeModules;
const Stack = createStackNavigator();

const asBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
  }
  return fallback;
};

const asNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const normalizeSettingsPayload = (raw: Settings | null): Settings | null => {
  if (!raw) return null;
  return {
    ...raw,
    inactivity_timeout_minutes: asNumber(raw.inactivity_timeout_minutes),
    tables_count: asNumber(raw.tables_count),
    default_prep_time: asNumber(raw.default_prep_time),
    cancellation_window: asNumber(raw.cancellation_window),
    enable_ai_chat: asBoolean(raw.enable_ai_chat, true),
    enable_customer_ratings: asBoolean(raw.enable_customer_ratings, true),
    enable_ads_module: asBoolean(raw.enable_ads_module, true),
    screen_lock_enabled: asBoolean(raw.screen_lock_enabled, false),
  };
};

const isValidHexColor = (value?: string) => !!value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

const App = () => {
  const [menu, setMenu] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(process.env.NODE_ENV === 'test' ? false : true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isChatVisible, setChatVisible] = useState(false);
  const [isCartVisible, setCartVisible] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isReviewVisible, setReviewVisible] = useState(false);
  const [isWaiterModalVisible, setWaiterModalVisible] = useState(false);
  const [orderCompletedModalVisible, setOrderCompletedModalVisible] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);
  const hideToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);

  const [activeAds, setActiveAds] = useState<AdItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [delayBanner, setDelayBanner] = useState<{ visible: boolean; text: string }>(() => ({ visible: false, text: '' }));
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('closed');

  // Dynamic Config
  const [serverIp, setServerIp] = useState('10.0.2.2');
  const [vpsIp, setVpsIp] = useState('');
  const [tableNumber, setTableNumber] = useState('1');
  const [restaurantId, setRestaurantId] = useState('1');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('pt');

  const normalizedSettings = useMemo(() => normalizeSettingsPayload(settings), [settings]);

  // === HOOKS ===
  const { cart, addToCart, removeFromCart, changeQuantity, clearCart, itemCount } = useCart({
    onItemAdded: (name, qty) => showToast(`${qty}x ${name} adicionado!`, 'success'),
  });

  const normalizedServerHost = normalizeServerHost(serverIp);
  const currentBaseUrl = buildBaseUrl(normalizedServerHost);
  const currentApiUrl = buildApiUrl(normalizedServerHost);
  const currentWsUrl = buildWsUrl(normalizedServerHost);

  const { currentOrder, isSendingOrder, sendOrder, cancelOrder, setCurrentOrder, checkOrderStatus } = useOrder({
    apiUrl: currentApiUrl,
    tableNumber,
    restaurantId,
    onOrderSent: () => {
      showToast('Pedido enviado com sucesso!', 'success');
      clearCart();
      setCartVisible(false);
    },
  });

  const { isLocked: locked, lock: lockScreen, unlock: unlockScreen, registerInteraction } = useInactivityLock({
    timeoutMinutes: Number(normalizedSettings?.inactivity_timeout_minutes) || 0,
    enabled: (Number(normalizedSettings?.inactivity_timeout_minutes) || 0) > 0,
  });

  // === DERIVED STATE ===
  const theme = useMemo(() => {
    const themeKey = normalizedSettings?.menu_theme || currentTheme || 'light';
    const baseTheme = themes[themeKey] || themes.light;
    const primaryColor = isValidHexColor(normalizedSettings?.primary_color)
      ? String(normalizedSettings?.primary_color).trim()
      : baseTheme.colors.primary;
    return { ...baseTheme, colors: { ...baseTheme.colors, primary: primaryColor } };
  }, [normalizedSettings, currentTheme]);

  const t = useCallback((key: TranslationKey) => translations[currentLanguage][key] || key, [currentLanguage]);
  const chatEnabled = normalizedSettings?.enable_ai_chat !== false;
  const ratingsEnabled = normalizedSettings?.enable_customer_ratings !== false;
  const adsEnabled = normalizedSettings?.enable_ads_module !== false;
  const currencySymbol = normalizedSettings?.currency_symbol?.trim() || 'MT';

  // === PERSISTENCE ===
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') return;

    const init = async () => {
      const state = await loadState();
      setServerIp(normalizeServerHost(state.serverIp));
      if (state.vpsIp) setVpsIp(normalizeServerHost(state.vpsIp));
      setTableNumber(state.tableNumber);
      setRestaurantId(state.restaurantId || '1');
      setCurrentTheme(state.currentTheme || 'light');
      setCurrentLanguage(state.currentLanguage as Language);

      if (state.currentOrder) {
        const savedHost = normalizeServerHost(state.serverIp);
        setCurrentOrder(state.currentOrder);
        checkOrderStatus(state.currentOrder.id, buildApiUrl(savedHost), state.restaurantId || '1');
      }
    };
    init();

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        KioskModule?.startKiosk();
        const activeOrder = currentOrderRef.current;
        if (activeOrder) {
          checkOrderStatus(activeOrder.id);
        }
      }
    };
    KioskModule?.startKiosk();
    const sub = RNAppState.addEventListener('change', handleAppStateChange);
    return () => { sub.remove(); };
  }, []);

  useEffect(() => {
    saveState({ serverIp, vpsIp, tableNumber, currentTheme, currentLanguage, currentOrder, restaurantId });
  }, [serverIp, vpsIp, tableNumber, currentTheme, currentLanguage, currentOrder, restaurantId]);

  useEffect(() => {
    if (!currentOrder) return undefined;
    const interval = setInterval(() => {
      checkOrderStatus(currentOrder.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentOrder?.id, checkOrderStatus]);

  // === FETCH DATA ===
  const fetchData = useCallback(async () => {
    if (!normalizedServerHost) {
      setError('Servidor nÃ£o configurado. Informe o IP nas configuraÃ§Ãµes.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const runFetch = async (ipHost: string) => {
        const url = buildApiUrl(ipHost);
        if (!url) throw new Error('Servidor nÃ£o configurado.');
        const fetchOpts = { headers: { 'x-restaurant-id': restaurantId } };
        const [menuRes, adsRes, settingsRes, catsRes] = await Promise.all([
          fetchWithTimeout(`${url}/dishes`, fetchOpts),
          fetchWithTimeout(`${url}/ads`, fetchOpts),
          fetchWithTimeout(`${url}/settings`, fetchOpts),
          fetchWithTimeout(`${url}/categories`, fetchOpts)
        ]);
        if (!menuRes.ok) throw new Error('Servidor não encontrado.');
        return {
          menuData: await menuRes.json(),
          adsData: await adsRes.json(),
          settingsData: await settingsRes.json(),
          catsData: await catsRes.json(),
          activeHost: ipHost
        };
      };

      let result;
      try {
        result = await runFetch(normalizedServerHost);
      } catch (err) {
        if (vpsIp && normalizeServerHost(vpsIp)) {
          if (__DEV__) console.log('Exceção conectando ao IP principal. Tentando VPS...');
          result = await runFetch(normalizeServerHost(vpsIp));
          setServerIp(result.activeHost);
        } else {
          throw err;
        }
      }

      const { menuData, adsData, settingsData, catsData, activeHost } = result;
      const baseUrl = buildBaseUrl(activeHost);
      const resolveUrl = (url: string | undefined) => {
        if (!url) return 'https://via.placeholder.com/300';
        if (url.startsWith('http')) {
          if (url.includes('localhost') || url.includes('127.0.0.1')) {
            return url.replace(/http:\/\/[^/]+/, baseUrl);
          }
          return url;
        }
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return `${baseUrl}/${url}`;
      };

      const processedMenu = menuData.map((dish: Dish) => ({ ...dish, image_url: resolveUrl(dish.image_url) }));
      const processedAds = adsData.map((ad: AdItem) => ({ ...ad, image_url: resolveUrl(ad.image_url) }));
      const normalizedFetchedSettings = normalizeSettingsPayload(settingsData);

      setMenu(processedMenu);
      setSettings(normalizedFetchedSettings);
      if (normalizedFetchedSettings?.menu_theme && themes[normalizedFetchedSettings.menu_theme]) {
        setCurrentTheme(normalizedFetchedSettings.menu_theme);
      }
      setCategories(['Todos', ...catsData.map((c: any) => c.name)]);

      const now = new Date();
      setActiveAds((normalizedFetchedSettings?.enable_ads_module === false ? [] : processedAds.filter((ad: AdItem) => {
        const startDate = ad.start_date ? new Date(ad.start_date) : new Date(0);
        const endDate = ad.end_date ? new Date(ad.end_date) : new Date(8640000000000000);
        return ad.is_active && now >= startDate && now <= endDate;
      })));
    } catch (error: any) {
      setError('Não foi possível conectar ao servidor. Verifique o IP nas configurações.');
    } finally {
      setIsLoading(false);
    }
  }, [normalizedServerHost, vpsIp, restaurantId]);

  // === RATINGS ===
  const handleRateDish = useCallback(async (dishId: number, rating: number) => {
    if (!currentApiUrl) return;
    try {
      await fetchWithTimeout(`${currentApiUrl}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-restaurant-id': restaurantId },
        body: JSON.stringify({ dish_id: dishId, rating, comment: 'Avaliado via Mobile' }),
      });
      setMenu(prev => prev.map(d => d.id === dishId ? { ...d, average_rating: rating } : d));
      Alert.alert('Obrigado!', 'Sua avaliação foi enviada.');
    } catch (e) {
      if (__DEV__) console.error('Erro ao avaliar:', e);
    }
  }, [currentApiUrl, restaurantId]);

  const handleReviewSubmit = useCallback(async (rating: number, comment: string) => {
    if (!currentApiUrl) return;

    try {
      await fetchWithTimeout(`${currentApiUrl}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-restaurant-id': restaurantId },
        body: JSON.stringify({
          order_id: currentOrderRef.current?.id,
          rating,
          comment: comment || 'Avaliado apos pedido concluido',
        }),
      });
      Alert.alert('Obrigado!', 'Agradecemos seu feedback.');
      setReviewVisible(false);
      setCurrentOrder(null);
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel enviar sua avaliacao.');
      if (__DEV__) console.error('Erro ao enviar feedback do pedido:', e);
    }
  }, [currentApiUrl, restaurantId, setCurrentOrder]);

  // === WAITER CALL ===
  const handleCallWaiter = useCallback(async (reason: string = 'Chamado Geral') => {
    if (!currentApiUrl) {
      Alert.alert('Erro', 'Servidor nÃ£o configurado.');
      return;
    }

    try {
      await fetchWithTimeout(`${currentApiUrl}/call-waiter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-restaurant-id': restaurantId },
        body: JSON.stringify({ table_number: parseInt(tableNumber), reason }),
      });
      setWaiterModalVisible(false);
      showToast('O garçom foi chamado!', 'success');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível chamar o garçom.');
    }
  }, [currentApiUrl, restaurantId, tableNumber, showToast]);

  // === SEND ORDER (wraps hook) ===
  const handleSendOrder = useCallback(async () => {
    await sendOrder(cart);
  }, [sendOrder, cart]);

  const handleCancelOrder = useCallback(async () => {
    await cancelOrder();
    showToast('Pedido cancelado.', 'info');
  }, [cancelOrder, showToast]);

  // === WEBSOCKET ===
  const currentOrderRef = useRef(currentOrder);
  useEffect(() => { currentOrderRef.current = currentOrder; }, [currentOrder]);
  const ratingsEnabledRef = useRef(ratingsEnabled);
  useEffect(() => { ratingsEnabledRef.current = ratingsEnabled; }, [ratingsEnabled]);
  const tableNumberRef = useRef(tableNumber);
  useEffect(() => { tableNumberRef.current = tableNumber; }, [tableNumber]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') return;

    if (normalizedServerHost) fetchData();
    if (!currentWsUrl) {
      setWsStatus('closed');
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectAttempt = 0;
    let closedByCleanup = false;

    const connect = () => {
      if (ws) ws.close();
      setWsStatus('connecting');
      ws = new WebSocket(currentWsUrl);
      ws.onopen = () => {
        setWsStatus('open');
        reconnectAttempt = 0;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 30000);
        if (__DEV__) console.log('Conectado ao WebSocket.');
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'WAITER_CALL_RESOLVED') {
            if (String(data.payload.table_number) === String(tableNumberRef.current)) {
              showToast('Sua solicitação ao garçom foi atendida.', 'success');
            }
            return;
          }

          const activeOrder = currentOrderRef.current;
          if (!activeOrder) return;
          if (!data.payload) return;
          const payloadOrderId = data.payload.order_id || data.payload.id;
          if (payloadOrderId != activeOrder.id) return;

          if (data.type === 'PREP_TIME_UPDATE') {
            const secs = Number(data.payload.prep_time_seconds || data.payload.prep_time) || 0;
            const cancelUntil = data.payload.cancel_until || activeOrder.cancelUntil;
            setCurrentOrder(prev => prev ? { ...prev, prepSeconds: secs, cancelUntil } : prev);
          } else if (data.type === 'ORDER_CANCELLED') {
            const reason = data.payload.cancellation_reason || 'Motivo não informado.';
            Alert.alert('Pedido cancelado pela cozinha', `Motivo: ${reason}`);
            setCurrentOrder(null);
          } else if (data.type === 'COURTESY_MESSAGE') {
            const text = data.payload.message || 'Msg';
            setDelayBanner({ visible: true, text });
            setTimeout(() => setDelayBanner({ visible: false, text: '' }), 30000);
            Alert.alert('Atualização', text);
          } else if (data.type === 'ORDER_STATUS_UPDATE') {
            const status = normalizeOrderStatus(data.payload.status);
            const cancelUntilUpdate = data.payload.cancel_until || activeOrder.cancelUntil;
            const prepSeconds = Number(data.payload.prep_time_seconds) || activeOrder.prepSeconds;
            if (status === 'preparing') {
              Alert.alert('Status', '👨‍🍳 Seu pedido está sendo preparado!');
              setCurrentOrder(prev => {
                if (!prev) return null;
                const preparingCancelUntil = prev.preparingCancelUntil || new Date(Date.now() + 30000).toISOString();
                return { ...prev, prepSeconds, cancelUntil: cancelUntilUpdate, status, preparingCancelUntil };
              });
            } else if (status === 'completed') {
              setOrderCompletedModalVisible(true);
              setCurrentOrder(null);
              if (ratingsEnabledRef.current) setReviewVisible(true);
            } else {
              setCurrentOrder(prev => prev ? { ...prev, prepSeconds, cancelUntil: cancelUntilUpdate, status } : prev);
            }
          } else if (data.type === 'ORDER_COMPLETED') {
            setOrderCompletedModalVisible(true);
            setCurrentOrder(null);
            if (ratingsEnabledRef.current) setReviewVisible(true);
          } else if (data.type === 'DISH_COMPLETED') {
            const dishName = data.payload.dish_name || 'Um prato';
            showToast(`${dishName} está pronto!`, 'success');
          }
        } catch (e) { }
      };
      ws.onclose = () => {
        setWsStatus('closed');
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (closedByCleanup) return;
        if (__DEV__) console.log('WebSocket desconectado. Tentando reconectar...');
        reconnectAttempt += 1;
        const delay = Math.min(30000, 1000 * Math.pow(1.5, reconnectAttempt));
        reconnectTimeout = setTimeout(connect, delay);
      };
      ws.onerror = (e) => {
        setWsStatus('error');
        if (__DEV__) console.log('Erro no WebSocket', e);
        ws?.close();
      };
    };

    connect();
    return () => {
      closedByCleanup = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, [normalizedServerHost, currentWsUrl, fetchData, showToast, setCurrentOrder]);

  // Chat disable sync
  useEffect(() => {
    if (!chatEnabled && isChatVisible) setChatVisible(false);
  }, [chatEnabled, isChatVisible]);

  return (
    <SafeAreaProvider onTouchStart={registerInteraction}>
      <NavigationContainer
        theme={{
          ...DefaultTheme,
          colors: { ...DefaultTheme.colors, background: theme.colors.background },
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: theme.colors.background } }}>
          <Stack.Screen name="Home">
            {(props: any) => <HomeScreen
              {...props}
              menu={menu}
              activeAds={activeAds}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              isLoading={isLoading}
              error={error}
              retryFetch={fetchData}
              addToCart={addToCart}
              handleRateDish={handleRateDish}
              settings={settings}
              theme={theme}
              tableNumber={tableNumber}
              cart={cart}
              currentOrder={currentOrder}
              t={t}
              chatEnabled={chatEnabled}
              adsEnabled={adsEnabled}
              currencySymbol={currencySymbol}
              onOpenSettings={() => setSettingsVisible(true)}
              onLock={lockScreen}
              onCallWaiter={() => setWaiterModalVisible(true)}
              onOpenChat={() => setChatVisible(true)}
              onOpenCart={() => setCartVisible(true)}
              onCancelOrder={handleCancelOrder}
              baseUrl={currentBaseUrl}
              wsStatus={wsStatus}
            />}
          </Stack.Screen>
          <Stack.Screen
            name="DishDetails"
            options={{
              presentation: 'transparentModal',
              cardStyle: { backgroundColor: 'transparent' },
              cardOverlayEnabled: true,
              cardStyleInterpolator: ({ current: { progress } }: { current: { progress: any } }) => ({
                cardStyle: { opacity: progress }
              }),
              gestureEnabled: false,
              transitionSpec: {
                open: { animation: 'timing', config: { duration: 400 } },
                close: { animation: 'timing', config: { duration: 400 } }
              }
            }}
          >
            {(props: any) => <DishDetailsScreen
              {...props}
              theme={theme}
              onAddToCart={addToCart}
              onRate={handleRateDish}
              baseUrl={currentBaseUrl}
              currencySymbol={currencySymbol}
              ratingsEnabled={ratingsEnabled}
              restaurantId={restaurantId}
            />}
          </Stack.Screen>
        </Stack.Navigator>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

        {delayBanner.visible && (
          <View style={styles.delayBanner}>
            <Text style={styles.delayBannerText}>{delayBanner.text}</Text>
          </View>
        )}

        <OrderStatusBar currentOrder={currentOrder} onViewOrder={() => setCartVisible(true)} theme={theme} t={t} />

        <WaiterCallModal visible={isWaiterModalVisible} onClose={() => setWaiterModalVisible(false)} onCall={handleCallWaiter} />
        <ChatModal visible={chatEnabled && isChatVisible} onClose={() => setChatVisible(false)} apiUrl={currentApiUrl} restaurantId={restaurantId} />
        <CartModal
          visible={isCartVisible}
          onClose={() => setCartVisible(false)}
          cart={cart}
          currentOrder={currentOrder}
          onRemoveItem={removeFromCart}
          onChangeQuantity={changeQuantity}
          onSendOrder={handleSendOrder}
          onCancelOrder={handleCancelOrder}
          isSending={isSendingOrder}
          theme={theme}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          currencySymbol={currencySymbol}
        />
        <SettingsModal
          visible={isSettingsVisible}
          onClose={() => setSettingsVisible(false)}
          initialIp={serverIp}
          initialVpsIp={vpsIp}
          initialTable={tableNumber}
          initialRestaurantId={restaurantId}
          onSave={(ip, ipVps, table, newRestaurantId, newTheme, newLang) => {
            setServerIp(normalizeServerHost(ip)); setVpsIp(normalizeServerHost(ipVps)); setTableNumber(table); setRestaurantId(newRestaurantId); setCurrentTheme(newTheme || 'light'); setCurrentLanguage(newLang as Language); setSettingsVisible(false);
          }}
          currentTheme={currentTheme}
          currentLanguage={currentLanguage}
        />
        <OrderReviewModal
          visible={isReviewVisible}
          onClose={() => setReviewVisible(false)}
          onSubmit={handleReviewSubmit}
        />
        <OrderCompletedModal 
          visible={orderCompletedModalVisible} 
          onClose={() => setOrderCompletedModalVisible(false)} 
          theme={theme} 
          t={t} 
        />

        {locked && (
          <View style={styles.lockOverlay}>
            <AdCarousel ads={activeAds} fullScreen />
            <View style={styles.lockPrompt}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Toque para iniciar</Text>
            </View>
            <Text
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
              onPress={() => {
                unlockScreen();
                setCartVisible(false);
                setChatVisible(false);
              }}
            > </Text>
          </View>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  delayBanner: { position: 'absolute', top: 86, left: 20, right: 20, borderRadius: 16, padding: 12, zIndex: 100, backgroundColor: '#fbbf24', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 },
  delayBannerText: { color: '#0f172a', fontWeight: '900', textAlign: 'center', fontSize: 14 },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.92)' },
  lockPrompt: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, zIndex: 2 },
});

export default App;
