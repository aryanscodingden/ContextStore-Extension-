import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getClient(url: string, anon: string) {
  if (!client) {
    client = createClient(url, anon, {
      auth: { 
        persistSession: false, 
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }
  return client;
}

export async function restore(client: SupabaseClient, session: Session | null) {
  if (!session) {
    console.log('No session to restore');
    return;
  }
  
  console.log('Restoring session');
  const { data, error } = await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });
  
  if (error) {
    console.error('Session restoration error:', error);
    throw error;
  }
  
  console.log('Session restored successfully, user:', data.user?.id);
  return data;
}
