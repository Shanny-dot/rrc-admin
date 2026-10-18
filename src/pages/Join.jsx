import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, Smartphone } from 'lucide-react';

// Public page behind each member's personal invite link: /join/<CODE>.
// Opening it records the visit, so after installing the app the friend's sign-up form
// already has the code filled in (Android also receives it through Google Play).
const API = import.meta.env.VITE_API_URL || 'https://rrc-backend-1dmv.onrender.com';
const APP_SCHEME = 'reliancerewards://join/';

const platform = () => {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)) return 'ios';
    return 'other';
};

const Join = () => {
    const { code: rawCode = '' } = useParams();
    const code = rawCode.trim().toUpperCase();
    const [invite, setInvite] = useState(null);
    const [stores, setStores] = useState({
        ios: 'https://apps.apple.com/au/app/reliance-rewards/id6784309292',
        android: 'https://play.google.com/store/apps/details?id=com.rrc.app',
    });
    const [copied, setCopied] = useState(false);
    const device = platform();

    useEffect(() => {
        document.title = 'Join Reliance Rewards';
        fetch(`${API}/api/v1/referrals/invite/${encodeURIComponent(code)}`, { method: 'POST' })
            .then((r) => r.json())
            .then(setInvite)
            .catch(() => setInvite({ valid: false }));
        fetch(`${API}/api/v1/content`)
            .then((r) => r.json())
            .then((c) => setStores((s) => ({ ios: c.ios_store_url || s.ios, android: c.android_store_url || s.android })))
            .catch(() => {});
    }, [code]);

    const valid = invite?.valid;
    const inviter = invite?.inviter_first_name;
    const androidUrl = valid
        ? `${stores.android}${stores.android.includes('?') ? '&' : '?'}referrer=${encodeURIComponent(`rrc_code=${code}`)}`
        : stores.android;

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard can be blocked; the code is still shown on the page.
        }
    };

    const storeButton = (href, label, sub) => (
        <a
            href={href}
            onClick={valid ? copyCode : undefined}
            className="flex-1 bg-gold hover:bg-gold-light text-black rounded-xl px-5 py-3 text-center transition-colors"
        >
            <div className="text-xs font-medium opacity-70">{sub}</div>
            <div className="text-lg font-bold leading-tight">{label}</div>
        </a>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-5">
            <div className="w-full max-w-md text-center">
                <img src="/logo-full.png" alt="Reliiance Rewards" className="w-72 max-w-full mx-auto mb-10" />

                {invite === null ? (
                    <p className="text-gray-400">Loading your invitation…</p>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold leading-tight mb-3">
                            {valid && inviter ? `${inviter} invited you to Reliance Rewards` : 'Join Reliance Rewards'}
                        </h1>
                        <p className="text-gray-400 leading-relaxed mb-8">
                            Reliance clients earn points for referrals and events, and swap them for experiences, gift cards and more.
                            {valid && ' Download the app and sign up — your invite code is added for you.'}
                        </p>

                        {valid && (
                            <button
                                onClick={copyCode}
                                className="w-full mb-6 bg-surface border border-input rounded-2xl px-5 py-4 flex items-center justify-between hover:border-gold/50 transition-colors"
                            >
                                <div className="text-left">
                                    <div className="text-xs text-gray-400">{inviter ? `${inviter}'s invite code` : 'Invite code'}</div>
                                    <div className="text-2xl font-bold tracking-[0.2em] text-[#FAB95B]">{code}</div>
                                </div>
                                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                                    {copied ? <><Check size={16} className="text-green-400" /> Copied</> : <><Copy size={16} /> Copy</>}
                                </span>
                            </button>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            {device !== 'android' && stores.ios && storeButton(stores.ios, 'App Store', 'Download on the')}
                            {device !== 'ios' && storeButton(androidUrl, 'Google Play', 'Get it on')}
                        </div>

                        {valid && device !== 'other' && (
                            <a href={`${APP_SCHEME}${code}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm py-3">
                                <Smartphone size={16} /> Already have the app? Open it
                            </a>
                        )}
                        {invite && !valid && (
                            <p className="text-sm text-gray-500 mt-2">This invite link isn't active any more, but you can still join.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Join;
