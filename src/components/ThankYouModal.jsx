import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

const inputClass = 'w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gold transition-colors';

// Thank everyone who checked in to an event: phone alert, in-app update and (once email is set
// up) an email with the key points, links and a "Contact us" button.
const ThankYouModal = ({ event, onClose }) => {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [slidesUrl, setSlidesUrl] = useState('');
    const [recordingUrl, setRecordingUrl] = useState('');
    const [extraUrl, setExtraUrl] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const send = async () => {
        setSending(true);
        setError(null);
        try {
            const res = await api.post(`/api/v1/admin/events/${event.id}/thank-you`, {
                message,
                slides_url: slidesUrl || null,
                recording_url: recordingUrl || null,
                extra_url: extraUrl || null,
            });
            setResult(res.data);
            queryClient.invalidateQueries(['adminEvents']);
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface border border-input rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-input">
                    <div>
                        <h2 className="text-xl font-bold text-white">Send a thank-you</h2>
                        <p className="text-sm text-gray-400 mt-0.5">{event.title}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                {result ? (
                    <div className="p-6 space-y-4">
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
                            Sent to {result.notified} of {result.attendees} attendee{result.attendees === 1 ? '' : 's'}
                            {result.notified < result.attendees ? ' (the others already had this thank-you)' : ''}.
                        </div>
                        <p className="text-sm text-gray-400">
                            {result.email_enabled
                                ? `${result.emailed} email${result.emailed === 1 ? '' : 's'} sent. Attendees also got a phone alert and an update in the app.`
                                : "Attendees got a phone alert and an update in the app. Emails aren't set up yet, so no email was sent."}
                        </p>
                        <div className="flex justify-end">
                            <button onClick={onClose} className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2.5 rounded-lg">Done</button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {event.thank_you_sent_at && (
                            <p className="text-sm text-gold">
                                A thank-you was already sent on {new Date(event.thank_you_sent_at).toLocaleDateString('en-AU')}. Sending again only reaches attendees checked in since.
                            </p>
                        )}
                        <label className="block">
                            <span className="block text-sm text-gray-400 mb-1.5">Message and key points</span>
                            <textarea
                                rows={6}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={'Thanks for joining us! A few key points from tonight:\n• …\n• …'}
                                className={inputClass}
                            />
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block">
                                <span className="block text-sm text-gray-400 mb-1.5">Slides link (optional)</span>
                                <input value={slidesUrl} onChange={(e) => setSlidesUrl(e.target.value)} placeholder="https://" className={inputClass} />
                            </label>
                            <label className="block">
                                <span className="block text-sm text-gray-400 mb-1.5">Recording link (optional)</span>
                                <input value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} placeholder="https://" className={inputClass} />
                            </label>
                        </div>
                        <label className="block">
                            <span className="block text-sm text-gray-400 mb-1.5">Other link (optional)</span>
                            <input value={extraUrl} onChange={(e) => setExtraUrl(e.target.value)} placeholder="https://" className={inputClass} />
                        </label>
                        <p className="text-xs text-gray-500">
                            The email includes a "Contact us" button using the contact details on the Help &amp; Contact page.
                        </p>
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={onClose} className="px-5 py-2.5 text-gray-400 hover:text-white">Cancel</button>
                            <button
                                onClick={send}
                                disabled={sending || message.trim().length < 5}
                                className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                <Send size={16} /> {sending ? 'Sending...' : 'Send to attendees'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThankYouModal;
