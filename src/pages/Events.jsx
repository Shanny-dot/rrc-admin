import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Users, X, QrCode } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/axios';

const Events = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [qrEvent, setQrEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        event_date: '',
        image_url: '',
        points_for_attending: 0,
        points_for_referring: 0,
        capacity: 0,
        is_active: true
    });

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['adminEvents'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/events');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (newEvent) => api.post('/api/v1/admin/events', newEvent),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminEvents']);
            closeModal();
        },
        onError: (err) => alert("Creation Failed: " + (err.response?.data?.detail || err.message))
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/api/v1/admin/events/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminEvents']);
            closeModal();
        },
        onError: (err) => alert("Update Failed: " + (err.response?.data?.detail || err.message))
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/v1/admin/events/${id}`),
        onSuccess: () => queryClient.invalidateQueries(['adminEvents'])
    });

    const openModal = (event = null) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                title: event.title,
                description: event.description || '',
                location: event.location || '',
                event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
                image_url: event.image_url || '',
                points_for_attending: event.points_for_attending || 0,
                points_for_referring: event.points_for_referring || 0,
                capacity: event.capacity || 0,
                is_active: event.is_active
            });
        } else {
            setEditingEvent(null);
            setFormData({
                title: '',
                description: '',
                location: '',
                event_date: '',
                image_url: '',
                points_for_attending: 0,
                points_for_referring: 0,
                capacity: 0,
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Format payload
        const payload = {
            ...formData,
            event_date: new Date(formData.event_date).toISOString(),
            capacity: formData.capacity > 0 ? formData.capacity : null
        };

        if (editingEvent) {
            updateMutation.mutate({ id: editingEvent.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Event Management</h1>
                    <p className="text-gray-400 mt-1">Manage platform events and RSVPs</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    New Event
                </button>
            </div>

            <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                <div className="p-4 border-b border-input flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search events..."
                            className="w-full bg-input border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Loading events...</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#111] text-gray-400 border-b border-input">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Event Name</th>
                                    <th className="px-6 py-4 font-medium">Date & Location</th>
                                    <th className="px-6 py-4 font-medium">Award Points</th>
                                    <th className="px-6 py-4 font-medium">RSVPs</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-input">
                                {events.map((event) => (
                                    <tr key={event.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#222]">
                                                    {event.image_url ? (
                                                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500">No Img</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{event.title}</p>
                                                    <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[200px]">{event.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-300">{new Date(event.event_date).toLocaleString()}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{event.location}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gold font-bold">+{event.points_for_attending} Attend</p>
                                            <p className="text-green-400 text-xs mt-0.5">+{event.points_for_referring} Ref</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-300">
                                                <Users size={16} className="text-gray-400" />
                                                <span>{event.capacity ? `${event.capacity} Max` : 'Unlimited'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {event.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => setQrEvent(event)}
                                                    className="text-gray-400 hover:text-gold transition-colors"
                                                    title="Show QR Code"
                                                >
                                                    <QrCode size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openModal(event)}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                    title="Edit Event"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                                    title="Delete Event"
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

            {/* Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-input rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-input">
                            <h2 className="text-xl font-bold text-white">
                                {editingEvent ? 'Edit Event' : 'Create New Event'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">Event Title</label>
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
                                    <label className="text-sm font-medium text-gray-300">Event Date & Time</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        name="event_date"
                                        value={formData.event_date}
                                        onChange={handleInputChange}
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Location (Online or Physical)</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">Image URL</label>
                                    <input
                                        type="url"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleInputChange}
                                        placeholder="https://..."
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Points for Attending</label>
                                    <input
                                        type="number"
                                        name="points_for_attending"
                                        value={formData.points_for_attending}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Points for Referring</label>
                                    <input
                                        type="number"
                                        name="points_for_referring"
                                        value={formData.points_for_referring}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Capacity (0 for unlimited)</label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-2 flex items-center mt-8">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 rounded border-[#333] bg-input text-gold focus:ring-gold focus:ring-offset-surface"
                                        />
                                        <span className="text-sm font-medium text-gray-300">Event is active & visible</span>
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
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* QR Code Modal */}
            {qrEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-input rounded-2xl w-full max-w-sm overflow-hidden text-center shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-input bg-[#111]">
                            <h2 className="text-lg font-bold text-white truncate pr-4">
                                {qrEvent.title}
                            </h2>
                            <button onClick={() => setQrEvent(null)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col items-center justify-center bg-white">
                            <QRCodeSVG
                                value={qrEvent.id}
                                size={250}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"Q"}
                                includeMargin={false}
                            />
                            <p className="mt-6 text-black font-semibold text-lg border-2 border-black border-dashed px-4 py-2 rounded-lg break-all w-full">
                                {qrEvent.id}
                            </p>
                        </div>
                        <div className="p-4 bg-input flex justify-center">
                            <p className="text-gray-400 text-sm">Mobile users can scan this code to claim attendance</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
