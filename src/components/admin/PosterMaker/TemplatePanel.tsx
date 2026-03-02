import React from 'react';
import { LayoutTemplate } from 'lucide-react';

export interface PosterTemplate {
    id: string;
    name: string;
    thumbnail: string;
    aspectRatio: 'post' | 'story';
    json: object;
}

// ---- ALFATIH BRAND COLORS ----
const BLUE = '#3b82f6';       // primary blue
const BLUE_LIGHT = '#72a8feff'; // lighter blue
const BLUE_DARK = '#1e3a5f';  // dark navy
const YELLOW = '#f59e0b';     // accent yellow / gold
const YELLOW_LIGHT = '#fbbf24';
const WHITE = '#ffffff';
const DARK = '#1f2937';       // dark grey
const GRAY = '#6b7280';       // text grey
const LIGHT_BG = '#f8fafc';   // very light bg

const makeTemplate = (
    id: string,
    name: string,
    thumbnail: string,
    aspectRatio: 'post' | 'story',
    bg: string,
    objects: object[]
): PosterTemplate => {
    const w = 1080;
    const h = aspectRatio === 'post' ? 1440 : 1920;

    // Explicitly set origins to left/top to fix Fabric v6 JSON parsing offset
    const mappedObjects = objects.map(obj => ({
        originX: 'left',
        originY: 'top',
        ...obj,
    }));

    return {
        id, name, thumbnail, aspectRatio,
        json: {
            version: '6.0.0',
            objects: mappedObjects,
            background: bg,
            width: w,
            height: h,
        }
    };
};

// Padding constants — keep everything well inside the canvas
const P = 100; // standard padding from edges
const CW = 880; // content width (1080 - 2*100)

