
import axios from 'axios';
import { API_URL } from '../config';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorizedCallback = null;

export const setOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback;
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export const getMenu = () => apiClient.get('/menu');
export const postOrder = (order) => apiClient.post('/orders', order);
export const cancelOrder = (orderId) => apiClient.post(`/orders/${orderId}/cancel`);
export const callWaiter = (tableNumber) => apiClient.post('/call-waiter', { table_number: tableNumber });
export const getAds = () => apiClient.get('/ads');
export const sendChatMessage = (message, mode = 'client_app_web') => apiClient.post('/chat', { message, mode });
export const getAiGreeting = () => apiClient.get('/ai/greeting');
export const streamChatMessage = async (message, { signal, onEvent, mode = 'client_app_web' } = {}) => {
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
export const sendVoiceChat = (formData) => apiClient.post('/chat/voice', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Função para buscar as configurações
export const getSettings = () => apiClient.get('/settings');

// --- Autenticação ---
export const login = (username, password) => apiClient.post('/auth/login', { username, password });

// --- Ratings ---
export const submitRating = (ratingData) => apiClient.post('/ratings', ratingData);

export default apiClient;
