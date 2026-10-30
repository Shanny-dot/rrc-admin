import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

// Owners and managers: every change made on this website and every security event, newest
// first. Entries can't be edited or deleted by anyone.
const inputClass =
    'bg-input border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors';

const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '';

const describe = (details) => {
    if (!details) return '';
    const { request, ...rest } = details;
    const parts = Object.entries(rest).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
    if (request && typeof request === 'object') {
        parts.push(...Object.entries(request).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`));
    }
    return parts.join(' · ');
};

const ActivityLog = () => {
    const [filters, setFilters] = useState({ kind: '', actor: '', search: '', since: '', until: '' });
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

    const { data: rows = [], isLoading, isError } = useQuery({
        queryKey: ['adminActivity', params],
        queryFn: async () => (await api.get('/api/v1/admin/activity', { params: { ...params, limit: 500 } })).data,
    });
    const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white tracking-tight">Activity log</h1>
                <p className="text-gray-400 mt-1">
                    Every change made on this website (who, when, from where and what) and every security event.
                    Entries are permanent: nobody can edit or delete them.
                </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <select value={filters.kind} onChange={set('kind')} className={inputClass}>
                    <option value="">Everything</option>
                    <option value="admin">Staff changes</option>
                    <option value="security">Security events</option>
                </select>
                <input value={filters.actor} onChange={set('actor')} placeholder="Staff email" className={`${inputClass} w-48`} />
                <input value={filters.search} onChange={set('search')} placeholder="Search (e.g. points, a member's email)" className={`${inputClass} w-72`} />
                <label className="flex items-center gap-2 text-xs text-gray-400">From <input type="date" value={filters.since} onChange={set('since')} className={inputClass} /></label>
                <label className="flex items-center gap-2 text-xs text-gray-400">To <input type="date" value={filters.until} onChange={set('until')} className={inputClass} /></label>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : isError ? (
                <div className="p-8 text-center text-red-400">Couldn't load the activity log. Please refresh.</div>
            ) : rows.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-input p-8 text-center text-gray-400">Nothing found.</div>
            ) : (
                <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="text-gray-400 text-left border-b border-input">
                            <tr>
                                <th className="p-3 font-medium">When</th>
                                <th className="p-3 font-medium">Who</th>
                                <th className="p-3 font-medium">What</th>
                                <th className="p-3 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-b border-input last:border-0 align-top">
                                    <td className="p-3 text-gray-300 whitespace-nowrap">{formatDate(r.at)}</td>
                                    <td className="p-3">
                                        <div className="text-white">{r.actor_email || (r.kind === 'security' ? 'System' : '-')}</div>
                                        <div className="text-xs text-gray-500">{[r.actor_role, r.ip].filter(Boolean).join(' · ')}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className={r.kind === 'security' ? 'text-amber-400' : 'text-white'}>{r.action}</div>
                                        {r.status >= 400 && <div className="text-xs text-red-400">Refused or failed ({r.status})</div>}
                                        {r.target && <div className="text-xs text-gray-500 break-all">{r.target}</div>}
                                    </td>
                                    <td className="p-3 text-xs text-gray-400 break-words max-w-md">{describe(r.details)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;
