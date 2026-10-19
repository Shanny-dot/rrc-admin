import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Public page behind the launch QR codes: /download.
// Phones go straight to their app store; computers see both stores and a QR code to scan.
const API = import.meta.env.VITE_API_URL || 'https://rrc-backend-1dmv.onrender.com';
const DEFAULT_STORES = {
    ios: 'https://apps.apple.com/au/app/reliance-rewards/id6784309292',
    android: 'https://play.google.com/store/apps/details?id=com.rrc.app',
};

const platform = () => {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)) return 'ios';
    return 'other';
};

const Download = () => {
    const device = platform();
    const [stores, setStores] = useState(DEFAULT_STORES);
    const [bonus, setBonus] = useState(null);

    useEffect(() => {
        document.title = 'Download Reliiance Rewards';
        // Send phones to their store straight away (the default links work even if the server is asleep).
        if (device !== 'other') {
            const timer = setTimeout(() => { window.location.href = DEFAULT_STORES[device]; }, 1500);
            fetch(`${API}/api/v1/content`)
                .then((r) => r.json())
                .then((c) => {
                    clearTimeout(timer);
                    window.location.href = (device === 'ios' ? c.ios_store_url : c.android_store_url) || DEFAULT_STORES[device];
                })
                .catch(() => {});
            return () => clearTimeout(timer);
        }
        fetch(`${API}/api/v1/content`)
            .then((r) => r.json())
            .then((c) => {
                setStores({ ios: c.ios_store_url || DEFAULT_STORES.ios, android: c.android_store_url || DEFAULT_STORES.android });
                if (parseInt(c.welcome_points, 10) > 0) setBonus(parseInt(c.welcome_points, 10));
            })
            .catch(() => {});
        return undefined;
    }, [device]);

    const storeButton = (href, label, sub) => (
        <a href={href} className="flex-1 bg-gold hover:bg-gold-light text-black rounded-xl px-5 py-3 text-center transition-colors">
            <div className="text-xs font-medium opacity-70">{sub}</div>
            <div className="text-lg font-bold leading-tight">{label}</div>
        </a>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-5">
            <div className="w-full max-w-md text-center">
                <img src="/logo-full.png" alt="Reliiance Rewards" className="w-72 max-w-full mx-auto mb-10" />
                {device !== 'other' ? (
                    <>
                        <h1 className="text-2xl font-bold mb-3">Taking you to the {device === 'ios' ? 'App Store' : 'Google Play store'}…</h1>
                        <p className="text-gray-400 mb-8">If nothing happens, tap the button below.</p>
                        <div className="flex">
                            {device === 'ios'
                                ? storeButton(stores.ios, 'App Store', 'Download on the')
                                : storeButton(stores.android, 'Google Play', 'Get it on')}
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold leading-tight mb-3">Download the Reliiance Rewards app</h1>
                        <p className="text-gray-400 leading-relaxed mb-8">
                            Earn points for referrals and events, and swap them for experiences, gift cards and more.
                            {bonus ? ` Sign up and get ${bonus.toLocaleString()} bonus points.` : ''}
                        </p>
                        <div className="bg-white rounded-2xl p-5 inline-block mb-3">
                            <QRCodeSVG value={window.location.href} size={200} level="M" />
                        </div>
                        <p className="text-sm text-gray-500 mb-8">Scan with your phone's camera</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {storeButton(stores.ios, 'App Store', 'Download on the')}
                            {storeButton(stores.android, 'Google Play', 'Get it on')}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Download;
