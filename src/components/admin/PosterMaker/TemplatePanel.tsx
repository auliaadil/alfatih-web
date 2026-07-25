import React, { useState, useEffect, useMemo } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { generateTemplateThumbnail } from './templateThumbnail';
import { useSiteSettings } from '../../../contexts/SiteSettingsContext';

export type TemplateType = 'Conversion' | 'Tour Promotion' | 'Documentation' | 'Content';

export interface PosterTemplate {
    id: string;
    name: string;
    description: string;
    type: TemplateType;
    previewColors: [string, string, string];
    aspectRatio: 'post' | 'story';
    json: object;
}

export interface FooterData {
    instagram: string;
    phone: string;
    email: string;
    izin_ppiu: string;
}


const extractInstagramHandle = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('@')) return url;
    const match = url.match(/instagram\.com\/([^/?]+)/);
    return match ? `@${match[1]}` : url;
};

const websiteFromEmail = (email: string): string => {
    const at = email.indexOf('@');
    return at >= 0 ? email.slice(at + 1) : email;
};

const buildContactLine = (footer: FooterData): string => {
    const parts = [
        websiteFromEmail(footer.email),
        extractInstagramHandle(footer.instagram),
        footer.phone,
    ].filter(Boolean);
    return parts.join('  |  ');
};

const buildLicenseLine = (footer: FooterData): string =>
    footer.izin_ppiu
        ? `Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: ${footer.izin_ppiu}`
        : 'Penyelenggara Perjalanan Ibadah Umrah (PPIU)';

const injectFooterData = (templates: PosterTemplate[], footer: FooterData): PosterTemplate[] => {
    const contactLine = buildContactLine(footer);
    const licenseLine = buildLicenseLine(footer);
    return templates.map(t => ({
        ...t,
        json: {
            ...(t.json as any),
            objects: (t.json as any).objects.map((obj: any) => {
                const type = (obj.type || '').toLowerCase();
                if (type !== 'textbox') return obj;
                const text: string = obj.text || '';
                // Contact/social line: pipe-separated with @ or .com
                if (text.includes('|') && (text.includes('@') || text.includes('.com'))) {
                    return { ...obj, text: contactLine };
                }
                // License line: references Penyelenggara or No. Izin
                if (text.includes('Penyelenggara') || text.includes('No. Izin')) {
                    return { ...obj, text: licenseLine };
                }
                return obj;
            }),
        },
    }));
};

export const buildStarterTemplates = (footer: FooterData): PosterTemplate[] =>
    injectFooterData(BASE_TEMPLATES, footer);

