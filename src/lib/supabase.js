import { createClient } from '@supabase/supabase-js';
import { IS_DEMO, DEMO_SUPABASE_URL, DEMO_SUPABASE_KEY } from './demo';

const supabaseUrl = IS_DEMO ? DEMO_SUPABASE_URL
    : import.meta.env.VITE_SUPABASE_URL || 'https://tmsdysbyvapdkbmlcurl.supabase.co';

// Supabase publishable key: public by design (row-level security protects the data).
// The old JWT "anon" key is switched off, so an older value still set in a host's
// VITE_SUPABASE_ANON_KEY is ignored.
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAnonKey = IS_DEMO ? DEMO_SUPABASE_KEY
    : envKey.startsWith('sb_publishable_')
        ? envKey
        : 'sb_publishable_nl0lvkCPMwj9q-tbtbqoMg__qusairC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
