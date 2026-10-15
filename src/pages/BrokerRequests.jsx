import { useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';

const STATUS_LABELS = { new: 'New', contacted: 'Contacted', closed: 'Closed' };

const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

// "Book a time" requests from the app, and "Request a review" from the yearly loan check-in.
const BrokerRequests = () => {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('open');

    const { data: items = [], isLoading, isError } = useQuery({
        queryKey: ['adminBrokerRequests'],
        queryFn: async () => (await api.get('/api/v1/admin/broker-requests')).data,
    });

    const mutation = useMutation({
        mutationFn: ({ id, ...body }) => api.put(`/api/v1/admin/broker-requests/${id}`, body),
        onSuccess: () => queryClient.invalidateQueries(['adminBrokerRequests']),
        onError: (err) => alert(err.response?.data?.detail || err.message),
    });

    const editNote = (item) => {
        const value = window.prompt('Staff note (only staff see this):', item.staff_note || '');
        if (value !== null) mutation.mutate({ id: item.id, staff_note: value });
    };

    const visible = items.filter((r) => (filter === 'open' ? r.status !== 'closed' : filter === 'all' || r.status === filter));
    const newCount = items.filter((r) => r.status === 'new').length;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Broker requests</h1>
                    <p className="text-gray-400 mt-1">
                        Members asking their broker to get in touch — "Book a time" and loan review requests{newCount ? ` — ${newCount} new` : ''}.
                    </p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-input border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                >
                    <option value="open">Open</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                    <option value="all">All</option>
                </select>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-gray-400">Loading requests...</div>
            ) : isError ? (
                <div className="p-8 text-center text-red-400">Couldn't load requests. Please refresh.</div>
            ) : visible.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-input p-8 text-center text-gray-400">No requests here.</div>
            ) : (
                <div className="space-y-4">
                    {visible.map((r) => {
                        const member = r.users || {};
                        return (
                            <div key={r.id} className={`bg-surface rounded-2xl border p-5 ${r.status === 'new' ? 'border-gold/40' : 'border-input'}`}>
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                                    <div>
                                        <div className="text-white font-semibold text-base">{member.full_name || 'Member'}</div>
                                        <div className="text-sm text-gray-400">{formatDate(r.created_at)}</div>
                                    </div>
                                    <select
                                        value={r.status}
                                        onChange={(e) => mutation.mutate({ id: r.id, status: e.target.value })}
                                        className="bg-input border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold"
                                    >
                                        {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </div>
                                <p className="text-white leading-relaxed mb-3">{r.note}</p>
                                {r.staff_note && <p className="text-sm text-gold/90 mb-3">Staff note: {r.staff_note}</p>}
                                <div className="flex flex-wrap items-center gap-4 border-t border-input pt-3 text-sm">
                                    {member.mobile && (
                                        <a href={`tel:${member.mobile}`} className="flex items-center gap-1.5 text-gold hover:text-gold-light">
                                            <Phone size={15} /> {member.mobile}
                                        </a>
                                    )}
                                    {member.email && (
                                        <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-gold hover:text-gold-light">
                                            <Mail size={15} /> {member.email}
                                        </a>
                                    )}
                                    <button onClick={() => editNote(r)} className="text-gray-400 hover:text-white ml-auto">
                                        {r.staff_note ? 'Edit note' : 'Add note'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BrokerRequests;
