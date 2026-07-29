import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, PDFImage, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatPrice = (price?: number) =>
    price
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
        : 'Hubungi Kami';

// Strip markdown syntax markers so PDF shows clean text.
// Returns { text, bold } so callers can choose the bold font for whole-line bold.
// List prefixes: "- item" → "• item", "1. item" → "1. item"
function parseMarkdownLine(raw: string): { text: string; bold: boolean } {
    const trimmed = raw.trim();
    // Bullet list: "- item"
    const bullet = trimmed.match(/^- (.*)$/);
    if (bullet) {
        const inner = parseMarkdownLine(bullet[1]);
        return { text: `• ${inner.text}`, bold: inner.bold };
    }
    // Ordered list: "1. item"
    const ordered = trimmed.match(/^(\d+)\. (.*)$/);
    if (ordered) {
        const inner = parseMarkdownLine(ordered[2]);
        return { text: `${ordered[1]}. ${inner.text}`, bold: inner.bold };
    }
    // Whole-line bold: "**text**"
    const wholeBold = trimmed.match(/^\*\*(.+)\*\*$/);
    if (wholeBold) return { text: wholeBold[1], bold: true };
    // Strip inline markers (bold, italic, underline)
    const cleaned = trimmed
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/__(.+?)__/g, '$1');
    return { text: cleaned, bold: false };
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLOR_PRIMARY   = rgb(0 / 255, 132 / 255, 255 / 255);
const COLOR_SECONDARY = rgb(245 / 255, 158 / 255, 11 / 255);
const COLOR_DARK      = rgb(15 / 255, 23 / 255, 42 / 255);
const COLOR_GRAY      = rgb(107 / 255, 114 / 255, 128 / 255);
const COLOR_WHITE     = rgb(1, 1, 1);

// 5-pointed star SVG path, 10×10 bounding box, center (5,5), outer r=5, inner r=2
const STAR_PATH =
    'M 5 0 L 6.18 3.38 L 9.76 3.45 L 6.90 5.62 ' +
    'L 7.94 9.05 L 5 7 L 2.06 9.05 L 3.10 5.62 ' +
    'L 0.24 3.45 L 3.82 3.38 Z';

interface DrawContext {
    page: ReturnType<PDFDocument['addPage']>;
    doc: PDFDocument;
    font: Awaited<ReturnType<PDFDocument['embedFont']>>;
    fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>;
    y: number;
}

function drawStars(page: DrawContext['page'], x: number, y: number, count: number, size: number): void {
    const scale = size / 10;
    for (let i = 0; i < Math.min(count, 7); i++) {
        page.drawSvgPath(STAR_PATH, { x: x + i * (size + 2), y, scale, color: COLOR_SECONDARY });
    }
}

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
    const { fontSize = 10, bold = false, color = COLOR_DARK, indent = 0, lineHeight, maxWidth } = opts;
    const font = bold ? ctx.fontBold : ctx.font;
    const lh = lineHeight ?? fontSize * 1.5;
    const width = maxWidth ?? CONTENT_W - indent;
    const lines = wrapText(text, font, fontSize, width);

    for (const line of lines) {
        if (ctx.y < MARGIN + fontSize + 10) {
            ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
            ctx.y = PAGE_H - MARGIN;
        }
        ctx.page.drawText(line, { x: MARGIN + indent, y: ctx.y - fontSize, size: fontSize, font, color });
        ctx.y -= lh;
    }
}

function drawSectionHeader(ctx: DrawContext, label: string): void {
    if (ctx.y < MARGIN + 30) {
        ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
        ctx.y = PAGE_H - MARGIN;
    }
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 22, width: CONTENT_W, height: 22, color: COLOR_PRIMARY });
    ctx.page.drawText(label.toUpperCase(), {
        x: MARGIN + 8, y: ctx.y - 16, size: 9, font: ctx.fontBold, color: COLOR_WHITE,
    });
    ctx.y -= 30;
}

