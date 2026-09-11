import { createClient } from '@supabase/supabase-js';

if (typeof WebSocket === 'undefined' && typeof window === 'undefined') {
  globalThis.WebSocket = class {};
}

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 'https://placeholder.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
