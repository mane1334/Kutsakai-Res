export const normalizeServerHost = (rawValue?: string | null): string => {
  const value = String(rawValue || '').trim();

  if (!value) {
    return '';
  }

  let normalized = value
    .replace(/^https?:\/\//i, '')
    .replace(/^wss?:\/\//i, '')
    .replace(/\/.*$/, '');

  if (normalized.endsWith(':3000')) {
    normalized = normalized.slice(0, -5);
  }

  return normalized.trim();
};

export const buildBaseUrl = (host: string, port = 3000): string => {
  const normalizedHost = normalizeServerHost(host);
  return normalizedHost ? `http://${normalizedHost}:${port}` : '';
};

export const buildApiUrl = (host: string, port = 3000): string => {
  const baseUrl = buildBaseUrl(host, port);
  return baseUrl ? `${baseUrl}/api` : '';
};

export const buildWsUrl = (host: string, port = 3000): string => {
  const normalizedHost = normalizeServerHost(host);
  return normalizedHost ? `ws://${normalizedHost}:${port}` : '';
};

export const fetchWithTimeout = (url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = options.signal || controller.signal;

  return fetch(url, { ...options, signal })
    .finally(() => clearTimeout(timeoutId));
};
