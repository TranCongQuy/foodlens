import { createClient } from '@supabase/supabase-js';

// Default public Supabase project endpoint & publishable anon key (protected by strict RLS)
// FoodLens dung project rieng czuvyzplxuczkegcqhxb (VuongTranPXU cu, da resume 15/11/2026)
const DEFAULT_SUPABASE_URL = 'https://czuvyzplxuczkegcqhxb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_i7x-XqNZSbAhgxksSf5Xvw_uoEzqZkr';

let rawInputUrl = import.meta.env.VITE_SUPABASE_URL || '';
if (!rawInputUrl || rawInputUrl.includes('your-project.supabase.co') || rawInputUrl.includes('demo-drawtostory')) {
  rawInputUrl = DEFAULT_SUPABASE_URL;
}

const rawUrl = rawInputUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

let rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
if (!rawKey || rawKey.includes('your_anon_key_here')) {
  rawKey = DEFAULT_SUPABASE_ANON_KEY;
}

// SECURITY: Mock/Demo mode is strictly restricted to local development (import.meta.env.DEV)
export const isMockEnabled = Boolean(import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true');

export const hasValidSupabaseConfig = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('your-project.supabase.co') &&
  !rawKey.includes('your_anon_key_here')
);

export const isDemoMode = isMockEnabled;

export const supabaseUrl = hasValidSupabaseConfig ? rawUrl : 'https://dummy-project.supabase.co';
export const supabaseAnonKey = hasValidSupabaseConfig ? rawKey : 'dummy-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
