import axios from 'axios';

export const buildApiBaseUrl = (env: ImportMetaEnv) => {
  const configured = env.VITE_API_BASE_URL?.trim();

  if (!configured) {
    return '/api/v1';
  }

  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
};

export const api = axios.create({
  baseURL: buildApiBaseUrl(import.meta.env),
});
