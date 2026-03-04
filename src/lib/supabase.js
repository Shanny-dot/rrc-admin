import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tmsdysbyvapdkbmlcurl.supabase.co';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback if Vercel truncated the key
if (!supabaseAnonKey || supabaseAnonKey.length < 150) {
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtc2R5c2J5dmFwZGtibWxjdXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODY2OTIsImV4cCI6MjA4NzY2MjY5Mn0.dYrteZkF5lkKBeVg7a6DRnBxfwFr8WdXWcfQYGty0Zs';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