// Fetch Plus Jakarta Sans TTF from fontsource CDN (jsDelivr).
// fontkit supports TTF/OTF natively; avoids the brittle WOFF1/WOFF2 Google Fonts UA hack.
async function fetchPlusJakartaSans(weight: 400 | 700): Promise<ArrayBuffer | null> {
    const file = weight === 700 ? 'latin-700-normal.ttf' : 'latin-400-normal.ttf';
    const url = `https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/${file}`;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        return res.ok ? res.arrayBuffer() : null;
    } catch {
        return null;
    }
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        return new Uint8Array(buf);
    } catch {
        return null;
    }
}

async function embedImage(doc: PDFDocument, url: string): Promise<PDFImage | null> {
    const bytes = await fetchImageBytes(url);
    if (!bytes) return null;
    try {
        const lower = url.toLowerCase().split('?')[0];
        if (lower.endsWith('.png')) return await doc.embedPng(bytes);
        return await doc.embedJpg(bytes);
    } catch {
        try { return await doc.embedPng(bytes); } catch { return null; }
    }
}

async function buildItineraryPdf(
    pkg: any,
    siteSettings: { whatsapp?: string; phone?: string },
    logoBase64: string | null,
    dayPhotos: { day: number; photoUrls: string[] }[] = [],
    termsConditions = '',
): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit); // required before embedding custom (non-standard) fonts

    // Fonts: Plus Jakarta Sans → WOFF1 from Google Fonts; fall back to Helvetica
    const [regularBytes, boldBytes] = await Promise.all([
        fetchPlusJakartaSans(400),
        fetchPlusJakartaSans(700),
    ]);
    const font     = regularBytes ? await doc.embedFont(regularBytes) : await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = boldBytes    ? await doc.embedFont(boldBytes)    : await doc.embedFont(StandardFonts.HelveticaBold);

    // Logo: base64 PNG sent by the frontend (converted from WEBP via canvas)
    let logoImage: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
    if (logoBase64) {
        try {
            const bytes = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));
            logoImage = await doc.embedPng(bytes);
        } catch { /* fall back to text mark */ }
    }

    const firstPage = doc.addPage([PAGE_W, PAGE_H]);
    const ctx: DrawContext = { page: firstPage, doc, font, fontBold, y: PAGE_H - MARGIN };

    // ── Cover header ──────────────────────────────────────────────────────────
    ctx.page.drawRectangle({ x: 0, y: PAGE_H - 64, width: PAGE_W, height: 64, color: COLOR_PRIMARY });

    const LOGO_H = 44; // height of logo inside header
    let textX = MARGIN + 8;

    if (logoImage) {
        const logoScale = LOGO_H / logoImage.height;
        const logoW = logoImage.width * logoScale;
        // drawImage y is the bottom-left corner; center logo vertically in the 64pt header
        ctx.page.drawImage(logoImage, {
            x: MARGIN + 4,
            y: PAGE_H - 54, // (PAGE_H - 32) - LOGO_H/2 = PAGE_H - 32 - 22 = PAGE_H - 54
            width: logoW,
            height: LOGO_H,
        });
        textX = MARGIN + 4 + logoW + 8;
    } else {
        // Text-only fallback mark
        ctx.page.drawCircle({ x: MARGIN + 20, y: PAGE_H - 32, size: 20, color: COLOR_WHITE });
        ctx.page.drawText('A', { x: MARGIN + 13, y: PAGE_H - 40, size: 16, font: fontBold, color: COLOR_PRIMARY });
        textX = MARGIN + 48;
    }

    ctx.page.drawText('ALFATIH DUNIA WISATA', { x: textX, y: PAGE_H - 30, size: 13, font: fontBold, color: COLOR_WHITE });
    ctx.page.drawText(siteSettings.website_url || 'alfatihduniawisata.id',  { x: textX, y: PAGE_H - 48, size: 9,  font,         color: rgb(0.8, 0.9, 1) });

    ctx.y = PAGE_H - 84;

    // Package title block
    drawText(ctx, 'ITINERARY PROGRAM', { fontSize: 10, color: COLOR_GRAY });
    ctx.y -= 4;
    drawText(ctx, pkg.title || 'Paket Wisata', { fontSize: 20, bold: true, color: COLOR_PRIMARY });
    ctx.y -= 8;

    const infoItems = [
        pkg.departure_date && `Keberangkatan: ${pkg.departure_date}`,
        pkg.duration        && `Durasi: ${pkg.duration}`,
        pkg.airlines?.length && `Maskapai: ${pkg.airlines.map((a: any) => a.name).join(', ')}`,
    ].filter(Boolean) as string[];

    for (const info of infoItems) {
        drawText(ctx, info, { fontSize: 10, color: COLOR_GRAY });
    }
    ctx.y -= 16;

    ctx.page.drawLine({
        start: { x: MARGIN, y: ctx.y }, end: { x: PAGE_W - MARGIN, y: ctx.y },
        thickness: 1, color: rgb(0.9, 0.9, 0.9),
    });
    ctx.y -= 20;

    // ── Day-by-day itinerary ──────────────────────────────────────────────────
    const itinerary: any[] = pkg.itinerary || [];
    const dayPhotoMap = new Map<number, string[]>(
        dayPhotos.map((dp: { day: number; photoUrls: string[] }) => [dp.day, dp.photoUrls])
    );

    if (itinerary.length > 0) {
        drawSectionHeader(ctx, 'Program Perjalanan');
        ctx.y -= 4;

        for (const day of itinerary) {
            const dayLabel = `Hari ${day.day}${day.title ? ` - ${day.title}` : ''}`;
            if (ctx.y < MARGIN + 60) {
                ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
                ctx.y = PAGE_H - MARGIN;
            }
            drawText(ctx, parseMarkdownLine(dayLabel).text, { fontSize: 11, bold: true, color: COLOR_PRIMARY });
            if (day.description) {
                const { text: descText, bold: descBold } = parseMarkdownLine(day.description);
                drawText(ctx, descText, { fontSize: 9, bold: descBold, color: COLOR_GRAY, indent: 8 });
            }
            for (const act of (day.activities || []) as string[]) {
                const { text: actText } = parseMarkdownLine(act);
                drawText(ctx, `• ${actText}`, { fontSize: 9, color: COLOR_DARK, indent: 8 });
            }
            ctx.y -= 8;

            // Embed day photo if provided (max 1 per day)
            const dayUrls = dayPhotoMap.get(day.day) ?? [];
            for (const photoUrl of dayUrls.slice(0, 1)) {
                try {
                    const img = await embedImage(doc, photoUrl);
                    if (img) {
                        const maxW = CONTENT_W;
                        const maxH = 160;
                        const scale = Math.min(maxW / img.width, maxH / img.height);
                        const w = img.width * scale;
                        const h = img.height * scale;
                        if (ctx.y - h - 12 < MARGIN) {
                            ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
                            ctx.y = PAGE_H - MARGIN;
                        }
                        ctx.y -= 8;
                        ctx.page.drawImage(img, {
                            x: MARGIN + (CONTENT_W - w) / 2,
                            y: ctx.y - h,
                            width: w,
                            height: h,
                        });
                        ctx.y -= h + 12;
                    }
                } catch (e) {
                    console.error('Failed to embed day photo:', e);
                }
            }
        }
        ctx.y -= 8;
    }

    // ── Hotels ────────────────────────────────────────────────────────────────
    const hotels: any[] = pkg.hotels || [];
    if (hotels.length > 0) {
        drawSectionHeader(ctx, 'Akomodasi Hotel');
        ctx.y -= 4;

        const makkah = hotels.filter((h: any) => /makkah|mekkah/i.test(h.location || ''));
        const madinah = hotels.filter((h: any) => /madinah|medina/i.test(h.location || ''));
        const others  = hotels.filter((h: any) => !makkah.includes(h) && !madinah.includes(h));

        for (const [label, list] of [
            ['Hotel Mekkah',  makkah],
            ['Hotel Madinah', madinah],
            ['Hotel Lainnya', others],
        ] as const) {
            if ((list as any[]).length === 0) continue;
            drawText(ctx, label, { fontSize: 9, bold: true, color: COLOR_GRAY });
            for (const h of list as any[]) {
                drawText(ctx, h.name || '', { fontSize: 10, color: COLOR_DARK, indent: 8 });
                const starCount = Math.min(Math.max(h.stars || 0, 0), 7);
                if (starCount > 0) {
                    if (ctx.y < MARGIN + 15) {
                        ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
                        ctx.y = PAGE_H - MARGIN;
                    }
                    drawStars(ctx.page, MARGIN + 8, ctx.y, starCount, 8);
                    ctx.y -= 12;
                }
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

        if (ctx.y < MARGIN + 50) {
            ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
            ctx.y = PAGE_H - MARGIN;
        }
        const colW = CONTENT_W / Math.max(roomOptions.length, 1);
        for (let i = 0; i < roomOptions.length; i++) {
            const opt = roomOptions[i];
            const x = MARGIN + i * colW;
            ctx.page.drawText(`Kamar ${opt.name}`, { x, y: ctx.y,      size: 8,  font,         color: COLOR_GRAY      });
            ctx.page.drawText(formatPrice(opt.price), { x, y: ctx.y - 14, size: 11, font: fontBold, color: COLOR_SECONDARY });
        }
        ctx.y -= 36;
    }

    // ── Included / Not Included ───────────────────────────────────────────────
    const included: string[]    = pkg.included     || [];
    const notIncluded: string[] = pkg.not_included || [];

    if (included.length > 0) {
        drawSectionHeader(ctx, 'Sudah Termasuk');
        ctx.y -= 4;
        included.forEach((item, i) => {
            const { text, bold } = parseMarkdownLine(item);
            drawText(ctx, `${i + 1}. ${text}`, { fontSize: 9, bold, color: COLOR_DARK, indent: 4 });
        });
        ctx.y -= 8;
    }

    if (notIncluded.length > 0) {
        drawSectionHeader(ctx, 'Tidak Termasuk');
        ctx.y -= 4;
        notIncluded.forEach((item, i) => {
            const { text, bold } = parseMarkdownLine(item);
            drawText(ctx, `${i + 1}. ${text}`, { fontSize: 9, bold, color: COLOR_GRAY, indent: 4 });
        });
        ctx.y -= 8;
    }

    // ── Syarat & Ketentuan ────────────────────────────────────────────────────
    if (termsConditions && termsConditions.trim()) {
        drawSectionHeader(ctx, 'Syarat & Ketentuan');
        ctx.y -= 4;
        const tncLines = termsConditions.split('\n').filter((l: string) => l.trim());
        for (const line of tncLines) {
            const { text, bold } = parseMarkdownLine(line);
            drawText(ctx, text, { fontSize: 8, color: COLOR_GRAY, bold, indent: 4, maxWidth: CONTENT_W - 8 });
        }
        ctx.y -= 8;
    }

    // ── Closing footer ────────────────────────────────────────────────────────
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
    ctx.page.drawText(`Alfatih Dunia Wisata - ${siteSettings.website_url || 'alfatihduniawisata.id'}`, {
        x: MARGIN, y: 18, size: 8, font, color: rgb(0.7, 0.8, 0.9),
    });

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
        const { package: pkg, siteSettings, logoBase64, dayPhotos = [], termsConditions = '' } = await req.json();
        if (!pkg) return new Response(
            JSON.stringify({ error: 'Missing package' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

        const pdfBytes = await buildItineraryPdf(pkg, siteSettings ?? {}, logoBase64 ?? null, dayPhotos, termsConditions ?? '');

        return new Response(pdfBytes, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="Itinerary.pdf"',
            },
        });
    } catch (err) {
        console.error('generate-itinerary-pdf error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }
});