const BASE_TEMPLATES: PosterTemplate[] = [
    {
        id: 'brochure-post-conversion',
        name: 'Brosur Paket Umrah (Post)',
        description: 'Brosur promosi paket Umrah dengan tata letak minimalis dan premium. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0084FF', '#D4A373', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { rx: 0, ry: 0, top: 0, fill: '#F8FAFC', left: 0, type: 'Rect', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 1080, height: 1350, scaleX: 1, scaleY: 1, shadow: null, stroke: null, opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', paintFirst: 'fill', strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, globalCompositeOperation: 'source-over' },
                { rx: 0, ry: 0, top: 0, fill: '#F59E0B', left: 0, type: 'Rect', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 1080, height: 15, scaleX: 1, scaleY: 1, shadow: null, stroke: null, opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', paintFirst: 'fill', strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, globalCompositeOperation: 'source-over' },
                { rx: 0, ry: 0, top: 245, fill: '#D4A373', left: 60, type: 'Rect', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 200, height: 4, scaleX: 1, scaleY: 1, shadow: null, stroke: null, opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', paintFirst: 'fill', strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, globalCompositeOperation: 'source-over' },
                { src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&q=80', top: 380, fill: 'rgb(0,0,0)', left: 60, type: 'Image', angle: 0, cropX: 0, cropY: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 400, scaleX: 1, scaleY: 1, shadow: null, stroke: null, filters: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', paintFirst: 'fill', crossOrigin: 'anonymous', strokeWidth: 0, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, globalCompositeOperation: 'source-over' },
                { rx: 12, ry: 12, top: 800, fill: '#F1F5F9', left: 60, type: 'Rect', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 100, scaleX: 1, scaleY: 1, shadow: null, stroke: null, opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', paintFirst: 'fill', strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, globalCompositeOperation: 'source-over' },
                { rx: 12, ry: 12, top: 800, fill: '#F1F5F9', left: 390, type: 'Rect', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 100, scaleX: 1, scaleY: 1, shadow: null, stroke: null, opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', paintFirst: 'fill', strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, globalCompositeOperation: 'source-over' },
                { rx: 12, ry: 12, top: 800, fill: '#F1F5F9', left: 720, type: 'Rect', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 100, scaleX: 1, scaleY: 1, shadow: null, stroke: null, opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', paintFirst: 'fill', strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, globalCompositeOperation: 'source-over' },
                { rx: 30, ry: 30, top: 1140, fill: '#0084FF', left: 340, type: 'Rect', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 400, height: 60, scaleX: 1, scaleY: 1, shadow: null, stroke: null, opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', paintFirst: 'fill', strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, globalCompositeOperation: 'source-over' },
                { rx: 0, ry: 0, top: 1210, fill: '#0084FF', left: 0, type: 'Rect', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 1080, height: 140, scaleX: 1, scaleY: 1, shadow: null, stroke: null, opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', paintFirst: 'fill', strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, globalCompositeOperation: 'source-over' },
                { top: 100, fill: '#F59E0B', left: 60, text: 'UMRAH REGULER', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 20.34, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 18, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'left', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 150, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 140, fill: '#0F172A', left: 60, text: 'Umrah Premium Syawal 1447H', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 61.02, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 54, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'left', underline: false, fontFamily: 'Dancing Script', fontWeight: '800', lineHeight: 1.2, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 270, fill: '#64748B', left: 60, text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU. Fasilitas hotel bintang 5 dekat dengan Masjidil Haram.', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 54.24, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 20, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'left', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', lineHeight: 1.4, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 820, fill: '#0F172A', left: 60, text: 'Keberangkatan\n12 Okt 2026', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 57.178, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 22, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', lineHeight: 1.3, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 820, fill: '#0F172A', left: 390, text: 'Durasi\n12 Hari', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 57.178, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 22, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', lineHeight: 1.3, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 820, fill: '#F59E0B', left: 720, text: 'Harga Mulai\nRp 32.5 Jt', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 57.178, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 22, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', lineHeight: 1.3, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 920, fill: '#64748B', left: 60, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 20.34, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 18, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                // Feature bullet list (5 items, amber diamonds)
                { type: 'textbox', left: 100, top: 970, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman\n◆ Air Zamzam 5 Liter & Perlengkapan Umrah Lengkap', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 3: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 4: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
                { top: 1158, fill: '#FFFFFF', left: 340, text: 'DAFTAR SEKARANG', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 400, height: 20.34, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 18, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 100, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 1235, fill: '#FFFFFF', left: 60, text: 'ALFATIH DUNIA WISATA', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 18.08, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 16, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'left', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 1235, fill: '#FFFFFF', left: 380, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 640, height: 16.95, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 18, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'right', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 1280, fill: '#FFFFFF', left: 60, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 13.56, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 15, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
            ]
        }
    },
    {
        id: 'brochure-story-conversion',
        name: 'Brosur Paket Umrah (Story)',
        description: 'Brosur promosi paket Umrah dalam format portrait Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
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
                    top: 1150,
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
                    top: 1150,
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
                    top: 1150,
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
                    text: 'Umrah Premium Syawal 1447H',
                    fontSize: 58,
                    fontFamily: 'Dancing Script',
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
                // Feature bullet list (5 items, amber diamonds)
                { type: 'textbox', left: 120, top: 1370, width: 840, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman\n◆ Air Zamzam 5 Liter & Perlengkapan Umrah Lengkap', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 3: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 4: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
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
                    fontSize: 17,
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
        id: 'promo-post-conversion',
        name: 'Promo Diskon Umrah (Post)',
        description: 'Harga coret dengan badge HEMAT dan urgency kursi tersisa. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0084FF', '#EF4444', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar (teal)
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Teal divider under header
                { type: 'rect', left: 80, top: 200, width: 180, height: 3, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Full-bleed image (edge-to-edge)
                { type: 'image', left: 0, top: 275, width: 1080, height: 375, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=375&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Teal price band background
                { type: 'rect', left: 0, top: 650, width: 1080, height: 165, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // HEMAT badge background
                { type: 'rect', left: 390, top: 669, width: 300, height: 50, rx: 25, ry: 25, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 290, top: 1100, width: 500, height: 62, rx: 31, ry: 31, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 78, width: 920, text: 'PROMO TERBATAS', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 108, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 50, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 214, width: 920, text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU.', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // HEMAT badge text
                { type: 'textbox', left: 390, top: 685, width: 300, text: 'HEMAT 18%', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Original price label
                { type: 'textbox', left: 80, top: 728, width: 400, text: 'Harga Normal', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                // Original price (strikethrough)
                { type: 'textbox', left: 80, top: 748, width: 380, text: 'Rp 36.000.000', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#94A3B8', linethrough: true, originX: 'left', originY: 'top', editable: true },
                // Discounted price label
                { type: 'textbox', left: 580, top: 728, width: 420, text: 'Harga Promo', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#0084FF', originX: 'left', originY: 'top', editable: true },
                // Discounted price
                { type: 'textbox', left: 580, top: 748, width: 445, text: 'Rp 29.500.000', fontSize: 38, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 832, width: 960, text: 'Quad: Rp 29.500.000 | Triple: Rp 31.500.000 | Double: Rp 33.500.000', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 60, top: 862, width: 960, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#EF4444', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (4 items, blue diamonds)
                { type: 'textbox', left: 100, top: 904, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0084FF' }, styles: { 0: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 1: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 2: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 3: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } } } },
                // CTA text
                { type: 'textbox', left: 290, top: 1119, width: 500, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'promo-story-conversion',
        name: 'Promo Diskon Umrah (Story)',
        description: 'Harga coret dengan badge HEMAT dan urgency kursi tersisa, format Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0084FF', '#EF4444', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar (teal)
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Teal divider under header
                { type: 'rect', left: 80, top: 300, width: 220, height: 4, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Full-bleed image (edge-to-edge)
                { type: 'image', left: 0, top: 380, width: 1080, height: 580, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=580&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Teal price band background
                { type: 'rect', left: 0, top: 960, width: 1080, height: 265, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // HEMAT badge background
                { type: 'rect', left: 390, top: 978, width: 300, height: 62, rx: 31, ry: 31, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 300, top: 1540, width: 480, height: 72, rx: 36, ry: 36, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 110, width: 920, text: 'PROMO TERBATAS', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 148, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 58, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 316, width: 920, text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // HEMAT badge text
                { type: 'textbox', left: 390, top: 993, width: 300, text: 'HEMAT 18%', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Original price label
                { type: 'textbox', left: 80, top: 1052, width: 420, text: 'Harga Normal', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                // Original price (strikethrough)
                { type: 'textbox', left: 80, top: 1072, width: 400, text: 'Rp 36.000.000', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#94A3B8', linethrough: true, originX: 'left', originY: 'top', editable: true },
                // Discounted price label
                { type: 'textbox', left: 580, top: 1052, width: 420, text: 'Harga Promo', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#0084FF', originX: 'left', originY: 'top', editable: true },
                // Discounted price
                { type: 'textbox', left: 580, top: 1072, width: 445, text: 'Rp 29.500.000', fontSize: 44, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 1240, width: 960, text: 'Quad: Rp 29.500.000 | Triple: Rp 31.500.000 | Double: Rp 33.500.000', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 60, top: 1278, width: 960, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 21, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#EF4444', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (4 items, blue diamonds)
                { type: 'textbox', left: 100, top: 1325, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0084FF' }, styles: { 0: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 1: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 2: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 3: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } } } },
                // CTA text
                { type: 'textbox', left: 300, top: 1562, width: 480, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'hotel-airline-post-conversion',
        name: 'Hotel & Penerbangan (Post)',
        description: 'Dua foto berdampingan: hotel bintang 5 dan penerbangan langsung. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#F59E0B', '#0084FF', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar (emerald)
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Emerald divider under header
                { type: 'rect', left: 80, top: 186, width: 180, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Hotel image (left, edge-to-edge)
                { type: 'image', left: 0, top: 225, width: 505, height: 490, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=505&h=490&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Airline image (right, edge-to-edge)
                { type: 'image', left: 555, top: 225, width: 525, height: 490, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=525&h=490&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Emerald vertical separator
                { type: 'rect', left: 503, top: 225, width: 4, height: 490, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Dark overlay on hotel image bottom
                { type: 'rect', left: 0, top: 663, width: 505, height: 52, fill: '#0F172A', opacity: 0.78, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Dark overlay on airline image bottom
                { type: 'rect', left: 555, top: 663, width: 525, height: 52, fill: '#0F172A', opacity: 0.78, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 1 (date)
                { type: 'rect', left: 60, top: 735, width: 295, height: 95, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 2 (duration)
                { type: 'rect', left: 395, top: 735, width: 290, height: 95, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 3 (price)
                { type: 'rect', left: 725, top: 735, width: 295, height: 95, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 290, top: 1100, width: 500, height: 62, rx: 31, ry: 31, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 80, width: 920, text: 'HOTEL & MASKAPAI', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 114, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 48, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 200, width: 920, text: 'Nikmati pengalaman ibadah dengan fasilitas premium — hotel bintang 5 dan penerbangan langsung.', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Hotel image label (on overlay)
                { type: 'textbox', left: 0, top: 674, width: 505, text: '🏨 Hotel Bintang 5 Makkah', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Airline image label (on overlay)
                { type: 'textbox', left: 555, top: 674, width: 525, text: '✈ Penerbangan Langsung Jeddah', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 1 text (date)
                { type: 'textbox', left: 60, top: 752, width: 295, text: 'Keberangkatan\n12 Okt 2026', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 2 text (duration)
                { type: 'textbox', left: 395, top: 752, width: 290, text: 'Durasi\n12 Hari', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 3 text (price — emerald)
                { type: 'textbox', left: 725, top: 752, width: 295, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 860, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 100, top: 898, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5) & Madinah: Front Taiba / Setaraf (*5)\n◆ Maskapai Penerbangan Langsung Jeddah tanpa Transit\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
                // CTA text
                { type: 'textbox', left: 290, top: 1119, width: 500, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'hotel-airline-story-conversion',
        name: 'Hotel & Penerbangan (Story)',
        description: 'Dua foto berdampingan: hotel bintang 5 dan penerbangan langsung, format Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#F59E0B', '#0084FF', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar (emerald)
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Emerald divider under header
                { type: 'rect', left: 80, top: 265, width: 220, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Hotel image (left, edge-to-edge)
                { type: 'image', left: 0, top: 348, width: 505, height: 692, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=505&h=692&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Airline image (right, edge-to-edge)
                { type: 'image', left: 555, top: 348, width: 525, height: 692, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=525&h=692&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Emerald vertical separator
                { type: 'rect', left: 503, top: 348, width: 4, height: 692, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Dark overlay on hotel image bottom
                { type: 'rect', left: 0, top: 980, width: 505, height: 60, fill: '#0F172A', opacity: 0.78, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Dark overlay on airline image bottom
                { type: 'rect', left: 555, top: 980, width: 525, height: 60, fill: '#0F172A', opacity: 0.78, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 1 (date)
                { type: 'rect', left: 60, top: 1058, width: 295, height: 118, rx: 16, ry: 16, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 2 (duration)
                { type: 'rect', left: 395, top: 1058, width: 290, height: 118, rx: 16, ry: 16, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 3 (price)
                { type: 'rect', left: 725, top: 1058, width: 295, height: 118, rx: 16, ry: 16, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 300, top: 1470, width: 480, height: 72, rx: 36, ry: 36, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 88, width: 920, text: 'HOTEL & MASKAPAI', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 126, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 56, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 282, width: 920, text: 'Nikmati pengalaman ibadah dengan fasilitas premium — hotel bintang 5 dan penerbangan langsung.', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Hotel image label (on overlay)
                { type: 'textbox', left: 0, top: 994, width: 505, text: '🏨 Hotel Bintang 5 Makkah', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Airline image label (on overlay)
                { type: 'textbox', left: 555, top: 994, width: 525, text: '✈ Penerbangan Langsung Jeddah', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 1 text (date)
                { type: 'textbox', left: 60, top: 1075, width: 295, text: 'Keberangkatan\n12 Okt 2026', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 2 text (duration)
                { type: 'textbox', left: 395, top: 1075, width: 290, text: 'Durasi\n12 Hari', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 3 text (price — emerald)
                { type: 'textbox', left: 725, top: 1075, width: 295, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 1196, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 100, top: 1238, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5) & Madinah: Front Taiba (*5)\n◆ Maskapai Penerbangan Langsung Jeddah tanpa Transit\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 21, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
                // CTA text
                { type: 'textbox', left: 300, top: 1493, width: 480, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'feature-grid-post-conversion',
        name: 'Grid Fasilitas Umrah (Post)',
        description: 'Split vertikal: foto tall di kiri, kartu fasilitas bertumpuk di kanan. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0084FF', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar (indigo)
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Indigo divider under header
                { type: 'rect', left: 80, top: 182, width: 180, height: 3, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Left panel: tall portrait image
                { type: 'image', left: 0, top: 220, width: 510, height: 990, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=510&h=990&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Thin separator
                { type: 'rect', left: 513, top: 220, width: 3, height: 990, fill: '#0084FF', opacity: 0.4, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: Card 1 (hotel)
                { type: 'rect', left: 550, top: 235, width: 510, height: 168, rx: 14, ry: 14, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: Card 2 (airline)
                { type: 'rect', left: 550, top: 415, width: 510, height: 168, rx: 14, ry: 14, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: Card 3 (duration)
                { type: 'rect', left: 550, top: 595, width: 510, height: 168, rx: 14, ry: 14, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: Card 4 (price — solid indigo)
                { type: 'rect', left: 550, top: 775, width: 510, height: 190, rx: 14, ry: 14, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: CTA button
                { type: 'rect', left: 550, top: 1035, width: 510, height: 60, rx: 30, ry: 30, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: Category
                { type: 'textbox', left: 80, top: 78, width: 920, text: 'KEUNGGULAN PAKET', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', charSpacing: 200, originX: 'left', originY: 'top', editable: true },
                // Header: Title
                { type: 'textbox', left: 80, top: 108, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 48, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Card 1: field label
                { type: 'textbox', left: 550, top: 258, width: 510, text: 'HOTEL BERBINTANG 5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Card 1: value
                { type: 'textbox', left: 550, top: 280, width: 510, text: 'Anjum / Setaraf Makkah & Madinah', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 1: sub
                { type: 'textbox', left: 550, top: 330, width: 510, text: 'Lokasi premium dekat Masjidil Haram', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 2: field label
                { type: 'textbox', left: 550, top: 438, width: 510, text: 'MASKAPAI PENERBANGAN', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Card 2: value
                { type: 'textbox', left: 550, top: 460, width: 510, text: 'Saudia Airlines / Direct Jeddah', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 2: sub
                { type: 'textbox', left: 550, top: 510, width: 510, text: 'Penerbangan langsung tanpa transit', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 3: field label
                { type: 'textbox', left: 550, top: 618, width: 510, text: 'DURASI & KEBERANGKATAN', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Card 3: value
                { type: 'textbox', left: 550, top: 640, width: 510, text: '12 Hari · 12 Okt 2026', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 3: sub
                { type: 'textbox', left: 550, top: 690, width: 510, text: '8 hari beribadah di Tanah Suci', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 4 (price): field label (white)
                { type: 'textbox', left: 550, top: 800, width: 510, text: 'HARGA MULAI', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Card 4 (price): value (white)
                { type: 'textbox', left: 550, top: 826, width: 510, text: 'Rp 32.500.000', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 4 (price): sub (white)
                { type: 'textbox', left: 550, top: 876, width: 510, text: 'per pax · Quad room', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 4 (price): note (white)
                { type: 'textbox', left: 550, top: 910, width: 510, text: 'Hubungi kami untuk penawaran terbaik', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 550, top: 975, width: 510, text: 'Quad: Rp 32.5 Jt | Triple: Rp 34.5 Jt | Double: Rp 36.5 Jt', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 550, top: 1054, width: 510, text: 'DAFTAR SEKARANG', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'feature-grid-story-conversion',
        name: 'Grid Fasilitas Umrah (Story)',
        description: 'Split vertikal: foto tall di kiri, kartu fasilitas bertumpuk di kanan, format Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0084FF', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar (indigo)
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Indigo divider under header
                { type: 'rect', left: 80, top: 295, width: 200, height: 4, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Left panel: tall portrait image
                { type: 'image', left: 0, top: 320, width: 510, height: 1420, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=510&h=1420&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Thin separator
                { type: 'rect', left: 513, top: 320, width: 3, height: 1420, fill: '#0084FF', opacity: 0.4, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: Card 1 (hotel)
                { type: 'rect', left: 550, top: 340, width: 510, height: 218, rx: 16, ry: 16, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: Card 2 (airline)
                { type: 'rect', left: 550, top: 574, width: 510, height: 218, rx: 16, ry: 16, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: Card 3 (duration)
                { type: 'rect', left: 550, top: 808, width: 510, height: 218, rx: 16, ry: 16, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: Card 4 (price — solid indigo)
                { type: 'rect', left: 550, top: 1042, width: 510, height: 248, rx: 16, ry: 16, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Right panel: CTA button
                { type: 'rect', left: 550, top: 1480, width: 510, height: 72, rx: 36, ry: 36, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: Category
                { type: 'textbox', left: 80, top: 110, width: 920, text: 'KEUNGGULAN PAKET', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', charSpacing: 200, originX: 'left', originY: 'top', editable: true },
                // Header: Title
                { type: 'textbox', left: 80, top: 144, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 58, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Card 1: field label
                { type: 'textbox', left: 550, top: 364, width: 510, text: 'HOTEL BERBINTANG 5', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Card 1: value
                { type: 'textbox', left: 550, top: 390, width: 510, text: 'Anjum / Setaraf Makkah & Madinah', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 1: sub
                { type: 'textbox', left: 550, top: 458, width: 510, text: 'Lokasi premium dekat Masjidil Haram', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 2: field label
                { type: 'textbox', left: 550, top: 598, width: 510, text: 'MASKAPAI PENERBANGAN', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Card 2: value
                { type: 'textbox', left: 550, top: 624, width: 510, text: 'Saudia Airlines / Direct Jeddah', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 2: sub
                { type: 'textbox', left: 550, top: 692, width: 510, text: 'Penerbangan langsung tanpa transit', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 3: field label
                { type: 'textbox', left: 550, top: 832, width: 510, text: 'DURASI & KEBERANGKATAN', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Card 3: value
                { type: 'textbox', left: 550, top: 858, width: 510, text: '12 Hari · 12 Okt 2026', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 3: sub
                { type: 'textbox', left: 550, top: 926, width: 510, text: '8 hari beribadah di Tanah Suci', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 4 (price): field label (white)
                { type: 'textbox', left: 550, top: 1068, width: 510, text: 'HARGA MULAI', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Card 4 (price): value (white)
                { type: 'textbox', left: 550, top: 1098, width: 510, text: 'Rp 32.500.000', fontSize: 38, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 4 (price): sub (white)
                { type: 'textbox', left: 550, top: 1152, width: 510, text: 'per pax · Quad room', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 4 (price): note (white)
                { type: 'textbox', left: 550, top: 1194, width: 510, text: 'Hubungi kami untuk penawaran terbaik', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 550, top: 1310, width: 510, text: 'Quad: Rp 32.5 Jt | Triple: Rp 34.5 Jt', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 550, top: 1501, width: 510, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'departure-focus-post-conversion',
        name: 'Fokus Keberangkatan (Post)',
        description: 'Tanggal besar dioverlay di atas gambar dengan panel putih semi-transparan. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#F59E0B', '#0084FF', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar (amber)
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Amber divider under header
                { type: 'rect', left: 80, top: 192, width: 180, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Full-bleed image (edge-to-edge)
                { type: 'image', left: 0, top: 252, width: 1080, height: 465, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=465&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // White translucent overlay panel (date hero) ON the image
                { type: 'rect', left: 0, top: 598, width: 1080, height: 119, fill: '#FFFFFF', opacity: 0.88, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Amber accent strip left
                { type: 'rect', left: 80, top: 610, width: 6, height: 96, rx: 3, ry: 3, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Amber accent strip right
                { type: 'rect', left: 994, top: 610, width: 6, height: 96, rx: 3, ry: 3, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Price card (amber tint)
                { type: 'rect', left: 60, top: 740, width: 455, height: 110, rx: 16, ry: 16, fill: '#FFFBEB', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Duration card (neutral)
                { type: 'rect', left: 565, top: 740, width: 455, height: 110, rx: 16, ry: 16, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 290, top: 1100, width: 500, height: 62, rx: 31, ry: 31, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 78, width: 920, text: 'UMRAH REGULER', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 112, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 50, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 208, width: 920, text: 'Bergabunglah bersama ribuan jamaah berpengalaman dalam perjalanan ibadah Umrah terbaik.', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // "KEBERANGKATAN" label (on overlay, left)
                { type: 'textbox', left: 90, top: 609, width: 430, text: 'KEBERANGKATAN', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // "SYAWAL 1447H" label (on overlay, right)
                { type: 'textbox', left: 560, top: 609, width: 430, text: 'SYAWAL 1447H', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 180, textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Large date (on overlay, centered)
                { type: 'textbox', left: 80, top: 628, width: 920, text: '12 OKT 2026', fontSize: 54, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Price card: label
                { type: 'textbox', left: 60, top: 760, width: 455, text: 'HARGA MULAI', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Price card: value
                { type: 'textbox', left: 60, top: 784, width: 455, text: 'Rp 32.500.000', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Duration card: label
                { type: 'textbox', left: 565, top: 760, width: 455, text: 'DURASI PAKET', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Duration card: value
                { type: 'textbox', left: 565, top: 784, width: 455, text: '12 Hari 9 Malam', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 876, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 100, top: 908, width: 880, text: '◆ Hotel Makkah & Madinah Bintang 5 dekat Masjidil Haram\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
                // CTA text
                { type: 'textbox', left: 290, top: 1119, width: 500, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'departure-focus-story-conversion',
        name: 'Fokus Keberangkatan (Story)',
        description: 'Tanggal besar dioverlay di atas gambar dengan panel putih semi-transparan, format Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#F59E0B', '#0084FF', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar (amber)
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Amber divider under header
                { type: 'rect', left: 80, top: 290, width: 220, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Full-bleed image (edge-to-edge)
                { type: 'image', left: 0, top: 360, width: 1080, height: 660, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=660&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // White translucent overlay panel ON the image
                { type: 'rect', left: 0, top: 856, width: 1080, height: 164, fill: '#FFFFFF', opacity: 0.88, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Amber accent strip left
                { type: 'rect', left: 80, top: 868, width: 6, height: 136, rx: 3, ry: 3, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Amber accent strip right
                { type: 'rect', left: 994, top: 868, width: 6, height: 136, rx: 3, ry: 3, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Price card (amber tint)
                { type: 'rect', left: 60, top: 1040, width: 455, height: 130, rx: 18, ry: 18, fill: '#FFFBEB', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Duration card (neutral)
                { type: 'rect', left: 565, top: 1040, width: 455, height: 130, rx: 18, ry: 18, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 300, top: 1480, width: 480, height: 72, rx: 36, ry: 36, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 120, width: 920, text: 'UMRAH REGULER', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 158, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 58, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 308, width: 920, text: 'Bergabunglah bersama ribuan jamaah berpengalaman dalam perjalanan ibadah Umrah terbaik.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // "KEBERANGKATAN" label (on overlay, left)
                { type: 'textbox', left: 90, top: 870, width: 430, text: 'KEBERANGKATAN', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // "SYAWAL 1447H" label (on overlay, right)
                { type: 'textbox', left: 560, top: 870, width: 430, text: 'SYAWAL 1447H', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 180, textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Large date (on overlay, centered)
                { type: 'textbox', left: 80, top: 893, width: 920, text: '12 OKT 2026', fontSize: 70, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Price card: label
                { type: 'textbox', left: 60, top: 1062, width: 455, text: 'HARGA MULAI', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Price card: value
                { type: 'textbox', left: 60, top: 1090, width: 455, text: 'Rp 32.500.000', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Duration card: label
                { type: 'textbox', left: 565, top: 1062, width: 455, text: 'DURASI PAKET', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Duration card: value
                { type: 'textbox', left: 565, top: 1090, width: 455, text: '12 Hari 9 Malam', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 1196, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 100, top: 1240, width: 880, text: '◆ Hotel Makkah & Madinah Bintang 5 dekat Masjidil Haram\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 21, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
                // CTA text
                { type: 'textbox', left: 300, top: 1502, width: 480, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'ribbon-banner-post-conversion',
        name: 'Banner Info Ribbon (Post)',
        description: 'Foto full-bleed dengan ribbon info amber tua menyatu di tepi bawah gambar. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0F172A', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Divider under header
                { type: 'rect', left: 80, top: 182, width: 180, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Hero image (extended so the ribbon sits inside its bottom edge)
                { type: 'image', left: 60, top: 252, width: 960, height: 450, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&h=450&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Info ribbon overlay (dark navy translucent, inside image bottom)
                { type: 'rect', left: 60, top: 612, width: 960, height: 90, fill: '#0F172A', opacity: 0.8, originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 290, top: 990, width: 500, height: 62, rx: 31, ry: 31, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: category
                { type: 'textbox', left: 80, top: 78, width: 920, text: 'UMRAH REGULER', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Header: title
                { type: 'textbox', left: 80, top: 108, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 50, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Header: description
                { type: 'textbox', left: 80, top: 198, width: 920, text: 'Nikmati kenyamanan ibadah bersama travel berizin resmi PPIU dari awal hingga akhir perjalanan.', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Ribbon: date
                { type: 'textbox', left: 60, top: 630, width: 320, text: 'Keberangkatan\n12 Okt 2026', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', lineHeight: 1.25, originX: 'left', originY: 'top', editable: true },
                // Ribbon: duration
                { type: 'textbox', left: 380, top: 630, width: 320, text: 'Durasi\n12 Hari', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', lineHeight: 1.25, originX: 'left', originY: 'top', editable: true },
                // Ribbon: price
                { type: 'textbox', left: 700, top: 630, width: 320, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', lineHeight: 1.25, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 722, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (4 items, amber diamonds)
                { type: 'textbox', left: 100, top: 760, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 3: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
                // CTA text
                { type: 'textbox', left: 290, top: 1009, width: 500, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 60, top: 1082, width: 960, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#B45309', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'ribbon-banner-story-conversion',
        name: 'Banner Info Ribbon (Story)',
        description: 'Foto full-bleed dengan ribbon info amber tua menyatu di tepi bawah gambar, format Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0F172A', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Divider under header
                { type: 'rect', left: 80, top: 290, width: 220, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Hero image (extended so the ribbon sits inside its bottom edge)
                { type: 'image', left: 0, top: 390, width: 1080, height: 610, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=610&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Info ribbon overlay (dark navy translucent, inside image bottom)
                { type: 'rect', left: 0, top: 870, width: 1080, height: 130, fill: '#0F172A', opacity: 0.8, originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 300, top: 1450, width: 480, height: 72, rx: 36, ry: 36, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: category
                { type: 'textbox', left: 80, top: 120, width: 920, text: 'UMRAH REGULER', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Header: title
                { type: 'textbox', left: 80, top: 158, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 58, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Header: description
                { type: 'textbox', left: 80, top: 308, width: 920, text: 'Nikmati kenyamanan ibadah bersama travel berizin resmi PPIU dari awal hingga akhir perjalanan.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Ribbon: date
                { type: 'textbox', left: 80, top: 905, width: 280, text: 'Keberangkatan\n12 Okt 2026', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Ribbon: duration
                { type: 'textbox', left: 400, top: 905, width: 280, text: 'Durasi\n12 Hari', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Ribbon: price
                { type: 'textbox', left: 720, top: 905, width: 280, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1020, width: 920, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (4 items, amber diamonds)
                { type: 'textbox', left: 120, top: 1060, width: 840, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 3: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
                // CTA text
                { type: 'textbox', left: 300, top: 1473, width: 480, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 80, top: 1560, width: 920, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#B45309', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'price-badge-post-conversion',
        name: 'Badge Harga Bundar (Post)',
        description: 'Badge harga bundar melayang di sudut foto. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0066CC', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Divider under header
                { type: 'rect', left: 80, top: 184, width: 180, height: 3, fill: '#0066CC', originX: 'left', originY: 'top', selectable: true },
                // Hero image
                { type: 'image', left: 60, top: 252, width: 960, height: 420, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&h=420&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Circular price badge overlapping image corner
                { type: 'rect', left: 820, top: 600, width: 170, height: 170, rx: 85, ry: 85, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 290, top: 950, width: 500, height: 62, rx: 31, ry: 31, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: category
                { type: 'textbox', left: 80, top: 78, width: 920, text: 'PROMO SPESIAL UMRAH', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0066CC', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Header: title
                { type: 'textbox', left: 80, top: 108, width: 920, text: 'Umrah Hemat Syawal 1447H', fontSize: 48, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Header: description
                { type: 'textbox', left: 80, top: 196, width: 920, text: 'Nikmati promo spesial dengan fasilitas lengkap dan pelayanan terbaik.', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Badge: label
                { type: 'textbox', left: 820, top: 640, width: 170, text: 'MULAI DARI', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0066CC', textAlign: 'center', charSpacing: 80, originX: 'left', originY: 'top', editable: true },
                // Badge: price
                { type: 'textbox', left: 820, top: 662, width: 170, text: 'Rp32,5Jt', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0066CC', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Info line
                { type: 'textbox', left: 60, top: 710, width: 960, text: 'Keberangkatan 12 Okt 2026   •   Durasi 12 Hari 9 Malam', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 745, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (4 items, deep-blue diamonds)
                { type: 'textbox', left: 100, top: 785, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0066CC' }, styles: { 0: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 1: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 2: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 3: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } } } },
                // CTA text
                { type: 'textbox', left: 290, top: 969, width: 500, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 60, top: 1030, width: 960, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'price-badge-story-conversion',
        name: 'Badge Harga Bundar (Story)',
        description: 'Badge harga bundar melayang di sudut foto, format Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0066CC', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Divider under header
                { type: 'rect', left: 80, top: 282, width: 200, height: 4, fill: '#0066CC', originX: 'left', originY: 'top', selectable: true },
                // Hero image
                { type: 'image', left: 80, top: 390, width: 920, height: 620, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=920&h=620&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Circular price badge overlapping image corner
                { type: 'rect', left: 720, top: 940, width: 220, height: 220, rx: 110, ry: 110, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 300, top: 1470, width: 480, height: 72, rx: 36, ry: 36, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: category
                { type: 'textbox', left: 80, top: 100, width: 920, text: 'PROMO SPESIAL UMRAH', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0066CC', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Header: title
                { type: 'textbox', left: 80, top: 140, width: 920, text: 'Umrah Hemat Syawal 1447H', fontSize: 56, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Header: description
                { type: 'textbox', left: 80, top: 300, width: 920, text: 'Nikmati promo spesial dengan fasilitas lengkap dan pelayanan terbaik.', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Badge: label
                { type: 'textbox', left: 720, top: 995, width: 220, text: 'MULAI DARI', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0066CC', textAlign: 'center', charSpacing: 80, originX: 'left', originY: 'top', editable: true },
                // Badge: price
                { type: 'textbox', left: 720, top: 1025, width: 220, text: 'Rp32,5Jt', fontSize: 30, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0066CC', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Info line
                { type: 'textbox', left: 80, top: 1190, width: 920, text: 'Keberangkatan 12 Okt 2026   •   Durasi 12 Hari 9 Malam', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1235, width: 920, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (4 items, deep-blue diamonds)
                { type: 'textbox', left: 120, top: 1280, width: 840, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0066CC' }, styles: { 0: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 1: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 2: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 3: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } } } },
                // CTA text
                { type: 'textbox', left: 300, top: 1493, width: 480, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 80, top: 1570, width: 920, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'sidebar-post-conversion',
        name: 'Kolom Info & Foto (Post)',
        description: 'Kolom info paket di kiri, foto besar di kanan dipisah garis tipis. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#D4A373', '#B45309', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Vertical column divider
                { type: 'rect', left: 400, top: 34, width: 3, height: 1176, fill: '#0084FF', opacity: 0.4, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Small divider under left column title
                { type: 'rect', left: 40, top: 260, width: 60, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Hero image (right column)
                { type: 'image', left: 420, top: 34, width: 620, height: 650, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=620&h=650&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // CTA button background (left column)
                { type: 'rect', left: 40, top: 640, width: 320, height: 56, rx: 28, ry: 28, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Left column: category
                { type: 'textbox', left: 40, top: 50, width: 330, text: 'UMRAH REGULER', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Left column: title
                { type: 'textbox', left: 40, top: 84, width: 330, text: 'Umrah Premium\nSyawal 1447H', fontSize: 34, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.25, originX: 'left', originY: 'top', editable: true },
                // Left column: description
                { type: 'textbox', left: 40, top: 200, width: 330, text: 'Ibadah nyaman bersama travel berizin resmi PPIU.', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.5, originX: 'left', originY: 'top', editable: true },
                // Left column: date label
                { type: 'textbox', left: 40, top: 290, width: 330, text: 'KEBERANGKATAN', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 120, originX: 'left', originY: 'top', editable: true },
                // Left column: date value
                { type: 'textbox', left: 40, top: 310, width: 330, text: '12 Okt 2026', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                // Left column: duration label
                { type: 'textbox', left: 40, top: 358, width: 330, text: 'DURASI PAKET', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 120, originX: 'left', originY: 'top', editable: true },
                // Left column: duration value
                { type: 'textbox', left: 40, top: 378, width: 330, text: '12 Hari 9 Malam', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                // Left column: price label
                { type: 'textbox', left: 40, top: 426, width: 330, text: 'HARGA MULAI', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 120, originX: 'left', originY: 'top', editable: true },
                // Left column: price value
                { type: 'textbox', left: 40, top: 448, width: 330, text: 'Rp 32.500.000', fontSize: 30, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#B45309', originX: 'left', originY: 'top', editable: true },
                // Left column: room pricing
                { type: 'textbox', left: 40, top: 500, width: 330, text: 'Quad: Rp 32.500.000\nTriple: Rp 34.500.000\nDouble: Rp 36.500.000', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#64748B', lineHeight: 1.7, originX: 'left', originY: 'top', editable: true },
                // Left column: CTA text
                { type: 'textbox', left: 40, top: 658, width: 320, text: 'DAFTAR SEKARANG', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 80, originX: 'left', originY: 'top', editable: true },
                // Right column: feature bullet list (5 items, primary-blue diamonds)
                { type: 'textbox', left: 420, top: 714, width: 620, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman\n◆ Air Zamzam 5 Liter & Perlengkapan Umrah Lengkap', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.7, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0084FF' }, styles: { 0: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 1: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 2: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 3: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 4: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } } } },
                // Right column: urgency
                { type: 'textbox', left: 420, top: 884, width: 620, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#B45309', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Right column: highlight list
                { type: 'textbox', left: 420, top: 924, width: 620, text: '🏨 Hotel Bintang 5 Makkah & Madinah\n✈ Direct Jeddah Tanpa Transit\n🕌 Muthawwif Berpengalaman', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#334155', lineHeight: 2, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'sidebar-story-conversion',
        name: 'Kolom Info & Foto (Story)',
        description: 'Kolom info paket di kiri, foto besar di kanan dipisah garis tipis, format Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#D4A373', '#B45309', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Vertical column divider
                { type: 'rect', left: 400, top: 40, width: 3, height: 1700, fill: '#0084FF', opacity: 0.4, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Small divider under left column title
                { type: 'rect', left: 40, top: 340, width: 70, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Hero image (right column)
                { type: 'image', left: 420, top: 40, width: 620, height: 900, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=620&h=900&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // CTA button background (left column)
                { type: 'rect', left: 40, top: 900, width: 320, height: 60, rx: 30, ry: 30, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Left column: category
                { type: 'textbox', left: 40, top: 70, width: 330, text: 'UMRAH REGULER', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Left column: title
                { type: 'textbox', left: 40, top: 106, width: 330, text: 'Umrah Premium\nSyawal 1447H', fontSize: 34, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.25, originX: 'left', originY: 'top', editable: true },
                // Left column: description
                { type: 'textbox', left: 40, top: 210, width: 330, text: 'Ibadah nyaman bersama travel berizin resmi PPIU.', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.5, originX: 'left', originY: 'top', editable: true },
                // Left column: date label
                { type: 'textbox', left: 40, top: 370, width: 330, text: 'KEBERANGKATAN', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 120, originX: 'left', originY: 'top', editable: true },
                // Left column: date value
                { type: 'textbox', left: 40, top: 392, width: 330, text: '12 Okt 2026', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                // Left column: duration label
                { type: 'textbox', left: 40, top: 450, width: 330, text: 'DURASI PAKET', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 120, originX: 'left', originY: 'top', editable: true },
                // Left column: duration value
                { type: 'textbox', left: 40, top: 472, width: 330, text: '12 Hari 9 Malam', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                // Left column: price label
                { type: 'textbox', left: 40, top: 540, width: 330, text: 'HARGA MULAI', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 120, originX: 'left', originY: 'top', editable: true },
                // Left column: price value
                { type: 'textbox', left: 40, top: 562, width: 330, text: 'Rp 32.500.000', fontSize: 34, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#B45309', originX: 'left', originY: 'top', editable: true },
                // Left column: room pricing
                { type: 'textbox', left: 40, top: 630, width: 330, text: 'Quad: Rp 32.500.000\nTriple: Rp 34.500.000\nDouble: Rp 36.500.000', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#64748B', lineHeight: 1.7, originX: 'left', originY: 'top', editable: true },
                // Left column: CTA text
                { type: 'textbox', left: 40, top: 919, width: 320, text: 'DAFTAR SEKARANG', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 80, originX: 'left', originY: 'top', editable: true },
                // Right column: feature bullet list (5 items, primary-blue diamonds)
                { type: 'textbox', left: 420, top: 1000, width: 620, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman\n◆ Air Zamzam 5 Liter & Perlengkapan Umrah Lengkap', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.7, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0084FF' }, styles: { 0: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 1: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 2: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 3: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 4: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } } } },
                // Right column: urgency
                { type: 'textbox', left: 420, top: 1190, width: 620, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#B45309', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Right column: highlight list
                { type: 'textbox', left: 420, top: 1240, width: 620, text: '🏨 Hotel Bintang 5 Makkah & Madinah\n✈ Direct Jeddah Tanpa Transit\n🕌 Muthawwif Berpengalaman', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#334155', lineHeight: 2, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'stat-badges-post-conversion',
        name: 'Statistik Keunggulan (Post)',
        description: 'Tiga badge statistik bundar di bawah foto full-bleed. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#334155', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Divider under header
                { type: 'rect', left: 80, top: 184, width: 180, height: 3, fill: '#334155', originX: 'left', originY: 'top', selectable: true },
                // Hero image (full-bleed)
                { type: 'image', left: 0, top: 252, width: 1080, height: 360, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=360&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Stat circle 1
                { type: 'rect', left: 160, top: 637, width: 120, height: 120, rx: 60, ry: 60, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: true },
                // Stat circle 2
                { type: 'rect', left: 480, top: 637, width: 120, height: 120, rx: 60, ry: 60, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: true },
                // Stat circle 3
                { type: 'rect', left: 800, top: 637, width: 120, height: 120, rx: 60, ry: 60, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 290, top: 1020, width: 500, height: 62, rx: 31, ry: 31, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: category
                { type: 'textbox', left: 80, top: 78, width: 920, text: 'UMRAH EKSKLUSIF', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#334155', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Header: title
                { type: 'textbox', left: 80, top: 108, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 48, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Header: description
                { type: 'textbox', left: 80, top: 196, width: 920, text: 'Rasakan pengalaman ibadah eksklusif dengan layanan premium menyeluruh.', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Stat 1: number
                { type: 'textbox', left: 160, top: 669, width: 120, text: '12', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Stat 2: number
                { type: 'textbox', left: 480, top: 669, width: 120, text: '★5', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0066CC', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Stat 3: number
                { type: 'textbox', left: 800, top: 669, width: 120, text: '0', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Stat 1: label
                { type: 'textbox', left: 160, top: 765, width: 120, text: 'HARI\nPERJALANAN', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#64748B', textAlign: 'center', lineHeight: 1.3, charSpacing: 30, originX: 'left', originY: 'top', editable: true },
                // Stat 2: label
                { type: 'textbox', left: 480, top: 765, width: 120, text: 'HOTEL\nBINTANG', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#64748B', textAlign: 'center', lineHeight: 1.3, charSpacing: 30, originX: 'left', originY: 'top', editable: true },
                // Stat 3: label
                { type: 'textbox', left: 800, top: 765, width: 120, text: 'TRANSIT\nPESAWAT', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#64748B', textAlign: 'center', lineHeight: 1.3, charSpacing: 30, originX: 'left', originY: 'top', editable: true },
                // Price line
                { type: 'textbox', left: 60, top: 832, width: 960, text: 'Harga Mulai Rp 32.500.000 /pax', fontSize: 26, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 870, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 100, top: 907, width: 880, text: '◆ Hotel Makkah & Madinah Bintang 5 dekat Masjidil Haram\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.7, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
                // Urgency
                { type: 'textbox', left: 60, top: 1100, width: 960, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 290, top: 1039, width: 500, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'stat-badges-story-conversion',
        name: 'Statistik Keunggulan (Story)',
        description: 'Tiga badge statistik bundar di bawah foto full-bleed, format Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#334155', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Divider under header
                { type: 'rect', left: 80, top: 282, width: 200, height: 4, fill: '#334155', originX: 'left', originY: 'top', selectable: true },
                // Hero image (full-bleed)
                { type: 'image', left: 0, top: 390, width: 1080, height: 520, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=520&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Stat circle 1
                { type: 'rect', left: 140, top: 945, width: 170, height: 170, rx: 85, ry: 85, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: true },
                // Stat circle 2
                { type: 'rect', left: 455, top: 945, width: 170, height: 170, rx: 85, ry: 85, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: true },
                // Stat circle 3
                { type: 'rect', left: 770, top: 945, width: 170, height: 170, rx: 85, ry: 85, fill: '#FEF3C7', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 300, top: 1450, width: 480, height: 72, rx: 36, ry: 36, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: category
                { type: 'textbox', left: 80, top: 100, width: 920, text: 'UMRAH EKSKLUSIF', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#334155', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Header: title
                { type: 'textbox', left: 80, top: 140, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 56, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Header: description
                { type: 'textbox', left: 80, top: 300, width: 920, text: 'Rasakan pengalaman ibadah eksklusif dengan layanan premium menyeluruh.', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Stat 1: number
                { type: 'textbox', left: 140, top: 1000, width: 170, text: '12', fontSize: 38, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Stat 2: number
                { type: 'textbox', left: 455, top: 1000, width: 170, text: '★5', fontSize: 38, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0066CC', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Stat 3: number
                { type: 'textbox', left: 770, top: 1000, width: 170, text: '0', fontSize: 38, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Stat 1: label
                { type: 'textbox', left: 140, top: 1140, width: 170, text: 'HARI\nPERJALANAN', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#64748B', textAlign: 'center', lineHeight: 1.3, charSpacing: 30, originX: 'left', originY: 'top', editable: true },
                // Stat 2: label
                { type: 'textbox', left: 455, top: 1140, width: 170, text: 'HOTEL\nBINTANG', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#64748B', textAlign: 'center', lineHeight: 1.3, charSpacing: 30, originX: 'left', originY: 'top', editable: true },
                // Stat 3: label
                { type: 'textbox', left: 770, top: 1140, width: 170, text: 'TRANSIT\nPESAWAT', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#64748B', textAlign: 'center', lineHeight: 1.3, charSpacing: 30, originX: 'left', originY: 'top', editable: true },
                // Price line
                { type: 'textbox', left: 80, top: 1220, width: 920, text: 'Harga Mulai Rp 32.500.000 /pax', fontSize: 30, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1265, width: 920, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 120, top: 1310, width: 840, text: '◆ Hotel Makkah & Madinah Bintang 5 dekat Masjidil Haram\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.7, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
                // Urgency
                { type: 'textbox', left: 80, top: 1550, width: 920, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 300, top: 1473, width: 480, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'framed-photo-post-conversion',
        name: 'Bingkai Foto Premium (Post)',
        description: 'Foto dalam bingkai kartu putih melayang dengan label promo di sudut. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0084FF', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Divider under header
                { type: 'rect', left: 80, top: 184, width: 180, height: 3, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Frame card (white, elevated)
                { type: 'rect', left: 60, top: 252, width: 960, height: 500, rx: 20, ry: 20, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.18)', blur: 30, offsetX: 0, offsetY: 12 }, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Hero image (inside frame)
                { type: 'image', left: 80, top: 272, width: 920, height: 400, rx: 12, ry: 12, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=920&h=400&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Corner promo badge
                { type: 'rect', left: 40, top: 232, width: 160, height: 70, rx: 14, ry: 14, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 290, top: 1030, width: 500, height: 62, rx: 31, ry: 31, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: category
                { type: 'textbox', left: 80, top: 78, width: 920, text: 'UMRAH PREMIUM', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Header: title
                { type: 'textbox', left: 80, top: 108, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 48, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Header: description
                { type: 'textbox', left: 80, top: 196, width: 920, text: 'Pengalaman ibadah premium dengan fasilitas terbaik di Tanah Suci.', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Corner badge text
                { type: 'textbox', left: 40, top: 254, width: 160, text: 'HEMAT 18%', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0066CC', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Frame caption
                { type: 'textbox', left: 80, top: 692, width: 920, text: 'Hotel Bintang 5 di Jantung Kota Makkah', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Info line
                { type: 'textbox', left: 60, top: 800, width: 960, text: 'Rp 32.500.000/pax  •  12 Hari 9 Malam  •  Berangkat 12 Okt 2026', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 838, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (4 items, accent-blue diamonds)
                { type: 'textbox', left: 100, top: 876, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0066CC' }, styles: { 0: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 1: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 2: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 3: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } } } },
                // Urgency
                { type: 'textbox', left: 60, top: 1110, width: 960, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 290, top: 1049, width: 500, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'framed-photo-story-conversion',
        name: 'Bingkai Foto Premium (Story)',
        description: 'Foto dalam bingkai kartu putih melayang dengan label promo di sudut, format Story. Mendukung AI Auto-Fill.',
        type: 'Conversion',
        previewColors: ['#0084FF', '#F59E0B', '#F8FAFC'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Divider under header
                { type: 'rect', left: 80, top: 282, width: 200, height: 4, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Frame card (white, elevated)
                { type: 'rect', left: 60, top: 390, width: 960, height: 750, rx: 24, ry: 24, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.18)', blur: 36, offsetX: 0, offsetY: 16 }, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Hero image (inside frame)
                { type: 'image', left: 80, top: 410, width: 920, height: 620, rx: 16, ry: 16, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=920&h=620&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Corner promo badge
                { type: 'rect', left: 40, top: 365, width: 190, height: 84, rx: 16, ry: 16, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 300, top: 1450, width: 480, height: 72, rx: 36, ry: 36, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Header: category
                { type: 'textbox', left: 80, top: 100, width: 920, text: 'UMRAH PREMIUM', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Header: title
                { type: 'textbox', left: 80, top: 140, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 56, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Header: description
                { type: 'textbox', left: 80, top: 300, width: 920, text: 'Pengalaman ibadah premium dengan fasilitas terbaik di Tanah Suci.', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Corner badge text
                { type: 'textbox', left: 40, top: 392, width: 190, text: 'HEMAT 18%', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0066CC', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Frame caption
                { type: 'textbox', left: 80, top: 1055, width: 920, text: 'Hotel Bintang 5 di Jantung Kota Makkah', fontSize: 21, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Info line
                { type: 'textbox', left: 80, top: 1170, width: 920, text: 'Rp 32.500.000/pax  •  12 Hari 9 Malam  •  Berangkat 12 Okt 2026', fontSize: 21, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1215, width: 920, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet list (4 items, accent-blue diamonds)
                { type: 'textbox', left: 120, top: 1260, width: 840, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0066CC' }, styles: { 0: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 1: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 2: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } }, 3: { 0: { fill: '#0066CC' }, 1: { fill: '#0066CC' } } } },
                // Urgency
                { type: 'textbox', left: 80, top: 1550, width: 920, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 300, top: 1473, width: 480, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'tour-promo-post',
        name: 'Destinasi Pilihan (Post)',
        description: 'Showcase destinasi dengan foto dramatis dan tagline editorial. Tanpa harga atau CTA.',
        type: 'Tour Promotion',
        previewColors: ['#0F172A', '#F59E0B', '#D4A373'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Full-bleed image
                { type: 'image', left: 0, top: 270, width: 1080, height: 940, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=940&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Dark overlay on bottom of image (for tagline readability)
                { type: 'rect', left: 0, top: 970, width: 1080, height: 240, fill: '#0F172A', opacity: 0.80, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top amber accent bar (renders over image top edge)
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider under header text
                { type: 'rect', left: 80, top: 212, width: 200, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category label
                { type: 'textbox', left: 80, top: 80, width: 920, text: 'DESTINASI PILIHAN', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 112, width: 920, text: 'Madinah Al-Munawwarah', fontSize: 52, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.15, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 228, width: 920, text: 'Kota cahaya yang menyejukkan hati setiap hamba yang rindu kepada-Nya.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Tagline on dark overlay
                { type: 'textbox', left: 80, top: 988, width: 920, text: 'Kota Cahaya yang Menyejukkan Hati', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Sub-tagline on overlay
                { type: 'textbox', left: 80, top: 1042, width: 920, text: 'Rasakan ketenangan beribadah bersama ribuan jamaah terpilih Alfatih Dunia Wisata.', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#CBD5E1', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Amber highlight on overlay
                { type: 'rect', left: 80, top: 1130, width: 120, height: 4, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact (injected by injectFooterData)
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license (injected by injectFooterData)
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'tour-promo-story',
        name: 'Destinasi Pilihan (Story)',
        description: 'Showcase destinasi dengan foto dramatis dan tagline editorial, format Story. Tanpa harga atau CTA.',
        type: 'Tour Promotion',
        previewColors: ['#0F172A', '#F59E0B', '#D4A373'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Full-bleed image (from below header to footer)
                { type: 'image', left: 0, top: 320, width: 1080, height: 1420, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=1420&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Dark overlay on bottom of image
                { type: 'rect', left: 0, top: 1390, width: 1080, height: 350, fill: '#0F172A', opacity: 0.82, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top amber accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider under header text
                { type: 'rect', left: 80, top: 260, width: 220, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category label
                { type: 'textbox', left: 80, top: 110, width: 920, text: 'DESTINASI PILIHAN', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 148, width: 920, text: 'Madinah Al-Munawwarah', fontSize: 62, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.15, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 270, width: 920, text: 'Kota cahaya yang menyejukkan hati setiap hamba yang rindu kepada-Nya.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Tagline on dark overlay
                { type: 'textbox', left: 80, top: 1408, width: 920, text: 'Kota Cahaya yang Menyejukkan Hati', fontSize: 42, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Sub-tagline on overlay
                { type: 'textbox', left: 80, top: 1472, width: 920, text: 'Rasakan ketenangan beribadah bersama ribuan jamaah terpilih Alfatih Dunia Wisata.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#CBD5E1', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Amber highlight on overlay
                { type: 'rect', left: 80, top: 1612, width: 140, height: 5, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Footer brand
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact (injected)
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license (injected)
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'tour-promo-magazine-post',
        name: 'Sampul Majalah Ibadah (Post)',
        description: 'Sampul editorial dengan foto full-bleed dan judul besar di tengah bawah. Tanpa harga atau CTA.',
        type: 'Tour Promotion',
        previewColors: ['#0F172A', '#F59E0B', '#D4A373'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#0F172A', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'image', left: 0, top: 0, width: 1080, height: 1350, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=1350&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'rect', left: 0, top: 790, width: 1080, height: 560, fill: '#0F172A', opacity: 0.62, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 80, top: 826, width: 920, text: 'DESTINASI PILIHAN', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 200, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 864, width: 920, text: 'Makkah\nAl-Mukarramah', fontSize: 66, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1.15, originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 80, top: 1050, width: 160, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                { type: 'textbox', left: 80, top: 1074, width: 920, text: 'Rumah Suci yang Selalu Dirindukan Setiap Hati yang Beriman.', fontSize: 19, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#CBD5E1', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'tour-promo-itinerary-post',
        name: 'Rute Perjalanan Suci (Post)',
        description: 'Garis waktu 3 titik keberangkatan dengan banner foto di atas. Tanpa harga atau CTA.',
        type: 'Tour Promotion',
        previewColors: ['#F8FAFC', '#F59E0B', '#D4A373'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'image', left: 0, top: 0, width: 1080, height: 480, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1080&h=480&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 380, width: 1080, height: 100, fill: '#0F172A', opacity: 0.55, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 80, top: 404, width: 920, text: 'RUTE PERJALANAN', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 432, width: 920, text: 'Jejak Langkah ke Tanah Suci', fontSize: 34, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 233, top: 700, width: 614, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'circle', left: 233, top: 700, radius: 16, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: true },
                { type: 'circle', left: 540, top: 700, radius: 16, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: true },
                { type: 'circle', left: 847, top: 700, radius: 16, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: true },
                { type: 'textbox', left: 83, top: 650, width: 300, text: 'HARI 1', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 390, top: 650, width: 300, text: 'HARI 6', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 697, top: 650, width: 300, text: 'HARI 12', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 83, top: 740, width: 300, text: 'Jeddah', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 390, top: 740, width: 300, text: 'Madinah', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 697, top: 740, width: 300, text: 'Makkah', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 83, top: 774, width: 300, text: 'Tiba & transit\nmenuju kota suci', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.3, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 390, top: 774, width: 300, text: 'Ziarah Raudhah\n& Masjid Nabawi', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.3, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 697, top: 774, width: 300, text: 'Ibadah Umrah\ndi Masjidil Haram', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.3, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 900, width: 920, text: 'Setiap Langkah, Setiap Doa, Menuju Ridha-Nya', fontSize: 32, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 470, top: 972, width: 140, height: 3, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 140, top: 1000, width: 800, text: 'Nikmati perjalanan ibadah terencana dengan pembimbing berpengalaman.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'tour-promo-twin-city-post',
        name: 'Dua Kota Suci (Post)',
        description: 'Makkah dan Madinah berdampingan dengan label kota di bawah masing-masing foto. Tanpa harga atau CTA.',
        type: 'Tour Promotion',
        previewColors: ['#0F172A', '#0084FF', '#F59E0B'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#0F172A', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'image', left: 0, top: 210, width: 536, height: 1000, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=536&h=1000&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'image', left: 544, top: 210, width: 536, height: 1000, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=536&h=1000&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'rect', left: 536, top: 210, width: 8, height: 1000, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1140, width: 536, height: 70, fill: '#0F172A', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 544, top: 1140, width: 536, height: 70, fill: '#0F172A', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 0, top: 60, width: 1080, text: 'DUA KOTA SUCI', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 200, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 0, top: 92, width: 1080, text: 'Makkah & Madinah', fontSize: 50, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1.15, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 0, top: 1160, width: 536, text: 'MAKKAH', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', charSpacing: 100, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 544, top: 1160, width: 536, text: 'MADINAH', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', charSpacing: 100, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'documentation-post',
        name: 'Testimonial Jamaah (Post)',
        description: 'Kisah perjalanan jamaah — foto di kiri, kutipan testimoni di kanan. Tanpa harga.',
        type: 'Documentation',
        previewColors: ['#F59E0B', '#0F172A', '#FFFFFF'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#FFFFFF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'image', left: 0, top: 0, width: 510, height: 1210, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=510&h=1210&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'rect', left: 514, top: 0, width: 566, height: 1210, fill: '#FFFFFF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 510, top: 0, width: 4, height: 1210, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 540, top: 148, width: 200, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 540, top: 560, width: 220, height: 3, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 540, top: 70, width: 500, text: 'KISAH JAMAAH', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 540, top: 98, width: 500, text: 'Cerita dari Tanah Suci', fontSize: 32, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 536, top: 162, width: 520, text: '❝', fontSize: 90, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', lineHeight: 1, originX: 'left', originY: 'top', editable: false },
                { type: 'textbox', left: 540, top: 270, width: 500, text: 'Subhanallah, perjalanan umrah bersama Alfatih sangat luar biasa. Pembimbing ibadah yang sabar, hotel dekat Masjidil Haram, dan pelayanan yang penuh kasih. InsyaAllah kami ingin kembali.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#0F172A', lineHeight: 1.55, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 540, top: 524, width: 500, text: '★★★★★', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 540, top: 578, width: 500, text: 'Ibu Sari Wulandari', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 540, top: 612, width: 500, text: 'Umrah Premium Syawal 1447H', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 540, top: 638, width: 500, text: '12 – 24 Oktober 2026', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#94A3B8', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'documentation-story',
        name: 'Testimonial Jamaah (Story)',
        description: 'Kisah perjalanan jamaah — foto besar di atas, kutipan testimoni di bawah, format Story.',
        type: 'Documentation',
        previewColors: ['#F59E0B', '#0F172A', '#FFFFFF'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#FFFFFF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'image', left: 0, top: 0, width: 1080, height: 960, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=960&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'rect', left: 0, top: 820, width: 1080, height: 140, fill: '#0F172A', opacity: 0.72, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 960, width: 1080, height: 6, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 80, top: 1430, width: 280, height: 4, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 80, top: 842, width: 920, text: 'KISAH JAMAAH', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 874, width: 920, text: 'Cerita dari Tanah Suci', fontSize: 36, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 76, top: 988, width: 920, text: '❝', fontSize: 100, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', lineHeight: 1, originX: 'left', originY: 'top', editable: false },
                { type: 'textbox', left: 80, top: 1112, width: 920, text: 'Subhanallah, perjalanan umrah bersama Alfatih sangat luar biasa. Pembimbing ibadah yang sabar, hotel dekat Masjidil Haram, dan pelayanan yang penuh kasih sayang. InsyaAllah kami ingin kembali bersama keluarga.', fontSize: 26, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#0F172A', lineHeight: 1.6, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 1390, width: 920, text: '★★★★★', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 1450, width: 920, text: 'Ibu Sari Wulandari', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 1492, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 1526, width: 920, text: '12 – 24 Oktober 2026', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#94A3B8', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'documentation-mosaic-post',
        name: 'Momen Kebersamaan Jamaah (Post)',
        description: 'Kolase 4 foto dokumentasi kegiatan jamaah dengan judul editorial di atas.',
        type: 'Documentation',
        previewColors: ['#FFFFFF', '#F59E0B', '#0F172A'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#FFFFFF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'image', left: 60, top: 200, width: 474, height: 489, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=474&h=489&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'image', left: 546, top: 200, width: 474, height: 489, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=474&h=489&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'image', left: 60, top: 701, width: 474, height: 489, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=474&h=489&q=81', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'image', left: 546, top: 701, width: 474, height: 489, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=474&h=489&q=81', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'textbox', left: 80, top: 48, width: 920, text: 'DOKUMENTASI KEGIATAN', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 76, width: 920, text: 'Momen Kebersamaan Jamaah', fontSize: 40, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.15, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 138, width: 920, text: 'Kebersamaan dan kehangatan sepanjang perjalanan ibadah suci.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'documentation-diary-post',
        name: 'Diary Perjalanan (Post)',
        description: 'Foto besar dengan kartu catatan ala polaroid menumpuk di bagian bawah.',
        type: 'Documentation',
        previewColors: ['#F8FAFC', '#F59E0B', '#0F172A'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'image', left: 0, top: 0, width: 1080, height: 950, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=950&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 100, top: 820, width: 880, height: 380, rx: 16, ry: 16, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.18)', blur: 30, offsetX: 0, offsetY: 10 }, originX: 'left', originY: 'top', selectable: true },
                { type: 'rect', left: 140, top: 934, width: 120, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 140, top: 852, width: 800, text: 'CATATAN PERJALANAN', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 160, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 140, top: 880, width: 800, text: 'Kisah Hari ke-5 di Madinah', fontSize: 30, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 140, top: 956, width: 760, text: 'Jamaah mengunjungi Raudhah dan berziarah ke Makam Rasulullah dengan penuh kekhusyukan dan air mata kerinduan.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.5, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 140, top: 1140, width: 760, text: '05 Rabiul Akhir 1447H  •  Masjid Nabawi, Madinah', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#94A3B8', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'documentation-quote-card-post',
        name: 'Testimoni Sorotan (Post)',
        description: 'Kartu testimoni dengan foto jamaah dibingkai persegi dan kutipan besar di tengah.',
        type: 'Documentation',
        previewColors: ['#FFFFFF', '#F59E0B', '#D4A373'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#FFFFFF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'circle', left: 540, top: 210, radius: 150, fill: '#FEF3E2', originX: 'center', originY: 'center', selectable: false, evented: false },
                { type: 'rect', left: 430, top: 100, width: 220, height: 220, rx: 24, ry: 24, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'image', left: 438, top: 108, width: 204, height: 204, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=204&h=204&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 0, top: 360, width: 1080, text: '❝', fontSize: 90, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', lineHeight: 1, textAlign: 'center', originX: 'left', originY: 'top', editable: false },
                { type: 'textbox', left: 110, top: 460, width: 860, text: 'Perjalanan umrah ini membuka mata hati saya. Setiap sujud di Masjidil Haram terasa begitu dekat dengan Allah. Terima kasih Alfatih Dunia Wisata atas bimbingan yang penuh berkah.', fontSize: 26, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#0F172A', lineHeight: 1.6, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 0, top: 700, width: 1080, text: '★★★★★', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 0, top: 740, width: 1080, text: 'Bapak Ahmad Fauzi', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 0, top: 778, width: 1080, text: 'Umrah Reguler Ramadhan 1447H', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 480, top: 826, width: 120, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'content-post',
        name: 'Tips Umrah (Post)',
        description: 'Konten edukatif bergaya editorial — tipografi besar di atas latar putih bersih. Tanpa foto.',
        type: 'Content',
        previewColors: ['#F8FAFC', '#F59E0B', '#0084FF'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // White background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top amber accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Blue footer bar
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Left amber vertical accent strip
                { type: 'rect', left: 80, top: 160, width: 6, height: 880, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold separator below big number
                { type: 'rect', left: 120, top: 430, width: 440, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Thin amber divider before brand
                { type: 'rect', left: 120, top: 1080, width: 160, height: 2, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category label
                { type: 'textbox', left: 120, top: 148, width: 900, text: 'TIPS UMRAH', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Large tip number
                { type: 'textbox', left: 100, top: 178, width: 400, text: '01', fontSize: 200, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', lineHeight: 1, originX: 'left', originY: 'top', editable: true },
                // Tip title
                { type: 'textbox', left: 120, top: 460, width: 900, text: 'Niat yang Ikhlas\nadalah Kunci Ibadah', fontSize: 52, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Body text
                { type: 'textbox', left: 120, top: 642, width: 900, text: 'Sebelum berangkat, pastikan niat Anda murni karena Allah SWT semata. Ibadah yang diterima bukan hanya tentang fisik yang hadir di Tanah Suci — tetapi tentang hati yang hadir dan khusyuk dalam setiap doa dan amalan selama di sana.', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.65, originX: 'left', originY: 'top', editable: true },
                // Brand name
                { type: 'textbox', left: 60, top: 1228, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Contact (injected by injectFooterData)
                { type: 'textbox', left: 380, top: 1228, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // License (injected by injectFooterData)
                { type: 'textbox', left: 60, top: 1300, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'content-story',
        name: 'Tips Umrah (Story)',
        description: 'Konten edukatif bergaya editorial — tipografi besar di atas latar putih bersih, format Story.',
        type: 'Content',
        previewColors: ['#F8FAFC', '#F59E0B', '#0084FF'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // White background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top amber accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Blue footer bar
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Left amber vertical accent strip
                { type: 'rect', left: 80, top: 200, width: 6, height: 1340, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold separator below big number
                { type: 'rect', left: 120, top: 640, width: 500, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Thin amber divider before brand
                { type: 'rect', left: 120, top: 1594, width: 200, height: 3, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category label
                { type: 'textbox', left: 120, top: 188, width: 900, text: 'TIPS UMRAH', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                // Large tip number
                { type: 'textbox', left: 96, top: 226, width: 500, text: '01', fontSize: 280, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', lineHeight: 1, originX: 'left', originY: 'top', editable: true },
                // Tip title
                { type: 'textbox', left: 120, top: 678, width: 900, text: 'Niat yang Ikhlas\nadalah Kunci Ibadah', fontSize: 62, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Body text
                { type: 'textbox', left: 120, top: 946, width: 900, text: 'Sebelum berangkat, pastikan niat Anda murni karena Allah SWT semata. Ibadah yang diterima bukan hanya tentang fisik yang hadir di Tanah Suci — tetapi tentang hati yang hadir dan khusyuk dalam setiap doa dan amalan selama di sana.\n\nPersiapkan diri Anda dengan memperbanyak doa, tilawah, dan meningkatkan akhlak sebelum keberangkatan.', fontSize: 26, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.65, originX: 'left', originY: 'top', editable: true },
                // Brand name
                { type: 'textbox', left: 80, top: 1758, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Contact (injected)
                { type: 'textbox', left: 400, top: 1758, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // License (injected)
                { type: 'textbox', left: 60, top: 1818, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'content-cover-post',
        name: 'Tips Umrah — Cover (Post)',
        description: 'Cover slide untuk carousel Tips Umrah, format Post. Dipakai secara internal oleh AI Content Modal.',
        type: 'Content',
        previewColors: ['#F8FAFC', '#F59E0B', '#0084FF'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 80, top: 160, width: 6, height: 880, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 355, width: 440, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 720, width: 300, height: 2, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 1080, width: 160, height: 2, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 120, top: 148, width: 900, text: 'TIPS UMRAH', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 120, top: 380, width: 900, text: 'Judul Konten\nCarousel Anda', fontSize: 72, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 120, top: 740, width: 900, text: 'Kalimat pendukung yang menggambarkan isi carousel ini.', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.55, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1228, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1228, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1300, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'content-cover-story',
        name: 'Tips Umrah — Cover (Story)',
        description: 'Cover slide untuk carousel Tips Umrah, format Story. Dipakai secara internal oleh AI Content Modal.',
        type: 'Content',
        previewColors: ['#F8FAFC', '#F59E0B', '#0084FF'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 80, top: 200, width: 6, height: 1340, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 520, width: 500, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 990, width: 360, height: 3, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 1594, width: 200, height: 3, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 120, top: 188, width: 900, text: 'TIPS UMRAH', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 120, top: 548, width: 900, text: 'Judul Konten\nCarousel Anda', fontSize: 90, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 120, top: 1016, width: 900, text: 'Kalimat pendukung yang menggambarkan isi carousel ini.', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.55, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 1758, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 400, top: 1758, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1818, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'content-dua-card-post',
        name: 'Kartu Doa Perjalanan (Post)',
        description: 'Kartu doa bergaya ornamen dengan kutipan dan terjemahan terpusat. Tanpa foto.',
        type: 'Content',
        previewColors: ['#F8FAFC', '#F59E0B', '#D4A373'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 90, top: 148, width: 900, height: 900, rx: 20, ry: 20, fill: '#FFFFFF', shadow: { color: 'rgba(15,23,42,0.10)', blur: 24, offsetX: 0, offsetY: 8 }, originX: 'left', originY: 'top', selectable: true },
                { type: 'rect', left: 90, top: 148, width: 24, height: 24, angle: 45, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: false, evented: false },
                { type: 'rect', left: 990, top: 148, width: 24, height: 24, angle: 45, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: false, evented: false },
                { type: 'rect', left: 90, top: 1048, width: 24, height: 24, angle: 45, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: false, evented: false },
                { type: 'rect', left: 990, top: 1048, width: 24, height: 24, angle: 45, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 90, top: 208, width: 900, text: 'DOA PERJALANAN', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 200, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 90, top: 254, width: 900, text: '✦', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#D4A373', textAlign: 'center', originX: 'left', originY: 'top', editable: false },
                { type: 'textbox', left: 90, top: 292, width: 900, text: 'Doa Naik Kendaraan', fontSize: 34, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 470, top: 356, width: 140, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 160, top: 392, width: 760, text: 'Subhanalladzi sakhkhara lana hadza wa ma kunna lahu muqrinin, wa inna ila robbina lamunqolibun.', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#0F172A', lineHeight: 1.7, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 160, top: 514, width: 760, text: 'Artinya: "Maha Suci Allah yang telah menundukkan semua ini bagi kami, dan kami tidak akan mampu melakukannya sendiri. Sesungguhnya kepada Allah kami akan kembali."', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#94A3B8', lineHeight: 1.6, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 470, top: 700, width: 140, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 90, top: 732, width: 900, text: 'HR. Muslim', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#F59E0B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'content-checklist-post',
        name: 'Checklist Persiapan Umrah (Post)',
        description: 'Daftar persiapan sebelum berangkat dengan badge centang di setiap baris. Tanpa foto.',
        type: 'Content',
        previewColors: ['#F8FAFC', '#F59E0B', '#0F172A'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 80, top: 60, width: 920, text: 'PERSIAPAN UMRAH', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 88, width: 920, text: 'Checklist Sebelum Berangkat', fontSize: 42, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 80, top: 168, width: 160, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'circle', left: 168, top: 262, radius: 28, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: true },
                { type: 'textbox', left: 140, top: 248, width: 56, text: '✓', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: false },
                { type: 'textbox', left: 230, top: 228, width: 770, text: 'Paspor & Dokumen Perjalanan', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 230, top: 266, width: 770, text: 'Pastikan paspor berlaku minimal 8 bulan dan visa umrah sudah terbit.', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 230, top: 340, width: 770, height: 1, fill: '#E2E8F0', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'circle', left: 168, top: 422, radius: 28, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: true },
                { type: 'textbox', left: 140, top: 408, width: 56, text: '✓', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: false },
                { type: 'textbox', left: 230, top: 388, width: 770, text: 'Vaksinasi Meningitis', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 230, top: 426, width: 770, text: 'Lengkapi vaksin meningitis sesuai syarat kesehatan dari Kementerian Kesehatan.', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 230, top: 500, width: 770, height: 1, fill: '#E2E8F0', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'circle', left: 168, top: 582, radius: 28, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: true },
                { type: 'textbox', left: 140, top: 568, width: 56, text: '✓', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: false },
                { type: 'textbox', left: 230, top: 548, width: 770, text: 'Perlengkapan Ibadah', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 230, top: 586, width: 770, text: "Siapkan mukena, sajadah lipat, dan Al-Qur'an kecil untuk perjalanan.", fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 230, top: 660, width: 770, height: 1, fill: '#E2E8F0', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'circle', left: 168, top: 742, radius: 28, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: true },
                { type: 'textbox', left: 140, top: 728, width: 56, text: '✓', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: false },
                { type: 'textbox', left: 230, top: 708, width: 770, text: 'Uang Riyal & Kartu Debit', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 230, top: 746, width: 770, text: 'Tukar sebagian uang ke Riyal dan bawa kartu debit berlogo internasional.', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 230, top: 820, width: 770, height: 1, fill: '#E2E8F0', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'circle', left: 168, top: 902, radius: 28, fill: '#F59E0B', originX: 'center', originY: 'center', selectable: true },
                { type: 'textbox', left: 140, top: 888, width: 56, text: '✓', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: false },
                { type: 'textbox', left: 230, top: 868, width: 770, text: 'Fisik & Kesehatan', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 230, top: 906, width: 770, text: 'Jaga kondisi tubuh dan istirahat cukup sebelum keberangkatan.', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1300, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    // {
    //     id: 'content-quick-fact-post',
    //     name: 'Fakta Singkat Ibadah (Post)',
    //     description: 'Angka statistik besar di latar gelap dramatis untuk konten edukasi singkat. Tanpa foto.',
    //     type: 'Content',
    //     previewColors: ['#0F172A', '#F59E0B', '#0084FF'],
    //     aspectRatio: 'post',
    //     json: {
    //         version: '7.2.0',
    //         width: 1080,
    //         height: 1350,
    //         objects: [
    //             { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#0F172A', originX: 'left', originY: 'top', selectable: false, evented: false },
    //             { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
    //             { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
    //             { type: 'textbox', left: 0, top: 100, width: 1080, text: 'TAHUKAH ANDA?', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 220, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
    //             { type: 'textbox', left: 0, top: 200, width: 1080, text: '40', fontSize: 320, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
    //             { type: 'textbox', left: 0, top: 600, width: 1080, text: 'HARI DI TANAH SUCI', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 150, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
    //             { type: 'rect', left: 470, top: 660, width: 140, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
    //             { type: 'textbox', left: 130, top: 696, width: 820, text: 'Durasi ideal umrah reguler agar jamaah dapat beribadah dengan tenang, menyelesaikan seluruh rangkaian ziarah, dan pulang dalam kondisi fisik serta hati yang siap.', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#CBD5E1', lineHeight: 1.6, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
    //             { type: 'textbox', left: 0, top: 900, width: 1080, text: 'Rencanakan perjalanan terbaik Anda bersama Alfatih Dunia Wisata.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#94A3B8', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
    //             { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
    //             { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
    //             { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
    //         ]
    //     }
    // },
    {
        id: 'content-quick-fact-post',
        name: 'Fakta Singkat Ibadah (Post)',
        description: 'Angka statistik besar di latar gelap dramatis untuk konten edukasi singkat. Tanpa foto.',
        type: 'Content',
        previewColors: ['#0F172A', '#F59E0B', '#0084FF'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#FFFFFF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 0, top: 100, width: 1080, text: 'TAHUKAH ANDA?', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 220, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 0, top: 200, width: 1080, text: '40', fontSize: 320, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 0, top: 600, width: 1080, text: 'HARI DI TANAH SUCI', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 150, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'rect', left: 470, top: 660, width: 140, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 130, top: 696, width: 820, text: 'Durasi ideal umrah reguler agar jamaah dapat beribadah dengan tenang, menyelesaikan seluruh rangkaian ziarah, dan pulang dalam kondisi fisik serta hati yang siap.', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#CBD5E1', lineHeight: 1.6, textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 0, top: 900, width: 1080, text: 'Rencanakan perjalanan terbaik Anda bersama Alfatih Dunia Wisata.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#94A3B8', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
];

// Backward-compat export: uses blank footer for display/listing in non-component contexts
export const STARTER_TEMPLATES: PosterTemplate[] = buildStarterTemplates({ instagram: '', phone: '', email: '', izin_ppiu: '' });

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

const FILTER_PILLS: Array<TemplateType | 'All'> = ['All', 'Conversion', 'Tour Promotion', 'Documentation', 'Content'];

const TemplatePanel: React.FC<TemplatePanelProps> = ({ onLoadTemplate }) => {
    const siteSettings = useSiteSettings();
    const footerFromSettings: FooterData = {
        instagram: siteSettings.instagram || '',
        phone: siteSettings.phone || '',
        email: siteSettings.email || '',
        izin_ppiu: siteSettings.izin_ppiu || '',
    };
    const liveTemplates = useMemo(() => buildStarterTemplates(footerFromSettings), [siteSettings]);
    const [typeFilter, setTypeFilter] = useState<TemplateType | 'All'>('All');

    const filteredTemplates = typeFilter === 'All'
        ? liveTemplates
        : liveTemplates.filter(t => t.type === typeFilter);

    const postTemplates  = filteredTemplates.filter(t => t.aspectRatio === 'post');
    const storyTemplates = filteredTemplates.filter(t => t.aspectRatio === 'story');

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
            <div className="flex items-center gap-2 mb-3">
                <LayoutTemplate className="w-4 h-4 text-gray-500" />
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">Templates</h3>
                    <p className="text-[10px] text-gray-400">Design system Alfatih Dunia Wisata</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
                {FILTER_PILLS.map(pill => (
                    <button
                        key={pill}
                        onClick={() => setTypeFilter(pill)}
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-colors ${
                            typeFilter === pill
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {pill}
                    </button>
                ))}
            </div>
            {renderGroup('Instagram Post (4:5)', '1080 × 1350 px', postTemplates)}
            {renderGroup('Instagram Story (9:16)', '1080 × 1920 px', storyTemplates)}
        </div>
    );
};

export default TemplatePanel;
