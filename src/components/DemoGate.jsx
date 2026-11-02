import { useState } from 'react';
import { IS_DEMO, DEMO_CODE_HASH, isPublicPage } from '../lib/demo';

const UNLOCKED = 'rrc-demo-unlocked';

const sha256 = async (text) => {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const wasUnlocked = () => {
    try {
        return sessionStorage.getItem(UNLOCKED) === DEMO_CODE_HASH;
    } catch {
        return false;
    }
};

// On the staging / demo site only: asks for the access code and labels every admin page.
// Other hosts and the public pages (invite links, download, FAQ, policies) pass straight through.
export default function DemoGate({ children }) {
    const [unlocked, setUnlocked] = useState(wasUnlocked);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    if (!IS_DEMO || isPublicPage(window.location.pathname)) return children;

    const submit = async (e) => {
        e.preventDefault();
        if (await sha256(code.trim()) !== DEMO_CODE_HASH) {
            setError('That access code is not correct.');
            return;
        }
        try {
            sessionStorage.setItem(UNLOCKED, DEMO_CODE_HASH);
        } catch {
            // Private browsing can block this; the code is simply asked for again next time.
        }
        setUnlocked(true);
    };

    return (
        <>
            <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-[92vw] text-center px-4 py-1 rounded-full bg-amber-500 text-black text-xs font-bold shadow-lg">
                STAGING / DEMO · Not the live admin panel · Sample data only
            </div>
            {unlocked ? children : (
                <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
                    <form onSubmit={submit} className="w-full max-w-md p-8 bg-surface rounded-2xl border border-input shadow-2xl">
                        <h1 className="text-xl font-bold text-white mb-2">Staging / demo access</h1>
                        <p className="text-sm text-gray-400 mb-4">Enter the access code you were given to review the updated admin panel.</p>
                        <input
                            type="password"
                            autoComplete="off"
                            aria-label="Access code"
                            value={code}
                            onChange={(e) => { setCode(e.target.value); setError(''); }}
                            className="w-full bg-input border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                        />
                        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                        <button type="submit" className="w-full mt-4 bg-gold text-black font-semibold rounded-xl py-3">Continue</button>
                    </form>
                </div>
            )}
        </>
    );
}
