import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatPrice = (price?: number) =>
    price
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
        : 'Hubungi Kami';

// A4 dimensions in PDF points (1 pt = 1/72 inch)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Brand colors as pdf-lib rgb values
const COLOR_PRIMARY = rgb(0 / 255, 132 / 255, 255 / 255);   // #0084FF
const COLOR_SECONDARY = rgb(245 / 255, 158 / 255, 11 / 255); // #F59E0B
const COLOR_DARK = rgb(15 / 255, 23 / 255, 42 / 255);        // #0F172A
const COLOR_GRAY = rgb(107 / 255, 114 / 255, 128 / 255);     // gray-500
const COLOR_LIGHT_BG = rgb(248 / 255, 250 / 255, 252 / 255); // slate-50
const COLOR_WHITE = rgb(1, 1, 1);

interface DrawContext {
    page: ReturnType<PDFDocument['addPage']>;
    doc: PDFDocument;
    font: Awaited<ReturnType<PDFDocument['embedFont']>>;
    fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>;
    y: number; // current Y cursor (decrements as content is added)
}

// Wraps text to fit within maxWidth, returns array of lines
function wrapText(text: string, font: DrawContext['font'], fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
            current = test;
        } else {
            if (current) lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
}

// Draw wrapped text, advance ctx.y, add new page if needed
function drawText(
    ctx: DrawContext,
    text: string,
    opts: {
        fontSize?: number;
        bold?: boolean;
        color?: ReturnType<typeof rgb>;
        indent?: number;
        lineHeight?: number;
        maxWidth?: number;
    } = {},
): void {
    const {
        fontSize = 10,
        bold = false,
        color = COLOR_DARK,
        indent = 0,
        lineHeight,
        maxWidth,
    } = opts;
    const font = bold ? ctx.fontBold : ctx.font;
    const lh = lineHeight ?? fontSize * 1.5;
    const width = maxWidth ?? CONTENT_W - indent;
    const lines = wrapText(text, font, fontSize, width);

    for (const line of lines) {
        if (ctx.y < MARGIN + fontSize + 10) {
            ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
            ctx.y = PAGE_H - MARGIN;
        }
        ctx.page.drawText(line, {
            x: MARGIN + indent,
            y: ctx.y - fontSize,
            size: fontSize,
            font,
            color,
        });
        ctx.y -= lh;
    }
}

// Draw a filled section header rectangle + white label
function drawSectionHeader(ctx: DrawContext, label: string): void {
    if (ctx.y < MARGIN + 30) {
        ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
        ctx.y = PAGE_H - MARGIN;
    }
    ctx.page.drawRectangle({
        x: MARGIN,
        y: ctx.y - 22,
        width: CONTENT_W,
        height: 22,
        color: COLOR_PRIMARY,
    });
    ctx.page.drawText(label.toUpperCase(), {
        x: MARGIN + 8,
        y: ctx.y - 16,
        size: 9,
        font: ctx.fontBold,
        color: COLOR_WHITE,
    });
    ctx.y -= 30;
}

