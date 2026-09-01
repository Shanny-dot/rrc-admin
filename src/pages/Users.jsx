import { useState } from 'react';
import { Search, Shield, Trash2, Edit3, RotateCcw, AlertTriangle, X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

const Users = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'deleted'
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [editingUser, setEditingUser] = useState(null); // { id, full_name, total_points }
    const [newPoints, setNewPoints] = useState(0);
    const [editReason, setEditReason] = useState('Admin manual adjustment');
    
    const [deletingUser, setDeletingUser] = useState(null); // user object to delete
    const [restoringUser, setRestoringUser] = useState(null); // user object to restore

    // Fetch Active Users
    const { data: activeUsers = [], isLoading: isLoadingActive } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/users');
            return res.data;
        }
    });

    // Fetch Deleted Users (Last 30 Days)
    const { data: deletedUsers = [], isLoading: isLoadingDeleted } = useQuery({
        queryKey: ['adminDeletedUsers'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/deleted-users');
            return res.data;
        }
    });

    // Mutation: Edit Points
    const updatePointsMutation = useMutation({
        mutationFn: async ({ id, newPoints, reason }) => {
            const res = await api.put(`/api/v1/admin/users/${id}/points`, {
                new_points: Number(newPoints),
                reason
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers']);
            queryClient.invalidateQueries(['adminDeletedUsers']);
            setEditingUser(null);
        }
    });

    // Mutation: Delete User (Soft Delete)
    const deleteUserMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/api/v1/admin/users/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers']);
            queryClient.invalidateQueries(['adminDeletedUsers']);
            setDeletingUser(null);
        }
    });

    // Mutation: Restore User
    const restoreUserMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.post(`/api/v1/admin/users/${id}/restore`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers']);
            queryClient.invalidateQueries(['adminDeletedUsers']);
            setRestoringUser(null);
        }
    });

    const currentList = activeTab === 'active' ? activeUsers : deletedUsers;
    const isLoading = activeTab === 'active' ? isLoadingActive : isLoadingDeleted;

    const filteredUsers = currentList.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            (user.full_name || '').toLowerCase().includes(query) ||
            (user.email || '').toLowerCase().includes(query) ||
            (user.mobile || '').toLowerCase().includes(query)
        );
    });

    const openEditPoints = (user) => {
        setEditingUser(user);
        setNewPoints(user.total_points || 0);
        setEditReason('Admin adjustment');
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-gray-400 mt-1">View active members, edit rewards points, and manage deleted accounts</p>
                </div>

                {/* Tabs Toggle */}
                <div className="flex bg-surface p-1 rounded-xl border border-input">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'active'
                                ? 'bg-gold text-black font-bold shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Active Members ({activeUsers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('deleted')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                            activeTab === 'deleted'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-bold'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Deleted Users (30 Days) ({deletedUsers.length})
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-input flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or mobile..."
                            className="w-full bg-input border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Loading members...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            {activeTab === 'active' 
                                ? 'No active users found.' 
                                : 'No deleted users in the last 30 days.'}
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#111] text-gray-400 border-b border-input">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium">Email</th>
                                    <th className="px-6 py-4 font-medium">Gender</th>
                                    <th className="px-6 py-4 font-medium">Occupancy</th>
                                    <th className="px-6 py-4 font-medium">Joined</th>
                                    <th className="px-6 py-4 font-medium">Reward Points</th>
                                    {activeTab === 'deleted' && <th className="px-6 py-4 font-medium">Deleted On</th>}
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-input">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-white font-medium">{user.full_name}</td>
                                        <td className="px-6 py-4 text-gray-400">{user.email}</td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {user.gender ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs bg-white/5 border border-white/10 text-gray-300">
                                                    {user.gender}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {user.home_ownership || user.occupancy ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs bg-gold/10 border border-gold/20 text-gold font-medium">
                                                    {user.home_ownership || user.occupancy}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        
                                        {/* Points Column with Quick Edit */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gold font-bold text-base">{user.total_points || 0} pts</span>
                                                {activeTab === 'active' && (
                                                    <button
                                                        onClick={() => openEditPoints(user)}
                                                        title="Edit Reward Points"
                                                        className="p-1 text-gray-500 hover:text-gold transition-colors"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {activeTab === 'deleted' && (
                                            <td className="px-6 py-4 text-red-400 text-xs">
                                                {user.deleted_at ? new Date(user.deleted_at).toLocaleString() : 'Recently'}
                                            </td>
                                        )}

                                        <td className="px-6 py-4">
                                            {user.is_admin ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <Shield size={13} /> Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    Member
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            {activeTab === 'active' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditPoints(user)}
                                                        className="px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold rounded-lg transition-colors border border-gold/30"
                                                    >
                                                        Edit Points
                                                    </button>
                                                    {!user.is_admin && (
                                                        <button
                                                            onClick={() => setDeletingUser(user)}
                                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setRestoringUser(user)}
                                                    className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg transition-colors border border-green-500/30 flex items-center gap-1 ml-auto"
                                                >
                                                    <RotateCcw size={14} /> Restore Account
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL: EDIT REWARD POINTS */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface border border-input rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-input">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit3 className="text-gold" size={20} /> Edit Reward Points
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">User Account:</p>
                                <p className="text-white font-medium text-lg">{editingUser.full_name}</p>
                                <p className="text-gray-500 text-xs">{editingUser.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">New Total Points Balance</label>
                                <input
                                    type="number"
                                    value={newPoints}
                                    onChange={(e) => setNewPoints(e.target.value)}
                                    className="w-full bg-input border border-[#444] rounded-lg px-4 py-2.5 text-gold font-bold text-xl focus:outline-none focus:border-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Reason / Note</label>
                                <input
                                    type="text"
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    className="w-full bg-input border border-[#444] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold"
                                    placeholder="Reason for adjustment"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-input">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 rounded-lg bg-input hover:bg-[#333] text-gray-300 text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => updatePointsMutation.mutate({
                                    id: editingUser.id,
                                    newPoints,
                                    reason: editReason
                                })}
                                disabled={updatePointsMutation.isPending}
                                className="px-5 py-2 rounded-lg bg-gold hover:bg-gold-light text-black text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {updatePointsMutation.isPending ? 'Saving...' : 'Save Points'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: DELETE USER CONFIRMATION */}
            {deletingUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 text-red-400 mb-4">
                            <AlertTriangle size={28} />
                            <h3 className="text-xl font-bold">Delete User Account</h3>
                        </div>
                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                            Are you sure you want to delete <strong className="text-white">{deletingUser.full_name}</strong> ({deletingUser.email})?
                        </p>
                        <p className="text-xs text-gray-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-6">
                            ℹ️ The account will be moved to the <strong>Deleted Users (30 Days)</strong> section. You can restore it anytime within 30 days.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingUser(null)}
                                className="px-4 py-2 rounded-lg bg-input hover:bg-[#333] text-gray-300 text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteUserMutation.mutate(deletingUser.id)}
                                disabled={deleteUserMutation.isPending}
                                className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: RESTORE USER CONFIRMATION */}
            {restoringUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface border border-green-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 text-green-400 mb-4">
                            <RotateCcw size={24} />
                            <h3 className="text-xl font-bold">Restore User Account</h3>
                        </div>
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                            Restore <strong className="text-white">{restoringUser.full_name}</strong> ({restoringUser.email}) back to Active Members?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRestoringUser(null)}
                                className="px-4 py-2 rounded-lg bg-input hover:bg-[#333] text-gray-300 text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => restoreUserMutation.mutate(restoringUser.id)}
                                disabled={restoreUserMutation.isPending}
                                className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {restoreUserMutation.isPending ? 'Restoring...' : 'Restore User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
