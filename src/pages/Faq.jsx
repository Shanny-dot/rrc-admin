import { useEffect, useState } from 'react';

// Public FAQ page (/faq), linked from the welcome email. Same questions as the app's
// Help page, edited on the admin Help & Contact page.
const API = import.meta.env.VITE_API_URL || 'https://rrc-backend-1dmv.onrender.com';

const Faq = () => {
    const [faq, setFaq] = useState(null);
    const [open, setOpen] = useState(0);

    useEffect(() => {
        document.title = 'FAQs — Reliiance Rewards';
        fetch(`${API}/api/v1/content`)
            .then((r) => r.json())
            .then((c) => {
                try {
                    const items = JSON.parse(c.help_faq || '[]');
                    setFaq(Array.isArray(items) ? items.filter((i) => i.q && i.a) : []);
                } catch {
                    setFaq([]);
                }
            })
            .catch(() => setFaq([]));
    }, []);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex justify-center p-5">
            <div className="w-full max-w-2xl py-10">
                <img src="/logo-full.png" alt="Reliiance Rewards" className="w-64 max-w-full mx-auto mb-10" />
                <h1 className="text-3xl font-bold mb-2 text-center">Frequently asked questions</h1>
                <p className="text-gray-400 text-center mb-8">Everything you need to know about earning and using your points.</p>
                {faq === null ? (
                    <p className="text-gray-400 text-center">Loading…</p>
                ) : faq.length === 0 ? (
                    <p className="text-gray-400 text-center">No questions yet — contact us from the app's Help &amp; contact page.</p>
                ) : (
                    <div className="space-y-3">
                        {faq.map((item, i) => (
                            <div key={i} className="bg-surface border border-input rounded-2xl">
                                <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full text-left px-5 py-4 flex justify-between gap-4">
                                    <span className="font-semibold">{item.q}</span>
                                    <span className="text-gold text-xl leading-none">{open === i ? '−' : '+'}</span>
                                </button>
                                {open === i && <p className="px-5 pb-5 text-gray-300 leading-relaxed whitespace-pre-line">{item.a}</p>}
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-center text-sm text-gray-500 mt-10">
                    Still have a question? Open the app and go to Profile → Help &amp; contact.
                </p>
            </div>
        </div>
    );
};

export default Faq;
