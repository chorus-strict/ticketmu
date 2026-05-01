import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY?.trim();

  // Check if configured and if it's not a placeholder
  const isConfigured = supabaseUrl && 
                      supabaseAnonKey && 
                      !supabaseUrl.includes('[project-ref]') && 
                      supabaseUrl !== 'your-supabase-url';

  if (!isConfigured) {
    console.warn('[Supabase] Not properly configured. VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing or using placeholders.');
    return null;
  }

  try {
    const url = new URL(supabaseUrl);
    if (!url.protocol.startsWith('http')) {
      throw new Error('Supabase URL must start with http:// or https://');
    }
  } catch (err: any) {
    console.error('[Supabase] Invalid URL format:', err.message);
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

export const BUCKET_NAME = (import.meta as any).env.VITE_SUPABASE_BUCKET || 'events';
