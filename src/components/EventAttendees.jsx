import { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

// Who is booked in to an event, with a button for staff to check each person in.
export default function EventAttendees({ event, onClose }) {
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const key = ['eventAttendees', event.id];
    const { data: people, isLoading } = useQuery({
        queryKey: key,
        queryFn: async () => (await api.get(`/api/v1/admin/events/${event.id}/attendees`)).data,
    });

    const checkIn = async (person) => {
        setBusy(person.qr_token);
        setError('');
        try {
            await api.post('/api/v1/admin/events/scan-qr', { qr_token: person.qr_token });
            await queryClient.invalidateQueries({ queryKey: key });
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        }
        setBusy('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface border border-input rounded-2xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-input bg-[#111]">
                    <h2 className="text-lg font-bold text-white truncate pr-4">Attendees: {event.title}</h2>
                    <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
                    {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
                    {!isLoading && !people?.length && <p className="text-sm text-gray-400">Nobody has booked in yet.</p>}
                    {(people || []).map((p) => (
                        <div key={p.qr_token} className="flex items-center justify-between gap-3 py-2 border-b border-input last:border-0">
                            <div className="min-w-0">
                                <div className="text-sm text-white truncate">{p.full_name || p.email}</div>
                                <div className="text-xs text-gray-500 truncate">{p.email}</div>
                            </div>
                            {p.attended ? (
                                <span className="text-xs text-green-400 shrink-0">Checked in</span>
                            ) : (
                                <button
                                    onClick={() => checkIn(p)}
                                    disabled={busy === p.qr_token}
                                    className="shrink-0 bg-gold hover:bg-gold-light text-black font-semibold px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                                >
                                    Check in
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
