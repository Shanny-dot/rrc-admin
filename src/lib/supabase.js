import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jymlbdeatzzrgkbtyjwa.supabase.co';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback if Vercel truncated the key
if (!supabaseAnonKey || supabaseAnonKey.length < 150) {
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bWxiZGVhdHp6cmdrYnR5andhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDI2MzQsImV4cCI6MjA5NjgxODYzNH0.78WhAm784aHFLhjwK_KuL8Y2f282fZev04CbwNcnEQM';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
