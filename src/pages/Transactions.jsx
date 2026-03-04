import { Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

const Transactions = () => {
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['adminTransactions'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/transactions');
            return res.data;
        }
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Point Transactions</h1>
                    <p className="text-gray-400 mt-1">Audit log of all point activities</p>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                <div className="p-4 border-b border-input flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by user or description..."
                            className="w-full bg-input border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-input hover:bg-[#333] px-6 py-2 rounded-lg text-white font-medium transition-colors border border-[#333]">
                        <Filter size={18} />
                        Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Loading transactions...</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#111] text-gray-400 border-b border-input">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">User ID</th>
                                    <th className="px-6 py-4 font-medium">Type</th>
                                    <th className="px-6 py-4 font-medium">Description</th>
                                    <th className="px-6 py-4 font-medium text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-input">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-gray-400">{new Date(tx.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-white font-medium">{tx.user_id.substring(0, 8)}...</td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize text-gray-300">{tx.type.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{tx.description}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center gap-1 font-bold ${tx.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {tx.points >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                {Math.abs(tx.points)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Transactions;
