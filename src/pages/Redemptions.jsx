import { useState } from 'react';
import { Search, CheckCircle, XCircle, Send } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';

const STATUS_STYLES = {
    pending: 'bg-orange-500/10 text-orange-400',
    approved: 'bg-green-500/10 text-green-400',
    sent: 'bg-blue-500/10 text-blue-400',
    rejected: 'bg-red-500/10 text-red-400',
};

const memberName = (users) => {
    if (users?.full_name && users.full_name !== users?.email) return users.full_name;
    if (users?.email) return users.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return 'Member';
};

const Redemptions = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('pending');
    const [search, setSearch] = useState('');

    const { data: redemptions = [], isLoading } = useQuery({
        queryKey: ['adminRedemptions'],
        queryFn: async () => (await api.get('/api/v1/admin/redemptions')).data,
    });

    const refresh = () => queryClient.invalidateQueries(['adminRedemptions']);
    const onError = (err) => alert(err.response?.data?.detail || err.message);

    const approveMutation = useMutation({
        mutationFn: (id) => api.put(`/api/v1/admin/redemptions/${id}/approve`),
        onSuccess: refresh, onError,
    });
    const rejectMutation = useMutation({
        mutationFn: (id) => api.put(`/api/v1/admin/redemptions/${id}/reject`, { admin_note: 'Rejected by admin' }),
        onSuccess: refresh, onError,
    });
    const sentMutation = useMutation({
        mutationFn: ({ id, note }) => api.put(`/api/v1/admin/redemptions/${id}/sent`, note ? { admin_note: note } : {}),
        onSuccess: refresh, onError,
    });

    const markSent = (req) => {
        const note = window.prompt(
            `Mark "${req.rewards?.title}" as sent to ${memberName(req.users)}?\n\nOptional note for the member's email (e.g. gift card code or tracking details):`,
            ''
        );
        if (note === null) return; // cancelled
        sentMutation.mutate({ id: req.id, note: note.trim() });
    };

    const q = search.trim().toLowerCase();
    const visible = redemptions.filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (!q) return true;
        return `${memberName(r.users)} ${r.users?.email || ''} ${r.rewards?.title || ''}`.toLowerCase().includes(q);
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reward Redemptions</h1>
                    <p className="text-gray-400 mt-1">Approve requests, then mark them as sent once the member has their reward</p>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                <div className="p-4 border-b border-input flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by member or reward..."
                            className="w-full bg-input border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-input border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved (to send)</option>
                        <option value="sent">Sent</option>
                        <option value="rejected">Rejected</option>
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
                                {visible.map((req) => (
                                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-gray-400">{new Date(req.requested_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-white font-medium">{memberName(req.users)}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{req.users?.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">{req.rewards?.title}</td>
                                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">{String(req.id).slice(0, 8).toUpperCase()}</td>
                                        <td className="px-6 py-4 text-gold font-bold">{req.points_used}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[req.status] || STATUS_STYLES.pending}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => approveMutation.mutate(req.id)}
                                                        className="bg-green-500/10 hover:bg-green-500/20 text-green-400 p-2 rounded-lg transition-colors border border-green-500/20"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => rejectMutation.mutate(req.id)}
                                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors border border-red-500/20"
                                                        title="Reject & refund points"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                            {req.status === 'approved' && (
                                                <button
                                                    onClick={() => markSent(req)}
                                                    className="inline-flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg transition-colors border border-blue-500/20"
                                                >
                                                    <Send size={16} /> Mark as sent
                                                </button>
                                            )}
                                            {(req.status === 'sent' || req.status === 'rejected') && (
                                                <span className="text-gray-500 text-xs">
                                                    {req.status === 'sent' && req.sent_at ? `Sent ${new Date(req.sent_at).toLocaleDateString()}` : 'Actioned'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Redemptions;
