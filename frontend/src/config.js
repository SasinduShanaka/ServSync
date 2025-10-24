export const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://yourdomain.com' 
  : 'http://localhost:5000';

export const WS_URL = import.meta.env.MODE === 'production'
  ? 'wss://yourdomain.com'
  : 'ws://localhost:5000';