export const STARTER_TEMPLATES: PosterTemplate[] = [

    // ========== POST TEMPLATES (1080 x 1440) ==========

    makeTemplate('post-promo-clean', 'Promo Clean', '🏷️', 'post', WHITE, [
        // Top blue banner
        { type: 'rect', left: 0, top: 0, width: 1080, height: 420, fill: BLUE },
        { type: 'textbox', left: P, top: 60, width: CW, text: 'ALFATIH DUNIA WISATA', fontSize: 24, fontFamily: 'Inter', fontWeight: '700', fill: YELLOW, charSpacing: 300, textAlign: 'center' },
        { type: 'textbox', left: P, top: 120, width: CW, text: 'Paket Umrah Plus Turkey\n7 Hari 6 Malam', fontSize: 52, fontFamily: 'Inter', fontWeight: '800', fill: WHITE, lineHeight: 1.3, textAlign: 'center' },
        // Price
        { type: 'textbox', left: P, top: 480, width: CW, text: 'Mulai Dari', fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: GRAY, textAlign: 'center' },
        { type: 'textbox', left: P, top: 520, width: CW, text: 'Rp 32.500.000', fontSize: 72, fontFamily: 'Inter', fontWeight: '900', fill: BLUE, textAlign: 'center' },
        // Benefits
        { type: 'rect', left: P, top: 640, width: CW, height: 2, fill: '#e5e7eb' },
        { type: 'textbox', left: P, top: 680, width: CW, text: '✓  Hotel Bintang 5\n✓  Pesawat Langsung\n✓  Makan 3x Sehari\n✓  Visa & Handling', fontSize: 32, fontFamily: 'Inter', fontWeight: '500', fill: DARK, lineHeight: 1.7 },
        // Footer
        { type: 'rect', left: 0, top: 1300, width: 1080, height: 140, fill: BLUE_DARK },
        { type: 'textbox', left: P, top: 1330, width: CW, text: 'www.alfatihduniawisata.com  •  @alfatihduniawisata', fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: WHITE, textAlign: 'center' },
    ]),

    makeTemplate('post-elegant-dark', 'Elegant Dark', '🌙', 'post', BLUE_DARK, [
        // Gold border
        { type: 'rect', left: 50, top: 50, width: 980, height: 1340, fill: 'transparent', stroke: YELLOW, strokeWidth: 2, rx: 16, ry: 16 },
        { type: 'textbox', left: P, top: 120, width: CW, text: '✦  ALFATIH  ✦', fontSize: 28, fontFamily: 'Inter', fontWeight: '700', fill: YELLOW, charSpacing: 500, textAlign: 'center' },
        { type: 'textbox', left: P, top: 300, width: CW, text: 'Exclusive\nUmrah Package', fontSize: 76, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, textAlign: 'center', lineHeight: 1.2 },
        // Gold line
        { type: 'rect', left: 400, top: 560, width: 280, height: 3, fill: YELLOW },
        { type: 'textbox', left: P, top: 600, width: CW, text: 'Pengalaman ibadah premium\ndengan layanan terbaik', fontSize: 32, fontFamily: 'Inter', fontWeight: '400', fill: '#94a3b8', textAlign: 'center', lineHeight: 1.5 },
        // Price
        { type: 'textbox', left: P, top: 800, width: CW, text: 'Mulai Dari', fontSize: 22, fontFamily: 'Inter', fontWeight: '500', fill: YELLOW, textAlign: 'center' },
        { type: 'textbox', left: P, top: 850, width: CW, text: 'Rp 28.000.000', fontSize: 68, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, textAlign: 'center' },
        // Features
        { type: 'textbox', left: P, top: 1000, width: CW, text: '★  Hotel Bintang 5  ★  VIP Service  ★', fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: YELLOW, textAlign: 'center' },
        // Footer
        { type: 'textbox', left: P, top: 1260, width: CW, text: 'alfatihduniawisata.com  •  @alfatihduniawisata', fontSize: 22, fontFamily: 'Inter', fontWeight: '400', fill: '#64748b', textAlign: 'center' },
    ]),

    makeTemplate('post-minimal-info', 'Minimal Info', '📋', 'post', WHITE, [
        // Yellow top accent bar
        { type: 'rect', left: 0, top: 0, width: 1080, height: 12, fill: YELLOW },
        { type: 'textbox', left: P, top: 60, width: CW, text: 'INFORMASI PAKET', fontSize: 22, fontFamily: 'Inter', fontWeight: '700', fill: BLUE, charSpacing: 400 },
        { type: 'textbox', left: P, top: 110, width: CW, text: 'Umrah Reguler\n9 Hari', fontSize: 56, fontFamily: 'Inter', fontWeight: '900', fill: DARK, lineHeight: 1.2 },
        // Divider
        { type: 'rect', left: P, top: 300, width: CW, height: 2, fill: '#e5e7eb' },
        // Info grid
        { type: 'textbox', left: P, top: 340, width: 400, text: '📅  Keberangkatan\n15 April 2026', fontSize: 28, fontFamily: 'Inter', fontWeight: '500', fill: DARK, lineHeight: 1.5 },
        { type: 'textbox', left: 540, top: 340, width: 440, text: '✈️  Penerbangan\nGaruda Indonesia', fontSize: 28, fontFamily: 'Inter', fontWeight: '500', fill: DARK, lineHeight: 1.5 },
        { type: 'textbox', left: P, top: 480, width: 400, text: '🏨  Hotel\nBintang 5 Madinah', fontSize: 28, fontFamily: 'Inter', fontWeight: '500', fill: DARK, lineHeight: 1.5 },
        { type: 'textbox', left: 540, top: 480, width: 440, text: '💰  Harga\nRp 35.000.000', fontSize: 28, fontFamily: 'Inter', fontWeight: '500', fill: BLUE, lineHeight: 1.5 },
        // Divider
        { type: 'rect', left: P, top: 630, width: CW, height: 2, fill: '#e5e7eb' },
        // Benefits
        { type: 'textbox', left: P, top: 670, width: CW, text: 'Keunggulan:\n•  Pembimbing berpengalaman\n•  Makan 3x sehari\n•  Handling & Visa\n•  City Tour', fontSize: 28, fontFamily: 'Inter', fontWeight: '400', fill: GRAY, lineHeight: 1.6 },
        // Footer
        { type: 'rect', left: 0, top: 1340, width: 1080, height: 100, fill: BLUE },
        { type: 'textbox', left: P, top: 1358, width: CW, text: 'www.alfatihduniawisata.com  |  @alfatihduniawisata', fontSize: 22, fontFamily: 'Inter', fontWeight: '500', fill: WHITE, textAlign: 'center' },
    ]),

    makeTemplate('post-bold-cta', 'Bold CTA', '🔥', 'post', LIGHT_BG, [
        // Yellow accent top
        { type: 'rect', left: 0, top: 0, width: 1080, height: 8, fill: YELLOW },
        { type: 'textbox', left: P, top: 80, width: CW, text: 'JANGAN LEWATKAN!', fontSize: 52, fontFamily: 'Inter', fontWeight: '900', fill: BLUE, textAlign: 'center' },
        { type: 'textbox', left: P, top: 180, width: CW, text: 'Promo Umrah\nRamadan 2026', fontSize: 72, fontFamily: 'Inter', fontWeight: '900', fill: DARK, lineHeight: 1.1, textAlign: 'center' },
        // Price card
        { type: 'rect', left: P, top: 420, width: CW, height: 250, fill: BLUE, rx: 20, ry: 20 },
        { type: 'textbox', left: 150, top: 450, width: 780, text: 'MULAI DARI', fontSize: 24, fontFamily: 'Inter', fontWeight: '600', fill: YELLOW },
        { type: 'textbox', left: 150, top: 490, width: 780, text: 'Rp 25.900.000', fontSize: 64, fontFamily: 'Inter', fontWeight: '900', fill: WHITE },
        { type: 'textbox', left: 150, top: 580, width: 780, text: '*Sudah termasuk tiket pesawat & hotel', fontSize: 20, fontFamily: 'Inter', fontWeight: '400', fill: '#93c5fd' },
        // Benefits
        { type: 'textbox', left: P, top: 730, width: CW, text: '✅  Hotel bintang 5\n✅  Makan 3x sehari\n✅  Ziarah lengkap\n✅  Pembimbing profesional', fontSize: 30, fontFamily: 'Inter', fontWeight: '500', fill: DARK, lineHeight: 1.7 },
        // CTA button
        { type: 'rect', left: P, top: 1080, width: CW, height: 80, fill: YELLOW, rx: 40, ry: 40 },
        { type: 'textbox', left: P, top: 1098, width: CW, text: 'DAFTAR SEKARANG →', fontSize: 28, fontFamily: 'Inter', fontWeight: '800', fill: DARK, textAlign: 'center' },
        // Footer
        { type: 'rect', left: 0, top: 1300, width: 1080, height: 140, fill: BLUE_DARK },
        { type: 'textbox', left: P, top: 1340, width: CW, text: '@alfatihduniawisata  •  0811-1234-5678', fontSize: 22, fontFamily: 'Inter', fontWeight: '500', fill: WHITE, textAlign: 'center' },
    ]),

    makeTemplate('post-split-layout', 'Split Layout', '📐', 'post', WHITE, [
        // Left blue column
        { type: 'rect', left: 0, top: 0, width: 400, height: 1440, fill: BLUE },
        { type: 'textbox', left: 60, top: 100, width: 280, text: 'ALFATIH\nDUNIA\nWISATA', fontSize: 44, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, lineHeight: 1.2 },
        { type: 'rect', left: 60, top: 340, width: 80, height: 4, fill: YELLOW },
        { type: 'textbox', left: 60, top: 380, width: 280, text: 'Travel Umrah\n& Haji\nTerpercaya', fontSize: 28, fontFamily: 'Inter', fontWeight: '400', fill: '#93c5fd', lineHeight: 1.4 },
        // Right side — content
        { type: 'textbox', left: 460, top: 100, width: 560, text: 'PAKET UNGGULAN', fontSize: 22, fontFamily: 'Inter', fontWeight: '700', fill: YELLOW, charSpacing: 300 },
        { type: 'textbox', left: 460, top: 160, width: 560, text: 'Umrah Plus\nTurkey & Dubai', fontSize: 52, fontFamily: 'Inter', fontWeight: '900', fill: DARK, lineHeight: 1.2 },
        { type: 'rect', left: 460, top: 360, width: 560, height: 2, fill: '#e5e7eb' },
        { type: 'textbox', left: 460, top: 400, width: 560, text: '📅  12 Hari Perjalanan\n✈️  Garuda Indonesia\n🏨  Hotel Bintang 5\n🍽️  Makan 3x Sehari', fontSize: 28, fontFamily: 'Inter', fontWeight: '500', fill: DARK, lineHeight: 1.7 },
        { type: 'rect', left: 460, top: 660, width: 560, height: 2, fill: '#e5e7eb' },
        { type: 'textbox', left: 460, top: 700, width: 560, text: 'Mulai Dari', fontSize: 22, fontFamily: 'Inter', fontWeight: '500', fill: GRAY },
        { type: 'textbox', left: 460, top: 740, width: 560, text: 'Rp 42.000.000', fontSize: 56, fontFamily: 'Inter', fontWeight: '900', fill: BLUE },
        // Bottom bar
        { type: 'rect', left: 400, top: 1340, width: 680, height: 100, fill: LIGHT_BG },
        { type: 'textbox', left: 460, top: 1360, width: 560, text: 'alfatihduniawisata.com', fontSize: 22, fontFamily: 'Inter', fontWeight: '500', fill: GRAY, textAlign: 'center' },
        { type: 'rect', left: 0, top: 1340, width: 400, height: 100, fill: BLUE_DARK },
        { type: 'textbox', left: 60, top: 1360, width: 280, text: '0811-1234-5678', fontSize: 22, fontFamily: 'Inter', fontWeight: '600', fill: YELLOW },
    ]),

    makeTemplate('post-photo-overlay', 'Photo Frame', '📷', 'post', '#d1d5db', [
        // Placeholder photo area — user replaces with photo
        { type: 'image', left: 0, top: 0, width: 1080, height: 900, src: 'https://placehold.co/1080x900/e2e8f0/64748b.png?text=Autofill+Photo+Here', crossOrigin: 'anonymous' },
        // Bottom content panel
        { type: 'rect', left: 0, top: 820, width: 1080, height: 620, fill: WHITE },
        { type: 'textbox', left: P, top: 860, width: CW, text: 'UMRAH PLUS TURKEY', fontSize: 48, fontFamily: 'Inter', fontWeight: '900', fill: YELLOW, textAlign: 'center' },
        { type: 'textbox', left: P, top: 940, width: CW, text: '10 Hari • 4 Negara • Berangkat April 2026', fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: GRAY, textAlign: 'center' },
        { type: 'rect', left: P, top: 1010, width: CW, height: 2, fill: '#e5e7eb' },
        { type: 'textbox', left: P, top: 1050, width: CW, text: 'Rp 45.000.000', fontSize: 64, fontFamily: 'Inter', fontWeight: '900', fill: BLUE, textAlign: 'center' },
        // Footer
        { type: 'rect', left: 0, top: 1300, width: 1080, height: 140, fill: BLUE_DARK },
        { type: 'textbox', left: P, top: 1335, width: CW, text: '0811-1234-5678  •  @alfatihduniawisata', fontSize: 24, fontFamily: 'Inter', fontWeight: '600', fill: WHITE, textAlign: 'center' },
    ]),

    makeTemplate('post-blank', 'Blank Canvas', '⬜', 'post', WHITE, []),

    // ========== STORY TEMPLATES (1080 x 1920) ==========

    makeTemplate('story-promo-vertical', 'Story Promo', '📱', 'story', WHITE, [
        // Blue header photo with overlay
        { type: 'image', left: 0, top: 0, width: 1080, height: 700, src: 'https://placehold.co/1080x700/e2e8f0/64748b.png?text=Autofill+Photo+Here', crossOrigin: 'anonymous' },
        { type: 'rect', left: 0, top: 0, width: 1080, height: 700, fill: 'rgba(30, 64, 175, 0.7)' },
        { type: 'textbox', left: P, top: 80, width: CW, text: 'ALFATIH\nDUNIA WISATA', fontSize: 44, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, lineHeight: 1.2, textAlign: 'center' },
        { type: 'rect', left: 440, top: 260, width: 200, height: 3, fill: YELLOW },
        { type: 'textbox', left: P, top: 310, width: CW, text: 'Paket Umrah\nTerbaik 2026', fontSize: 64, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, lineHeight: 1.1, textAlign: 'center' },
        { type: 'textbox', left: P, top: 560, width: CW, text: 'Berangkat dari Jakarta', fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: '#93c5fd', textAlign: 'center' },
        // Price section
        { type: 'textbox', left: P, top: 780, width: CW, text: 'Mulai Dari', fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: GRAY, textAlign: 'center' },
        { type: 'textbox', left: P, top: 820, width: CW, text: 'Rp 28.000.000', fontSize: 72, fontFamily: 'Inter', fontWeight: '900', fill: BLUE, textAlign: 'center' },
        // Divider
        { type: 'rect', left: P, top: 940, width: CW, height: 2, fill: '#e5e7eb' },
        // Benefits
        { type: 'textbox', left: P, top: 980, width: CW, text: '✓  Hotel Bintang 5\n✓  Pesawat PP\n✓  Makan 3x Sehari\n✓  Visa & Handling\n✓  Pembimbing', fontSize: 32, fontFamily: 'Inter', fontWeight: '500', fill: DARK, lineHeight: 1.7, textAlign: 'center' },
        // CTA
        { type: 'rect', left: P, top: 1460, width: CW, height: 90, fill: YELLOW, rx: 45, ry: 45 },
        { type: 'textbox', left: P, top: 1482, width: CW, text: 'SWIPE UP UNTUK DAFTAR', fontSize: 26, fontFamily: 'Inter', fontWeight: '800', fill: DARK, textAlign: 'center' },
        // Footer
        { type: 'rect', left: 0, top: 1780, width: 1080, height: 140, fill: BLUE_DARK },
        { type: 'textbox', left: P, top: 1818, width: CW, text: '@alfatihduniawisata', fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: WHITE, textAlign: 'center' },
    ]),

    makeTemplate('story-dark-luxury', 'Story Luxury', '✨', 'story', BLUE_DARK, [
        // Gold border
        { type: 'rect', left: 50, top: 50, width: 980, height: 1820, fill: 'transparent', stroke: YELLOW, strokeWidth: 2, rx: 20, ry: 20 },
        { type: 'textbox', left: P, top: 120, width: CW, text: '✦  ALFATIH  ✦', fontSize: 26, fontFamily: 'Inter', fontWeight: '700', fill: YELLOW, textAlign: 'center', charSpacing: 500 },
        // Main text
        { type: 'textbox', left: P, top: 400, width: CW, text: 'Premium\nUmrah\nExperience', fontSize: 84, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, textAlign: 'center', lineHeight: 1.1 },
        // Gold line
        { type: 'rect', left: 400, top: 780, width: 280, height: 3, fill: YELLOW },
        { type: 'textbox', left: P, top: 830, width: CW, text: 'Nikmati pengalaman ibadah\ndengan fasilitas terbaik', fontSize: 30, fontFamily: 'Inter', fontWeight: '400', fill: '#94a3b8', textAlign: 'center', lineHeight: 1.5 },
        // Price
        { type: 'textbox', left: P, top: 1020, width: CW, text: 'Mulai Dari', fontSize: 22, fontFamily: 'Inter', fontWeight: '500', fill: YELLOW, textAlign: 'center' },
        { type: 'textbox', left: P, top: 1060, width: CW, text: 'Rp 35.000.000', fontSize: 68, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, textAlign: 'center' },
        // Features
        { type: 'textbox', left: P, top: 1250, width: CW, text: '★  Hotel Bintang 5\n★  Business Class\n★  VIP Service', fontSize: 30, fontFamily: 'Inter', fontWeight: '500', fill: YELLOW, textAlign: 'center', lineHeight: 1.7 },
        // Footer
        { type: 'textbox', left: P, top: 1720, width: CW, text: 'alfatihduniawisata.com', fontSize: 22, fontFamily: 'Inter', fontWeight: '400', fill: '#64748b', textAlign: 'center' },
    ]),

    makeTemplate('story-content-tips', 'Story Tips', '💡', 'story', LIGHT_BG, [
        // Blue header
        { type: 'rect', left: 0, top: 0, width: 1080, height: 320, fill: BLUE },
        { type: 'textbox', left: P, top: 80, width: CW, text: '5 TIPS UMRAH', fontSize: 52, fontFamily: 'Inter', fontWeight: '900', fill: WHITE, textAlign: 'center' },
        { type: 'textbox', left: P, top: 180, width: CW, text: 'Yang Harus Kamu Tahu!', fontSize: 28, fontFamily: 'Inter', fontWeight: '500', fill: YELLOW, textAlign: 'center' },
        // Tips list
        { type: 'textbox', left: P, top: 400, width: CW, text: '1.  Persiapkan dokumen jauh hari\n\n2.  Bawa obat-obatan pribadi\n\n3.  Pakai sepatu yang nyaman\n\n4.  Bawa adaptor universal\n\n5.  Pelajari doa-doa ibadah', fontSize: 32, fontFamily: 'Inter', fontWeight: '500', fill: DARK, lineHeight: 1.4 },
        // Divider
        { type: 'rect', left: P, top: 1260, width: CW, height: 2, fill: '#d1d5db' },
        // CTA
        { type: 'textbox', left: P, top: 1320, width: CW, text: 'Bagikan ke teman yang\nberencana umrah! 🤲', fontSize: 32, fontFamily: 'Inter', fontWeight: '600', fill: BLUE, textAlign: 'center', lineHeight: 1.4 },
        // Footer
        { type: 'rect', left: 0, top: 1780, width: 1080, height: 140, fill: BLUE },
        { type: 'textbox', left: P, top: 1818, width: CW, text: '@alfatihduniawisata', fontSize: 24, fontFamily: 'Inter', fontWeight: '500', fill: WHITE, textAlign: 'center' },
    ]),

    makeTemplate('story-blank', 'Blank Story', '⬜', 'story', WHITE, []),
];

interface TemplatePanelProps {
    onLoadTemplate: (template: PosterTemplate) => void;
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({ onLoadTemplate }) => {
    const postTemplates = STARTER_TEMPLATES.filter(t => t.aspectRatio === 'post');
    const storyTemplates = STARTER_TEMPLATES.filter(t => t.aspectRatio === 'story');

    const renderGroup = (title: string, templates: PosterTemplate[]) => (
        <div className="mb-5">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
            <div className="grid grid-cols-2 gap-2">
                {templates.map(t => (
                    <button
                        key={t.id}
                        onClick={() => {
                            if (confirm('This will replace the current canvas. Continue?')) {
                                onLoadTemplate(t);
                            }
                        }}
                        className="text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 transition-all group"
                    >
                        <div className="text-2xl mb-1">{t.thumbnail}</div>
                        <div className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">{t.name}</div>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <LayoutTemplate className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-800">Templates</h3>
            </div>
            {renderGroup('Instagram Post (3:4)', postTemplates)}
            {renderGroup('Instagram Story (9:16)', storyTemplates)}
        </div>
    );
};

export default TemplatePanel;
