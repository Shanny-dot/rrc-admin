import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tmsdysbyvapdkbmlcurl.supabase.co';

// Supabase publishable key: public by design (row-level security protects the data).
// The old JWT "anon" key is switched off, so an older value still set in a host's
// VITE_SUPABASE_ANON_KEY is ignored.
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAnonKey = envKey.startsWith('sb_publishable_')
    ? envKey
    : 'sb_publishable_nl0lvkCPMwj9q-tbtbqoMg__qusairC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
