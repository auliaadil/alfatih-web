import React from 'react';
import { TemplateConfig } from '../../../types/poster';
import { Check } from 'lucide-react';

// The engine powers these templates completely dynamically!
export const AVAILABLE_TEMPLATES: TemplateConfig[] = [
    // --- POST TEMPLATES (3:4 Ratio) ---
    {
        id: 'minimal-hero-post',
        name: 'Post: Full Hero Clean',
        category: 'Tour Promotion',
        aspectRatio: 'post',
        layoutType: 'hero-overlay',
        options: {
            showFooter: true,
            showPrice: true,
            showDates: true,
            showFeatures: false,
            showHotelAndFlight: true,
            imageCount: 1,
            imageStyle: 'cover',
            overlayOpacity: 'heavy',
            theme: 'dark',
            detailsPosition: 'bottom'
        }
    },
    {
        id: 'minimal-split-post',
        name: 'Post: Split Image',
        category: 'Tour Promotion',
        aspectRatio: 'post',
        layoutType: 'split-half',
        options: {
            showFooter: true,
            showPrice: true,
            showDates: true,
            showFeatures: true,
            showHotelAndFlight: false,
            imageCount: 1,
            imageStyle: 'cover',
            overlayOpacity: 'none',
            theme: 'light',
            detailsPosition: 'bottom'
        }
    },
    {
        id: 'minimal-grid-post',
        name: 'Post: Gallery Grid',
        category: 'Tour Promotion',
        aspectRatio: 'post',
        layoutType: 'grid-gallery',
        options: {
            showFooter: true,
            showPrice: true,
            showDates: true,
            showFeatures: false,
            showHotelAndFlight: true,
            imageCount: 3,
            imageStyle: 'rounded',
            overlayOpacity: 'none',
            theme: 'light',
            detailsPosition: 'bottom'
        }
    },
    {
        id: 'minimal-content-post',
        name: 'Post: Typography Focus',
        category: 'Content',
        aspectRatio: 'post',
        layoutType: 'minimal-clean',
        options: {
            showFooter: true,
            showPrice: false,
            showDates: false,
            showFeatures: false,
            showHotelAndFlight: false,
            imageCount: 0,
            theme: 'light',
            detailsPosition: 'bottom'
        }
    },

    // --- STORY TEMPLATES (9:16 Ratio) ---
    {
        id: 'minimal-hero-story',
        name: 'Story: Full Hero Clean',
        category: 'Tour Promotion',
        aspectRatio: 'story',
        layoutType: 'hero-overlay',
        options: {
            showFooter: false, // Too much content for a fast story
            showPrice: true,
            showDates: true,
            showFeatures: true,
            showHotelAndFlight: false,
            imageCount: 1,
            imageStyle: 'cover',
            overlayOpacity: 'heavy',
            theme: 'dark',
            detailsPosition: 'center'
        }
    },
    {
        id: 'minimal-split-story',
        name: 'Story: Split Image',
        category: 'Tour Promotion',
        aspectRatio: 'story',
        layoutType: 'split-third',
        options: {
            showFooter: true,
            showPrice: true,
            showDates: true,
            showFeatures: true,
            showHotelAndFlight: true,
            imageCount: 1,
            imageStyle: 'cover',
            overlayOpacity: 'none',
            theme: 'light',
            detailsPosition: 'bottom'
        }
    }
];

interface TemplateSelectorProps {
    selectedTemplateId: string | null;
    onSelectTemplate: (template: TemplateConfig) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplateId, onSelectTemplate }) => {
    // Group templates by Aspect Ratio to make choice easier
    const postTemplates = AVAILABLE_TEMPLATES.filter(t => t.aspectRatio === 'post');
    const storyTemplates = AVAILABLE_TEMPLATES.filter(t => t.aspectRatio === 'story');

    const renderTemplateList = (title: string, templates: TemplateConfig[]) => (
        <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
            <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => {
                    const isSelected = selectedTemplateId === template.id;
                    return (
                        <button
                            key={template.id}
                            onClick={() => onSelectTemplate(template)}
                            className={`relative text-left p-3 rounded-lg border-2 transition-all duration-200 ${isSelected
                                    ? 'border-primary bg-emerald-50 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                    {template.name}
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </div>
                            <div className="text-[10px] text-gray-500 font-medium">
                                {template.layoutType} • {template.options.theme}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div>
            {renderTemplateList('Instagram Post (3:4)', postTemplates)}
            {renderTemplateList('Instagram Story (9:16)', storyTemplates)}
        </div>
    );
};

export default TemplateSelector;