async function buildItineraryPdf(
    pkg: any,
    siteSettings: { whatsapp?: string; phone?: string },
): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const firstPage = doc.addPage([PAGE_W, PAGE_H]);
    const ctx: DrawContext = { page: firstPage, doc, font, fontBold, y: PAGE_H - MARGIN };

    // ── Cover ────────────────────────────────────────────────────────────────
    // Blue top bar
    ctx.page.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: COLOR_PRIMARY });
    ctx.page.drawText('ALFATIH DUNIA WISATA', { x: MARGIN, y: PAGE_H - 38, size: 14, font: fontBold, color: COLOR_WHITE });
    ctx.page.drawText('adwisata.com', { x: MARGIN, y: PAGE_H - 54, size: 9, font, color: rgb(0.8, 0.9, 1) });

    ctx.y = PAGE_H - 80;

    // Package title
    drawText(ctx, 'ITINERARY PROGRAM', { fontSize: 10, color: COLOR_GRAY, bold: false });
    ctx.y -= 4;
    drawText(ctx, pkg.title || 'Paket Wisata', { fontSize: 20, bold: true, color: COLOR_PRIMARY });
    ctx.y -= 8;

    // Key info row
    const infoItems = [
        pkg.departure_date && `Keberangkatan: ${pkg.departure_date}`,
        pkg.duration && `Durasi: ${pkg.duration}`,
        pkg.airlines?.length && `Maskapai: ${pkg.airlines.map((a: any) => a.name).join(', ')}`,
    ].filter(Boolean) as string[];

    for (const info of infoItems) {
        drawText(ctx, info, { fontSize: 10, color: COLOR_GRAY });
    }
    ctx.y -= 16;

    // Divider line
    ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: PAGE_W - MARGIN, y: ctx.y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    ctx.y -= 20;

    // ── Day-by-day itinerary ──────────────────────────────────────────────────
    const itinerary: any[] = pkg.itinerary || [];
    if (itinerary.length > 0) {
        drawSectionHeader(ctx, 'Program Perjalanan');
        ctx.y -= 4;

        for (const day of itinerary) {
            // Day header
            const dayLabel = `Hari ${day.day}${day.title ? ` — ${day.title}` : ''}`;
            // Add extra spacing and a new page check before each day
            if (ctx.y < MARGIN + 60) {
                ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
                ctx.y = PAGE_H - MARGIN;
            }
            drawText(ctx, dayLabel, { fontSize: 11, bold: true, color: COLOR_PRIMARY });

            if (day.description) {
                drawText(ctx, day.description, { fontSize: 9, color: COLOR_GRAY, indent: 8 });
            }
            const activities: string[] = day.activities || [];
            for (const act of activities) {
                drawText(ctx, `• ${act}`, { fontSize: 9, color: COLOR_DARK, indent: 8 });
            }
            ctx.y -= 8;
        }
        ctx.y -= 8;
    }

    // ── Hotels ───────────────────────────────────────────────────────────────
    const hotels: any[] = pkg.hotels || [];
    if (hotels.length > 0) {
        drawSectionHeader(ctx, 'Akomodasi Hotel');
        ctx.y -= 4;

        const makkah = hotels.filter((h: any) => /makkah|mekkah/i.test(h.location || ''));
        const madinah = hotels.filter((h: any) => /madinah|medina/i.test(h.location || ''));
        const others = hotels.filter((h: any) => !makkah.includes(h) && !madinah.includes(h));

        for (const [label, list] of [['Hotel Mekkah', makkah], ['Hotel Madinah', madinah], ['Hotel Lainnya', others]] as const) {
            if ((list as any[]).length === 0) continue;
            drawText(ctx, label, { fontSize: 9, bold: true, color: COLOR_GRAY });
            for (const h of list as any[]) {
                const stars = '★'.repeat(h.stars || 0);
                drawText(ctx, `${h.name}${stars ? `  ${stars}` : ''}`, { fontSize: 10, bold: false, color: COLOR_DARK, indent: 8 });
            }
            ctx.y -= 4;
        }
        ctx.y -= 8;
    }

    // ── Pricing ───────────────────────────────────────────────────────────────
    const roomOptions: any[] = pkg.room_options || [];
    if (roomOptions.length > 0) {
        drawSectionHeader(ctx, 'Harga Paket');
        ctx.y -= 4;

        const colW = CONTENT_W / Math.max(roomOptions.length, 1);
        for (let i = 0; i < roomOptions.length; i++) {
            const opt = roomOptions[i];
            const x = MARGIN + i * colW;
            ctx.page.drawText(`Kamar ${opt.name}`, { x, y: ctx.y, size: 8, font, color: COLOR_GRAY });
            ctx.page.drawText(formatPrice(opt.price), { x, y: ctx.y - 14, size: 11, font: fontBold, color: COLOR_SECONDARY });
        }
        ctx.y -= 36;
    }

    // ── Included / Not Included ───────────────────────────────────────────────
    const included: string[] = pkg.included || [];
    const notIncluded: string[] = pkg.not_included || [];

    if (included.length > 0) {
        drawSectionHeader(ctx, 'Sudah Termasuk');
        ctx.y -= 4;
        included.forEach((item, i) => {
            drawText(ctx, `${i + 1}. ${item}`, { fontSize: 9, color: COLOR_DARK, indent: 4 });
        });
        ctx.y -= 8;
    }

    if (notIncluded.length > 0) {
        drawSectionHeader(ctx, 'Tidak Termasuk');
        ctx.y -= 4;
        notIncluded.forEach((item, i) => {
            drawText(ctx, `${i + 1}. ${item}`, { fontSize: 9, color: COLOR_GRAY, indent: 4 });
        });
        ctx.y -= 8;
    }

    // ── Closing ───────────────────────────────────────────────────────────────
    if (ctx.y < MARGIN + 80) {
        ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
        ctx.y = PAGE_H - MARGIN;
    }

    ctx.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 80, color: COLOR_PRIMARY });
    if (siteSettings.whatsapp) {
        ctx.page.drawText(`WhatsApp: ${siteSettings.whatsapp}`, { x: MARGIN, y: 54, size: 10, font: fontBold, color: COLOR_WHITE });
    }
    if (siteSettings.phone) {
        ctx.page.drawText(`Telp: ${siteSettings.phone}`, { x: MARGIN, y: 36, size: 9, font, color: rgb(0.8, 0.9, 1) });
    }
    ctx.page.drawText('Alfatih Dunia Wisata — adwisata.com', { x: MARGIN, y: 18, size: 8, font, color: rgb(0.7, 0.8, 0.9) });

    return doc.save();
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
        const { package: pkg, siteSettings } = await req.json();
        if (!pkg) return new Response(JSON.stringify({ error: 'Missing package' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const pdfBytes = await buildItineraryPdf(pkg, siteSettings ?? {});

        return new Response(pdfBytes, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Itinerary.pdf"`,
            },
        });
    } catch (err) {
        console.error('generate-itinerary-pdf error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
