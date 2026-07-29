import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
    whatsapp: string;
    phone: string;
    email: string;
    address: string;
    instagram: string;
    tiktok: string;
    facebook: string;
    izin_ppiu: string;
    izin_bpw: string;
    siskopatuh_logo_url: string;
    pasti_umrah_logo_url: string;
    website_url: string;
}

const defaultSettings: SiteSettings = {
    whatsapp: '628XXXXXXXXXX',
    phone: '08XXXXXXXXXX',
    email: 'info@alfatihduniawisata.com',
    address: 'Jakarta, Indonesia',
    instagram: 'https://instagram.com/alfatihduniawisata',
    tiktok: 'https://tiktok.com/@alfatihduniawisata',
    facebook: 'https://facebook.com/alfatihduniawisata',
    izin_ppiu: '',
    izin_bpw: '',
    siskopatuh_logo_url: '',
    pasti_umrah_logo_url: '',
    website_url: 'alfatihduniawisata.id',
};

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings);

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .single();

            if (!error && data) {
                setSettings({
                    whatsapp: data.whatsapp || defaultSettings.whatsapp,
                    phone: data.phone || defaultSettings.phone,
                    email: data.email || defaultSettings.email,
                    address: data.address || defaultSettings.address,
                    instagram: data.instagram || defaultSettings.instagram,
                    tiktok: data.tiktok || defaultSettings.tiktok,
                    facebook: data.facebook || defaultSettings.facebook,
                    izin_ppiu: data.izin_ppiu || '',
                    izin_bpw: data.izin_bpw || '',
                    siskopatuh_logo_url: data.siskopatuh_logo_url || '',
                    pasti_umrah_logo_url: data.pasti_umrah_logo_url || '',
                    website_url: data.website_url || defaultSettings.website_url,
                });
            }
        };

        fetchSettings();
    }, []);

    return (
        <SiteSettingsContext.Provider value={settings}>
            {children}
        </SiteSettingsContext.Provider>
    );
};
