import { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Send, Loader, Mail, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';

const STATUS_STYLES = {
    pending: 'bg-orange-500/10 text-orange-400',
    in_progress: 'bg-blue-500/10 text-blue-400',
    approved: 'bg-green-500/10 text-green-400',
    sent: 'bg-blue-500/10 text-blue-400',
    rejected: 'bg-red-500/10 text-red-400',
};

const FALLBACK_LABELS = { pending: 'Pending', in_progress: 'In progress', approved: 'Approved', sent: 'Sent', rejected: 'Rejected' };

const STATUS_HELP = {
    pending: 'Sent to the member as soon as they redeem (their confirmation email).',
    in_progress: 'Sent when you click "In progress".',
    approved: 'Sent when you approve the request.',
    sent: 'Sent when you mark the reward as sent. Your note (e.g. a gift card code) is added to the email.',
    rejected: 'Sent when you reject the request. Their points are returned automatically.',
};

const inputClass = 'w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors';

const memberName = (users) => {
    if (users?.full_name && users.full_name !== users?.email) return users.full_name;
    if (users?.email) return users.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return 'Member';
};

/** Status names and the email the member gets for each, edited by staff. */
const StatusWording = ({ wording, onSaved }) => {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (wording) setDraft(wording.statuses);
    }, [wording]);

    const update = (status, field, value) => setDraft((d) => ({ ...d, [status]: { ...d[status], [field]: value } }));

    const save = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.put('/api/v1/admin/redemption-statuses', { statuses: draft });
            setMessage({ error: false, text: 'Saved. New emails and the app use this wording straight away.' });
            onSaved();
        } catch (err) {
            setMessage({ error: true, text: err.response?.data?.detail || err.message });
        } finally {
            setSaving(false);
        }
    };

    if (!wording || !draft) return null;
    return (
        <div className="bg-surface rounded-2xl border border-input mb-6">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
                <div className="flex items-center gap-3">
                    <Mail size={20} className="text-gold" />
                    <div>
                        <p className="text-white font-semibold">Status names &amp; emails</p>
                        <p className="text-sm text-gray-400">Change what each status is called and the email members get when it changes.</p>
                    </div>
                </div>
                {open ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
            </button>
            {open && (
                <div className="px-5 pb-5 space-y-5">
                    <p className="text-sm text-gray-400">
                        You can use <code className="text-gold">{'{reward}'}</code>, <code className="text-gold">{'{points}'}</code>,{' '}
                        <code className="text-gold">{'{balance}'}</code> and <code className="text-gold">{'{reference}'}</code> — they're filled in for each member.
                        Every email also lists the reward, status, reference number and points balance.
                    </p>
                    {wording.order.map((status) => (
                        <div key={status} className="border border-input rounded-xl p-4 space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium w-fit ${STATUS_STYLES[status]}`}>{FALLBACK_LABELS[status]}</span>
                                <span className="text-xs text-gray-500">{STATUS_HELP[status]}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <label className="block">
                                    <span className="block text-xs text-gray-400 mb-1">Name shown to members</span>
                                    <input value={draft[status]?.label || ''} onChange={(e) => update(status, 'label', e.target.value)} className={inputClass} />
                                </label>
                                <label className="block md:col-span-2">
                                    <span className="block text-xs text-gray-400 mb-1">Email subject</span>
                                    <input value={draft[status]?.subject || ''} onChange={(e) => update(status, 'subject', e.target.value)} className={inputClass} />
                                </label>
                            </div>
                            <label className="block">
                                <span className="block text-xs text-gray-400 mb-1">Email message</span>
                                <textarea rows={3} value={draft[status]?.message || ''} onChange={(e) => update(status, 'message', e.target.value)} className={inputClass} />
                            </label>
                        </div>
                    ))}
                    {message && (
                        <div className={`p-3 rounded-lg border text-sm ${message.error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                            {message.text}
                        </div>
                    )}
                    <button
                        onClick={save}
                        disabled={saving}
                        className="bg-gold hover:bg-gold-light text-black font-semibold px-5 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Save size={16} /> {saving ? 'Saving...' : 'Save wording'}
                    </button>
                </div>
            )}
        </div>
    );
};

const Redemptions = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('open');
    const [search, setSearch] = useState('');

    const { data: redemptions = [], isLoading } = useQuery({
        queryKey: ['adminRedemptions'],
        queryFn: async () => (await api.get('/api/v1/admin/redemptions')).data,
    });
    const { data: wording } = useQuery({
        queryKey: ['redemptionStatuses'],
        queryFn: async () => (await api.get('/api/v1/admin/redemption-statuses')).data,
    });
    const label = (status) => wording?.statuses?.[status]?.label || FALLBACK_LABELS[status] || status;

    const refresh = () => queryClient.invalidateQueries(['adminRedemptions']);
    const statusMutation = useMutation({
        mutationFn: ({ id, status, note }) => api.put(`/api/v1/admin/redemptions/${id}/status`, note ? { status, admin_note: note } : { status }),
        onSuccess: refresh,
        onError: (err) => alert(err.response?.data?.detail || err.message),
    });

    const move = (req, status) => {
        const reward = req.rewards?.title;
        const who = memberName(req.users);
        let note = '';
        if (status === 'rejected') {
            note = window.prompt(`Reject "${reward}" for ${who}? Their ${req.points_used} points will be returned.\n\nReason for the member's email (optional):`, '');
            if (note === null) return;
        } else if (status === 'sent') {
            note = window.prompt(`Mark "${reward}" as sent to ${who}?\n\nOptional note for the member's email (e.g. gift card code or tracking details):`, '');
            if (note === null) return;
        } else if (!window.confirm(`Change "${reward}" for ${who} to "${label(status)}"? The member will be emailed.`)) {
            return;
        }
        statusMutation.mutate({ id: req.id, status, note: (note || '').trim() });
    };

    const q = search.trim().toLowerCase();
    const visible = redemptions.filter((r) => {
        if (statusFilter === 'open' && !['pending', 'in_progress', 'approved'].includes(r.status)) return false;
        if (!['open', 'all'].includes(statusFilter) && r.status !== statusFilter) return false;
        if (!q) return true;
        return `${memberName(r.users)} ${r.users?.email || ''} ${r.rewards?.title || ''} ${String(r.id).slice(0, 8)}`.toLowerCase().includes(q);
    });

    const actionButton = (req, status, Icon, text, style) => (
        <button
            key={status}
            onClick={() => move(req, status)}
            disabled={statusMutation.isPending}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${style}`}
        >
            <Icon size={14} /> {text}
        </button>
    );

    const actionsFor = (req) => {
        const inProgress = actionButton(req, 'in_progress', Loader, label('in_progress'), 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20');
        const approve = actionButton(req, 'approved', CheckCircle, 'Approve', 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20');
        const reject = actionButton(req, 'rejected', XCircle, 'Reject', 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20');
        const sent = actionButton(req, 'sent', Send, 'Mark as sent', 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20');
        if (req.status === 'pending') return [inProgress, approve, reject, sent];
        if (req.status === 'in_progress') return [approve, reject, sent];
        if (req.status === 'approved') return [sent];
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reward Redemptions</h1>
                    <p className="text-gray-400 mt-1">
                        Move each request along: {label('pending')} → {label('in_progress')} → {label('approved')} or {label('rejected')}. The member is emailed at every step.
                    </p>
                </div>
            </div>

            <StatusWording wording={wording} onSaved={() => queryClient.invalidateQueries(['redemptionStatuses'])} />

            <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                <div className="p-4 border-b border-input flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by member, reward or reference..."
                            className="w-full bg-input border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-input border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                    >
                        <option value="open">Open (needs action)</option>
                        <option value="pending">{label('pending')}</option>
                        <option value="in_progress">{label('in_progress')}</option>
                        <option value="approved">{label('approved')} (to send)</option>
                        <option value="sent">{label('sent')}</option>
                        <option value="rejected">{label('rejected')}</option>
                        <option value="all">All</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Loading redemptions...</div>
                    ) : visible.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No redemptions match this filter.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#111] text-gray-400 border-b border-input">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Member</th>
                                    <th className="px-6 py-4 font-medium">Reward</th>
                                    <th className="px-6 py-4 font-medium">Reference</th>
                                    <th className="px-6 py-4 font-medium">Points</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-input">
                                {visible.map((req) => {
                                    const actions = actionsFor(req);
                                    return (
                                        <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-gray-400">{new Date(req.requested_at).toLocaleDateString('en-AU')}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-white font-medium">{memberName(req.users)}</p>
                                                <p className="text-gray-500 text-xs mt-0.5">{req.users?.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-white font-medium">{req.rewards?.title}</td>
                                            <td className="px-6 py-4 text-gray-400 font-mono text-xs">{String(req.id).slice(0, 8).toUpperCase()}</td>
                                            <td className="px-6 py-4 text-gold font-bold">{req.points_used}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[req.status] || STATUS_STYLES.pending}`}>
                                                    {label(req.status)}
                                                </span>
                                                {req.admin_note && <p className="text-gray-500 text-xs mt-1 max-w-[200px]">{req.admin_note}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {actions ? (
                                                    <div className="flex items-center justify-end gap-2 flex-wrap">{actions}</div>
                                                ) : (
                                                    <span className="text-gray-500 text-xs">
                                                        {req.status === 'sent' && req.sent_at ? `Sent ${new Date(req.sent_at).toLocaleDateString('en-AU')}` : 'Done'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Redemptions;
