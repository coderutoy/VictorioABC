import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const DEFAULT_PUBLIC_SUPABASE_URL = 'https://sjhascvejmnqoovqcbui.supabase.co';
const DEFAULT_PUBLIC_ANON_KEY = 'sb_publishable_081e4_28f3U3fL_i0c29bQ_c7T2bX4T';

export const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_PUBLIC_ANON_KEY;
export const hasServiceRoleKey = Boolean(
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
    String(process.env.SUPABASE_SERVICE_ROLE_KEY).trim()
);
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const requestSupabaseStorage = new AsyncLocalStorage();

// Base client (uses service role key when configured, falls back to anon key)
const baseSupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Per-request JWT-scoped client (enforces PostgreSQL RLS policies as the authenticated staff user)
export function createUserSupabaseClient(accessToken) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Dynamic proxy for `supabaseAdmin`:
 * - When `SUPABASE_SERVICE_ROLE_KEY` is configured, uses `baseSupabaseClient` (full service_role).
 * - When running in a serverless environment without `SUPABASE_SERVICE_ROLE_KEY`, automatically
 *   delegates `.from(...)` and `.rpc(...)` to the current request's authenticated JWT client
 *   so RLS policies (`TO authenticated`) allow all live database queries and writes.
 */
export const supabaseAdmin = new Proxy(baseSupabaseClient, {
  get(target, prop, receiver) {
    if (!hasServiceRoleKey) {
      const store = requestSupabaseStorage.getStore();
      if (store?.userClient && (prop === 'from' || prop === 'rpc' || prop === 'storage')) {
        const val = Reflect.get(store.userClient, prop, store.userClient);
        return typeof val === 'function' ? val.bind(store.userClient) : val;
      }
    }
    const value = Reflect.get(target, prop, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});
