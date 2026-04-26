import React, { useState, useEffect } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { generateTemplateThumbnail } from './templateThumbnail';

export interface PosterTemplate {
    id: string;
    name: string;
    description: string;
    previewColors: [string, string, string]; // [header accent, body bg, footer]
    aspectRatio: 'post' | 'story';
    json: object;
}

// ── Design System Tokens ────────────────────────────────────────────────────
const BLUE        = '#0084FF';
const BLUE_DARK   = '#0066CC';
const GOLD        = '#F59E0B';
const DARK        = '#0F172A';
const WHITE       = '#FFFFFF';
const GRAY_50     = '#F8FAFC';
const GRAY_100    = '#F1F5F9';
const GRAY_200    = '#E2E8F0';
const GRAY_400    = '#94A3B8';
const GRAY_500    = '#6B7280';
const GRAY_700    = '#374151';
const BLUE_50     = '#EFF6FF';
const GOLD_50     = '#FFFBEB';
const GREEN       = '#22C55E';

// ── Layout constants ─────────────────────────────────────────────────────────
const PX  = 48;   // horizontal padding
const CW  = 984;  // content width (1080 - PX*2)

const makeTemplate = (
    id: string,
    name: string,
    description: string,
    previewColors: [string, string, string],
    aspectRatio: 'post' | 'story',
    bg: string,
    objects: object[]
): PosterTemplate => {
    const w = 1080;
    const h = aspectRatio === 'post' ? 1350 : 1920;
    const mappedObjects = objects.map(obj => ({
        originX: 'left',
        originY: 'top',
        ...obj,
    }));
    return {
        id, name, description, previewColors, aspectRatio,
        json: { version: '6.0.0', objects: mappedObjects, background: bg, width: w, height: h },
    };
};

// ── IMAGE PLACEHOLDER helper ──────────────────────────────────────────────────
const imgPlaceholder = (x: number, y: number, w: number, h: number, rx = 16) => ([
    { type: 'rect', left: x, top: y, width: w, height: h, fill: GRAY_200, rx, ry: rx },
    {
        type: 'textbox', left: x, top: y + h / 2 - 14, width: w,
        text: 'Autofill Photo Here',
        fontSize: 32, fontFamily: 'Inter', fontWeight: '600', fill: GRAY_400, textAlign: 'center',
    },
]);

// ── INFO-GRID helper (4 cells) ────────────────────────────────────────────────
const infoGrid = (
    y: number,
    cells: { label: string; value: string; valueColor?: string }[],
    h = 110
) => {
    const cellW = 244;
    const offsets = [PX, PX + 245, PX + 490, PX + 735];
    const objects: object[] = [
        { type: 'rect', left: PX, top: y, width: CW, height: h, fill: GRAY_100, rx: 14, ry: 14 },
    ];
    cells.forEach((cell, i) => {
        objects.push(
            { type: 'rect', left: offsets[i] + 1, top: y + 1, width: cellW, height: h - 2, fill: WHITE },
            {
                type: 'textbox', left: offsets[i] + 10, top: y + 10, width: cellW - 16,
                text: cell.label.toUpperCase(),
                fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_400, charSpacing: 100,
            },
            {
                type: 'textbox', left: offsets[i] + 10, top: y + 46, width: cellW - 16,
                text: cell.value,
                fontSize: 26, fontFamily: 'Inter', fontWeight: '700', fill: cell.valueColor || DARK,
            }
        );
    });
    return objects;
};

// ── BENEFIT ROWS helper ────────────────────────────────────────────────────────
const benefitRows = (y: number, items: string[], gap = 48) =>
    items.map((text, i) => ({
        type: 'textbox',
        left: PX, top: y + i * gap, width: CW,
        text: `✓  ${text}`,
        fontSize: 28, fontFamily: 'Inter', fontWeight: '600', fill: GRAY_700,
    }));

// ── TOP BAR (shared, white bg) ─────────────────────────────────────────────────
const topBarWhite = () => [
    { type: 'rect', left: 0, top: 75, width: 1080, height: 1.5, fill: GRAY_100 },
    {
        type: 'textbox', left: PX, top: 20, width: 500,
        text: 'Alfatih Dunia Wisata',
        fontSize: 32, fontFamily: 'Outfit', fontWeight: '800', fill: DARK,
    },
    {
        type: 'textbox', left: 750, top: 24, width: 282,
        text: '✦ Amanah Sejak 2012',
        fontSize: 24, fontFamily: 'Inter', fontWeight: '800', fill: BLUE, textAlign: 'right', charSpacing: 60,
    },
];

// ── FOOTER BAR (shared, dark) ──────────────────────────────────────────────────
const footerDark = (y: number) => [
    { type: 'rect', left: 0, top: y, width: 1080, height: 56, fill: DARK },
    {
        type: 'textbox', left: PX, top: y + 14, width: 550,
        text: '@alfatih.umroh  ·  adwisata.com',
        fontSize: 24, fontFamily: 'Inter', fontWeight: '600', fill: 'rgba(255,255,255,0.6)',
    },
    {
        type: 'textbox', left: 650, top: y + 14, width: 382,
        text: 'Izin Resmi PPIU · 1603230089040001',
        fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: 'rgba(255,255,255,0.35)', textAlign: 'right',
    },
];

