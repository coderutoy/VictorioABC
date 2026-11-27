import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const PLACEHOLDER_PATTERNS = ['your-project-ref', 'your-supabase-anon-key'];

/**
 * Validates the browser-safe Supabase env vars. The service_role key must NEVER be used in web/.
 */
function validateSupabaseEnv() {
  const problems = [];
  if (!supabaseUrl) problems.push('VITE_SUPABASE_URL is missing');
  if (!supabaseAnonKey) problems.push('VITE_SUPABASE_ANON_KEY is missing');

  if (
    PLACEHOLDER_PATTERNS.some(
      (p) => supabaseUrl.includes(p) || supabaseAnonKey.includes(p)
    )
  ) {
    problems.push('Supabase env values are still the .env.example placeholders');
  }

  if (supabaseUrl && !/^https?:\/\//i.test(supabaseUrl)) {
    problems.push('VITE_SUPABASE_URL must start with https://');
  }

  if (supabaseAnonKey.startsWith('sb_secret_')) {
    problems.push(
      'VITE_SUPABASE_ANON_KEY contains a secret/service_role key — use the public anon/publishable key only'
    );
  } else if (supabaseAnonKey.split('.').length === 3) {
    try {
      const payload = JSON.parse(atob(supabaseAnonKey.split('.')[1]));
      if (payload?.role === 'service_role') {
        problems.push(
          'VITE_SUPABASE_ANON_KEY contains a service_role key — use the public anon key only'
        );
      }
    } catch {
      // Not a decodable JWT; ignore
    }
  }

  return problems;
}

const configProblems = validateSupabaseEnv();

export const isSupabaseConfigured = configProblems.length === 0;

export const supabaseConfigWarning = isSupabaseConfigured
  ? ''
  : `Supabase is not configured: ${configProblems.join('; ')}. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in web/.env (see web/.env.example) and restart the dev server.`;

if (!isSupabaseConfigured && typeof console !== 'undefined') {
  console.warn(`[Victorio ABC] ${supabaseConfigWarning}`);
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'http://localhost:54321',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);
