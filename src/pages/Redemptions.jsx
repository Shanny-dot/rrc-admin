import { Search, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';

const Redemptions = () => {
    const queryClient = useQueryClient();

    const { data: redemptions = [], isLoading } = useQuery({
        queryKey: ['adminRedemptions'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/redemptions');
            return res.data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: (id) => api.put(`/api/v1/admin/redemptions/${id}/approve`),
        onSuccess: () => queryClient.invalidateQueries(['adminRedemptions'])
    });

    const rejectMutation = useMutation({
        mutationFn: (id) => api.put(`/api/v1/admin/redemptions/${id}/reject`, { admin_note: 'Rejected by admin' }),
        onSuccess: () => queryClient.invalidateQueries(['adminRedemptions'])
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reward Redemptions</h1>
                    <p className="text-gray-400 mt-1">Review and process user reward claims</p>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                <div className="p-4 border-b border-input flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by user or reward..."
                            className="w-full bg-input border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                    <select className="bg-input border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors">
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Loading redemptions...</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#111] text-gray-400 border-b border-input">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">User</th>
                                    <th className="px-6 py-4 font-medium">Reward Claimed</th>
                                    <th className="px-6 py-4 font-medium">Points Used</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-input">
                                {redemptions.map((req) => (
                                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-gray-400">{new Date(req.requested_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-white font-medium">{req.users?.full_name}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{req.users?.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">{req.rewards?.title}</td>
                                        <td className="px-6 py-4 text-gold font-bold">{req.points_used} Points</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${req.status === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                                                req.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'pending' ? (
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
                                                        title="Reject & Refund Points"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-xs">Actioned</span>
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
