import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://rrc-backend-1dmv.onrender.com',
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
api.interceptors.response.use((response) => response, (error) => {
    const detail = error?.response?.data?.detail;
    if (error?.response?.status === 403 && typeof detail === 'string' && detail.startsWith('two_step_required')
        && window.location.pathname !== '/two-step') {
        window.location.href = '/two-step';
    }
    return Promise.reject(error);
});
