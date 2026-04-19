import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, X, Plus } from 'lucide-react';

interface TravelerType {
    value: string;
    label: string;
    icon: string;
}

interface SiteSettingsData {
    id: number;
    whatsapp: string;
    phone: string;
    email: string;
    address: string;
    instagram: string;
    tiktok: string;
    facebook: string;
    planner_destinations: string[];
    planner_interests: string[];
    planner_traveler_types: TravelerType[];
}

const TagEditor: React.FC<{
    label: string;
    tags: string[];
    onChange: (tags: string[]) => void;
}> = ({ label, tags, onChange }) => {
    const [input, setInput] = useState('');

    const addTag = () => {
        const trimmed = input.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput('');
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                        {tag}
                        <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="text-emerald-400 hover:text-red-500 transition">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Type and press Enter..."
                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
                />
                <button type="button" onClick={addTag} className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-emerald-700 transition flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>
        </div>
    );
};

const SiteSettings: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
        if (!error && data) {
            setSettings({
                ...data,
                planner_destinations: data.planner_destinations || [],
                planner_interests: data.planner_interests || [],
                planner_traveler_types: data.planner_traveler_types || [],
            } as SiteSettingsData);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setMessage('');

        const { error } = await supabase.from('site_settings').update({
            whatsapp: settings.whatsapp,
            phone: settings.phone,
            email: settings.email,
            address: settings.address,
            instagram: settings.instagram,
            tiktok: settings.tiktok,
            facebook: settings.facebook,
            planner_destinations: settings.planner_destinations,
            planner_interests: settings.planner_interests,
            planner_traveler_types: settings.planner_traveler_types,
            updated_at: new Date().toISOString()
        }).eq('id', 1);

        setSaving(false);
        if (error) {
            setMessage('Error saving settings.');
        } else {
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const updateTravelerType = (index: number, field: keyof TravelerType, value: string) => {
        if (!settings) return;
        const types = [...settings.planner_traveler_types];
        types[index] = { ...types[index], [field]: value };
        setSettings({ ...settings, planner_traveler_types: types });
    };

    const addTravelerType = () => {
        if (!settings) return;
        setSettings({
            ...settings,
            planner_traveler_types: [...settings.planner_traveler_types, { value: '', label: '', icon: '🧑' }],
        });
    };

    const removeTravelerType = (index: number) => {
        if (!settings) return;
        setSettings({
            ...settings,
            planner_traveler_types: settings.planner_traveler_types.filter((_, i) => i !== index),
        });
    };

    if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Site Settings</h1>

            <form onSubmit={handleSave} className="space-y-8">

                {message && (
                    <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message}
                    </div>
                )}

                {/* ── Contact Information ── */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Contact Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                            <input type="text" required className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary" value={settings?.whatsapp || ''} onChange={(e) => setSettings(s => s ? { ...s, whatsapp: e.target.value } : null)} placeholder="e.g., 62812345678" />
                            <p className="text-xs text-gray-500 mt-1">Include country code without +</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Phone Number</label>
                            <input type="text" required className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary" value={settings?.phone || ''} onChange={(e) => setSettings(s => s ? { ...s, phone: e.target.value } : null)} placeholder="e.g., +62 815-164-222-5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" required className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary" value={settings?.email || ''} onChange={(e) => setSettings(s => s ? { ...s, email: e.target.value } : null)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
                        <textarea required rows={3} className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary" value={settings?.address || ''} onChange={(e) => setSettings(s => s ? { ...s, address: e.target.value } : null)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                            <input type="url" className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary" value={settings?.facebook || ''} onChange={(e) => setSettings(s => s ? { ...s, facebook: e.target.value } : null)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                            <input type="url" className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary" value={settings?.instagram || ''} onChange={(e) => setSettings(s => s ? { ...s, instagram: e.target.value } : null)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
                            <input type="url" className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary" value={settings?.tiktok || ''} onChange={(e) => setSettings(s => s ? { ...s, tiktok: e.target.value } : null)} />
                        </div>
                    </div>
                </div>

                {/* ── Private Trip Planner Configuration ── */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Private Trip Planner Configuration</h2>
                    <p className="text-sm text-gray-500">Customize the options shown to users in the AI Private Trip Planner form.</p>

                    <TagEditor
                        label="Destinations"
                        tags={settings?.planner_destinations || []}
                        onChange={(tags) => setSettings(s => s ? { ...s, planner_destinations: tags } : null)}
                    />

                    <TagEditor
                        label="Travel Interests"
                        tags={settings?.planner_interests || []}
                        onChange={(tags) => setSettings(s => s ? { ...s, planner_interests: tags } : null)}
                    />

                    {/* Traveler Types */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Traveler Types</label>
                        <div className="space-y-3">
                            {settings?.planner_traveler_types.map((tt, i) => (
                                <div key={i} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                    <input type="text" value={tt.icon} onChange={(e) => updateTravelerType(i, 'icon', e.target.value)} className="w-14 text-center px-2 py-1.5 border rounded-md text-lg" title="Emoji icon" />
                                    <input type="text" value={tt.value} onChange={(e) => updateTravelerType(i, 'value', e.target.value)} className="flex-1 px-3 py-1.5 border rounded-md text-sm" placeholder="Value (e.g. Solo)" />
                                    <input type="text" value={tt.label} onChange={(e) => updateTravelerType(i, 'label', e.target.value)} className="flex-1 px-3 py-1.5 border rounded-md text-sm" placeholder="Label (e.g. Solo)" />
                                    <button type="button" onClick={() => removeTravelerType(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addTravelerType} className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Traveler Type
                        </button>
                    </div>
                </div>

                {/* Save */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`bg-primary hover:bg-emerald-700 text-white px-6 py-2 rounded-md flex items-center gap-2 ${saving ? 'opacity-70' : ''}`}
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SiteSettings;
