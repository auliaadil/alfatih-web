import React from 'react';
import { Instagram, Globe, Phone } from 'lucide-react';
import { LayoutOptions } from '../../../../types/poster';
import { useSiteSettings } from '../../../../contexts/SiteSettingsContext';

interface PosterFooterProps {
    options: LayoutOptions;
}

const extractInstagramHandle = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('@')) return url;
    const match = url.match(/instagram\.com\/([^/?]+)/);
    return match ? `@${match[1]}` : url;
};

const websiteFromEmail = (email: string): string => {
    const at = email.indexOf('@');
    return at >= 0 ? email.slice(at + 1) : email;
};

const PosterFooter: React.FC<PosterFooterProps> = ({ options }) => {
    const settings = useSiteSettings();

    if (!options.showFooter) return null;

    const textColorClass = options.theme === 'dark' ? 'text-white/80' : 'text-gray-600';
    const borderColorClass = options.theme === 'dark' ? 'border-white/20' : 'border-gray-200';

    const website = websiteFromEmail(settings.email);
    const instagramHandle = extractInstagramHandle(settings.instagram);

    return (
        <div className={`mt-auto pt-4 border-t ${borderColorClass} flex justify-between items-end relative z-10 w-full`}>
            <div className={`flex flex-col gap-1.5 ${textColorClass}`}>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{website}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Instagram className="w-3.5 h-3.5" />
                    <span>{instagramHandle}</span>
                </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${textColorClass}`}>
                <Phone className="w-3.5 h-3.5" />
                <span>{settings.phone}</span>
            </div>
        </div>
    );
};

export default PosterFooter;
