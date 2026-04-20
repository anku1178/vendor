import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let client = null;
try {
  if (supabaseUrl && supabaseUrl !== 'your_supabase_url_here' && supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here') {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.warn("Supabase initialization failed. Please check your .env credentials.");
}

export const supabase = client;
