import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env as any).REACT_APP_SUPABASE_URL as string;
const supabaseAnonKey = (process.env as any).REACT_APP_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing. Check .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
