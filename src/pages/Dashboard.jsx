import { Users, Calendar, Gift, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

const StatCard = ({ title, value, icon: Icon, trend }) => (
    <div className="bg-surface p-6 rounded-2xl border border-input">
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
    </div>
);

const Dashboard = () => {
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

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-400 mt-1">Platform performance and key metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Users"
                    value={users.length}
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                    title="Active Events"
                    value={activeEvents}
                    icon={Calendar}
                    trend={{ value: 5, isPositive: true }}
                />
                <StatCard
                    title="Available Rewards"
                    value={activeRewards}
                    icon={Gift}
                    trend={{ value: 2, isPositive: false }}
                />
                <StatCard
                    title="Pending Redemptions"
                    value={pendingRedemptions}
                    icon={CheckCircle}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-input min-h-[400px]">
                    <h3 className="text-lg font-bold text-white mb-4">Referral Growth</h3>
                    {/* Chart placeholder */}
                    <div className="w-full h-[300px] flex items-center justify-center border-2 border-dashed border-[#333] rounded-xl">
                        <p className="text-gray-500 font-medium">Chart visualization will appear here</p>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-input min-h-[400px]">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {/* Activity placeholders */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-2 h-2 mt-2 rounded-full bg-gold shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-medium">New user registration</p>
                                    <p className="text-gray-500 text-xs mt-0.5">2 minutes ago</p>
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
