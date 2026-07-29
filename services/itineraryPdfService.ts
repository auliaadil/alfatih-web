import { supabase } from '@/src/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ItinerarySiteSettings {
    whatsapp: string;
    phone: string;
    website_url: string;
}

// Convert the local WEBP logo to a PNG base64 string the edge function can embed.
// We fetch as a blob first (avoids canvas CORS taint on same-origin assets), then
// draw onto a canvas to produce a PNG regardless of the original format.
async function getLogoBase64(): Promise<string | null> {
    try {
        const res = await fetch('/assets/alfatih_logo_circle.webp');
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        const bitmapUrl = URL.createObjectURL(blob);
        try {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = bitmapUrl;
            });
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            return dataUrl.split(',')[1]; // strip "data:image/png;base64,"
        } finally {
            URL.revokeObjectURL(bitmapUrl);
        }
    } catch {
        return null;
    }
}

export async function downloadItineraryPdf(
    pkg: any,
    siteSettings: ItinerarySiteSettings,
    dayPhotos?: { day: number; photoUrls: string[] }[],
    termsConditions?: string,
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
        body: JSON.stringify({ package: pkg, siteSettings, logoBase64, dayPhotos: dayPhotos ?? [], termsConditions: termsConditions ?? '' }),
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

export async function generateAndSaveItineraryPdf(
    pkg: any,
    siteSettings: ItinerarySiteSettings,
    dayPhotos?: { day: number; photoUrls: string[] }[],
    termsConditions?: string,
): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const logoBase64 = await getLogoBase64();

    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-itinerary-pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ package: pkg, siteSettings, logoBase64, dayPhotos: dayPhotos ?? [], termsConditions: termsConditions ?? '' }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PDF generation failed: ${res.status} ${text}`);
    }

    const blob = await res.blob();

    // Upload to persistent storage (upsert so regenerating overwrites the same file)
    const fileName = `${pkg.id}/itinerary.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('itinerary-pdfs')
        .upload(fileName, blob, { upsert: true, contentType: 'application/pdf' });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('itinerary-pdfs').getPublicUrl(uploadData.path);

    // Save URL to package record
    await supabase.from('packages').update({ itinerary_pdf_url: publicUrl }).eq('id', pkg.id);

    return publicUrl;
}
