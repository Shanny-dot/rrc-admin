import axios from 'axios';
import { supabase } from './supabase';
import { IS_DEMO, DEMO_API_URL } from './demo';

export const api = axios.create({
    baseURL: IS_DEMO ? DEMO_API_URL : import.meta.env.VITE_API_URL || 'https://rrc-backend-1dmv.onrender.com',
});

api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// The server refuses admin requests until the authenticator-app code has been entered.
api.interceptors.response.use((response) => response, async (error) => {
    const detail = error?.response?.data?.detail;
    // The session has ended on the server (signed out everywhere, access removed, reset): without
    // this the site stays open with empty pages and a short menu instead of asking to sign in.
    if (error?.response?.status === 401 && window.location.pathname !== '/login') {
        await supabase.auth.signOut({ scope: 'local' });
        window.location.href = '/login';
        return Promise.reject(error);
    }
    if (error?.response?.status === 403 && typeof detail === 'string' && detail.startsWith('two_step_required')
        && window.location.pathname !== '/two-step') {
        window.location.href = '/two-step';
    }
    return Promise.reject(error);
});
