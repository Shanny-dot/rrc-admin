import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

// Points rules members see in the app. Numbers are whole numbers; 0 switches that one off.
const FIELDS = [
    { key: 'welcome_points', label: 'Welcome points', help: 'Added to a new member\'s account once their mobile and email are both verified (members who didn\'t use the launch QR code). 0 = no welcome points.', unit: 'points', fallback: '100' },
    { key: 'launch_bonus_points', label: 'Launch QR code bonus', help: 'Given instead of the welcome points to people who signed up by scanning the launch QR code (code LAUNCH), once their mobile and email are both verified. 0 = no launch bonus.', unit: 'points', fallback: '100' },
    { key: 'min_points_to_redeem', label: 'Minimum balance for a first reward', help: 'Members need at least this many points in their account before they can redeem their first reward, whatever it costs. After their first reward they can spend all their points. 0 = no minimum.', unit: 'points', fallback: '150' },
    { key: 'referral_points', label: 'Referral bonus', help: 'Added to the member who referred a friend when you move that referral to "Points added" on the Referrals page.', unit: 'points' },
    { key: 'bonus_birthday_points', label: 'Birthday bonus', help: 'Added on the member\'s birthday, with a "Happy birthday" alert. Needs their date of birth.', unit: 'points' },
    { key: 'points_expiry_months', label: 'Points expire after', help: 'Unused points expire this many months after they were earned. Members get an alert 30 days before. 0 = never expire.', unit: 'months' },
];
const isValid = (f, v) => (f.type === 'date' ? /^\d{4}-\d{2}-\d{2}$/.test(v) : /^\d+$/.test(v));

// Security alerts (staff-only settings, so they come from the admin content list, not the public one)
const SecurityAlerts = () => {
    const [email, setEmail] = useState('');
    const [points, setPoints] = useState('1000');
    const [saved, setSaved] = useState(null);
    const { data: rows } = useQuery({
        queryKey: ['adminContentAll'],
        queryFn: async () => (await api.get('/api/v1/content/all')).data,
    });
    useEffect(() => {
        const get = (k) => (rows || []).find((r) => r.key === k)?.value;
        if (rows) {
            setEmail(get('security_alert_email') || '');
            setPoints(get('security_alert_points') || '1000');
        }
    }, [rows]);

    const save = async () => {
        if (!/^\d+$/.test(points.trim()) || parseInt(points, 10) < 1) {
            setSaved({ error: true, text: 'The points amount must be a whole number above 0.' });
            return;
        }
        try {
            await api.put('/api/v1/content/security_alert_email', { value: email.trim() });
            await api.put('/api/v1/content/security_alert_points', { value: String(parseInt(points, 10)) });
            setSaved({ error: false, text: 'Saved.' });
        } catch (err) {
            setSaved({ error: true, text: err.response?.data?.detail || err.message });
        }
    };

    return (
        <div className="bg-surface rounded-2xl border border-input p-5 mt-8">
            <div className="text-white font-medium">Security alerts</div>
            <div className="text-sm text-gray-400 mt-0.5 mb-4">
                Emails about repeated wrong passwords, large points changes and changes to staff access. Leave the
                address empty to use the usual staff email (membership@).
            </div>
            <div className="flex flex-wrap gap-4 items-end">
                <label className="flex flex-col gap-1 text-xs text-gray-400">
                    Send alerts to
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="membership@reliiancerewards.com.au"
                        className="w-72 bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold" />
                </label>
                <label className="flex flex-col gap-1 text-xs text-gray-400">
                    Alert when one points change is at least
                    <input inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value)}
                        className="w-28 bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-right text-sm focus:outline-none focus:border-gold" />
                </label>
                <button onClick={save} className="bg-gold hover:bg-gold-light text-black font-semibold px-4 py-2 rounded-lg text-sm">Save alerts</button>
            </div>
            {saved && <div className={`mt-3 text-sm ${saved.error ? 'text-red-400' : 'text-green-400'}`}>{saved.text}</div>}
        </div>
    );
};

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
        const bad = FIELDS.find((f) => !isValid(f, String(values[f.key] ?? '').trim()));
        if (bad) {
            setMessage({ error: true, text: bad.type === 'date' ? `Please pick a date for ${bad.label}.` : `${bad.label} must be a whole number (0 to switch it off).` });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            for (const f of FIELDS) {
                const value = f.type === 'date' ? String(values[f.key]).trim() : String(parseInt(values[f.key], 10));
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
                    <p className="text-gray-400 mt-1">Welcome points, the launch QR code bonus, the referral bonus, the birthday bonus and points expiry. Set any number to 0 to switch it off.</p>
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
                            {f.type === 'date' ? (
                                <input
                                    type="date"
                                    value={values[f.key] ?? ''}
                                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                                    className="w-44 bg-input border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold [color-scheme:dark]"
                                />
                            ) : (
                                <>
                                    <input
                                        inputMode="numeric"
                                        value={values[f.key] ?? ''}
                                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                                        className="w-28 bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-right focus:outline-none focus:border-gold"
                                    />
                                    <span className="text-sm text-gray-400 w-14">{f.unit}</span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <SecurityAlerts />
        </div>
    );
};

export default ProgramSettings;
