
import axios from 'axios';

// Lê a URL da API do arquivo .env, com detecção automática do IP
const getDefaultAPIUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Se estiver em localhost, tenta detectar o IP real da máquina
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3000/api`;
    }

    // Se não for localhost, usa o hostname atual
    return `${protocol}//${hostname}:3000/api`;
  }

  return 'http://localhost:3000/api';
};

const API_URL = import.meta.env.VITE_API_URL || getDefaultAPIUrl();

// Log para debug
console.log('ðŸ”§ Admin Panel - Configuração da API:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Interceptor para tratar respostas e erros de forma centralizada
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Você pode adicionar uma lógica de notificação de erro aqui (ex: usando react-toastify)
    console.error('API Error:', error.response?.data?.error || error.message);

    const status = error.response?.status;
    const code = error.response?.data?.code;
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/setup')
      || requestUrl.includes('/auth/register-restaurant');

    const isAuthFailure = status === 401
      || status === 403
      || code === 'TOKEN_INVALID'
      || code === 'TOKEN_MISSING';

    if (!isAuthRequest && isAuthFailure) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common.Authorization;

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

// --- Settings ---
export const getSettings = () => apiClient.get('/settings');
export const updateSettings = (settingsData) => apiClient.put('/settings', settingsData);

// --- Auth ---
export const registerRestaurant = (payload) => apiClient.post('/auth/register-restaurant', payload);
export const setupSuperadmin = (payload) => apiClient.post('/auth/setup', payload);

// --- Categories ---
export const getCategories = () => apiClient.get('/categories');
export const createCategory = (data) => apiClient.post('/categories', data);
export const updateCategory = (id, data) => apiClient.put(`/categories/${id}`, data);
export const deleteCategory = (id) => apiClient.delete(`/categories/${id}`);

// --- Dishes ---
export const getDishes = () => apiClient.get('/dishes');
export const createDish = (dishData) => apiClient.post('/dishes', dishData);
export const updateDish = (id, dishData) => apiClient.put(`/dishes/${id}`, dishData);
export const deleteDish = (id) => apiClient.delete(`/dishes/${id}`);

// --- Orders ---
export const getOrders = (filters = {}) => apiClient.get('/orders', { params: filters });
export const updateOrderStatus = (id, status, cancellation_reason = null) => apiClient.put(`/orders/${id}/status`, { status, cancellation_reason });
export const updateOrderPrepTime = (id, payload) => apiClient.put(`/orders/${id}/prep-time`, payload);
export const exportOrdersCsv = async (filters = {}) => {
  const response = await apiClient.get('/orders/export', {
    params: filters,
    responseType: 'blob',
  });
  const blob = response instanceof Blob ? response : new Blob([response], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'historico_pedidos.csv');
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
  return { success: true };
};

// --- Analytics ---
export const getAnalytics = () => apiClient.get('/analytics');
export const getAiInsights = () => apiClient.get('/ai/insights');
export const streamChatMessage = async (message, { signal, onEvent, mode = 'consultive_chat' } = {}) => {
  const response = await fetch(`${API_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, mode }),
    signal,
  });

  if (!response.ok) {
    let errorMessage = 'Erro ao iniciar o streaming do chat.';
    try {
      const errorPayload = await response.json();
      errorMessage = errorPayload?.error || errorMessage;
    } catch (_) { }
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  if (!reader) {
    throw new Error('Streaming não suportado neste navegador.');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    events.forEach((eventBlock) => {
      const dataLine = eventBlock
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('data: '));

      if (!dataLine) return;

      try {
        const payload = JSON.parse(dataLine.slice(6));
        onEvent?.(payload);
      } catch (_) { }
    });
  }
};
export const getWaiterCalls = (status) => apiClient.get('/waiter-calls', { params: status ? { status } : {} });
export const resolveWaiterCall = (id) => apiClient.put(`/waiter-calls/${id}/resolve`);
export const getSuperadminOverview = (params = {}) => apiClient.get('/superadmin/overview', { params });
export const getSuperadminRestaurants = (params = {}) => apiClient.get('/superadmin/restaurants', { params });
export const getSuperadminRestaurantDetail = (id, params = {}) => apiClient.get(`/superadmin/restaurants/${id}`, { params });
export const updateSuperadminRestaurantStatus = (id, is_active) => apiClient.patch(`/superadmin/restaurants/${id}/status`, { is_active });
export const exportSuperadminSnapshot = () => apiClient.get('/superadmin/export');

// --- Ads ---
export const getAds = () => apiClient.get('/ads');
export const createAd = (adData) => apiClient.post('/ads', adData);
export const updateAd = (id, adData) => apiClient.put(`/ads/${id}`, adData);
export const deleteAd = (id) => apiClient.delete(`/ads/${id}`);

// --- Ratings ---
export const getRatings = () => apiClient.get('/ratings');
export const getRatingsSummary = () => apiClient.get('/ratings/summary');

// --- Uploads ---
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- Database Management ---
export const getDatabaseStatus = () => apiClient.get('/database/status');
export const testDatabaseConnection = (config) => apiClient.post('/database/test', config);
export const setupDatabase = (config) => apiClient.post('/database/setup', config);

export const exportDatabase = async () => {
  try {
    // Usamos o axios puro para ter mais controle sobre a resposta
    const response = await axios.get(`${API_URL}/database/export`, {
      responseType: 'blob', // Importante para receber o arquivo
    });

    // Cria um link temporário para forçar o download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `backup-${today}.sql`);

    document.body.appendChild(link);
    link.click();

    // Limpa o link e o objeto URL
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar banco de dados:', error);
    // Tenta ler o erro do blob, caso o backend tenha enviado um JSON de erro
    if (error.response && error.response.data) {
      try {
        const errorText = await error.response.data.text();
        const errorJson = JSON.parse(errorText);
        return Promise.reject(errorJson);
      } catch (e) {
        return Promise.reject({ message: 'Ocorreu um erro desconhecido durante o download.' });
      }
    }
    return Promise.reject(error);
  }
};

export const importDatabase = (formData) => {
  return apiClient.post('/database/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default apiClient;
