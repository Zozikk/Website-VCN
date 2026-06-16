const rawAuthServerBaseUrl = import.meta.env.VITE_AUTH_SERVER_BASE_URL || 'http://localhost:4000';

export const authConfig = {
  baseUrl: rawAuthServerBaseUrl.replace(/\/$/, ''),
};