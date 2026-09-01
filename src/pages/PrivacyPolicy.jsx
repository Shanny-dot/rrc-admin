import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-bg-base text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl bg-surface rounded-2xl border border-input p-8 shadow-2xl">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-input pb-6 mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gold/10 text-gold rounded-lg">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
                            <p className="text-sm text-gray-500">Effective Date: June 26, 2026</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/login')}
                        className="flex items-center text-gray-400 hover:text-gold transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                    </button>
                </div>

                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-input scrollbar-track-transparent leading-relaxed text-gray-300">
                    
                    <section>
                        <h2 className="text-lg font-semibold text-gold mb-3">1. Introduction</h2>
                        <p>
                            Welcome to Reliiance Rewards. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy policy, or our practices with regards to your personal information, please contact us at <span className="text-white font-medium">privacy@rrc.com</span>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-gold mb-3">2. Information We Collect</h2>
                        <p className="mb-4">
                            We collect personal information that you voluntarily provide to us when you register on our application, participate in referral programs, or contact us. This includes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><span className="text-white font-medium">Account Details:</span> Name, email address, phone number, and password.</li>
                            <li><span className="text-white font-medium">Referral Data:</span> Names and contact details of friends or colleagues you invite to services or events.</li>
                            <li><span className="text-white font-medium">Contact Sync (Mobile App):</span> If you grant permission, the app accesses your device's address book to let you easily select contacts for invitations. We do not store or upload your entire contact book to our servers; we only transmit details of the specific contacts you choose to invite.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-gold mb-3">3. How We Use Your Information</h2>
                        <p className="mb-4">
                            We use personal information collected via our app for a variety of business purposes, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li>To facilitate account creation and login processes.</li>
                            <li>To process and reward your successful referrals and event participation.</li>
                            <li>To send invitations to contacts you explicitly refer to events or professional services.</li>
                            <li>To deliver support, resolve user tickets, and respond to inquiries.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-gold mb-3">4. Data Security & Storage</h2>
                        <p>
                            We use appropriate technical and organizational security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. Your data is stored securely using Supabase backend databases, and credentials/sensitive tokens are kept on your local device using secure encrypted hardware storage (iOS Keychain and Android Keystore).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-gold mb-3">5. Sharing of Information</h2>
                        <p>
                            We do not sell, trade, rent, or lease your personal information to third parties. We may share data with service providers who perform services for us or on our behalf (such as database hosting or email delivery) under strict confidentiality agreements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-gold mb-3">6. Your Privacy Rights & Data Deletion</h2>
                        <p>
                            You have the right to request access to your data, correction of inaccurate details, or deletion of your personal account information. To request deletion of your account and related data, please email us at <span className="text-white font-medium">deletemyaccount@rrc.com</span>, and we will process your request within 7 business days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-gold mb-3">7. Updates to This Policy</h2>
                        <p>
                            We may update this privacy policy from time to time. The updated version will be indicated by an updated "Effective Date" at the top of this page. We encourage you to review this policy periodically to stay informed of how we are protecting your data.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
