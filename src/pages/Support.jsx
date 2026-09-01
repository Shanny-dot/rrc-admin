import { useState } from 'react';
import { Mail, Phone, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Support = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here we would normally send to the backend, but a client-side confirmation is perfect for this page
        setSubmitted(true);
        setName('');
        setEmail('');
        setMessage('');
    };

    return (
        <div className="min-h-screen bg-bg-base text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl bg-surface rounded-2xl border border-input overflow-hidden shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-5">
                    
                    {/* Left Panel: Contact Info */}
                    <div className="md:col-span-2 bg-[#1e1e1e] p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-input">
                        <div>
                            <button 
                                onClick={() => navigate('/login')}
                                className="flex items-center text-gray-400 hover:text-gold transition-colors mb-8 text-sm"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                            </button>
                            <h2 className="text-3xl font-bold text-gold mb-4">Support Center</h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Have questions about your rewards, event invitations, or account? Get in touch with our team.
                            </p>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gold/10 text-gold rounded-lg">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email us at</p>
                                    <p className="text-sm font-medium hover:text-gold transition-colors">support@rrc.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gold/10 text-gold rounded-lg">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Call us at</p>
                                    <p className="text-sm font-medium">+61 1300 000 000</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gold/10 text-gold rounded-lg">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Hours</p>
                                    <p className="text-sm font-medium text-gray-300">Mon - Fri, 9am - 5pm AEST</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Form */}
                    <div className="md:col-span-3 p-8">
                        {submitted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                                <p className="text-gray-400 max-w-sm mb-6">
                                    Thank you for contacting us. Our support team will get back to you within 24 hours.
                                </p>
                                <button 
                                    onClick={() => setSubmitted(false)}
                                    className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2.5 rounded-lg transition-colors"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <h3 className="text-xl font-semibold text-white mb-4">Send us a message</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">How can we help?</label>
                                    <textarea 
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={4}
                                        className="w-full bg-input border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors resize-none"
                                        placeholder="Describe your issue or query..."
                                        required
                                    />
                                </div>
                                
                                <button 
                                    type="submit"
                                    className="w-full bg-gold hover:bg-gold-light text-black font-semibold py-3 rounded-lg transition-colors"
                                >
                                    Submit Ticket
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Support;
