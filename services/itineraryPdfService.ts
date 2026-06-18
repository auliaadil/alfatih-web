import { supabase } from '@/src/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ItinerarySiteSettings {
    whatsapp: string;
    phone: string;
}

export async function downloadItineraryPdf(
    pkg: any,
    siteSettings: ItinerarySiteSettings,
): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-itinerary-pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ package: pkg, siteSettings }),
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