// ── CTA STRIP (shared, blue) ───────────────────────────────────────────────────
const ctaStrip = (y: number) => [
    { type: 'rect', left: 0, top: y, width: 1080, height: 80, fill: BLUE },
    {
        type: 'textbox', left: PX, top: y + 22, width: 550,
        text: 'Hubungi kami sekarang — terbatas!',
        fontSize: 28, fontFamily: 'Inter', fontWeight: '600', fill: 'rgba(255,255,255,0.9)',
    },
    { type: 'rect', left: 680, top: y + 12, width: 352, height: 56, fill: WHITE, rx: 12, ry: 12 },
    {
        type: 'textbox', left: 680, top: y + 26, width: 352,
        text: '0857-1190-3031',
        fontSize: 30, fontFamily: 'Inter', fontWeight: '900', fill: BLUE, textAlign: 'center',
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// POST TEMPLATES (1080 × 1350)
// ═══════════════════════════════════════════════════════════════════════════════

const postConversion = makeTemplate(
    'post-conversion', 'Conversion', 'Promo paket lengkap dengan harga & benefit',
    [BLUE, WHITE, DARK], 'post', WHITE,
    [
        // TOP BAR
        ...topBarWhite(),

        // CATEGORY + HEADLINE
        {
            type: 'textbox', left: PX, top: 110, width: 700,
            text: '—— PAKET UMROH PREMIUM',
            fontSize: 24, fontFamily: 'Inter', fontWeight: '800', fill: GOLD, charSpacing: 140,
        },
        {
            type: 'textbox', left: PX, top: 140, width: CW,
            text: 'Umroh Syawal\n2026',
            fontSize: 68, fontFamily: 'Outfit', fontWeight: '900', fill: DARK, lineHeight: 0.95,
        },

        // HERO IMAGE
        ...imgPlaceholder(PX, 340, CW, 265),

        // INFO GRID
        ...infoGrid(635, [
            { label: 'Keberangkatan', value: '15 Mei 2026' },
            { label: 'Durasi', value: '9 Hari' },
            { label: 'Maskapai', value: 'Saudia / Garuda' },
            { label: 'Hotel Makkah', value: '★★★★★ Bintang 5', valueColor: GOLD },
        ]),

        // PRICE — left side
        {
            type: 'textbox', left: PX, top: 754, width: 300,
            text: 'Mulai Dari',
            fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_500, charSpacing: 80,
        },
        {
            type: 'textbox', left: PX, top: 786, width: 500,
            text: '32,5 JT',
            fontSize: 60, fontFamily: 'Outfit', fontWeight: '900', fill: BLUE, lineHeight: 1,
        },
        {
            type: 'textbox', left: PX, top: 862, width: 250,
            text: '/pax (Quad)',
            fontSize: 26, fontFamily: 'Inter', fontWeight: '600', fill: GRAY_400,
        },

        // TIER CHIPS — right side
        { type: 'rect', left: 744, top: 766, width: 288, height: 50, fill: GRAY_50, rx: 8, ry: 8, stroke: GRAY_200, strokeWidth: 1 },
        {
            type: 'textbox', left: 756, top: 775, width: 110,
            text: 'TRIPLE', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_500, charSpacing: 60,
        },
        {
            type: 'textbox', left: 870, top: 775, width: 150,
            text: 'Rp 34 JT', fontSize: 26, fontFamily: 'Inter', fontWeight: '800', fill: DARK, textAlign: 'right',
        },
        { type: 'rect', left: 744, top: 824, width: 288, height: 50, fill: GRAY_50, rx: 8, ry: 8, stroke: GRAY_200, strokeWidth: 1 },
        {
            type: 'textbox', left: 756, top: 833, width: 110,
            text: 'DOUBLE', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_500, charSpacing: 60,
        },
        {
            type: 'textbox', left: 870, top: 833, width: 150,
            text: 'Rp 36,5 JT', fontSize: 26, fontFamily: 'Inter', fontWeight: '800', fill: DARK, textAlign: 'right',
        },

        // BENEFITS
        ...benefitRows(896, [
            'Visa Umroh & Asuransi Saudi termasuk',
            'Muthawwif berpengalaman berbahasa Indonesia',
            'Tiket Pesawat PP + Air Zamzam 5 liter',
            'Makan 3x sehari menu Indonesia',
        ]),

        // TRUST STRIP
        { type: 'rect', left: PX, top: 1090, width: CW, height: 1.5, fill: GRAY_100 },
        { type: 'rect', left: PX, top: 1105, width: 128, height: 44, fill: GRAY_100, rx: 8, ry: 8 },
        { type: 'textbox', left: 62, top: 1115, width: 100, text: '✈ Saudia', fontSize: 26, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_700 },
        { type: 'rect', left: 190, top: 1105, width: 128, height: 44, fill: GRAY_100, rx: 8, ry: 8 },
        { type: 'textbox', left: 202, top: 1115, width: 104, text: '✈ Garuda', fontSize: 26, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_700 },
        { type: 'textbox', left: 580, top: 1103, width: 100, text: '1000+', fontSize: 26, fontFamily: 'Outfit', fontWeight: '900', fill: BLUE, textAlign: 'center' },
        { type: 'textbox', left: 580, top: 1140, width: 100, text: 'JAMAAH', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_400, charSpacing: 80, textAlign: 'center' },
        { type: 'textbox', left: 720, top: 1103, width: 110, text: '12 Thn', fontSize: 26, fontFamily: 'Outfit', fontWeight: '900', fill: BLUE, textAlign: 'center' },
        { type: 'textbox', left: 720, top: 1140, width: 110, text: 'PENGALAMAN', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_400, charSpacing: 80, textAlign: 'center' },
        { type: 'textbox', left: 876, top: 1103, width: 108, text: '★ 5.0', fontSize: 26, fontFamily: 'Outfit', fontWeight: '900', fill: GOLD, textAlign: 'center' },
        { type: 'textbox', left: 876, top: 1140, width: 108, text: 'RATING', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_400, charSpacing: 80, textAlign: 'center' },

        // CTA + FOOTER
        ...ctaStrip(1214),
        ...footerDark(1294),
    ]
);

const postAspiration = makeTemplate(
    'post-aspiration', 'Aspiration', 'Foto + tagline inspirasional & brand pillars',
    [GOLD, WHITE, DARK], 'post', WHITE,
    [
        // WORDMARK
        {
            type: 'textbox', left: PX, top: 52, width: 500,
            text: 'Alfatih Dunia Wisata',
            fontSize: 30, fontFamily: 'Outfit', fontWeight: '800', fill: BLUE,
        },

        // PHOTO FRAME
        ...imgPlaceholder(PX, 108, CW, 600, 24),

        // AMBER ACCENT LINE
        { type: 'rect', left: PX, top: 734, width: 64, height: 3, fill: GOLD, rx: 2, ry: 2 },

        // TAGLINE
        {
            type: 'textbox', left: PX, top: 754, width: CW,
            text: '"Pengalaman Ibadah\nBerkelas Dunia"',
            fontSize: 52, fontFamily: 'Outfit', fontWeight: '700', fill: DARK,
            lineHeight: 1.1, fontStyle: 'italic', textAlign: 'center',
        },

        // SUB TAGLINE
        {
            type: 'textbox', left: PX, top: 894, width: CW,
            text: 'Umroh Premium bersama Alfatih Dunia Wisata',
            fontSize: 30, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_500, textAlign: 'center',
        },

        // PILLAR PILLS
        { type: 'rect', left: PX, top: 948, width: 220, height: 56, fill: BLUE_50, rx: 99, ry: 99, stroke: '#BFDBFE', strokeWidth: 1.5 },
        { type: 'textbox', left: PX, top: 961, width: 220, text: '🕌 Islami', fontSize: 28, fontFamily: 'Inter', fontWeight: '700', fill: BLUE, textAlign: 'center' },
        { type: 'rect', left: 320, top: 948, width: 220, height: 56, fill: BLUE_50, rx: 99, ry: 99, stroke: '#BFDBFE', strokeWidth: 1.5 },
        { type: 'textbox', left: 320, top: 961, width: 220, text: '🤝 Amanah', fontSize: 28, fontFamily: 'Inter', fontWeight: '700', fill: BLUE, textAlign: 'center' },
        { type: 'rect', left: 560, top: 948, width: 220, height: 56, fill: GOLD_50, rx: 99, ry: 99, stroke: '#FDE68A', strokeWidth: 1.5 },
        { type: 'textbox', left: 560, top: 961, width: 220, text: '⭐ Premium', fontSize: 28, fontFamily: 'Inter', fontWeight: '700', fill: '#D97706', textAlign: 'center' },
        { type: 'rect', left: 800, top: 948, width: 232, height: 56, fill: '#ECFDF5', rx: 99, ry: 99, stroke: '#A7F3D0', strokeWidth: 1.5 },
        { type: 'textbox', left: 800, top: 961, width: 232, text: '✓ Halal Friendly', fontSize: 28, fontFamily: 'Inter', fontWeight: '700', fill: '#059669', textAlign: 'center' },

        // STATS STRIP
        { type: 'rect', left: PX, top: 1022, width: CW, height: 96, fill: GRAY_50, rx: 16, ry: 16, stroke: GRAY_100, strokeWidth: 1.5 },
        { type: 'rect', left: PX + CW / 3, top: 1032, width: 1.5, height: 74, fill: GRAY_100 },
        { type: 'rect', left: PX + CW * 2 / 3, top: 1032, width: 1.5, height: 74, fill: GRAY_100 },
        { type: 'textbox', left: PX, top: 1030, width: CW / 3, text: '1000+', fontSize: 28, fontFamily: 'Outfit', fontWeight: '900', fill: BLUE, textAlign: 'center' },
        { type: 'textbox', left: PX, top: 1068, width: CW / 3, text: 'JAMAAH PUAS', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_400, charSpacing: 80, textAlign: 'center' },
        { type: 'textbox', left: PX + CW / 3, top: 1030, width: CW / 3, text: '12 Thn', fontSize: 28, fontFamily: 'Outfit', fontWeight: '900', fill: BLUE, textAlign: 'center' },
        { type: 'textbox', left: PX + CW / 3, top: 1068, width: CW / 3, text: 'PENGALAMAN', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_400, charSpacing: 80, textAlign: 'center' },
        { type: 'textbox', left: PX + CW * 2 / 3, top: 1030, width: CW / 3, text: '★ 5.0', fontSize: 28, fontFamily: 'Outfit', fontWeight: '900', fill: GOLD, textAlign: 'center' },
        { type: 'textbox', left: PX + CW * 2 / 3, top: 1068, width: CW / 3, text: 'RATING', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_400, charSpacing: 80, textAlign: 'center' },

        // BOTTOM LOCKUP
        { type: 'rect', left: PX, top: 1132, width: CW, height: 1.5, fill: GRAY_100 },
        { type: 'textbox', left: PX, top: 1148, width: 500, text: 'Alfatih Dunia Wisata', fontSize: 28, fontFamily: 'Outfit', fontWeight: '800', fill: DARK },
        { type: 'textbox', left: PX, top: 1184, width: 500, text: '@alfatih.umroh  ·  adwisata.com', fontSize: 24, fontFamily: 'Inter', fontWeight: '600', fill: GRAY_400 },
        { type: 'rect', left: 800, top: 1146, width: 232, height: 42, fill: BLUE_50, rx: 99, ry: 99, stroke: '#BFDBFE', strokeWidth: 1 },
        { type: 'textbox', left: 800, top: 1157, width: 232, text: 'AMANAH SEJAK 2012', fontSize: 24, fontFamily: 'Inter', fontWeight: '800', fill: BLUE, textAlign: 'center', charSpacing: 60 },

        ...footerDark(1286),
    ]
);

const postEduReminder = makeTemplate(
    'post-edu-reminder', 'Edu Reminder', 'Checklist/tips dengan blue header brand',
    [BLUE, WHITE, DARK], 'post', WHITE,
    [
        // BLUE TOP BAR
        { type: 'rect', left: 0, top: 0, width: 1080, height: 80, fill: BLUE },
        { type: 'textbox', left: PX, top: 22, width: 500, text: '● TIPS UMROH', fontSize: 24, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, charSpacing: 160 },
        { type: 'textbox', left: 680, top: 25, width: 352, text: 'Alfatih Dunia Wisata', fontSize: 26, fontFamily: 'Outfit', fontWeight: '800', fill: WHITE, textAlign: 'right' },

        // HEADLINE
        {
            type: 'textbox', left: PX, top: 116, width: 820,
            text: '5 Hal Wajib Dibawa\nSaat Umroh',
            fontSize: 60, fontFamily: 'Outfit', fontWeight: '800', fill: DARK, lineHeight: 1.0,
        },
        {
            type: 'textbox', left: PX, top: 258, width: CW,
            text: 'Persiapkan perjalanan spiritual Anda dengan checklist ini.',
            fontSize: 28, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_500,
        },

        // DIVIDER
        { type: 'rect', left: PX, top: 300, width: CW, height: 1.5, fill: GRAY_100 },

        // LIST ITEMS (5 items, gap = 190px)
        ...[
            { num: '1', icon: '🩱', title: 'Ihram & Perlengkapan Ibadah',    desc: 'Baju ihram pria, mukena wanita, sajadah travel, tasbih' },
            { num: '2', icon: '💊', title: 'Obat-obatan Pribadi',             desc: 'Vitamin, obat maag, antinyeri — kondisi prima = ibadah khusyuk', badge: 'Penting' },
            { num: '3', icon: '📄', title: 'Dokumen Perjalanan Lengkap',      desc: 'Paspor (min. 6 bln), visa umroh, vaksin meningitis' },
            { num: '4', icon: '💰', title: 'Uang Cash (Riyal & USD)',         desc: 'SAR untuk keperluan harian, USD sebagai cadangan' },
            { num: '5', icon: '🧴', title: 'Kantong Zamzam & Koper Kabin',    desc: 'Untuk membawa Air Zamzam sesuai ketentuan penerbangan' },
        ].flatMap(({ num, icon, title, desc, badge }, i) => {
            const y = 316 + i * 188;
            const objs: object[] = [
                { type: 'rect', left: PX, top: y, width: 52, height: 52, fill: BLUE_50, rx: 12, ry: 12, stroke: '#BFDBFE', strokeWidth: 1.5 },
                { type: 'textbox', left: PX, top: y + 8, width: 52, text: num, fontSize: 32, fontFamily: 'Outfit', fontWeight: '900', fill: BLUE, textAlign: 'center' },
                { type: 'textbox', left: 114, top: y + 4, width: 36, text: icon, fontSize: 26 },
                { type: 'textbox', left: 162, top: y, width: badge ? 672 : CW - 114, text: title, fontSize: 32, fontFamily: 'Inter', fontWeight: '700', fill: DARK },
                { type: 'textbox', left: 162, top: y + 44, width: badge ? 672 : CW - 114, text: desc, fontSize: 28, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_500, lineHeight: 1.4 },
                { type: 'rect', left: PX, top: y + 176, width: CW, height: 1.5, fill: GRAY_100 },
            ];
            if (badge) {
                objs.push(
                    { type: 'rect', left: 850, top: y + 5, width: 182, height: 40, fill: GOLD_50, rx: 99, ry: 99, stroke: '#FDE68A', strokeWidth: 1 },
                    { type: 'textbox', left: 850, top: y + 13, width: 182, text: badge.toUpperCase(), fontSize: 24, fontFamily: 'Inter', fontWeight: '800', fill: GOLD, textAlign: 'center', charSpacing: 80 }
                );
            }
            return objs;
        }),

        ...footerDark(1294),
    ]
);

const postSocialProof = makeTemplate(
    'post-social-proof', 'Social Proof', 'Foto jamaah + kutipan testimoni',
    [GOLD, WHITE, DARK], 'post', WHITE,
    [
        // TOP ROW
        { type: 'textbox', left: PX, top: 34, width: 500, text: 'Alfatih Dunia Wisata', fontSize: 28, fontFamily: 'Outfit', fontWeight: '800', fill: DARK },
        { type: 'rect', left: 726, top: 28, width: 306, height: 42, fill: GOLD_50, rx: 99, ry: 99, stroke: '#FDE68A', strokeWidth: 1.5 },
        { type: 'textbox', left: 726, top: 39, width: 306, text: 'TESTIMONI JAMAAH', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GOLD, textAlign: 'center', charSpacing: 80 },

        // PHOTO
        ...imgPlaceholder(PX, 94, CW, 440, 20),

        // QUOTE MARK
        { type: 'textbox', left: PX, top: 572, width: 100, text: '"', fontSize: 90, fontFamily: 'Outfit', fontWeight: '900', fill: GOLD, lineHeight: 0.7 },

        // QUOTE TEXT
        {
            type: 'textbox', left: PX, top: 622, width: CW,
            text: 'Alfatih Dunia Wisata memberikan pelayanan terbaik. Mutawwif sangat sabar, hotel dekat Haram.',
            fontSize: 36, fontFamily: 'Outfit', fontWeight: '600', fill: DARK,
            lineHeight: 1.3, fontStyle: 'italic',
        },

        // ATTRIBUTION
        { type: 'rect', left: PX, top: 888, width: 60, height: 60, fill: BLUE, rx: 30, ry: 30 },
        { type: 'textbox', left: PX, top: 905, width: 60, text: 'H', fontSize: 26, fontFamily: 'Outfit', fontWeight: '900', fill: WHITE, textAlign: 'center' },
        { type: 'textbox', left: 128, top: 892, width: 500, text: 'Haji Ahmad Fauzi', fontSize: 30, fontFamily: 'Inter', fontWeight: '700', fill: DARK },
        { type: 'textbox', left: 128, top: 932, width: 500, text: 'Jamaah Umroh Syawal · Maret 2026', fontSize: 26, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_500 },
        { type: 'textbox', left: 800, top: 890, width: 232, text: '★★★★★', fontSize: 32, fontFamily: 'Inter', fill: GOLD, textAlign: 'right' },

        // STATS ROW
        { type: 'rect', left: PX, top: 974, width: CW, height: 100, fill: WHITE, rx: 16, ry: 16, stroke: GRAY_100, strokeWidth: 1.5 },
        ...[
            { val: '1000+', label: 'Jamaah Puas',  color: BLUE },
            { val: '12 Thn', label: 'Pengalaman',   color: BLUE },
            { val: '★ 5.0', label: 'Rating',        color: GOLD },
            { val: 'PPIU',  label: 'Izin Resmi',    color: GOLD },
        ].map(({ val, label, color }, i) => {
            const x = PX + i * 246;
            return [
                { type: 'textbox', left: x, top: 984, width: 240, text: val, fontSize: 26, fontFamily: 'Outfit', fontWeight: '900', fill: color, textAlign: 'center' },
                { type: 'textbox', left: x, top: 1022, width: 240, text: label.toUpperCase(), fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_400, charSpacing: 80, textAlign: 'center' },
            ];
        }).flat(),

        // BOTTOM STRIP
        { type: 'rect', left: PX, top: 1090, width: CW, height: 1.5, fill: GRAY_100 },
        { type: 'textbox', left: PX, top: 1106, width: 500, text: '@alfatih.umroh  ·  adwisata.com', fontSize: 24, fontFamily: 'Inter', fontWeight: '600', fill: GRAY_400 },
        { type: 'rect', left: 730, top: 1102, width: 302, height: 42, fill: BLUE_50, rx: 10, ry: 10, stroke: '#BFDBFE', strokeWidth: 1.5 },
        { type: 'textbox', left: 730, top: 1113, width: 302, text: 'Daftar Sekarang →', fontSize: 26, fontFamily: 'Inter', fontWeight: '800', fill: BLUE, textAlign: 'center' },

        ...footerDark(1294),
    ]
);

// ═══════════════════════════════════════════════════════════════════════════════
// STORY TEMPLATES (1080 × 1920)
// ═══════════════════════════════════════════════════════════════════════════════

const storyConversion = makeTemplate(
    'story-conversion', 'Conversion', 'Promo vertikal dengan hero image & price block',
    [BLUE, WHITE, DARK], 'story', WHITE,
    [
        // BLUE TOP BAR
        { type: 'rect', left: 0, top: 0, width: 1080, height: 110, fill: BLUE },
        { type: 'textbox', left: 56, top: 26, width: 500, text: 'Alfatih Dunia Wisata', fontSize: 32, fontFamily: 'Outfit', fontWeight: '800', fill: WHITE },
        { type: 'textbox', left: 56, top: 68, width: 500, text: 'Mitra Umroh & Wisata Halal Anda', fontSize: 24, fontFamily: 'Inter', fontWeight: '600', fill: 'rgba(255,255,255,0.7)' },
        { type: 'rect', left: 770, top: 30, width: 254, height: 44, fill: 'rgba(255,255,255,0.15)', rx: 99, ry: 99, stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1.5 },
        { type: 'textbox', left: 770, top: 37, width: 254, text: '✦ 2012', fontSize: 24, fontFamily: 'Inter', fontWeight: '800', fill: WHITE, textAlign: 'center', charSpacing: 100 },

        // HERO IMAGE
        ...imgPlaceholder(0, 110, 1080, 520, 0),
        // Overlay gradient simulation (amber badge)
        { type: 'rect', left: 56, top: 574, width: 280, height: 42, fill: GOLD, rx: 99, ry: 99 },
        { type: 'textbox', left: 56, top: 585, width: 280, text: 'PAKET UMROH PREMIUM', fontSize: 24, fontFamily: 'Inter', fontWeight: '800', fill: WHITE, textAlign: 'center', charSpacing: 60 },

        // CATEGORY LABEL
        {
            type: 'textbox', left: 56, top: 648, width: 700,
            text: '—— KEBERANGKATAN MEI 2026',
            fontSize: 24, fontFamily: 'Inter', fontWeight: '800', fill: GOLD, charSpacing: 140,
        },
        {
            type: 'textbox', left: 56, top: 678, width: CW + 8,
            text: 'Umroh\nSyawal\n2026',
            fontSize: 80, fontFamily: 'Outfit', fontWeight: '900', fill: DARK, lineHeight: 0.93,
        },

        // INFO GRID (2×2)
        ...infoGrid(948, [
            { label: 'Tanggal', value: '15 Mei 2026' },
            { label: 'Durasi', value: '9 Hari' },
            { label: 'Maskapai', value: 'Saudia / Garuda' },
            { label: 'Hotel Makkah', value: '★★★★★', valueColor: GOLD },
        ], 86),

        // PRICE BLOCK
        { type: 'rect', left: 56, top: 1068, width: CW + 8, height: 160, fill: BLUE_50, rx: 20, ry: 20, stroke: '#BFDBFE', strokeWidth: 2 },
        { type: 'textbox', left: 88, top: 1088, width: 300, text: 'Mulai Dari', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_500, charSpacing: 80 },
        { type: 'textbox', left: 88, top: 1108, width: 500, text: '32,5 JT', fontSize: 72, fontFamily: 'Outfit', fontWeight: '900', fill: BLUE, lineHeight: 1 },
        { type: 'textbox', left: 88, top: 1188, width: 200, text: '/pax (Quad)', fontSize: 28, fontFamily: 'Inter', fontWeight: '600', fill: GRAY_400 },
        { type: 'rect', left: 730, top: 1084, width: 282, height: 50, fill: WHITE, rx: 10, ry: 10, stroke: '#BFDBFE', strokeWidth: 1.5 },
        { type: 'textbox', left: 740, top: 1091, width: 120, text: 'TRIPLE', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_500, charSpacing: 60 },
        { type: 'textbox', left: 870, top: 1091, width: 132, text: '34 JT', fontSize: 30, fontFamily: 'Inter', fontWeight: '800', fill: BLUE, textAlign: 'right' },
        { type: 'rect', left: 730, top: 1142, width: 282, height: 50, fill: WHITE, rx: 10, ry: 10, stroke: '#BFDBFE', strokeWidth: 1.5 },
        { type: 'textbox', left: 740, top: 1149, width: 120, text: 'DOUBLE', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_500, charSpacing: 60 },
        { type: 'textbox', left: 870, top: 1149, width: 132, text: '36,5 JT', fontSize: 30, fontFamily: 'Inter', fontWeight: '800', fill: BLUE, textAlign: 'right' },

        // BENEFITS
        ...benefitRows(1262, [
            'Visa Umroh & Asuransi Saudi',
            'Muthawwif berbahasa Indonesia',
            'Tiket PP + Air Zamzam 5 liter',
            'Makan 3x sehari menu Indonesia',
        ], 56),

        // CTA BLOCK
        { type: 'rect', left: 56, top: 1510, width: CW + 8, height: 110, fill: BLUE, rx: 20, ry: 20 },
        { type: 'textbox', left: 88, top: 1526, width: 550, text: 'Hubungi kami sekarang', fontSize: 26, fontFamily: 'Inter', fontWeight: '600', fill: 'rgba(255,255,255,0.75)' },
        { type: 'textbox', left: 88, top: 1550, width: 500, text: '0857-1190-3031', fontSize: 32, fontFamily: 'Outfit', fontWeight: '900', fill: WHITE },
        { type: 'rect', left: 730, top: 1520, width: 282, height: 80, fill: WHITE, rx: 14, ry: 14 },
        { type: 'textbox', left: 730, top: 1544, width: 282, text: 'WhatsApp', fontSize: 30, fontFamily: 'Inter', fontWeight: '900', fill: BLUE, textAlign: 'center' },

        ...footerDark(1856),
    ]
);

const storyAspiration = makeTemplate(
    'story-aspiration', 'Aspiration', 'Foto tinggi + tagline + brand pillars + CTA',
    [GOLD, WHITE, DARK], 'story', WHITE,
    [
        // WORDMARK
        { type: 'textbox', left: 72, top: 54, width: 500, text: 'Alfatih Dunia Wisata', fontSize: 32, fontFamily: 'Outfit', fontWeight: '800', fill: BLUE },
        { type: 'rect', left: 560, top: 62, width: 5, height: 5, fill: GOLD, rx: 99, ry: 99 },

        // TALL PHOTO
        ...imgPlaceholder(72, 122, CW + 8, 760, 28),

        // ACCENT LINE
        { type: 'rect', left: 72, top: 914, width: 80, height: 4, fill: GOLD, rx: 2, ry: 2 },

        // TAGLINE
        {
            type: 'textbox', left: 72, top: 940, width: CW + 8,
            text: '"Sambut Panggilan\nIllahi dengan\nPenuh Kekhusyuan"',
            fontSize: 58, fontFamily: 'Outfit', fontWeight: '700', fill: DARK,
            lineHeight: 1.1, fontStyle: 'italic', textAlign: 'center',
        },

        // SUB TAGLINE
        {
            type: 'textbox', left: 72, top: 1128, width: CW + 8,
            text: 'Umroh & Wisata Halal bersama Alfatih Dunia Wisata\n— Amanah Sejak 2012',
            fontSize: 30, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_500, textAlign: 'center', lineHeight: 1.4,
        },

        // PILLARS (2×2 grid)
        ...([
            { icon: '🕌', name: 'Islami',       desc: 'Sesuai nilai-nilai Islam',  x: 72,  y: 1232 },
            { icon: '🤝', name: 'Amanah',       desc: 'Terpercaya sejak 2012',     x: 564, y: 1232 },
            { icon: '⭐', name: 'Premium',      desc: 'Hotel bintang 5 pilihan',   x: 72,  y: 1382 },
            { icon: '🛡️', name: 'Profesional', desc: 'Mutawwif berpengalaman',    x: 564, y: 1382 },
        ].flatMap(({ icon, name, desc, x, y }) => [
            { type: 'rect', left: x, top: y, width: 472, height: 130, fill: GRAY_50, rx: 18, ry: 18, stroke: GRAY_100, strokeWidth: 1.5 },
            { type: 'textbox', left: x, top: y + 14, width: 472, text: icon, fontSize: 30, textAlign: 'center' },
            { type: 'textbox', left: x, top: y + 52, width: 472, text: name, fontSize: 30, fontFamily: 'Outfit', fontWeight: '700', fill: DARK, textAlign: 'center' },
            { type: 'textbox', left: x, top: y + 94, width: 472, text: desc, fontSize: 26, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_500, textAlign: 'center' },
        ])),

        // CTA BLOCK
        { type: 'rect', left: 72, top: 1538, width: CW + 8, height: 110, fill: BLUE, rx: 20, ry: 20 },
        { type: 'textbox', left: 104, top: 1556, width: 550, text: 'Mulai perjalanan spiritual Anda hari ini', fontSize: 30, fontFamily: 'Outfit', fontWeight: '700', fill: WHITE, lineHeight: 1.3 },
        { type: 'rect', left: 748, top: 1562, width: 282, height: 56, fill: WHITE, rx: 12, ry: 12 },
        { type: 'textbox', left: 748, top: 1578, width: 282, text: 'Hubungi Kami →', fontSize: 28, fontFamily: 'Inter', fontWeight: '900', fill: BLUE, textAlign: 'center' },

        // BOTTOM LOCKUP
        { type: 'rect', left: 72, top: 1684, width: CW + 8, height: 1.5, fill: GRAY_100 },
        { type: 'textbox', left: 72, top: 1700, width: 500, text: 'Alfatih Dunia Wisata', fontSize: 30, fontFamily: 'Outfit', fontWeight: '800', fill: DARK },
        { type: 'textbox', left: 72, top: 1726, width: 500, text: '@alfatih.umroh  ·  adwisata.com', fontSize: 26, fontFamily: 'Inter', fontWeight: '600', fill: GRAY_400 },
        { type: 'rect', left: 730, top: 1698, width: 298, height: 34, fill: GOLD_50, rx: 99, ry: 99, stroke: '#FDE68A', strokeWidth: 1 },
        { type: 'textbox', left: 730, top: 1708, width: 298, text: 'HALAL FRIENDLY', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GOLD, textAlign: 'center', charSpacing: 80 },

        ...footerDark(1864),
    ]
);

const storyEduReminder = makeTemplate(
    'story-edu-reminder', 'Edu Reminder', 'Checklist panjang format story',
    [BLUE, WHITE, DARK], 'story', WHITE,
    [
        // BLUE TOP BAR
        { type: 'rect', left: 0, top: 0, width: 1080, height: 114, fill: BLUE },
        { type: 'textbox', left: 56, top: 28, width: 500, text: '● TIPS UMROH', fontSize: 26, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, charSpacing: 160 },
        { type: 'textbox', left: 680, top: 32, width: 344, text: 'Alfatih Dunia Wisata', fontSize: 30, fontFamily: 'Outfit', fontWeight: '800', fill: WHITE, textAlign: 'right' },
        { type: 'textbox', left: 56, top: 64, width: 450, text: '@alfatih.umroh', fontSize: 24, fontFamily: 'Inter', fontWeight: '600', fill: 'rgba(255,255,255,0.65)' },

        // HEADLINE AREA
        {
            type: 'textbox', left: 56, top: 158, width: 820,
            text: '5 Hal Wajib Dibawa\nSaat Umroh',
            fontSize: 68, fontFamily: 'Outfit', fontWeight: '800', fill: DARK, lineHeight: 1.0,
        },
        {
            type: 'textbox', left: 56, top: 316, width: CW + 8,
            text: 'Persiapkan perjalanan spiritual Anda dengan checklist ini.',
            fontSize: 30, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_500,
        },
        { type: 'rect', left: 56, top: 372, width: CW + 8, height: 2, fill: GRAY_100 },

        // LIST ITEMS (5 items, gap = 290px each)
        ...[
            { num: '1', icon: '🩱', title: 'Ihram & Perlengkapan Ibadah',   desc: 'Baju ihram pria, mukena wanita, sajadah travel, tasbih' },
            { num: '2', icon: '💊', title: 'Obat-obatan Pribadi',            desc: 'Vitamin, obat maag, antinyeri — kondisi prima = ibadah khusyuk', badge: 'Penting' },
            { num: '3', icon: '📄', title: 'Dokumen Perjalanan Lengkap',     desc: 'Paspor (min. 6 bln), visa umroh, vaksin meningitis' },
            { num: '4', icon: '💰', title: 'Uang Cash (Riyal & USD)',        desc: 'SAR untuk keperluan harian, USD sebagai cadangan' },
            { num: '5', icon: '🧴', title: 'Kantong Zamzam & Koper Kabin',   desc: 'Untuk membawa Air Zamzam sesuai ketentuan penerbangan' },
        ].flatMap(({ num, icon, title, desc, badge }, i) => {
            const y = 386 + i * 278;
            const objs: object[] = [
                { type: 'rect', left: 56, top: y + 14, width: 56, height: 56, fill: BLUE_50, rx: 16, ry: 16, stroke: '#BFDBFE', strokeWidth: 2 },
                { type: 'textbox', left: 56, top: y + 25, width: 56, text: num, fontSize: 28, fontFamily: 'Outfit', fontWeight: '900', fill: BLUE, textAlign: 'center' },
                { type: 'textbox', left: 130, top: y + 20, width: 44, text: icon, fontSize: 34 },
                { type: 'textbox', left: 188, top: y + 14, width: badge ? 680 : CW - 132, text: title, fontSize: 26, fontFamily: 'Inter', fontWeight: '700', fill: DARK, lineHeight: 1.2 },
                { type: 'textbox', left: 188, top: y + 54, width: CW - 132, text: desc, fontSize: 30, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_500, lineHeight: 1.5 },
                { type: 'rect', left: 56, top: y + 262, width: CW + 8, height: 1.5, fill: GRAY_100 },
            ];
            if (badge) {
                objs.push(
                    { type: 'rect', left: 870, top: y + 18, width: 182, height: 44, fill: GOLD_50, rx: 99, ry: 99, stroke: '#FDE68A', strokeWidth: 1 },
                    { type: 'textbox', left: 870, top: y + 24, width: 182, text: badge.toUpperCase(), fontSize: 24, fontFamily: 'Inter', fontWeight: '800', fill: GOLD, textAlign: 'center', charSpacing: 80 }
                );
            }
            return objs;
        }),

        // SHARE PROMPT
        { type: 'rect', left: 56, top: 1782, width: CW + 8, height: 68, fill: GRAY_50, rx: 20, ry: 20, stroke: GRAY_100, strokeWidth: 1.5 },
        { type: 'textbox', left: 88, top: 1800, width: 600, text: 'Bagikan ke teman yang berencana umrah! 🤲', fontSize: 30, fontFamily: 'Inter', fontWeight: '600', fill: BLUE },

        ...footerDark(1864),
    ]
);

const storySocialProof = makeTemplate(
    'story-social-proof', 'Social Proof', 'Foto tinggi + testimoni besar + pilgrim card',
    [GOLD, WHITE, DARK], 'story', WHITE,
    [
        // TOP ROW
        { type: 'textbox', left: 60, top: 44, width: 500, text: 'Alfatih Dunia Wisata', fontSize: 30, fontFamily: 'Outfit', fontWeight: '800', fill: DARK },
        { type: 'rect', left: 726, top: 38, width: 294, height: 44, fill: GOLD_50, rx: 99, ry: 99, stroke: '#FDE68A', strokeWidth: 1.5 },
        { type: 'textbox', left: 726, top: 50, width: 294, text: 'TESTIMONI JAMAAH', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GOLD, textAlign: 'center', charSpacing: 80 },

        // TALL PHOTO
        ...imgPlaceholder(60, 104, CW + 8, 660, 24),
        // Stars overlay
        { type: 'rect', left: 80, top: 710, width: 320, height: 80, fill: 'rgba(255,255,255,0.95)', rx: 12, ry: 12 },
        { type: 'textbox', left: 90, top: 720, width: 200, text: '★★★★★', fontSize: 30, fill: GOLD },
        { type: 'textbox', left: 90, top: 760, width: 300, text: 'Rating Jamaah', fontSize: 26, fontFamily: 'Inter', fontWeight: '700', fill: DARK },

        // QUOTE SECTION
        { type: 'textbox', left: 60, top: 792, width: 100, text: '"', fontSize: 120, fontFamily: 'Outfit', fontWeight: '900', fill: GOLD, lineHeight: 0.65 },
        {
            type: 'textbox', left: 60, top: 854, width: CW + 8,
            text: 'Alfatih Dunia Wisata memberikan pelayanan terbaik. Mutawwif sangat sabar, hotel dekat Haram, semua akomodasi diurus dengan sempurna.',
            fontSize: 38, fontFamily: 'Outfit', fontWeight: '600', fill: DARK, lineHeight: 1.3, fontStyle: 'italic',
        },

        // PILGRIM CARD
        { type: 'rect', left: 60, top: 1142, width: CW + 8, height: 120, fill: GRAY_50, rx: 20, ry: 20, stroke: GRAY_100, strokeWidth: 1.5 },
        { type: 'rect', left: 92, top: 1172, width: 70, height: 70, fill: BLUE, rx: 35, ry: 35 },
        { type: 'textbox', left: 92, top: 1194, width: 70, text: 'H', fontSize: 28, fontFamily: 'Outfit', fontWeight: '900', fill: WHITE, textAlign: 'center' },
        { type: 'textbox', left: 182, top: 1158, width: 500, text: 'Haji Ahmad Fauzi', fontSize: 32, fontFamily: 'Inter', fontWeight: '700', fill: DARK },
        { type: 'textbox', left: 182, top: 1200, width: 540, text: 'Jamaah Umroh Syawal · Maret 2026', fontSize: 28, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_500 },
        { type: 'textbox', left: 780, top: 1164, width: 230, text: '★★★★★', fontSize: 32, fill: GOLD, textAlign: 'right' },
        { type: 'rect', left: 756, top: 1194, width: 262, height: 40, fill: '#ECFDF5', rx: 99, ry: 99, stroke: '#A7F3D0', strokeWidth: 1 },
        { type: 'textbox', left: 756, top: 1202, width: 262, text: '✓ PUAS 100%', fontSize: 24, fontFamily: 'Inter', fontWeight: '800', fill: '#059669', textAlign: 'center', charSpacing: 80 },

        // STATS ROW
        { type: 'rect', left: 60, top: 1294, width: CW + 8, height: 90, fill: WHITE, rx: 16, ry: 16, stroke: GRAY_100, strokeWidth: 1.5 },
        ...[
            { val: '1000+', label: 'Jamaah Puas', color: BLUE },
            { val: '12 Thn', label: 'Pengalaman',  color: BLUE },
            { val: '★ 5.0', label: 'Rating',       color: GOLD },
            { val: 'PPIU',  label: 'Izin Resmi',   color: GOLD },
        ].map(({ val, label, color }, i) => {
            const x = 60 + i * 246;
            return [
                { type: 'textbox', left: x, top: 1304, width: 240, text: val, fontSize: 28, fontFamily: 'Outfit', fontWeight: '900', fill: color, textAlign: 'center' },
                { type: 'textbox', left: x, top: 1344, width: 240, text: label.toUpperCase(), fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: GRAY_400, charSpacing: 80, textAlign: 'center' },
            ];
        }).flat(),

        // CTA
        { type: 'rect', left: 60, top: 1416, width: CW + 8, height: 100, fill: BLUE, rx: 20, ry: 20 },
        { type: 'textbox', left: 92, top: 1437, width: 600, text: 'Mau bergabung? Konsultasi gratis!', fontSize: 30, fontFamily: 'Outfit', fontWeight: '700', fill: WHITE },
        { type: 'rect', left: 758, top: 1430, width: 262, height: 60, fill: WHITE, rx: 12, ry: 12 },
        { type: 'textbox', left: 758, top: 1449, width: 262, text: 'Daftar Sekarang', fontSize: 28, fontFamily: 'Inter', fontWeight: '900', fill: BLUE, textAlign: 'center' },

        // BOTTOM
        { type: 'rect', left: 60, top: 1550, width: CW + 8, height: 1.5, fill: GRAY_100 },
        { type: 'textbox', left: 60, top: 1566, width: 500, text: '@alfatih.umroh  ·  adwisata.com', fontSize: 26, fontFamily: 'Inter', fontWeight: '600', fill: GRAY_400 },
        { type: 'textbox', left: 600, top: 1566, width: 420, text: 'Izin PPIU · 1603230089040001', fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: GRAY_400, textAlign: 'right' },

        ...footerDark(1864),
    ]
);

// ── BLANK CANVASES ────────────────────────────────────────────────────────────
const postBlank = makeTemplate('post-blank', 'Blank Canvas', 'Kanvas kosong (4:5)', [WHITE, WHITE, GRAY_100], 'post', WHITE, []);
const storyBlank = makeTemplate('story-blank', 'Blank Story', 'Kanvas kosong (9:16)', [WHITE, WHITE, GRAY_100], 'story', WHITE, []);

// ═══════════════════════════════════════════════════════════════════════════════
export const STARTER_TEMPLATES: PosterTemplate[] = [
    postConversion,
    postAspiration,
    postEduReminder,
    postSocialProof,
    postBlank,
    storyConversion,
    storyAspiration,
    storyEduReminder,
    storySocialProof,
    storyBlank,
];

// ── VISUAL THUMBNAIL ──────────────────────────────────────────────────────────
export const TemplateThumbnail: React.FC<{ t: PosterTemplate }> = ({ t }) => {
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);
    const isStory = t.aspectRatio === 'story';

    useEffect(() => {
        let cancelled = false;
        generateTemplateThumbnail(t.id, t.json).then(url => {
            if (!cancelled) setThumbUrl(url);
        });
        return () => { cancelled = true; };
    }, [t.id, t.json]);

    return (
        <div
            style={{
                width: '100%',
                aspectRatio: isStory ? '9/16' : '4/5',
                borderRadius: 6,
                overflow: 'hidden',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                flexShrink: 0,
            }}
        >
            {thumbUrl ? (
                <img
                    src={thumbUrl}
                    alt={t.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s infinite',
                }} />
            )}
        </div>
    );
};

