import { useState, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Package, X, Upload, Image as ImageIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { supabase } from '../lib/supabase';

const Rewards = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        points_required: 0,
        image_url: '',
        stock: 0,
        is_active: true
    });

    const { data: rewards = [], isLoading } = useQuery({
        queryKey: ['adminRewards'],
        queryFn: async () => {
            const res = await api.get('/api/v1/rewards');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (newReward) => api.post('/api/v1/admin/rewards', newReward),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminRewards']);
            closeModal();
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/api/v1/admin/rewards/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminRewards']);
            closeModal();
        }
    });

    const [deleteError, setDeleteError] = useState(null);

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/v1/admin/rewards/${id}`),
        onSuccess: () => {
            setDeleteError(null);
            queryClient.invalidateQueries(['adminRewards']);
        },
        onError: (error) => {
            const msg = error?.response?.data?.detail || 'Failed to delete reward.';
            setDeleteError(msg);
            setTimeout(() => setDeleteError(null), 6000);
        }
    });

    const openModal = (reward = null) => {
        if (reward) {
            setEditingReward(reward);
            setFormData({
                title: reward.title,
                description: reward.description || '',
                category: reward.category || '',
                points_required: reward.points_required || 0,
                image_url: reward.image_url || '',
                stock: reward.stock || 0,
                is_active: reward.is_active
            });
        } else {
            setEditingReward(null);
            setFormData({
                title: '',
                description: '',
                category: '',
                points_required: 0,
                image_url: '',
                stock: 0,
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingReward(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    // --- Image Upload ---
    const handleImageUpload = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (jpg, png, gif, webp)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `reward_${Date.now()}.${ext}`;

            const { data, error } = await supabase.storage
                .from('reward-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) {
                console.error('Upload error:', error);
                // Try to create the bucket first
                const { error: bucketError } = await supabase.storage.createBucket('reward-images', {
                    public: true,
                    fileSizeLimit: 5242880,
                });

                if (!bucketError || bucketError.message?.includes('already exists')) {
                    const { data: retryData, error: retryError } = await supabase.storage
                        .from('reward-images')
                        .upload(fileName, file, { cacheControl: '3600', upsert: false });

                    if (retryError) throw retryError;

                    const { data: urlData } = supabase.storage
                        .from('reward-images')
                        .getPublicUrl(fileName);

                    setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
                } else {
                    throw bucketError;
                }
            } else {
                const { data: urlData } = supabase.storage
                    .from('reward-images')
                    .getPublicUrl(fileName);

                setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
            }
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Image upload failed. You can enter a URL manually instead.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleImageUpload(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            stock: formData.stock > 0 ? formData.stock : null
        };

        if (editingReward) {
            updateMutation.mutate({ id: editingReward.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this reward? This action cannot be undone.")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reward Catalog</h1>
                    <p className="text-gray-400 mt-1">Manage items available for point redemption</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    New Reward
                </button>
            </div>

            {/* Delete Error Banner */}
            {deleteError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
                    <p className="text-red-400 text-sm font-medium">⚠️ {deleteError}</p>
                    <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-300 ml-4">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                <div className="p-4 border-b border-input flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search rewards..."
                            className="w-full bg-input border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Loading rewards...</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#111] text-gray-400 border-b border-input">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Reward Item</th>
                                    <th className="px-6 py-4 font-medium">Category</th>
                                    <th className="px-6 py-4 font-medium">Points Required</th>
                                    <th className="px-6 py-4 font-medium">Stock Levels</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-input">
                                {rewards.map((reward) => (
                                    <tr key={reward.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#222]">
                                                    {reward.image_url ? (
                                                        <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Img</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{reward.title}</p>
                                                    <p className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">{reward.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{reward.category}</td>
                                        <td className="px-6 py-4 text-gold font-bold">{reward.points_required}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Package size={16} className={reward.stock < 10 ? 'text-orange-400' : 'text-gray-400'} />
                                                <span className={reward.stock < 10 ? 'text-orange-400 font-medium' : 'text-gray-300'}>
                                                    {reward.stock ? `${reward.stock} left` : 'Unlimited'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {reward.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                                    Disabled
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => openModal(reward)}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(reward.id)}
                                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Reward Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-input rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-input">
                            <h2 className="text-xl font-bold text-white">
                                {editingReward ? 'Edit Reward' : 'Create New Reward'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">Reward Title</label>
                                    <input
                                        required
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">Description</label>
                                    <textarea
                                        rows="3"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    >
                                        <option value="">Select category...</option>
                                        <option value="Experiences">Experiences</option>
                                        <option value="Dining">Dining</option>
                                        <option value="Shopping">Shopping</option>
                                        <option value="Travel">Travel</option>
                                        <option value="Entertainment">Entertainment</option>
                                        <option value="Wellness">Wellness</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Points Required</label>
                                    <input
                                        required
                                        type="number"
                                        name="points_required"
                                        value={formData.points_required}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                {/* Image Upload Section */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">Reward Image</label>

                                    {/* Preview & Upload Area */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragging
                                            ? 'border-gold bg-gold/5'
                                            : formData.image_url
                                                ? 'border-green-500/30 bg-green-500/5'
                                                : 'border-[#333] hover:border-gold/50 hover:bg-white/[0.02]'
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />

                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-3 py-4">
                                                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                                                <p className="text-sm text-gray-400">Uploading image...</p>
                                            </div>
                                        ) : formData.image_url ? (
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#222] flex-shrink-0">
                                                    <img
                                                        src={formData.image_url}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm text-green-400 font-medium">Image uploaded ✓</p>
                                                    <p className="text-xs text-gray-500 mt-1 truncate max-w-sm">{formData.image_url}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Click to replace or drag a new image</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData(prev => ({ ...prev, image_url: '' }));
                                                    }}
                                                    className="text-gray-400 hover:text-red-400 transition-colors p-1"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-4">
                                                <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center">
                                                    <Upload size={20} className="text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-300">
                                                        <span className="text-gold font-medium">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP up to 5MB</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* URL Fallback */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 h-px bg-[#333]" />
                                        <span className="text-xs text-gray-500">or enter URL</span>
                                        <div className="flex-1 h-px bg-[#333]" />
                                    </div>
                                    <input
                                        type="url"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Stock (0 for unlimited)</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2 flex items-center mt-8 md:col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 rounded border-[#333] bg-input text-gold focus:ring-gold focus:ring-offset-surface"
                                        />
                                        <span className="text-sm font-medium text-gray-300">Reward is active & visible</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-input mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 rounded-lg text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                                    className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Reward'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rewards;
