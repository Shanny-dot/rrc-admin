import { useState } from 'react';
import { FileText, Edit3, Check, X, RefreshCw, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

const LABEL_MAP = {
    hero_title: 'Home Hero Title',
    tier_gold_label: 'Gold Tier Label',
    tier_platinum_threshold: 'Points to Platinum Text',
    quick_action_refer: 'Quick Action: Refer Label',
    quick_action_redeem: 'Quick Action: Redeem Label',
    quick_action_events: 'Quick Action: Events Label',
    announcement_banner: 'Announcement Banner Text',
    announcement_active: 'Show Announcement Banner',
};

const SECTION_MAP = {
    hero_title: 'Home Screen',
    tier_gold_label: 'Home Screen',
    tier_platinum_threshold: 'Home Screen',
    quick_action_refer: 'Quick Actions',
    quick_action_redeem: 'Quick Actions',
    quick_action_events: 'Quick Actions',
    announcement_banner: 'Announcements',
    announcement_active: 'Announcements',
};

const Content = () => {
    const queryClient = useQueryClient();
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [savedKey, setSavedKey] = useState(null);

    const { data: contentRows = [], isLoading } = useQuery({
        queryKey: ['adminContent'],
        queryFn: async () => {
            const res = await api.get('/api/v1/content/all');
            return res.data;
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ key, value }) => {
            const res = await api.put(`/api/v1/content/${key}`, { value });
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['adminContent']);
            setSavedKey(variables.key);
            setEditingKey(null);
            setTimeout(() => setSavedKey(null), 2500);
        }
    });

    const startEdit = (row) => {
        setEditingKey(row.key);
        setEditValue(row.value || '');
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setEditValue('');
    };

    const saveEdit = (key) => {
        updateMutation.mutate({ key, value: editValue });
    };

    const toggleBoolean = (row) => {
        const newVal = row.value === 'true' ? 'false' : 'true';
        updateMutation.mutate({ key: row.key, value: newVal });
    };

    // Group rows by section
    const sections = {};
    contentRows.forEach(row => {
        const section = SECTION_MAP[row.key] || 'Other';
        if (!sections[section]) sections[section] = [];
        sections[section].push(row);
    });

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Content Management</h1>
                    <p className="text-gray-400 mt-1">Edit app text and copy — changes go live instantly on next app refresh</p>
                </div>
                <div className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-xl px-4 py-2">
                    <AlertCircle size={16} className="text-gold" />
                    <span className="text-gold text-sm font-medium">Changes are live instantly</span>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center text-gray-400 py-20">
                    <RefreshCw className="animate-spin mx-auto mb-3" size={28} />
                    Loading content...
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(sections).map(([sectionName, rows]) => (
                        <div key={sectionName} className="bg-surface rounded-2xl border border-input overflow-hidden">
                            <div className="px-6 py-4 border-b border-input flex items-center gap-3">
                                <FileText size={18} className="text-gold" />
                                <h2 className="text-lg font-bold text-white">{sectionName}</h2>
                                <span className="text-xs text-gray-500">{rows.length} item{rows.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="divide-y divide-input">
                                {rows.map((row) => {
                                    const label = LABEL_MAP[row.key] || row.label || row.key;
                                    const isBool = row.key === 'announcement_active';
                                    const isEditing = editingKey === row.key;
                                    const wasSaved = savedKey === row.key;

                                    return (
                                        <div key={row.key} className="px-6 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-semibold text-white">{label}</p>
                                                    <code className="text-xs text-gray-600 bg-[#111] px-1.5 py-0.5 rounded font-mono">{row.key}</code>
                                                    {wasSaved && (
                                                        <span className="text-green-400 text-xs flex items-center gap-1">
                                                            <Check size={12} /> Saved
                                                        </span>
                                                    )}
                                                </div>

                                                {isBool ? (
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <button
                                                            onClick={() => toggleBoolean(row)}
                                                            className="flex items-center gap-2 transition-colors"
                                                            disabled={updateMutation.isPending}
                                                        >
                                                            {row.value === 'true' ? (
                                                                <ToggleRight size={32} className="text-gold" />
                                                            ) : (
                                                                <ToggleLeft size={32} className="text-gray-500" />
                                                            )}
                                                            <span className={`text-sm font-medium ${row.value === 'true' ? 'text-gold' : 'text-gray-500'}`}>
                                                                {row.value === 'true' ? 'Enabled' : 'Disabled'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                ) : isEditing ? (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <input
                                                            autoFocus
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') saveEdit(row.key);
                                                                if (e.key === 'Escape') cancelEdit();
                                                            }}
                                                            className="flex-1 bg-input border border-gold/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                                                            placeholder="Enter content..."
                                                        />
                                                        <button
                                                            onClick={() => saveEdit(row.key)}
                                                            disabled={updateMutation.isPending}
                                                            className="p-2 bg-gold hover:bg-gold/90 text-black rounded-lg transition-colors disabled:opacity-50"
                                                            title="Save"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="p-2 bg-input hover:bg-[#333] text-gray-400 rounded-lg transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 text-sm mt-1">
                                                        {row.value || <span className="text-gray-600 italic">— empty —</span>}
                                                    </p>
                                                )}

                                                {row.updated_at && (
                                                    <p className="text-xs text-gray-600 mt-1.5">
                                                        Last updated {new Date(row.updated_at).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            {!isBool && !isEditing && (
                                                <button
                                                    onClick={() => startEdit(row)}
                                                    className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors shrink-0"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Supabase SQL Helper */}
            <div className="mt-8 bg-surface border border-input rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest">Setup — Run in Supabase SQL Editor (one-time)</h3>
                <pre className="bg-[#0a0a0a] text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed">{`CREATE TABLE IF NOT EXISTS app_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  label TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_content (key, value, label) VALUES
  ('hero_title', 'Total Points', 'Home Hero Title'),
  ('tier_gold_label', 'Gold Tier', 'Gold Tier Label'),
  ('tier_platinum_threshold', '1000 to Platinum', 'Points to Platinum Text'),
  ('quick_action_refer', 'Refer Friend', 'Quick Action: Refer Label'),
  ('quick_action_redeem', 'Redeem', 'Quick Action: Redeem Label'),
  ('quick_action_events', 'Events', 'Quick Action: Events Label'),
  ('announcement_banner', '', 'Announcement Banner Text'),
  ('announcement_active', 'false', 'Show Announcement Banner')
ON CONFLICT (key) DO NOTHING;`}</pre>
            </div>
        </div>
    );
};

export default Content;
