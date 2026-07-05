import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, X, Plus, Phone, Globe, MessageSquare, FileText } from 'lucide-react';
import {
    PageHeader, SectionCard, FormField, inputClass, textareaClass, btnPrimary, useToast,
} from '../../components/admin/ui';

interface TravelerType { value: string; label: string; icon: string; }
interface SiteSettingsData {
    id: number; whatsapp: string; phone: string; email: string; address: string;
    instagram: string; tiktok: string; facebook: string;
    planner_destinations: string[]; planner_interests: string[];
    planner_traveler_types: TravelerType[];
    izin_ppiu: string; izin_bpw: string;
    siskopatuh_logo_url: string; pasti_umrah_logo_url: string;
}

const TagEditor: React.FC<{ label: string; tags: string[]; onChange: (tags: string[]) => void }> = ({ label, tags, onChange }) => {
    const [input, setInput] = useState('');
    const addTag = () => {
        const t = input.trim();
        if (t && !tags.includes(t)) onChange([...tags, t]);
        setInput('');
    };
    return (
        <FormField label={label}>
            <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
                {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm font-medium">
                        {tag}
                        <button
                            type="button"
                            onClick={() => onChange(tags.filter(t => t !== tag))}
                            className="w-4 h-4 rounded-full bg-blue-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
                        >
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                ))}
                {tags.length === 0 && <p className="text-sm text-gray-400">No tags added yet.</p>}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Type and press Enter…"
                    className={inputClass}
                />
                <button type="button" onClick={addTag} className="px-4 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>
        </FormField>
    );
};

