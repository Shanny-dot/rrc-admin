import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';

const CATEGORY_LABELS = { idea: 'Idea', problem: 'Problem', praise: 'Praise', other: 'Other' };
const CATEGORY_STYLES = {
    idea: 'bg-blue-500/10 text-blue-400',
    problem: 'bg-red-500/10 text-red-400',
    praise: 'bg-green-500/10 text-green-400',
    other: 'bg-gray-500/10 text-gray-300',
};
const STATUS_LABELS = { new: 'New', read: 'Read', resolved: 'Resolved' };

const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

const Feedback = () => {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('open');

    const { data: items = [], isLoading, isError } = useQuery({
        queryKey: ['adminFeedback'],
        queryFn: async () => (await api.get('/api/v1/admin/feedback')).data,
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => api.put(`/api/v1/admin/feedback/${id}`, { status }),
        onSuccess: () => queryClient.invalidateQueries(['adminFeedback']),
        onError: (err) => alert(err.response?.data?.detail || err.message),
    });

    const visible = items.filter((f) => (filter === 'open' ? f.status !== 'resolved' : filter === 'all' || f.status === filter));
    const newCount = items.filter((f) => f.status === 'new').length;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Feedback</h1>
                    <p className="text-gray-400 mt-1">
                        Messages members send from the app's "Send feedback" form{newCount ? ` — ${newCount} new` : ''}.
                    </p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-input border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                >
                    <option value="open">Not resolved</option>
                    <option value="new">New</option>
                    <option value="resolved">Resolved</option>
                    <option value="all">All</option>
                </select>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-gray-400">Loading feedback...</div>
            ) : isError ? (
                <div className="p-8 text-center text-red-400">Couldn't load feedback. Please refresh.</div>
            ) : visible.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-input p-8 text-center text-gray-400">No feedback here yet.</div>
            ) : (
                <div className="space-y-4">
                    {visible.map((f) => {
                        const member = f.users || {};
                        return (
                            <div key={f.id} className={`bg-surface rounded-2xl border p-5 ${f.status === 'new' ? 'border-gold/40' : 'border-input'}`}>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${CATEGORY_STYLES[f.category] || CATEGORY_STYLES.other}`}>
                                        {CATEGORY_LABELS[f.category] || 'Other'}
                                    </span>
                                    {f.status === 'new' && <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gold/10 text-gold">New</span>}
                                    <span className="text-sm text-gray-400">{formatDate(f.created_at)}</span>
                                    {(f.platform || f.app_version) && (
                                        <span className="text-xs text-gray-500">· {[f.platform, f.app_version].filter(Boolean).join(' ')}</span>
                                    )}
                                </div>
                                <p className="text-white whitespace-pre-wrap leading-relaxed mb-4">{f.message}</p>
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-input pt-3">
                                    <div className="text-sm">
                                        <span className="text-white font-medium">{member.full_name || 'Member'}</span>
                                        <span className="text-gray-400"> {[member.email, member.mobile].filter(Boolean).join(' · ')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {member.email && (
                                            <a
                                                href={`mailto:${member.email}?subject=${encodeURIComponent('Re: your Reliance Rewards feedback')}`}
                                                className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-light px-3 py-1.5"
                                            >
                                                <Mail size={15} /> Reply
                                            </a>
                                        )}
                                        <select
                                            value={f.status}
                                            onChange={(e) => statusMutation.mutate({ id: f.id, status: e.target.value })}
                                            className="bg-input border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold"
                                        >
                                            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Feedback;