// ── PANEL COMPONENT ───────────────────────────────────────────────────────────
interface TemplatePanelProps {
    onLoadTemplate: (template: PosterTemplate) => void;
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({ onLoadTemplate }) => {
    const postTemplates = STARTER_TEMPLATES.filter(t => t.aspectRatio === 'post');
    const storyTemplates = STARTER_TEMPLATES.filter(t => t.aspectRatio === 'story');

    const renderGroup = (title: string, subtitle: string, templates: PosterTemplate[]) => (
        <div className="mb-6">
            <div className="mb-3">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                {templates.map(t => (
                    <button
                        key={t.id}
                        onClick={() => {
                            if (confirm(`Load "${t.name}"? Current canvas will be replaced.`)) {
                                onLoadTemplate(t);
                            }
                        }}
                        className="text-left rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all group overflow-hidden bg-white"
                    >
                        <div className="p-2">
                            <TemplateThumbnail t={t} />
                        </div>
                        <div className="px-2.5 pb-2.5">
                            <div className="text-[11px] font-bold text-gray-700 group-hover:text-primary leading-tight">{t.name}</div>
                            <div className="text-[9px] text-gray-400 mt-0.5 leading-tight line-clamp-2">{t.description}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <LayoutTemplate className="w-4 h-4 text-gray-500" />
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">Templates</h3>
                    <p className="text-[10px] text-gray-400">Design system Alfatih Dunia Wisata</p>
                </div>
            </div>
            {renderGroup('Instagram Post (4:5)', '1080 × 1350 px', postTemplates)}
            {renderGroup('Instagram Story (9:16)', '1080 × 1920 px', storyTemplates)}
        </div>
    );
};

export default TemplatePanel;
