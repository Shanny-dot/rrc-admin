import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

// Points rules members see in the app. Every value is a whole number; 0 switches it off.
const FIELDS = [
    { key: 'welcome_points', label: 'Welcome points', help: 'Added automatically to every new member\'s account when they sign up (100 if never set).', unit: 'points', fallback: '100' },
    { key: 'launch_bonus_points', label: 'Launch QR bonus', help: 'Given instead of the welcome points to people who join from the launch QR codes (the code LAUNCH is filled in for them, or they can type it). 0 = off.', unit: 'points', fallback: '500' },
    { key: 'referral_points', label: 'Points per referral', help: 'Awarded when you move a referral to "Points added" (you can override it per referral).', unit: 'points' },
    { key: 'bonus_birthday_points', label: 'Birthday bonus', help: 'Added on the member\'s birthday, with a "Happy birthday" alert. Needs their date of birth.', unit: 'points' },
    { key: 'bonus_loan_anniversary_points', label: 'Loan anniversary bonus', help: 'Added each year on the date their own loan settled (set it on the member in Users).', unit: 'points' },
    { key: 'bonus_first_referral_points', label: 'First successful referral bonus', help: 'One-off extra points when a member\'s first referral reaches Settled.', unit: 'points' },
    { key: 'points_expiry_months', label: 'Points expire after', help: 'Unused points expire this many months after they were earned. Members get an alert 30 days before. 0 = never expire.', unit: 'months' },
];

const ProgramSettings = () => {
    const queryClient = useQueryClient();
    const [values, setValues] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const { data: content, isLoading, isError } = useQuery({
        queryKey: ['appContent'],
        queryFn: async () => (await api.get('/api/v1/content')).data,
    });

    useEffect(() => {
        if (content) setValues(Object.fromEntries(FIELDS.map((f) => [f.key, content[f.key] ?? f.fallback ?? '0'])));
    }, [content]);

    const save = async () => {
        const bad = FIELDS.find((f) => !/^\d+$/.test(String(values[f.key] ?? '').trim()));
        if (bad) {
            setMessage({ error: true, text: `${bad.label} must be a whole number (0 to switch it off).` });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            for (const f of FIELDS) {
                const value = String(parseInt(values[f.key], 10));
                if (value !== String(content?.[f.key] ?? '')) await api.put(`/api/v1/content/${f.key}`, { value });
            }
            await queryClient.invalidateQueries(['appContent']);
            setMessage({ error: false, text: 'Saved. Welcome and referral points apply straight away; bonuses and expiry from the next daily run (about 8am Sydney time).' });
        } catch (err) {
            setMessage({ error: true, text: err.response?.data?.detail || err.message });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
    if (isError) return <div className="p-8 text-center text-red-400">Couldn't load the settings. Please refresh.</div>;

    return (
        <div className="max-w-3xl mx-auto pb-16">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Program settings</h1>
                    <p className="text-gray-400 mt-1">Welcome points, points for referrals, surprise bonuses and points expiry. Set any of them to 0 to switch it off.</p>
                </div>
                <button
                    onClick={save}
                    disabled={saving}
                    className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save changes'}
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl border ${message.error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-surface rounded-2xl border border-input divide-y divide-input">
                {FIELDS.map((f) => (
                    <div key={f.key} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <div className="text-white font-medium">{f.label}</div>
                            <div className="text-sm text-gray-400 mt-0.5">{f.help}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <input
                                inputMode="numeric"
                                value={values[f.key] ?? ''}
                                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                                className="w-28 bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-right focus:outline-none focus:border-gold"
                            />
                            <span className="text-sm text-gray-400 w-14">{f.unit}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProgramSettings;