const SiteSettings: React.FC = () => {
    const toast = useToast();
    const [settings, setSettings] = useState<SiteSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
        if (!error && data) {
            setSettings({
                ...data,
                planner_destinations: data.planner_destinations || [],
                planner_interests: data.planner_interests || [],
                planner_traveler_types: data.planner_traveler_types || [],
                izin_ppiu: data.izin_ppiu || '',
                izin_bpw: data.izin_bpw || '',
                siskopatuh_logo_url: data.siskopatuh_logo_url || '',
                pasti_umrah_logo_url: data.pasti_umrah_logo_url || '',
            } as SiteSettingsData);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        setSaving(true);
        const { error } = await supabase.from('site_settings').update({
            whatsapp: settings.whatsapp, phone: settings.phone, email: settings.email,
            address: settings.address, instagram: settings.instagram,
            tiktok: settings.tiktok, facebook: settings.facebook,
            planner_destinations: settings.planner_destinations,
            planner_interests: settings.planner_interests,
            planner_traveler_types: settings.planner_traveler_types,
            izin_ppiu: settings.izin_ppiu,
            izin_bpw: settings.izin_bpw,
            siskopatuh_logo_url: settings.siskopatuh_logo_url,
            pasti_umrah_logo_url: settings.pasti_umrah_logo_url,
            updated_at: new Date().toISOString(),
        }).eq('id', 1);
        setSaving(false);
        if (error) toast('error', 'Failed to save settings.');
        else toast('success', 'Settings saved successfully!');
    };

    const set = (field: keyof SiteSettingsData, value: any) =>
        setSettings(s => s ? { ...s, [field]: value } : null);

    const updateTravelerType = (i: number, field: keyof TravelerType, value: string) => {
        if (!settings) return;
        const types = [...settings.planner_traveler_types];
        types[i] = { ...types[i], [field]: value };
        set('planner_traveler_types', types);
    };

    if (loading) return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 h-40 animate-pulse" />
            ))}
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Site Settings"
                subtitle="Configure contact info, social links, and AI planner options"
            />

            <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
                {/* Contact Info */}
                <SectionCard
                    title="Contact Information"
                    description="Used in the website footer, contact page, and WhatsApp links."
                >
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="WhatsApp Number" required hint="Include country code, no + symbol (e.g. 62812345678)">
                                <div className="relative">
                                    <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" required className={`${inputClass} pl-10`} value={settings?.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} placeholder="62812345678" />
                                </div>
                            </FormField>
                            <FormField label="Display Phone Number" required>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" required className={`${inputClass} pl-10`} value={settings?.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+62 815-164-222-5" />
                                </div>
                            </FormField>
                        </div>
                        <FormField label="Email Address" required>
                            <input type="email" required className={inputClass} value={settings?.email || ''} onChange={e => set('email', e.target.value)} />
                        </FormField>
                        <FormField label="Office Address" required>
                            <textarea required rows={3} className={textareaClass} value={settings?.address || ''} onChange={e => set('address', e.target.value)} />
                        </FormField>
                    </div>
                </SectionCard>

                {/* Social Links */}
                <SectionCard title="Social Media Links" description="Optional — leave blank to hide from website.">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {(['facebook', 'instagram', 'tiktok'] as const).map((platform) => (
                            <FormField key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1) + ' URL'}>
                                <div className="relative">
                                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="url" className={`${inputClass} pl-10`} value={(settings as any)?.[platform] || ''} onChange={e => set(platform, e.target.value)} placeholder="https://..." />
                                </div>
                            </FormField>
                        ))}
                    </div>
                </SectionCard>

                {/* Legal & Certification */}
                <SectionCard
                    title="Izin & Sertifikasi"
                    description="Nomor izin resmi dan logo sertifikasi yang ditampilkan di footer brosur poster."
                >
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="Izin PPIU" hint="Nomor izin untuk paket umrah">
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" className={`${inputClass} pl-10`} value={settings?.izin_ppiu || ''} onChange={e => set('izin_ppiu', e.target.value)} placeholder="16032300890440001" />
                                </div>
                            </FormField>
                            <FormField label="Izin BPW" hint="Nomor izin untuk paket wisata muslim">
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" className={`${inputClass} pl-10`} value={settings?.izin_bpw || ''} onChange={e => set('izin_bpw', e.target.value)} placeholder="16032300890440002" />
                                </div>
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField label="URL Logo Siskopatuh" hint="URL gambar logo Siskopatuh">
                                <div className="space-y-2">
                                    <input type="url" className={inputClass} value={settings?.siskopatuh_logo_url || ''} onChange={e => set('siskopatuh_logo_url', e.target.value)} placeholder="https://..." />
                                    {settings?.siskopatuh_logo_url && (
                                        <img src={settings.siskopatuh_logo_url} alt="Siskopatuh" className="h-10 object-contain rounded border border-gray-100 bg-gray-50 p-1" />
                                    )}
                                </div>
                            </FormField>
                            <FormField label="URL Logo 5 Pasti Umrah" hint="URL gambar logo 5 Pasti Umrah">
                                <div className="space-y-2">
                                    <input type="url" className={inputClass} value={settings?.pasti_umrah_logo_url || ''} onChange={e => set('pasti_umrah_logo_url', e.target.value)} placeholder="https://..." />
                                    {settings?.pasti_umrah_logo_url && (
                                        <img src={settings.pasti_umrah_logo_url} alt="5 Pasti Umrah" className="h-10 object-contain rounded border border-gray-100 bg-gray-50 p-1" />
                                    )}
                                </div>
                            </FormField>
                        </div>
                    </div>
                </SectionCard>

                {/* Planner Config */}
                <SectionCard
                    title="AI Planner Configuration"
                    description="Customize the dropdown options shown in the public AI Private Trip Planner form."
                >
                    <div className="space-y-6">
                        <TagEditor
                            label="Destinations"
                            tags={settings?.planner_destinations || []}
                            onChange={tags => set('planner_destinations', tags)}
                        />
                        <TagEditor
                            label="Travel Interests"
                            tags={settings?.planner_interests || []}
                            onChange={tags => set('planner_interests', tags)}
                        />

                        {/* Traveler Types */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Traveler Types</label>
                            <div className="space-y-2 mb-3">
                                {settings?.planner_traveler_types.map((tt, i) => (
                                    <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <input
                                            type="text"
                                            value={tt.icon}
                                            onChange={e => updateTravelerType(i, 'icon', e.target.value)}
                                            className="w-14 text-center px-2 py-2 text-lg border border-gray-200 rounded-lg bg-white"
                                            title="Emoji icon"
                                        />
                                        <input
                                            type="text"
                                            value={tt.value}
                                            onChange={e => updateTravelerType(i, 'value', e.target.value)}
                                            className={`flex-1 ${inputClass}`}
                                            placeholder="Value (e.g. Solo)"
                                        />
                                        <input
                                            type="text"
                                            value={tt.label}
                                            onChange={e => updateTravelerType(i, 'label', e.target.value)}
                                            className={`flex-1 ${inputClass}`}
                                            placeholder="Label (e.g. Solo Traveler)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => set('planner_traveler_types', settings!.planner_traveler_types.filter((_, idx) => idx !== i))}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {settings?.planner_traveler_types.length === 0 && (
                                    <p className="text-sm text-gray-400">No traveler types yet.</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => set('planner_traveler_types', [...(settings?.planner_traveler_types || []), { value: '', label: '', icon: '🧑' }])}
                                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Traveler Type
                            </button>
                        </div>
                    </div>
                </SectionCard>

                {/* Save */}
                <div className="flex justify-end pb-8">
                    <button type="submit" disabled={saving} className={btnPrimary}>
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SiteSettings;
