import axios from 'axios';
import { supabase } from './supabase';

const defaultApiUrl = import.meta.env.PROD
  ? '/api/v1'
  : 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});