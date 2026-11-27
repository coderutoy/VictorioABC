import axios from 'axios';
import { supabase } from './supabase';
import {
  BRANCH_STORAGE_KEY,
  DEFAULT_BRANCH_SLUG,
  getBranchBySlug,
  resolveRuntimeApiBaseUrl,
} from '../config/branches';

export const api = axios.create({
  baseURL: resolveRuntimeApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    config.baseURL = resolveRuntimeApiBaseUrl();
    const activeSlug =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(BRANCH_STORAGE_KEY) || DEFAULT_BRANCH_SLUG
        : DEFAULT_BRANCH_SLUG;
    const branchObj = getBranchBySlug(activeSlug);
    if (branchObj?.id) {
      config.headers['X-Branch-Id'] = branchObj.id;
    }
    if (branchObj?.slug) {
      config.headers['X-Branch-Slug'] = branchObj.slug;
      config.headers['X-Server-Tenant-Id'] = branchObj.serverTenantId;
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error?.config;
    // If local devVITE_API_URL pointed to localhost:5000 and connection refused, retry once against same-origin /api/v1
    if (
      originalConfig &&
      !originalConfig.__retriedSameOrigin &&
      !error?.response &&
      String(originalConfig.baseURL || '').includes('localhost:5000')
    ) {
      originalConfig.__retriedSameOrigin = true;
      originalConfig.baseURL = '/api/v1';
      return api.request(originalConfig);
    }

    const serverMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Request failed.';
    error.userMessage = serverMessage;
    return Promise.reject(error);
  }
);

export default api;
