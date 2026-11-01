import { useState } from 'react';
import { ShieldCheck, ShieldAlert, UserPlus } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAccess } from '../lib/access';

// Owners only: who can use this admin website and what each person may do.
const inputClass =
    'bg-input border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors';

const Staff = () => {
    const queryClient = useQueryClient();
    const access = useAccess();
    const [form, setForm] = useState({ email: '', full_name: '', role: 'staff' });
    const [notice, setNotice] = useState('');

    const { data, isLoading, isError } = useQuery({
        queryKey: ['adminStaff'],
        queryFn: async () => (await api.get('/api/v1/admin/staff')).data,
    });
    const staff = data?.staff || [];
    const roles = data?.roles || [];
    const roleName = (value) => (roles.find((r) => r.value === value)?.label || value || '').split(' - ')[0];

    const done = (msg) => {
        setNotice(msg);
        queryClient.invalidateQueries(['adminStaff']);
    };
    const fail = (err) => alert(err.response?.data?.detail || err.message);

    const add = useMutation({
        mutationFn: () => api.post('/api/v1/admin/staff', form),
        onSuccess: (r) => {
            setForm({ email: '', full_name: '', role: 'staff' });
            done(r.data.message);
        },
        onError: fail,
    });
    const changeRole = useMutation({
        mutationFn: ({ id, role }) => api.put(`/api/v1/admin/staff/${id}`, { role }),
        onSuccess: () => done('Access level changed.'),
        onError: fail,
    });
    const remove = useMutation({
        mutationFn: (id) => api.delete(`/api/v1/admin/staff/${id}`),
        onSuccess: (r) => done(r.data.message),
        onError: fail,
    });
    const resetTwoStep = useMutation({
        mutationFn: (id) => api.post(`/api/v1/admin/staff/${id}/reset-two-step`),
        onSuccess: (r) => done(r.data.message),
        onError: fail,
    });

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Staff &amp; access</h1>
                <p className="text-gray-400 mt-1">
                    Give each person their own sign-in with only the access their job needs. Every change here is
                    emailed as a security alert and kept in the Activity log.
                </p>
            </div>

            {notice && (
                <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm">{notice}</div>
            )}

            <div className="bg-surface rounded-2xl border border-input p-5 mb-8">
                <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><UserPlus size={18} /> Give someone access</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        add.mutate();
                    }}
                    className="flex flex-wrap gap-3 items-end"
                >
                    <label className="flex flex-col gap-1 text-xs text-gray-400">
                        Email
                        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className={`${inputClass} w-64`} placeholder="name@reliiancerewards.com.au" />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-gray-400">
                        Name (new accounts)
                        <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            className={`${inputClass} w-48`} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-gray-400">
                        Access level
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
                            {roles.map((r) => <option key={r.value} value={r.value}>{r.label.split(' - ')[0]}</option>)}
                        </select>
                    </label>
                    <button type="submit" disabled={add.isPending}
                        className="bg-gold hover:bg-gold-light text-black font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                        {add.isPending ? 'Adding...' : 'Give access'}
                    </button>
                </form>
                <ul className="mt-4 space-y-1 text-xs text-gray-500">
                    {roles.map((r) => <li key={r.value}><span className="text-gray-300">{r.label.split(' - ')[0]}</span> - {r.label.split(' - ')[1]}</li>)}
                </ul>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-gray-400">Loading staff...</div>
            ) : isError ? (
                <div className="p-8 text-center text-red-400">Couldn't load staff. Please refresh.</div>
            ) : (
                <div className="bg-surface rounded-2xl border border-input overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="text-gray-400 text-left border-b border-input">
                            <tr>
                                <th className="p-4 font-medium">Person</th>
                                <th className="p-4 font-medium">Access level</th>
                                <th className="p-4 font-medium">Two-step sign-in</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((s) => {
                                const me = s.email === access.email;
                                return (
                                    <tr key={s.id} className="border-b border-input last:border-0">
                                        <td className="p-4">
                                            <div className="text-white font-medium">{s.full_name || '-'}{me && <span className="text-gray-500"> (you)</span>}</div>
                                            <div className="text-gray-400">{s.email}</div>
                                        </td>
                                        <td className="p-4">
                                            {me ? (
                                                <span className="text-white">{roleName(s.admin_role)}</span>
                                            ) : (
                                                <select value={s.admin_role} className={inputClass}
                                                    onChange={(e) => changeRole.mutate({ id: s.id, role: e.target.value })}>
                                                    {roles.map((r) => <option key={r.value} value={r.value}>{r.label.split(' - ')[0]}</option>)}
                                                </select>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {s.two_step === true && <span className="flex items-center gap-1.5 text-emerald-400"><ShieldCheck size={16} /> Set up</span>}
                                            {s.two_step === false && <span className="flex items-center gap-1.5 text-amber-400"><ShieldAlert size={16} /> Not yet (asked at next sign-in)</span>}
                                            {s.two_step == null && <span className="text-gray-500">Unknown</span>}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            {!me && s.two_step && (
                                                <button className="text-xs text-gray-300 hover:text-white px-2 py-1"
                                                    onClick={() => window.confirm(`Reset two-step sign-in for ${s.email}? They'll link their authenticator app again at their next sign-in.`) && resetTwoStep.mutate(s.id)}>
                                                    Reset two-step
                                                </button>
                                            )}
                                            {!me && (
                                                <button className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                                                    onClick={() => window.confirm(`Remove admin access for ${s.email}? They'll be signed out straight away.`) && remove.mutate(s.id)}>
                                                    Remove access
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Staff;
