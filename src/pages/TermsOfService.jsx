import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-bg-base text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl bg-surface rounded-2xl border border-input p-8 shadow-2xl">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-input pb-6 mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gold/10 text-gold rounded-lg">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
                            <p className="text-sm text-gray-500">Effective Date: September 1, 2026</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/login')}
                        className="flex items-center text-gray-400 hover:text-gold transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                    </button>
                </div>

                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-input scrollbar-track-transparent leading-relaxed text-gray-300 text-sm">
                    
                    <section>
                        <h2 className="text-base font-semibold text-gold mb-2">1. Agreement to Terms</h2>
                        <p>
                            Welcome to <span className="text-white font-semibold">Reliiance Rewards</span> ("Company", "we", "us", or "our"). By accessing or using our mobile application, website, and referral rewards services, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-gold mb-2">2. Eligibility and Account Creation</h2>
                        <p className="mb-3">
                            To use Reliiance Rewards, you must be at least 18 years of age and reside in Australia or an authorized jurisdiction.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-400">
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You agree to provide accurate, current, and complete registration information (including mobile number and full name).</li>
                            <li>Each individual may maintain only one active account. Duplicate or fake accounts created for referral manipulation will be terminated.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-gold mb-2">3. Referral Program & Points Policy</h2>
                        <p className="mb-3">
                            Reliiance Rewards awards reward points for valid user referrals, event attendances, and promotions.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-400">
                            <li>Referral points are awarded only after the referred user completes successful registration and verification.</li>
                            <li>Points hold no monetary cash value and cannot be exchanged, transferred, or sold for fiat currency.</li>
                            <li>We reserve the right to audit, adjust, or cancel points balances if fraudulent, spam, or self-referral activity is detected.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-gold mb-2">4. Reward Redemptions & Events</h2>
                        <p className="mb-3">
                            Users can redeem accumulated points for gift vouchers, experiences, and exclusive event access within the app.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-400">
                            <li>Reward vouchers and event RSVPs are subject to stock availability and event capacity limits.</li>
                            <li>Event check-ins require presenting your unique QR token generated inside the Reliiance Rewards mobile app.</li>
                            <li>Approved redemptions are non-refundable once fulfilled or claimed, unless explicitly canceled by administrators.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-gold mb-2">5. Prohibited Activities</h2>
                        <p className="mb-2">You agree not to engage in any of the following prohibited behaviors:</p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-400">
                            <li>Submitting false referral contact details or automated bot sign-ups.</li>
                            <li>Attempting to bypass security controls or manipulate QR token validation.</li>
                            <li>Using the platform for any illegal purpose or transmitting harmful code.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-gold mb-2">6. Account Suspension & Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate your access to Reliiance Rewards immediately, without prior notice or liability, if you violate these Terms of Service or engage in deceptive practices.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-gold mb-2">7. Limitation of Liability</h2>
                        <p>
                            Reliiance Rewards shall not be held liable for any indirect, incidental, or consequential damages resulting from your use of or inability to use the platform, rewards, or services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-gold mb-2">8. Contact & Support</h2>
                        <p>
                            If you have any questions regarding these Terms of Service, please reach out to our team at:
                        </p>
                        <div className="mt-3 p-4 bg-input/50 rounded-xl border border-input text-gray-300">
                            <p className="font-semibold text-white">Reliiance Rewards Support Team</p>
                            <p>Email: <a href="mailto:support@reliiancerewards.com.au" className="text-gold hover:underline">support@reliiancerewards.com.au</a></p>
                            <p>Website: <a href="https://reliiancerewards.com.au" target="_blank" rel="noreferrer" className="text-gold hover:underline">https://reliiancerewards.com.au</a></p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
