// Backend location, baked in at build time (see .env.example).
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

// Same host as the API, over ws:// or wss://.
export const WS_URL = API_URL.replace(/^http/, 'ws');
