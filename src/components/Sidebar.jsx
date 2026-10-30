import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, Gift, CheckCircle, List, LogOut, UserPlus, LifeBuoy, MessageSquare, PhoneCall, SlidersHorizontal, ShieldCheck, ScrollText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAccess } from '../lib/access';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const access = useAccess();

    // `need`: shown only to staff whose access level allows it
    const links = [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Users', path: '/users', icon: Users },
        { name: 'Referrals', path: '/referrals', icon: UserPlus },
        { name: 'Events', path: '/events', icon: Calendar },
        { name: 'Rewards', path: '/rewards', icon: Gift },
        { name: 'Redemptions', path: '/redemptions', icon: CheckCircle },
        { name: 'Transactions', path: '/transactions', icon: List },
        { name: 'Requests', path: '/broker-requests', icon: PhoneCall },
        { name: 'Feedback', path: '/feedback', icon: MessageSquare },
        { name: 'Program settings', path: '/program-settings', icon: SlidersHorizontal, need: 'settings.manage' },
        { name: 'Help & Contact', path: '/help-contact', icon: LifeBuoy, need: 'settings.manage' },
        { name: 'Staff & access', path: '/staff', icon: ShieldCheck, need: 'staff.manage' },
        { name: 'Activity log', path: '/activity', icon: ScrollText, need: 'audit.view' },
    ].filter((link) => !link.need || access.can(link.need));

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
                {access.email && (
                    <div className="px-4 pb-3 text-xs text-gray-500">
                        <div className="truncate text-gray-300">{access.email}</div>
                        <div>{(access.roleLabel || '').split(' - ')[0]}</div>
                    </div>
                )}
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
