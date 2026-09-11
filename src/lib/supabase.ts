import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Keep the dashboard usable when it is opened without a hosted Supabase project.
// The hook switches to its local demo data in that case.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://coldshield-demo.supabase.co',
  supabaseAnonKey || 'coldshield-demo-anon-key'
);
