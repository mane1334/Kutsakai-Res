// Vite exposes env via import.meta.env. Use try/catch to stay compatible in non-Vite contexts.
let VITE_API = null;
let VITE_BASE = null;
try {
  VITE_API = import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : null;
  VITE_BASE = import.meta.env && import.meta.env.VITE_BASE_URL ? import.meta.env.VITE_BASE_URL : null;
} catch (_) {}

const normalizeBaseUrl = (rawValue) => {
  const value = String(rawValue || '').trim().replace(/\/+$/, '');
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `http://${value.replace(/\/.*$/, '')}`;
};

const getDefaultBase = () => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${hostname}:3000`;
  }

  return 'http://localhost:3000';
};

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedBase = window.localStorage.getItem('API_BASE_URL');
    if (savedBase) return normalizeBaseUrl(savedBase);
  }

  return normalizeBaseUrl(VITE_BASE || getDefaultBase());
};

const BASE_URL = getBaseUrl();
const API_URL = VITE_API || `${BASE_URL}/api`;

console.log('Configuração da API:', { BASE_URL, API_URL });

export { API_URL, BASE_URL };
