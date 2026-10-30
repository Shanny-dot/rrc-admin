import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Second sign-in step for staff: a 6-digit code from an authenticator app (Google
// Authenticator, Microsoft Authenticator, Authy...). The first time, staff scan a QR code to
// link the app; after that they enter the code every time they sign in. The server refuses
// admin requests from a session that hasn't passed this step.
const inputClass =
    'w-full bg-input border border-[#333] rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-gold transition-colors';

export default function TwoStep() {
    const [stage, setStage] = useState('loading'); // loading | setup | code
    const [factorId, setFactorId] = useState('');
    const [qr, setQr] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        (async () => {
            const { data, error: listErr } = await supabase.auth.mfa.listFactors();
            if (listErr) {
                setError(listErr.message);
                return;
            }
            const verified = (data?.totp || []).find((f) => f.status === 'verified');
            if (verified) {
                setFactorId(verified.id);
                setStage('code');
                return;
            }
            // A setup that was started but never finished: remove it and start again.
            for (const f of data?.all || []) {
                if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
            }
            const { data: enrolled, error: enrollErr } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                friendlyName: `Admin ${new Date().toISOString().slice(0, 10)}`,
            });
            if (enrollErr) {
                setError(enrollErr.message);
                return;
            }
            setFactorId(enrolled.id);
            setQr(enrolled.totp.qr_code);
            setSecret(enrolled.totp.secret);
            setStage('setup');
        })();
    }, []);

    const verify = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
        if (verifyErr) {
            setError('That code didn\'t work. Check the time on your phone is set automatically and enter the newest code.');
            setBusy(false);
            setCode('');
            return;
        }
        window.location.href = '/';
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
            <div className="w-full max-w-md p-8 bg-surface rounded-2xl border border-input shadow-2xl">
                <div className="text-center mb-6">
                    <img src="/logo-full.png" alt="Reliiance Rewards" className="w-56 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-gold mb-1">Two-step sign-in</h1>
                </div>

                {stage === 'loading' && !error && <p className="text-center text-gray-400 text-sm">Loading...</p>}

                {stage === 'setup' && (
                    <div className="space-y-4 text-sm text-gray-300">
                        <p>For extra security, admin sign-in now needs a code from an authenticator app on your phone. This is a one-time setup.</p>
                        <ol className="list-decimal pl-5 space-y-1 text-gray-400">
                            <li>Install <span className="text-white">Google Authenticator</span> or <span className="text-white">Microsoft Authenticator</span> on your phone.</li>
                            <li>In the app, tap <span className="text-white">+</span> and scan this QR code.</li>
                            <li>Enter the 6-digit code the app shows.</li>
                        </ol>
                        <div className="bg-white rounded-xl p-3 w-48 mx-auto">
                            <img src={qr} alt="QR code for your authenticator app" className="w-full" />
                        </div>
                        <p className="text-xs text-gray-500 text-center break-all">
                            Can't scan? Enter this key in the app instead:<br />
                            <span className="text-gray-300 font-mono">{secret}</span>
                        </p>
                    </div>
                )}

                {stage === 'code' && (
                    <p className="text-sm text-gray-300 mb-4 text-center">
                        Open your authenticator app and enter the 6-digit code for Reliiance Rewards.
                    </p>
                )}

                {(stage === 'setup' || stage === 'code') && (
                    <form onSubmit={verify} className="space-y-4 mt-4">
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            placeholder="000000"
                            className={inputClass}
                            required
                        />
                        <button
                            type="submit"
                            disabled={busy || code.length !== 6}
                            className="w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
                        >
                            {busy ? 'Checking...' : 'Continue'}
                        </button>
                    </form>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                        {error}
                    </div>
                )}

                <div className="mt-6 text-center space-y-2">
                    {stage === 'code' && (
                        <p className="text-xs text-gray-500">Lost your phone? Ask another admin or your developer to reset your two-step sign-in.</p>
                    )}
                    <button onClick={signOut} className="text-xs text-gray-400 hover:text-white">Sign out</button>
                </div>
            </div>
        </div>
    );
}
