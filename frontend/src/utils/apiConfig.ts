// API / Socket.io backend origin. Set VITE_API_URL on your static host (Render URL, https, no trailing slash).
// VITE_SOCKET_URL is optional and defaults to VITE_API_URL.
const DEFAULT_LOCAL = 'http://localhost:3001';

export const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_LOCAL;
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || DEFAULT_LOCAL;

export const getApiUrl = (path: string): string => {
  const base = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${cleanPath}`;
};
