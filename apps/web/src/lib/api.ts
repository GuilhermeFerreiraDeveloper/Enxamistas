import axios from 'axios';

const externalApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: typeof window === 'undefined' ? externalApiBase : '/api',
  withCredentials: true,
  timeout: 10000,
});

export default api;
