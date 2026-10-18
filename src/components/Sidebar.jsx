import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, Gift, CheckCircle, List, LogOut, UserPlus, LifeBuoy, MessageSquare, PhoneCall, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const links = [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Users', path: '/users', icon: Users },
        { name: 'Referrals', path: '/referrals', icon: UserPlus },
        { name: 'Events', path: '/events', icon: Calendar },
        { name: 'Rewards', path: '/rewards', icon: Gift },
        { name: 'Redemptions', path: '/redemptions', icon: CheckCircle },
        { name: 'Transactions', path: '/transactions', icon: List },
        { name: 'Broker requests', path: '/broker-requests', icon: PhoneCall },
        { name: 'Feedback', path: '/feedback', icon: MessageSquare },
        { name: 'Program settings', path: '/program-settings', icon: SlidersHorizontal },
        { name: 'Help & Contact', path: '/help-contact', icon: LifeBuoy },
    ];

    return (
        <div className="w-64 bg-surface h-full border-r border-input p-6 flex flex-col">
            <div className="mb-8">
                <img src="/logo-full.png" alt="Reliiance Rewards" className="w-full max-w-[200px]" />
                <p className="text-xs text-gray-500 mt-2 tracking-widest uppercase">Admin</p>
            </div>

            <nav className="flex-1 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-gold/10 text-gold font-medium border border-gold/30'
                                : 'text-gray-400 hover:bg-input hover:text-white'
                                }`}
                        >
                            <Icon size={20} className={isActive ? 'text-gold' : 'text-gray-400'} />
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8 border-t border-input pt-4">
                <button
                    onClick={async () => {
                        try {
                            await supabase.auth.signOut();
                        } catch (error) {
                            console.error("Logout error:", error);
                        } finally {
                            localStorage.clear();
                            window.location.href = '/login';
                        }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
