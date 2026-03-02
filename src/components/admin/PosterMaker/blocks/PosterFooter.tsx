import React from 'react';
import { Instagram, Globe, Phone } from 'lucide-react';
import { LayoutOptions } from '../../../../types/poster';

interface PosterFooterProps {
    options: LayoutOptions;
}

const PosterFooter: React.FC<PosterFooterProps> = ({ options }) => {
    if (!options.showFooter) return null;

    const textColorClass = options.theme === 'dark' ? 'text-white/80' : 'text-gray-600';
    const borderColorClass = options.theme === 'dark' ? 'border-white/20' : 'border-gray-200';

    return (
        <div className={`mt-auto pt-4 border-t ${borderColorClass} flex justify-between items-end relative z-10 w-full`}>
            <div className={`flex flex-col gap-1.5 ${textColorClass}`}>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Globe className="w-3.5 h-3.5" />
                    <span>alfatihduniawisata.com</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Instagram className="w-3.5 h-3.5" />
                    <span>@alfatihduniawisata</span>
                </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${textColorClass}`}>
                <Phone className="w-3.5 h-3.5" />
                <span>0811-1234-5678</span>
            </div>
        </div>
    );
};

export default PosterFooter;
