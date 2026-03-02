import React from 'react';
import { LayoutOptions } from '../../../../types/poster';

interface PosterImageBlockProps {
    packageData?: any;
    options: LayoutOptions;
    className?: string; // specific layout classes passed down from the Canvas engine
}

const PosterImageBlock: React.FC<PosterImageBlockProps> = ({ packageData, options, className = '' }) => {
    if (options.imageCount === 0 || !packageData) return null;

    const coverUrl = packageData.image_url;
    const galleryUrls = packageData.gallery || [];

    // If we only want exactly 1 image OR we have no gallery images
    if (options.imageCount === 1 || galleryUrls.length === 0) {
        if (!coverUrl) return <div className={`bg-gray-200 flex items-center justify-center text-gray-400 font-medium ${className}`}>No Cover Image</div>;

        return (
            <div className={`relative overflow-hidden ${className}`}>
                <img src={coverUrl} alt="Cover" className={`w-full h-full ${options.imageStyle === 'contain' ? 'object-contain' : 'object-cover'}`} />
                {options.overlayOpacity !== 'none' && (
                    <div className={`absolute inset-0 bg-black ${options.overlayOpacity === 'light' ? 'opacity-20' :
                            options.overlayOpacity === 'medium' ? 'opacity-40' : 'opacity-60'
                        }`}></div>
                )}
            </div>
        );
    }

    // Grid Gallery (requires multiple images)
    if (options.imageCount > 1 && galleryUrls.length > 0) {
        // Collect all available images up to the requested count
        const allImages = [coverUrl, ...galleryUrls].filter(Boolean).slice(0, Math.max(2, options.imageCount));

        if (allImages.length === 2) {
            return (
                <div className={`grid grid-cols-2 gap-2 ${className}`}>
                    <img src={allImages[0]} alt="Pic 1" className="w-full h-full object-cover rounded-lg shadow-sm" />
                    <img src={allImages[1]} alt="Pic 2" className="w-full h-full object-cover rounded-lg shadow-sm" />
                </div>
            );
        }

        if (allImages.length >= 3) {
            return (
                <div className={`grid grid-cols-2 gap-2 ${className}`}>
                    <img src={allImages[0]} alt="Main" className="w-full h-full object-cover rounded-l-lg shadow-sm" />
                    <div className="grid grid-rows-2 gap-2">
                        <img src={allImages[1]} alt="Sub 1" className="w-full h-full object-cover rounded-tr-lg shadow-sm" />
                        <img src={allImages[2]} alt="Sub 2" className="w-full h-full object-cover rounded-br-lg shadow-sm" />
                    </div>
                </div>
            );
        }
    }

    return null;
};

export default PosterImageBlock;
