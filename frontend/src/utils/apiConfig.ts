// API / Socket.io backend origin. Set VITE_API_URL on your static host (Render URL, https, no trailing slash).
// VITE_SOCKET_URL is optional and defaults to VITE_API_URL.
// Empty string means use proxy (same origin) - useful for Docker/nginx setups.
const DEFAULT_LOCAL = 'http://localhost:3001';

const getBaseUrl = (envVar: string | undefined): string => {
  if (envVar === '' || envVar === undefined) return ''; // Use proxy (same origin)
  return envVar || DEFAULT_LOCAL;
};

export const API_BASE_URL = getBaseUrl(import.meta.env.VITE_API_URL);
export const SOCKET_URL = getBaseUrl(import.meta.env.VITE_SOCKET_URL) || getBaseUrl(import.meta.env.VITE_API_URL) || '';

export const getApiUrl = (path: string): string => {
  const base = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // If no base URL, use relative path (goes through nginx proxy)
  if (!base) return `/${cleanPath}`;
  return `${base}/${cleanPath}`;
};
