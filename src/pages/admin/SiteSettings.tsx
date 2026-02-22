import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save } from 'lucide-react';

interface SiteSettings {
    id: number;
    whatsapp: string;
    phone: string;
    email: string;
    address: string;
    instagram: string;
    tiktok: string;
}

const SiteSettings: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
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
            setSettings(data as SiteSettings);
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

    if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Site Settings</h1>

            <form onSubmit={handleSave} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">

                {message && (
                    <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                            value={settings?.whatsapp || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, whatsapp: e.target.value } : null)}
                            placeholder="e.g., 62812345678"
                        />
                        <p className="text-xs text-gray-500 mt-1">Include country code without +, e.g. 628123</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Phone Number</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                            value={settings?.phone || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, phone: e.target.value } : null)}
                            placeholder="e.g., +62 815-164-222-5"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                        value={settings?.email || ''}
                        onChange={(e) => setSettings(s => s ? { ...s, email: e.target.value } : null)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
                    <textarea
                        required
                        rows={3}
                        className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                        value={settings?.address || ''}
                        onChange={(e) => setSettings(s => s ? { ...s, address: e.target.value } : null)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                        <input
                            type="url"
                            className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                            value={settings?.instagram || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, instagram: e.target.value } : null)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
                        <input
                            type="url"
                            className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                            value={settings?.tiktok || ''}
                            onChange={(e) => setSettings(s => s ? { ...s, tiktok: e.target.value } : null)}
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
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
