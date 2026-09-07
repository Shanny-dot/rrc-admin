import { useState } from 'react';
import { Search, Shield, Trash2, Edit3, RotateCcw, AlertTriangle, X, Check, Eye } from 'lucide-react';
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
    const [viewingUser, setViewingUser] = useState(null);   // user object for detail drawer
    const [drawerForm, setDrawerForm] = useState({});       // editable copy of user fields
    const [drawerDirty, setDrawerDirty] = useState(false);

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

    // Mutation: Save user profile from drawer
    const saveProfileMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.put(`/api/v1/admin/users/${id}`, data);
            return res.data;
        },
        onSuccess: (updated) => {
            queryClient.invalidateQueries(['adminUsers']);
            // update viewing user with fresh data
            setViewingUser(updated);
            setDrawerForm(updated);
            setDrawerDirty(false);
        }
    });

    const openDrawer = (user) => {
        setViewingUser(user);
        setDrawerForm({ ...user });
        setDrawerDirty(false);
    };

    const handleDrawerChange = (field, value) => {
        setDrawerForm(prev => ({ ...prev, [field]: value }));
        setDrawerDirty(true);
    };

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
                                        <td className="px-6 py-4 text-white font-medium">
                                            {user.full_name && user.full_name !== user.email
                                                ? user.full_name
                                                : user.email
                                                    ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                                                    : 'Member'}
                                        </td>
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
                                                        onClick={() => openDrawer(user)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="View / Edit Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
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
            {/* DRAWER: USER DETAIL VIEW/EDIT */}
            {viewingUser && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => setViewingUser(null)}
                    />
                    {/* Panel */}
                    <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-surface border-l border-input z-50 overflow-y-auto shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-input sticky top-0 bg-surface z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {drawerForm.full_name && drawerForm.full_name !== drawerForm.email
                                        ? drawerForm.full_name
                                        : drawerForm.email?.split('@')[0] || 'Member'}
                                </h2>
                                <p className="text-gray-400 text-sm mt-0.5">{drawerForm.email}</p>
                            </div>
                            <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 flex-1">

                            {/* Identity */}
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Identity</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Full Name</label>
                                        <input
                                            value={drawerForm.full_name || ''}
                                            onChange={e => handleDrawerChange('full_name', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Mobile</label>
                                        <input
                                            value={drawerForm.mobile || ''}
                                            onChange={e => handleDrawerChange('mobile', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Date of Birth</label>
                                        <input
                                            value={drawerForm.dob || ''}
                                            onChange={e => handleDrawerChange('dob', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Gender</label>
                                        <select
                                            value={drawerForm.gender || ''}
                                            onChange={e => handleDrawerChange('gender', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                        >
                                            <option value="">— Select —</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Non-binary">Non-binary</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Professional */}
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Professional</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Industry</label>
                                        <input
                                            value={drawerForm.industry || ''}
                                            onChange={e => handleDrawerChange('industry', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Home Ownership</label>
                                        <select
                                            value={drawerForm.home_ownership_status || drawerForm.home_ownership || ''}
                                            onChange={e => handleDrawerChange('home_ownership_status', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                        >
                                            <option value="">— Select —</option>
                                            <option value="Owner">Owner</option>
                                            <option value="Renter">Renter</option>
                                            <option value="Living with family">Living with family</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-gray-400 block mb-1">Annual Income</label>
                                        <input
                                            value={drawerForm.annual_income || ''}
                                            onChange={e => handleDrawerChange('annual_income', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                            placeholder="e.g. $80,000 – $100,000"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Address */}
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Address</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs text-gray-400 block mb-1">Street Address</label>
                                        <input
                                            value={drawerForm.street_address || ''}
                                            onChange={e => handleDrawerChange('street_address', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">City</label>
                                        <input
                                            value={drawerForm.city || ''}
                                            onChange={e => handleDrawerChange('city', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">State</label>
                                        <input
                                            value={drawerForm.state || ''}
                                            onChange={e => handleDrawerChange('state', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Post Code</label>
                                        <input
                                            value={drawerForm.postal_code || ''}
                                            onChange={e => handleDrawerChange('postal_code', e.target.value)}
                                            className="w-full bg-input border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Account Info (read-only) */}
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Account Info</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Total Points', value: `${viewingUser.total_points || 0} pts` },
                                        { label: 'Referral Code', value: viewingUser.referral_code || '—' },
                                        { label: 'Joined', value: viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString() : '—' },
                                        { label: 'Role', value: viewingUser.is_admin ? 'Admin' : 'Member' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-input rounded-lg px-3 py-2">
                                            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                                            <p className="text-white text-sm font-medium">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-input sticky bottom-0 bg-surface flex justify-between items-center gap-3">
                            {saveProfileMutation.isError && (
                                <p className="text-red-400 text-xs">Save failed. Please try again.</p>
                            )}
                            {saveProfileMutation.isSuccess && !drawerDirty && (
                                <p className="text-green-400 text-xs flex items-center gap-1"><Check size={14} /> Saved</p>
                            )}
                            {!saveProfileMutation.isError && !(saveProfileMutation.isSuccess && !drawerDirty) && <span />}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setViewingUser(null)}
                                    className="px-4 py-2 rounded-lg bg-input hover:bg-[#333] text-gray-300 text-sm font-medium transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => saveProfileMutation.mutate({ id: viewingUser.id, data: drawerForm })}
                                    disabled={!drawerDirty || saveProfileMutation.isPending}
                                    className="px-5 py-2 rounded-lg bg-gold hover:bg-gold/90 text-black text-sm font-bold transition-colors disabled:opacity-40"
                                >
                                    {saveProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Users;
