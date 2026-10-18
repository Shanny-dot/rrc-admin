import { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

// Settings shown on the app's Help page and the "Contact us" card on Home.
const CONTACT_FIELDS = [
    { key: 'contact_card_title', label: 'Card title on Home', placeholder: 'Contact us' },
    { key: 'contact_name', label: 'Name under the title', placeholder: 'Your Reliiance broker' },
    { key: 'contact_phone', label: 'Phone number', placeholder: '02 9000 0000' },
    { key: 'contact_email', label: 'Email address', placeholder: 'hello@reliance.com.au' },
    { key: 'contact_booking_url', label: 'Book-a-time link', placeholder: 'https://calendly.com/...' },
    { key: 'contact_hours', label: 'Opening hours', placeholder: 'Mon–Fri, 9am–5pm' },
];
const LINK_FIELDS = [
    { key: 'terms_url', label: 'Program terms link' },
    { key: 'privacy_url', label: 'Privacy policy link' },
];
const KEYS = [...CONTACT_FIELDS, ...LINK_FIELDS, { key: 'tiers_intro' }].map((f) => f.key);

const inputClass = 'w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors';

const parseFaq = (raw) => {
    try {
        const items = JSON.parse(raw || '[]');
        return Array.isArray(items) ? items.map((i) => ({ q: i.q || '', a: i.a || '' })) : [];
    } catch {
        return [];
    }
};

const HelpContact = () => {
    const queryClient = useQueryClient();
    const [values, setValues] = useState({});
    const [faq, setFaq] = useState([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const [tiers, setTiers] = useState([]);

    const { data: content, isLoading, isError } = useQuery({
        queryKey: ['appContent'],
        queryFn: async () => (await api.get('/api/v1/content')).data,
    });
    const { data: savedTiers } = useQuery({
        queryKey: ['adminTiers'],
        queryFn: async () => (await api.get('/api/v1/admin/tiers')).data,
    });

    useEffect(() => {
        if (!content) return;
        setValues(Object.fromEntries(KEYS.map((k) => [k, content[k] || ''])));
        setFaq(parseFaq(content.help_faq));
    }, [content]);

    useEffect(() => {
        if (savedTiers) setTiers(savedTiers.map((t) => ({ id: t.id, name: t.name, min_points: String(t.min_points ?? 0), benefits: t.benefits || '' })));
    }, [savedTiers]);

    const updateTier = (index, field, value) => setTiers((items) => items.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
    const tiersJson = (list) => JSON.stringify(list.map((t) => ({ id: t.id, name: t.name.trim(), min_points: String(t.min_points).trim(), benefits: t.benefits.trim() })));

    const updateFaq = (index, field, value) => setFaq((items) => items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    const moveFaq = (index, delta) => setFaq((items) => {
        const next = [...items];
        const target = index + delta;
        if (target < 0 || target >= next.length) return items;
        [next[index], next[target]] = [next[target], next[index]];
        return next;
    });

    const save = async () => {
        const cleanFaq = faq.map((i) => ({ q: i.q.trim(), a: i.a.trim() })).filter((i) => i.q || i.a);
        if (cleanFaq.some((i) => !i.q || !i.a)) {
            setMessage({ error: true, text: 'Each question needs an answer (or remove the empty one).' });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const changed = KEYS.filter((k) => (values[k] || '').trim() !== (content?.[k] || ''));
            for (const key of changed) {
                await api.put(`/api/v1/content/${key}`, { value: (values[key] || '').trim() });
            }
            const faqJson = JSON.stringify(cleanFaq);
            if (faqJson !== JSON.stringify(parseFaq(content?.help_faq))) {
                await api.put('/api/v1/content/help_faq', { value: faqJson });
            }
            const original = (savedTiers || []).map((t) => ({ id: t.id, name: t.name, min_points: String(t.min_points ?? 0), benefits: t.benefits || '' }));
            if (tiersJson(tiers) !== tiersJson(original)) {
                await api.put('/api/v1/admin/tiers', {
                    tiers: tiers.map((t) => ({ id: t.id, name: t.name.trim(), min_points: parseInt(t.min_points, 10), benefits: t.benefits })),
                });
                await queryClient.invalidateQueries(['adminTiers']);
            }
            await queryClient.invalidateQueries(['appContent']);
            setMessage({ error: false, text: 'Saved. Members see the changes next time they open Help.' });
        } catch (err) {
            setMessage({ error: true, text: err.response?.data?.detail || err.message });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
    if (isError) return <div className="p-8 text-center text-red-400">Couldn't load the help settings. Please refresh.</div>;

    return (
        <div className="max-w-4xl mx-auto pb-16">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Help &amp; Contact</h1>
                    <p className="text-gray-400 mt-1">
                        What members see on the app's Help page, the "Contact us" card on Home and the member tiers page. Leave a contact field empty to hide that button.
                    </p>
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

            <section className="bg-surface rounded-2xl border border-input p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Contact details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CONTACT_FIELDS.map((f) => (
                        <label key={f.key} className="block">
                            <span className="block text-sm text-gray-400 mb-1.5">{f.label}</span>
                            <input
                                value={values[f.key] || ''}
                                placeholder={f.placeholder}
                                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                                className={inputClass}
                            />
                        </label>
                    ))}
                </div>
            </section>

            <section className="bg-surface rounded-2xl border border-input p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Common questions</h2>
                    <button
                        onClick={() => setFaq((items) => [...items, { q: '', a: '' }])}
                        className="text-gold hover:text-gold-light flex items-center gap-1.5 text-sm font-medium"
                    >
                        <Plus size={16} /> Add question
                    </button>
                </div>
                {faq.length === 0 && <p className="text-gray-400 text-sm">No questions yet.</p>}
                <div className="space-y-4">
                    {faq.map((item, i) => (
                        <div key={i} className="border border-input rounded-xl p-4">
                            <div className="flex gap-2 mb-2">
                                <input
                                    value={item.q}
                                    placeholder="Question"
                                    onChange={(e) => updateFaq(i, 'q', e.target.value)}
                                    className={`${inputClass} font-medium`}
                                />
                                <button onClick={() => moveFaq(i, -1)} disabled={i === 0} title="Move up"
                                    className="p-2 text-gray-400 hover:text-white disabled:opacity-30"><ArrowUp size={18} /></button>
                                <button onClick={() => moveFaq(i, 1)} disabled={i === faq.length - 1} title="Move down"
                                    className="p-2 text-gray-400 hover:text-white disabled:opacity-30"><ArrowDown size={18} /></button>
                                <button onClick={() => setFaq((items) => items.filter((_, j) => j !== i))} title="Remove"
                                    className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={18} /></button>
                            </div>
                            <textarea
                                value={item.a}
                                placeholder="Answer"
                                rows={3}
                                onChange={(e) => updateFaq(i, 'a', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-surface rounded-2xl border border-input p-6 mb-6">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-semibold text-white">Member tiers</h2>
                    <button
                        onClick={() => setTiers((items) => [...items, { id: null, name: '', min_points: '', benefits: '' }])}
                        className="text-gold hover:text-gold-light flex items-center gap-1.5 text-sm font-medium"
                    >
                        <Plus size={16} /> Add tier
                    </button>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                    Shown when members tap "What do tiers give me?" in Help &amp; contact. The first tier must start at 0 points.
                </p>
                <label className="block mb-5">
                    <span className="block text-sm text-gray-400 mb-1.5">Intro text at the top of the page (optional)</span>
                    <textarea
                        rows={2}
                        value={values.tiers_intro || ''}
                        placeholder="Your tier is based on all the points you've earned, so redeeming rewards never moves you down."
                        onChange={(e) => setValues((v) => ({ ...v, tiers_intro: e.target.value }))}
                        className={inputClass}
                    />
                </label>
                <div className="space-y-4">
                    {tiers.map((t, i) => (
                        <div key={t.id || `new-${i}`} className="border border-input rounded-xl p-4">
                            <div className="flex gap-2 mb-2">
                                <input
                                    value={t.name}
                                    placeholder="Tier name, e.g. Gold"
                                    onChange={(e) => updateTier(i, 'name', e.target.value)}
                                    className={`${inputClass} font-medium`}
                                />
                                <input
                                    inputMode="numeric"
                                    value={t.min_points}
                                    placeholder="Points needed"
                                    onChange={(e) => updateTier(i, 'min_points', e.target.value)}
                                    className={`${inputClass} max-w-[160px]`}
                                />
                                <button onClick={() => setTiers((items) => items.filter((_, j) => j !== i))} title="Remove tier"
                                    className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={18} /></button>
                            </div>
                            <textarea
                                value={t.benefits}
                                placeholder={'What members get — one benefit per line'}
                                rows={3}
                                onChange={(e) => updateTier(i, 'benefits', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-surface rounded-2xl border border-input p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Program terms &amp; privacy</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {LINK_FIELDS.map((f) => (
                        <label key={f.key} className="block">
                            <span className="block text-sm text-gray-400 mb-1.5">{f.label}</span>
                            <input
                                value={values[f.key] || ''}
                                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                                className={inputClass}
                            />
                        </label>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HelpContact;
