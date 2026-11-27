import axios from 'axios';
import { supabase } from './supabase';
import { BRANCH_STORAGE_KEY, DEFAULT_BRANCH_SLUG, getBranchBySlug } from '../config/branches';

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
  try {
    const activeSlug =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(BRANCH_STORAGE_KEY) || DEFAULT_BRANCH_SLUG
        : DEFAULT_BRANCH_SLUG;
    const branchObj = getBranchBySlug(activeSlug);
    if (branchObj?.slug) {
      config.headers['X-Branch-Slug'] = branchObj.slug;
      config.headers['X-Server-Tenant-Id'] = branchObj.serverTenantId;
    }
    if (branchObj?.apiBaseUrl && !import.meta.env.VITE_API_URL) {
      config.baseURL = branchObj.apiBaseUrl;
    }
  } catch {
    // Ignore storage read errors
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});
