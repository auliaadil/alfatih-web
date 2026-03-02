import React from 'react';
import { LayoutOptions } from '../../../../types/poster';

interface PosterPromoProps {
    packageData?: any;
    generatedData?: any;
    options: LayoutOptions;
}

const PosterPromo: React.FC<PosterPromoProps> = ({ packageData, generatedData, options }) => {
    const textColorClass = options.theme === 'dark' ? 'text-white' : 'text-gray-900';
    const subtleTextColorClass = options.theme === 'dark' ? 'text-white/80' : 'text-gray-600';

    const renderPromoText = () => {
        if (generatedData?.hook && (generatedData?.details || generatedData?.body)) {
            const descriptionText = generatedData.details || generatedData.body;

            return (
                <>
                    {generatedData.title && (
                        <h4 className={`text-sm tracking-widest uppercase font-bold text-primary mb-2`}>
                            {generatedData.title}
                        </h4>
                    )}
                    <h2 className={`text-4xl leading-tight font-black tracking-tighter mb-4 ${textColorClass}`}>
                        {generatedData.hook}
                    </h2>
                    <p className={`text-sm leading-relaxed font-medium ${subtleTextColorClass}`}>
                        {descriptionText}
                    </p>
                </>
            );
        }

        if (packageData) {
            return (
                <>
                    <h2 className={`text-4xl leading-tight font-black tracking-tighter mb-4 ${textColorClass}`}>
                        {packageData.title}
                    </h2>
                    <p className={`text-sm leading-relaxed font-medium line-clamp-4 ${subtleTextColorClass}`}>
                        {packageData.description || 'Experience the journey of a lifetime with Alfatih Dunia Wisata.'}
                    </p>
                </>
            );
        }

        return (
            <>
                <h2 className={`text-4xl leading-tight font-black tracking-tighter mb-4 ${textColorClass}`}>
                    Headline Goes Here
                </h2>
                <p className={`text-sm leading-relaxed font-medium ${subtleTextColorClass}`}>
                    Generate copy using the AI assistant or select a package to see content here.
                </p>
            </>
        );
    };

    return (
        <div className="relative z-10 w-full max-w-[85%]">
            {renderPromoText()}
        </div>
    );
};

export default PosterPromo;
