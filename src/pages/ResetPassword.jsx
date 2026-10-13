import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Opened from the "Reset password" email for members (app) and staff (admin).
// Supabase signs the person in from the link; they choose a new password here,
// then go back to the app (or the admin login) and sign in with it.
const inputClass =
    'w-full bg-input border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors text-sm';

function linkError() {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search);
    const code = params.get('error_code') || params.get('error');
    if (!code) return '';
    if (code === 'otp_expired' || code === 'access_denied') {
        return 'This reset link has expired or was already used. Request a new one from the app with "Forgot Password?" and open only the newest email.';
    }
    return params.get('error_description')?.replace(/\+/g, ' ') || 'This reset link is not valid.';
}

export default function ResetPassword() {
    const [stage, setStage] = useState('checking'); // checking | form | done | invalid
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState(linkError());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (linkError()) {
            setStage('invalid');
            return;
        }
        let settled = false;
        const ready = (session) => {
            if (settled || !session) return;
            settled = true;
            setEmail(session.user?.email || '');
            setStage('form');
        };
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => ready(session));
        supabase.auth.getSession().then(({ data: { session } }) => ready(session));
        const timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                setError('Open this page from the link in your "Reset password" email. If the link is old, request a new one from the app.');
                setStage('invalid');
            }
        }, 4000);
        return () => {
            clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 8) return setError('Use at least 8 characters.');
        if (password !== confirm) return setError('The two passwords don\'t match.');
        setSaving(true);
        const { error: err } = await supabase.auth.updateUser({ password });
        setSaving(false);
        if (err) {
            setError(err.message || 'Could not update the password. Please try again.');
            return;
        }
        await supabase.auth.signOut();
        window.history.replaceState(null, '', '/reset-password');
        setStage('done');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base relative px-4">
            <div className="w-full max-w-md p-8 bg-surface rounded-2xl border border-input shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gold mb-2 tracking-tight">Reliiance Rewards</h1>
                    <p className="text-gray-400 text-sm">Set a new password</p>
                </div>

                {stage === 'checking' && <p className="text-center text-gray-400 text-sm">Checking your link…</p>}

                {stage === 'invalid' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>
                )}

                {stage === 'done' && (
                    <div className="space-y-3 text-center">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
                            Your password has been updated.
                        </div>
                        <p className="text-gray-300 text-sm">
                            Go back to the Reliiance Rewards app and log in with your email and new password.
                        </p>
                    </div>
                )}

                {stage === 'form' && (
                    <form onSubmit={submit} className="space-y-5">
                        {email && (
                            <p className="text-gray-400 text-sm">
                                Account: <span className="text-white">{email}</span>
                            </p>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">New password</label>
                            <input type="password" autoComplete="new-password" value={password}
                                onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Confirm new password</label>
                            <input type="password" autoComplete="new-password" value={confirm}
                                onChange={(e) => setConfirm(e.target.value)} className={inputClass} required />
                        </div>
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">{error}</div>
                        )}
                        <button type="submit" disabled={saving}
                            className="w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm shadow-md">
                            {saving ? 'Saving…' : 'Save new password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
