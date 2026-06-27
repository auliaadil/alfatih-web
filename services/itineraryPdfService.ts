import { supabase } from '@/src/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ItinerarySiteSettings {
    whatsapp: string;
    phone: string;
}

// Convert the local WEBP logo to a PNG base64 string the edge function can embed
async function getLogoBase64(): Promise<string | null> {
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = '/assets/alfatih_logo_circle.webp';
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        return dataUrl.split(',')[1]; // strip "data:image/png;base64,"
    } catch {
        return null;
    }
}

export async function downloadItineraryPdf(
    pkg: any,
    siteSettings: ItinerarySiteSettings,
): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const logoBase64 = await getLogoBase64();

    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-itinerary-pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ package: pkg, siteSettings, logoBase64 }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PDF generation failed: ${res.status} ${text}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Itinerary - ${pkg.title} - ${pkg.departure_date || ''}.pdf`.replace(/\s+/g, ' ').trim();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
