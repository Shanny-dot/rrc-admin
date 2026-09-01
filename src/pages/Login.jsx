import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetStatus, setResetStatus] = useState({ type: '', msg: '' });

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail) return;

        setResetLoading(true);
        setResetStatus({ type: '', msg: '' });

        try {
            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/login`,
            });

            if (resetErr) {
                setResetStatus({ type: 'error', msg: resetErr.message });
            } else {
                setResetStatus({ type: 'success', msg: 'Password reset link sent! Check your email inbox.' });
                setTimeout(() => {
                    setShowForgotModal(false);
                    setResetStatus({ type: '', msg: '' });
                }, 4000);
            }
        } catch (err) {
            setResetStatus({ type: 'error', msg: err.message || 'Failed to send reset link' });
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base relative px-4">
            <div className="w-full max-w-md p-8 bg-surface rounded-2xl border border-input shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gold mb-2 tracking-tight">RRC Admin</h1>
                    <p className="text-gray-400 text-sm">Sign in to manage the platform</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-input border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors text-sm"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-400">Password</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setResetEmail(email);
                                    setShowForgotModal(true);
                                }}
                                className="text-xs text-gold hover:underline font-medium"
                            >
                                Forgot Password?
                            </button>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-input border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium">
                            {successMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm shadow-md"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-surface p-6 rounded-2xl border border-input shadow-2xl relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Reset Password</h3>
                            <button
                                onClick={() => setShowForgotModal(false)}
                                className="text-gray-400 hover:text-white text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                            Enter your registered email address below. We will send you a password reset link.
                        </p>

                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="w-full bg-input border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>

                            {resetStatus.msg && (
                                <div
                                    className={`p-3 rounded-xl text-xs font-medium border ${
                                        resetStatus.type === 'success'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}
                                >
                                    {resetStatus.msg}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    className="px-4 py-2 text-xs text-gray-400 hover:text-white font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="px-5 py-2.5 bg-gold hover:bg-gold-light text-black font-bold text-xs rounded-xl transition-colors disabled:opacity-50 shadow-md"
                                >
                                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
