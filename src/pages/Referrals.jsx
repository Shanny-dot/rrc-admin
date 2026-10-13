import { useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';

// Stages the member sees on their referral tracker, in order.
const STAGES = [
    { value: 'invited', label: 'Invited' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'loan_in_progress', label: 'Loan in progress' },
    { value: 'settled', label: 'Settled' },
    { value: 'rewarded', label: 'Points added' },
    { value: 'closed', label: 'Not proceeding' },
];

// Older rows use these statuses; they sit at the "Invited" stage.
const normalise = (status) => (status === 'pending' || status === 'registered' ? 'invited' : status);

const STAGE_STYLES = {
    invited: 'bg-orange-500/10 text-orange-400',
    contacted: 'bg-blue-500/10 text-blue-400',
    loan_in_progress: 'bg-blue-500/10 text-blue-400',
    settled: 'bg-green-500/10 text-green-400',
    rewarded: 'bg-green-500/10 text-green-400',
    closed: 'bg-red-500/10 text-red-400',
};

const CHANNELS = { sms: 'SMS', whatsapp: 'WhatsApp', share: 'Message', email: 'Email', form: 'Form', contacts: 'Contacts', code: 'Referral code' };

const Referrals = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [stageFilter, setStageFilter] = useState('open');

    const { data: referrals = [], isLoading, isError } = useQuery({
        queryKey: ['adminReferrals'],
        queryFn: async () => (await api.get('/api/v1/admin/referrals')).data,
    });

    const stageMutation = useMutation({
        mutationFn: ({ id, status, points }) =>
            api.put(`/api/v1/admin/referrals/${id}/stage`, points ? { status, points } : { status }),
        onSuccess: () => queryClient.invalidateQueries(['adminReferrals']),
        onError: (err) => alert(err.response?.data?.detail || err.message),
    });

    const changeStage = (ref, status) => {
        if (status === 'rewarded') {
            const input = window.prompt(
                `Award referral points to ${ref.referrer?.full_name || 'the member'} for referring ${ref.referred_name}?\n\n` +
                'Points to award (leave blank to use the standard referral points setting):',
                ''
            );
            if (input === null) return;
            const points = input.trim() ? parseInt(input.trim(), 10) : undefined;
            if (input.trim() && (!points || points <= 0)) {
                alert('Please enter a positive whole number of points.');
                return;
            }
            stageMutation.mutate({ id: ref.id, status, points });
            return;
        }
        stageMutation.mutate({ id: ref.id, status });
    };

    const q = search.trim().toLowerCase();
    const visible = referrals.filter((r) => {
        const stage = normalise(r.status);
        if (stageFilter === 'open' && (stage === 'rewarded' || stage === 'closed')) return false;
        if (stageFilter !== 'open' && stageFilter !== 'all' && stage !== stageFilter) return false;
        if (!q) return true;
        return `${r.referred_name} ${r.referred_email || ''} ${r.referred_mobile || ''} ${r.referrer?.full_name || ''} ${r.referrer?.email || ''}`
            .toLowerCase()
            .includes(q);
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Referrals</h1>
                <p className="text-gray-400 mt-1">
                    Update each referral as it progresses. Members see these stages in the app. Moving to "Points added" awards the referral points once.
                </p>
            </div>

            <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                <div className="p-4 border-b border-input flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search friend or referring member..."
                            className="w-full bg-input border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                    <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="bg-input border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                    >
                        <option value="open">Open (not finished)</option>
                        {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        <option value="all">All</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Loading referrals...</div>
                    ) : isError ? (
                        <div className="p-8 text-center text-red-400">Couldn't load referrals. Please refresh.</div>
                    ) : visible.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No referrals match this filter.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#111] text-gray-400 border-b border-input">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Referred</th>
                                    <th className="px-6 py-4 font-medium">Friend</th>
                                    <th className="px-6 py-4 font-medium">Contact</th>
                                    <th className="px-6 py-4 font-medium">Referred by</th>
                                    <th className="px-6 py-4 font-medium">Notes</th>
                                    <th className="px-6 py-4 font-medium">Stage</th>
                                    <th className="px-6 py-4 font-medium">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-input">
                                {visible.map((r) => {
                                    const stage = normalise(r.status);
                                    return (
                                        <tr key={r.id} className="hover:bg-white/5 transition-colors align-top">
                                            <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                                {new Date(r.created_at).toLocaleDateString()}
                                                <p className="text-gray-500 text-xs mt-0.5">{CHANNELS[r.channel] || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-white font-medium">
                                                {r.referred_name}
                                                {r.status === 'registered' && <p className="text-green-400 text-xs mt-0.5">Joined the app</p>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {r.referred_mobile && <p>{r.referred_mobile}</p>}
                                                {r.referred_email && <p className="text-gray-500 text-xs">{r.referred_email}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-white">{r.referrer?.full_name || '—'}</p>
                                                <p className="text-gray-500 text-xs">{r.referrer?.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 max-w-[220px]">{r.notes || '—'}</td>
                                            <td className="px-6 py-4">
                                                {stage === 'rewarded' ? (
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_STYLES.rewarded}`}>Points added</span>
                                                ) : (
                                                    <select
                                                        value={stage}
                                                        disabled={stageMutation.isPending}
                                                        onChange={(e) => changeStage(r, e.target.value)}
                                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border border-[#333] focus:outline-none focus:border-gold ${STAGE_STYLES[stage] || ''}`}
                                                    >
                                                        {STAGES.map((s) => (
                                                            <option key={s.value} value={s.value} className="bg-[#1a1a1a] text-white">{s.label}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gold font-bold">{r.points_earned || '—'}</td>
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

export default Referrals;
