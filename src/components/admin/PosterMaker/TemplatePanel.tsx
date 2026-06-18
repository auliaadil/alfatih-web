import React, { useState, useEffect } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { generateTemplateThumbnail } from './templateThumbnail';

export interface PosterTemplate {
    id: string;
    name: string;
    description: string;
    previewColors: [string, string, string];
    aspectRatio: 'post' | 'story';
    json: object;
}

export const STARTER_TEMPLATES: PosterTemplate[] = [
    {
        id: 'brochure-post-conversion',
        name: 'Brosur Paket Umrah (Post)',
        description: 'Brosur promosi paket Umrah dengan tata letak minimalis dan premium. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#D4A373', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                {
                    type: 'rect',
                    left: 0,
                    top: 0,
                    width: 1080,
                    height: 1350,
                    fill: '#F8FAFC',
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                // Top accent
                {
                    type: 'rect',
                    left: 0,
                    top: 0,
                    width: 1080,
                    height: 15,
                    fill: '#F59E0B',
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                // Gold divider line
                {
                    type: 'rect',
                    left: 60,
                    top: 255,
                    width: 200,
                    height: 4,
                    fill: '#D4A373',
                    originX: 'left',
                    originY: 'top',
                    selectable: true
                },
                // Image placeholder
                {
                    type: 'image',
                    left: 60,
                    top: 400,
                    width: 960,
                    height: 400,
                    scaleX: 1,
                    scaleY: 1,
                    src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&q=80',
                    rx: 16,
                    ry: 16,
                    originX: 'left',
                    originY: 'top',
                    selectable: true
                },
                // Info Grid cards
                {
                    type: 'rect',
                    left: 60,
                    top: 820,
                    width: 300,
                    height: 100,
                    fill: '#F1F5F9',
                    rx: 12,
                    ry: 12,
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                {
                    type: 'rect',
                    left: 390,
                    top: 820,
                    width: 300,
                    height: 100,
                    fill: '#F1F5F9',
                    rx: 12,
                    ry: 12,
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                {
                    type: 'rect',
                    left: 720,
                    top: 820,
                    width: 300,
                    height: 100,
                    fill: '#F1F5F9',
                    rx: 12,
                    ry: 12,
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                // CTA Button background
                {
                    type: 'rect',
                    left: 340,
                    top: 1140,
                    width: 400,
                    height: 60,
                    fill: '#0084FF',
                    rx: 30,
                    ry: 30,
                    originX: 'left',
                    originY: 'top',
                    selectable: true
                },
                // Footer Background bar
                {
                    type: 'rect',
                    left: 0,
                    top: 1210,
                    width: 1080,
                    height: 140,
                    fill: '#0084FF',
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                // txt-0: Category
                {
                    type: 'textbox',
                    left: 60,
                    top: 100,
                    width: 960,
                    text: 'UMRAH REGULER',
                    fontSize: 18,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '800',
                    fill: '#F59E0B',
                    charSpacing: 150,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-1: Title
                {
                    type: 'textbox',
                    left: 60,
                    top: 140,
                    width: 960,
                    text: 'Paket Umrah Premium Syawal 1447H',
                    fontSize: 54,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '800',
                    fill: '#0F172A',
                    lineHeight: 1.2,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-2: Description
                {
                    type: 'textbox',
                    left: 60,
                    top: 280,
                    width: 960,
                    text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU. Fasilitas hotel bintang 5 dekat dengan Masjidil Haram.',
                    fontSize: 20,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 'normal',
                    fill: '#64748B',
                    lineHeight: 1.4,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-3: Date
                {
                    type: 'textbox',
                    left: 60,
                    top: 830,
                    width: 300,
                    text: 'Keberangkatan\n12 Okt 2026',
                    fontSize: 22,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#0F172A',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-4: Duration
                {
                    type: 'textbox',
                    left: 390,
                    top: 830,
                    width: 300,
                    text: 'Durasi\n12 Hari',
                    fontSize: 22,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#0F172A',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-5: Starting Price
                {
                    type: 'textbox',
                    left: 720,
                    top: 830,
                    width: 300,
                    text: 'Harga Mulai\nRp 32.5 Jt',
                    fontSize: 22,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#F59E0B',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-6: Room options
                {
                    type: 'textbox',
                    left: 60,
                    top: 940,
                    width: 960,
                    text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000',
                    fontSize: 18,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '600',
                    fill: '#64748B',
                    textAlign: 'center',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-7: Feature bullets (diamond accent)
                {
                    type: 'textbox',
                    left: 100,
                    top: 990,
                    width: 30,
                    text: '◆\n◆\n◆\n◆\n◆',
                    fontSize: 12,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#F59E0B',
                    lineHeight: 2.28,
                    textAlign: 'center',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-7b: Feature text
                {
                    type: 'textbox',
                    left: 142,
                    top: 990,
                    width: 838,
                    text: 'Hotel Makkah: Anjum / Setaraf (*5)\nHotel Madinah: Front Taiba / Setaraf (*5)\nTiket Pesawat Saudia Airlines direct Jeddah\nMuthawwif Pembimbing Ibadah Berpengalaman\nAir Zamzam 5 Liter & Perlengkapan Umrah Lengkap',
                    fontSize: 18,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '500',
                    fill: '#0F172A',
                    lineHeight: 1.5,
                    textAlign: 'left',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-8: CTA button text
                {
                    type: 'textbox',
                    left: 340,
                    top: 1158,
                    width: 400,
                    text: 'DAFTAR SEKARANG',
                    fontSize: 18,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '800',
                    fill: '#FFFFFF',
                    textAlign: 'center',
                    charSpacing: 100,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-9: Footer brand text
                {
                    type: 'textbox',
                    left: 60,
                    top: 1235,
                    width: 300,
                    text: 'ALFATIH DUNIA WISATA',
                    fontSize: 16,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '800',
                    fill: '#FFFFFF',
                    textAlign: 'left',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-10: Footer social contact details
                {
                    type: 'textbox',
                    left: 380,
                    top: 1235,
                    width: 640,
                    text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5',
                    fontSize: 15,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#FFFFFF',
                    textAlign: 'right',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-11: Footer license text
                {
                    type: 'textbox',
                    left: 60,
                    top: 1280,
                    width: 960,
                    text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024',
                    fontSize: 12,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '500',
                    fill: '#FFFFFF',
                    textAlign: 'center',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                }
            ]
        }
    },
    {
        id: 'brochure-story-conversion',
        name: 'Brosur Paket Umrah (Story)',
        description: 'Brosur promosi paket Umrah dalam format portrait Story. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#D4A373', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                {
                    type: 'rect',
                    left: 0,
                    top: 0,
                    width: 1080,
                    height: 1920,
                    fill: '#F8FAFC',
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                // Top accent
                {
                    type: 'rect',
                    left: 0,
                    top: 0,
                    width: 1080,
                    height: 20,
                    fill: '#F59E0B',
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                // Gold divider line
                {
                    type: 'rect',
                    left: 80,
                    top: 315,
                    width: 250,
                    height: 5,
                    fill: '#D4A373',
                    originX: 'left',
                    originY: 'top',
                    selectable: true
                },
                // Image placeholder
                {
                    type: 'image',
                    left: 80,
                    top: 500,
                    width: 920,
                    height: 600,
                    scaleX: 1,
                    scaleY: 1,
                    src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&q=80',
                    rx: 20,
                    ry: 20,
                    originX: 'left',
                    originY: 'top',
                    selectable: true
                },
                // Info Grid cards
                {
                    type: 'rect',
                    left: 80,
                    top: 1160,
                    width: 280,
                    height: 120,
                    fill: '#F1F5F9',
                    rx: 16,
                    ry: 16,
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                {
                    type: 'rect',
                    left: 400,
                    top: 1160,
                    width: 280,
                    height: 120,
                    fill: '#F1F5F9',
                    rx: 16,
                    ry: 16,
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                {
                    type: 'rect',
                    left: 720,
                    top: 1160,
                    width: 280,
                    height: 120,
                    fill: '#F1F5F9',
                    rx: 16,
                    ry: 16,
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                // CTA Button background
                {
                    type: 'rect',
                    left: 320,
                    top: 1590,
                    width: 440,
                    height: 70,
                    fill: '#0084FF',
                    rx: 35,
                    ry: 35,
                    originX: 'left',
                    originY: 'top',
                    selectable: true
                },
                // Footer Background bar
                {
                    type: 'rect',
                    left: 0,
                    top: 1740,
                    width: 1080,
                    height: 180,
                    fill: '#0084FF',
                    originX: 'left',
                    originY: 'top',
                    selectable: false,
                    evented: false
                },
                // txt-0: Category
                {
                    type: 'textbox',
                    left: 80,
                    top: 140,
                    width: 920,
                    text: 'UMRAH REGULER',
                    fontSize: 20,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '800',
                    fill: '#F59E0B',
                    charSpacing: 150,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-1: Title
                {
                    type: 'textbox',
                    left: 80,
                    top: 190,
                    width: 920,
                    text: 'Paket Umrah Premium Syawal 1447H',
                    fontSize: 58,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '800',
                    fill: '#0F172A',
                    lineHeight: 1.2,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-2: Description
                {
                    type: 'textbox',
                    left: 80,
                    top: 350,
                    width: 920,
                    text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU. Fasilitas hotel bintang 5 dekat dengan Masjidil Haram.',
                    fontSize: 22,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 'normal',
                    fill: '#64748B',
                    lineHeight: 1.4,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-3: Date
                {
                    type: 'textbox',
                    left: 80,
                    top: 1180,
                    width: 280,
                    text: 'Keberangkatan\n12 Okt 2026',
                    fontSize: 22,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#0F172A',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-4: Duration
                {
                    type: 'textbox',
                    left: 400,
                    top: 1180,
                    width: 280,
                    text: 'Durasi\n12 Hari',
                    fontSize: 22,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#0F172A',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-5: Starting Price
                {
                    type: 'textbox',
                    left: 720,
                    top: 1180,
                    width: 280,
                    text: 'Harga Mulai\nRp 32.5 Jt',
                    fontSize: 22,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#F59E0B',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-6: Room options
                {
                    type: 'textbox',
                    left: 80,
                    top: 1310,
                    width: 920,
                    text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000',
                    fontSize: 20,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '600',
                    fill: '#64748B',
                    textAlign: 'center',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-7: Feature bullets (diamond accent)
                {
                    type: 'textbox',
                    left: 120,
                    top: 1370,
                    width: 34,
                    text: '◆\n◆\n◆\n◆\n◆',
                    fontSize: 13,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#F59E0B',
                    lineHeight: 2.46,
                    textAlign: 'center',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-7b: Feature text
                {
                    type: 'textbox',
                    left: 166,
                    top: 1370,
                    width: 794,
                    text: 'Hotel Makkah: Anjum / Setaraf (*5)\nHotel Madinah: Front Taiba / Setaraf (*5)\nTiket Pesawat Saudia Airlines direct Jeddah\nMuthawwif Pembimbing Ibadah Berpengalaman\nAir Zamzam 5 Liter & Perlengkapan Umrah Lengkap',
                    fontSize: 20,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '500',
                    fill: '#0F172A',
                    lineHeight: 1.6,
                    textAlign: 'left',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-8: CTA button text
                {
                    type: 'textbox',
                    left: 320,
                    top: 1610,
                    width: 440,
                    text: 'DAFTAR SEKARANG',
                    fontSize: 20,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '800',
                    fill: '#FFFFFF',
                    textAlign: 'center',
                    charSpacing: 100,
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-9: Footer brand text
                {
                    type: 'textbox',
                    left: 80,
                    top: 1765,
                    width: 320,
                    text: 'ALFATIH DUNIA WISATA',
                    fontSize: 18,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '800',
                    fill: '#FFFFFF',
                    textAlign: 'left',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-10: Footer social contact details
                {
                    type: 'textbox',
                    left: 420,
                    top: 1765,
                    width: 580,
                    text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5',
                    fontSize: 16,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '700',
                    fill: '#FFFFFF',
                    textAlign: 'right',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                },
                // txt-11: Footer license text
                {
                    type: 'textbox',
                    left: 80,
                    top: 1825,
                    width: 920,
                    text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024',
                    fontSize: 14,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: '500',
                    fill: '#FFFFFF',
                    textAlign: 'center',
                    originX: 'left',
                    originY: 'top',
                    editable: true
                }
            ]
        }
    }
];

// ── Visual thumbnail ──────────────────────────────────────────────────────────
export const TemplateThumbnail: React.FC<{ t: PosterTemplate }> = ({ t }) => {
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        generateTemplateThumbnail(t.id, t.json).then(url => {
            if (!cancelled && url) setThumbUrl(url);
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [t.id, t.json]);

    const isStory = t.aspectRatio === 'story';
    return (
        <div style={{
            width: '100%', aspectRatio: isStory ? '9/16' : '4/5',
            borderRadius: 8, overflow: 'hidden', background: '#F1F5F9',
            border: '1px solid #E2E8F0', flexShrink: 0,
        }}>
            {thumbUrl ? (
                <img src={thumbUrl} alt={t.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                }} />
            )}
        </div>
    );
};

// ── Panel component ───────────────────────────────────────────────────────────
interface TemplatePanelProps {
    onLoadTemplate: (template: PosterTemplate) => void;
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({ onLoadTemplate }) => {
    const postTemplates  = STARTER_TEMPLATES.filter(t => t.aspectRatio === 'post');
    const storyTemplates = STARTER_TEMPLATES.filter(t => t.aspectRatio === 'story');

    const renderGroup = (title: string, subtitle: string, templates: PosterTemplate[]) => (
        <div className="mb-6">
            <div className="mb-3">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
            </div>
            {templates.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic">Belum ada template.</p>
            ) : (
                <div className="grid grid-cols-2 gap-2.5">
                    {templates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => {
                                if (confirm(`Muat template "${t.name}"? Canvas saat ini akan diganti.`)) {
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
            )}
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
