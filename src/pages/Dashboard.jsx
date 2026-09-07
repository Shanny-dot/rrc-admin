import { Users, Calendar, Gift, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';

const StatCard = ({ title, value, icon: Icon, trend, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-surface p-6 rounded-2xl border border-input transition-all duration-200 ${
            onClick ? 'cursor-pointer hover:border-gold/50 hover:shadow-[0_0_24px_rgba(212,175,55,0.15)] hover:scale-[1.02]' : ''
        }`}
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-gray-400 font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white">{value}</h3>
            </div>
            <div className="p-3 bg-[#111] rounded-xl text-gold">
                <Icon size={24} />
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center gap-2 text-sm">
                <span className={trend.isPositive ? 'text-green-400' : 'text-red-400'}>
                    {trend.isPositive ? '+' : '-'}{trend.value}%
                </span>
                <span className="text-gray-500">vs last month</span>
            </div>
        )}
        {onClick && (
            <div className="mt-3 flex items-center gap-1 text-xs text-gold/60 font-medium">
                <span>View all →</span>
            </div>
        )}
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();

    const { data: users = [] } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => (await api.get('/api/v1/admin/users')).data
    });

    const { data: events = [] } = useQuery({
        queryKey: ['adminEvents'],
        queryFn: async () => (await api.get('/api/v1/events')).data
    });

    const { data: rewards = [] } = useQuery({
        queryKey: ['adminRewards'],
        queryFn: async () => (await api.get('/api/v1/rewards')).data
    });

    const { data: redemptions = [] } = useQuery({
        queryKey: ['adminRedemptions'],
        queryFn: async () => (await api.get('/api/v1/admin/redemptions')).data
    });

    const activeEvents = events.filter(e => e.is_active).length;
    const activeRewards = rewards.filter(r => r.is_active).length;
    const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length;

    // Build real recent activity from actual data
    const recentItems = [
        ...users.slice(0, 3).map(u => ({
            label: `${u.full_name && u.full_name !== u.email ? u.full_name : (u.email?.split('@')[0] || 'Member')} joined`,
            time: u.created_at ? new Date(u.created_at).toLocaleString() : '',
            dot: 'bg-gold'
        })),
        ...redemptions.slice(0, 2).map(r => ({
            label: `${r.users?.full_name && r.users?.full_name !== r.users?.email ? r.users.full_name : (r.users?.email?.split('@')[0] || 'Member')} redeemed ${r.rewards?.title || 'a reward'}`,
            time: r.requested_at ? new Date(r.requested_at).toLocaleString() : '',
            dot: 'bg-purple-400'
        }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

    const quickCards = [
        { label: 'Manage Users', sub: `${users.length} total members`, icon: Users, path: '/users', cls: 'border-blue-500/20 from-blue-500/10 to-blue-500/5 text-blue-400' },
        { label: 'Manage Events', sub: `${activeEvents} active events`, icon: Calendar, path: '/events', cls: 'border-purple-500/20 from-purple-500/10 to-purple-500/5 text-purple-400' },
        { label: 'Manage Rewards', sub: `${activeRewards} available rewards`, icon: Gift, path: '/rewards', cls: 'border-gold/20 from-gold/10 to-gold/5 text-gold' },
        { label: 'Redemptions', sub: `${pendingRedemptions} pending`, icon: CheckCircle, path: '/redemptions', cls: 'border-green-500/20 from-green-500/10 to-green-500/5 text-green-400' },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-400 mt-1">Platform performance and key metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Users" value={users.length} icon={Users} trend={{ value: 12, isPositive: true }} onClick={() => navigate('/users')} />
                <StatCard title="Active Events" value={activeEvents} icon={Calendar} trend={{ value: 5, isPositive: true }} onClick={() => navigate('/events')} />
                <StatCard title="Available Rewards" value={activeRewards} icon={Gift} trend={{ value: 2, isPositive: false }} onClick={() => navigate('/rewards')} />
                <StatCard title="Pending Redemptions" value={pendingRedemptions} icon={CheckCircle} onClick={() => navigate('/redemptions')} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-input min-h-[320px]">
                    <h3 className="text-lg font-bold text-white mb-6">Quick Access</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {quickCards.map(({ label, sub, icon: Icon, path, cls }) => (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                className={`bg-gradient-to-br ${cls} border p-5 rounded-xl text-left w-full hover:scale-[1.02] transition-all duration-200`}
                            >
                                <Icon size={22} className="mb-3" />
                                <p className="text-white font-semibold text-sm">{label}</p>
                                <p className="text-gray-400 text-xs mt-1">{sub}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-input min-h-[320px]">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {(recentItems.length > 0 ? recentItems : Array(5).fill({ label: 'New user registration', time: '—', dot: 'bg-gold' })).map((item, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <div className={`w-2 h-2 mt-2 rounded-full ${item.dot} shrink-0`} />
                                <div>
                                    <p className="text-white text-sm font-medium leading-snug">{item.label}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
