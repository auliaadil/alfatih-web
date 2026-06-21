export const GOOGLE_FONTS = [
    // Sans-serif
    'Plus Jakarta Sans', 'Inter', 'Poppins', 'Montserrat', 'Raleway',
    'Work Sans', 'DM Sans', 'Nunito', 'Rubik', 'Outfit', 'Lato',
    'Open Sans', 'Ubuntu', 'Figtree',
    // Serif
    'Playfair Display', 'Merriweather', 'Lora', 'Source Serif 4',
    // Display / Bold
    'Bebas Neue', 'Anton', 'Oswald',
    // Decorative / Script
    'Great Vibes', 'Pacifico', 'Dancing Script', 'Caveat',
    // Arabic
    'Amiri', 'Noto Sans Arabic', 'Cairo', 'Tajawal',
];

const loadedFonts = new Set<string>();

export const loadGoogleFont = (fontName: string) => {
    if (loadedFonts.has(fontName)) return;
    loadedFonts.add(fontName);
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
};

// Eagerly preload the most commonly used fonts at module load time
['Plus Jakarta Sans', ...GOOGLE_FONTS.slice(0, 9)].forEach(loadGoogleFont);

/**
 * Injects the Google Fonts CSS for `fontName` (if not already done), then
 * waits for the browser to actually have the font ready before resolving.
 * Safe to call concurrently — `loadGoogleFont` is idempotent.
 */
export const ensureFontReady = async (fontName: string, fontWeight: string | number = 400): Promise<void> => {
    loadGoogleFont(fontName);
    try {
        await document.fonts.load(`${fontWeight} 1em "${fontName}"`);
    } catch {
        // document.fonts.load resolves with [] on failure but doesn't reject;
        // this catch is just a safety net.
    }
};

/**
 * Extracts every unique fontFamily from a Fabric canvas JSON object list,
 * loads their CSS, and waits until all are available in the browser font set.
 * Call this before canvas.loadFromJSON to guarantee fonts are ready when
 * Fabric first measures and renders text.
 */
export const preloadTemplateFonts = async (json: Record<string, unknown>): Promise<void> => {
    const objects = (json.objects ?? []) as Array<Record<string, unknown>>;
    const seen = new Set<string>();
    const requests: Promise<void>[] = [];
    for (const obj of objects) {
        const family = obj.fontFamily as string | undefined;
        if (!family || seen.has(family)) continue;
        seen.add(family);
        const weight = (obj.fontWeight as string | number | undefined) ?? 400;
        requests.push(ensureFontReady(family, weight));
    }
    await Promise.all(requests);
};
