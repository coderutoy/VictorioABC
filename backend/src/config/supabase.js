import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.SUPABASE_URL || !supabaseServiceRoleKey) {
  console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY not found in environment; using public anon key fallback.');
}

// Service-role client (uses service role key when configured, falls back to anon key so auth still works)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Per-request JWT-scoped client (enforces PostgreSQL RLS policies automatically)
export function createUserSupabaseClient(accessToken) {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
