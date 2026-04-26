import React from 'react';
import { LayoutOptions } from '../../../../types/poster';

interface PosterHeaderProps {
    options: LayoutOptions;
}

const PosterHeader: React.FC<PosterHeaderProps> = ({ options }) => {
    const textColorClass = options.theme === 'dark' ? 'text-white' : 'text-primary';

    return (
        <div className="flex items-center gap-3 relative z-10 w-full mb-6">
            {/* Logo placeholder - replace with actual Alfatih logo if stored in poster_assets */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${options.theme === 'dark' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                A
            </div>
            <div>
                <h3 className={`font-bold text-lg tracking-tight leading-none ${textColorClass} font-display`}>Alfatih</h3>
                <p className={`text-[10px] font-medium opacity-80 uppercase tracking-widest ${textColorClass}`}>Dunia Wisata</p>
            </div>
        </div>
    );
};

export default PosterHeader;
