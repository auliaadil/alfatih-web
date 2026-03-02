export type AspectRatio = 'post' | 'story';

export type LayoutType =
    | 'hero-overlay'       // Full image with gradient overlay
    | 'split-half'         // 50% image, 50% solid color
    | 'split-third'        // 33% image, 67% solid color (or vice versa)
    | 'grid-gallery'       // Grid of multiple images 
    | 'polaroid'           // Image wrapped in a polaroid/frame style
    | 'minimal-clean'      // Barely any images, heavy typography
    | 'feature-focused';   // Details and features take primary focus

export interface LayoutOptions {
    showFooter: boolean;
    showPrice: boolean;
    showDates: boolean;
    showFeatures: boolean;
    showHotelAndFlight: boolean;
    imageCount: number; // 0 for no image, 1 for cover, >1 for gallery
    imageStyle?: 'cover' | 'contain' | 'rounded' | 'masked';
    overlayOpacity?: 'none' | 'light' | 'medium' | 'heavy';
    theme: 'light' | 'dark' | 'brand'; // Brand = primary color background
    detailsPosition: 'top' | 'bottom' | 'center' | 'left' | 'right';
}

export interface TemplateConfig {
    id: string;
    name: string;
    category: 'Tour Promotion' | 'Documentation' | 'Content';
    aspectRatio: AspectRatio;
    layoutType: LayoutType;
    options: LayoutOptions;
}
