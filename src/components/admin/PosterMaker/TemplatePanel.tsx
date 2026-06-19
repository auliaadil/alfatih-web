import React, { useState, useEffect, useMemo } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { generateTemplateThumbnail } from './templateThumbnail';
import { useSiteSettings } from '../../../contexts/SiteSettingsContext';

export interface PosterTemplate {
    id: string;
    name: string;
    description: string;
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

const DEFAULT_FOOTER: FooterData = {
    instagram: 'https://instagram.com/alfatihduniawisata',
    phone: '0811-1234-5678',
    email: 'info@alfatihduniawisata.com',
    izin_ppiu: '1234/2024',
};

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
                // License line: references PPIU / Penyelenggara
                if (text.includes('PPIU') || text.includes('Penyelenggara')) {
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
                { top: 140, fill: '#0F172A', left: 60, text: 'Umrah Premium Syawal 1447H', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 61.02, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 54, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'left', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', lineHeight: 1.2, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 270, fill: '#64748B', left: 60, text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU. Fasilitas hotel bintang 5 dekat dengan Masjidil Haram.', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 54.24, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 20, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'left', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', lineHeight: 1.4, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 820, fill: '#0F172A', left: 60, text: 'Keberangkatan\n12 Okt 2026', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 57.178, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 22, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', lineHeight: 1.3, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 820, fill: '#0F172A', left: 390, text: 'Durasi\n12 Hari', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 57.178, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 22, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', lineHeight: 1.3, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 820, fill: '#F59E0B', left: 720, text: 'Harga Mulai\nRp 32.5 Jt', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 57.178, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 22, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', lineHeight: 1.3, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 920, fill: '#64748B', left: 60, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 20.34, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 18, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 990, fill: '#F59E0B', left: 100, text: '◆\n◆\n◆\n◆\n◆', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 30, height: 137.2272, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 12, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', lineHeight: 2.28, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 970, fill: '#0F172A', left: 142, text: 'Hotel Makkah: Anjum / Setaraf (*5)\nHotel Madinah: Front Taiba / Setaraf (*5)\nTiket Pesawat Saudia Airlines direct Jeddah\nMuthawwif Pembimbing Ibadah Berpengalaman\nAir Zamzam 5 Liter & Perlengkapan Umrah Lengkap', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 838, height: 142.38, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 18, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'left', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', lineHeight: 1.5, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 1158, fill: '#FFFFFF', left: 340, text: 'DAFTAR SEKARANG', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 400, height: 20.34, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 18, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 100, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 1235, fill: '#FFFFFF', left: 60, text: 'ALFATIH DUNIA WISATA', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 300, height: 18.08, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 16, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'left', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 1235, fill: '#FFFFFF', left: 380, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 640, height: 16.95, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 15, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'right', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
                { top: 1280, fill: '#FFFFFF', left: 60, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', type: 'Textbox', angle: 0, flipX: false, flipY: false, skewX: 0, skewY: 0, width: 960, height: 13.56, scaleX: 1, scaleY: 1, shadow: null, stroke: null, styles: [], opacity: 1, originX: 'left', originY: 'top', version: '7.2.0', visible: true, fillRule: 'nonzero', fontSize: 12, minWidth: 20, overline: false, pathSide: 'left', direction: 'ltr', fontStyle: 'normal', pathAlign: 'baseline', textAlign: 'center', underline: false, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', lineHeight: 1.16, paintFirst: 'fill', charSpacing: 0, linethrough: false, strokeWidth: 1, strokeLineCap: 'butt', strokeUniform: false, strokeLineJoin: 'miter', backgroundColor: '', pathStartOffset: 0, splitByGrapheme: false, strokeDashArray: null, strokeDashOffset: 0, strokeMiterLimit: 4, textBackgroundColor: '', textDecorationThickness: 66.667, globalCompositeOperation: 'source-over' },
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
    },
    {
        id: 'promo-post-conversion',
        name: 'Promo Diskon Umrah (Post)',
        description: 'Harga coret dengan badge HEMAT dan urgency kursi tersisa. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#EF4444'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 15, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 60, top: 245, width: 200, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Main image
                { type: 'image', left: 60, top: 350, width: 960, height: 355, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&q=80', rx: 12, ry: 12, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // HEMAT badge background
                { type: 'rect', left: 60, top: 730, width: 200, height: 44, rx: 22, ry: 22, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 340, top: 1140, width: 400, height: 60, rx: 30, ry: 30, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 60, top: 100, width: 960, text: 'PROMO TERBATAS', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 60, top: 140, width: 960, text: 'Umrah Premium Syawal 1447H', fontSize: 50, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 60, top: 268, width: 960, text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // HEMAT badge text
                { type: 'textbox', left: 60, top: 741, width: 200, text: 'HEMAT 18%', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 50, originX: 'left', originY: 'top', editable: true },
                // Original price label
                { type: 'textbox', left: 285, top: 736, width: 250, text: 'Harga Normal', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                // Original price (strikethrough)
                { type: 'textbox', left: 282, top: 756, width: 300, text: 'Rp 36.000.000', fontSize: 26, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#94A3B8', linethrough: true, originX: 'left', originY: 'top', editable: true },
                // Discounted price label
                { type: 'textbox', left: 610, top: 736, width: 250, text: 'Harga Promo', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                // Discounted price
                { type: 'textbox', left: 600, top: 748, width: 420, text: 'Rp 29.500.000', fontSize: 38, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 820, width: 960, text: 'Quad: Rp 29.500.000 | Triple: Rp 31.500.000 | Double: Rp 33.500.000', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 60, top: 855, width: 960, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#EF4444', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 100, top: 900, width: 30, text: '◆\n◆\n◆\n◆', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.3, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 142, top: 900, width: 838, text: 'Hotel Makkah: Anjum / Setaraf (*5)\nHotel Madinah: Front Taiba / Setaraf (*5)\nTiket Pesawat Saudia Airlines direct Jeddah\nMuthawwif Pembimbing Ibadah Berpengalaman', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.5, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 340, top: 1159, width: 400, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'promo-story-conversion',
        name: 'Promo Diskon Umrah (Story)',
        description: 'Harga coret dengan badge HEMAT dan urgency kursi tersisa, format Story. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#EF4444'],
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
                // Gold divider
                { type: 'rect', left: 80, top: 315, width: 250, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Main image
                { type: 'image', left: 80, top: 500, width: 920, height: 490, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&q=80', rx: 16, ry: 16, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // HEMAT badge background
                { type: 'rect', left: 80, top: 1020, width: 230, height: 54, rx: 27, ry: 27, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 320, top: 1590, width: 440, height: 70, rx: 35, ry: 35, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 140, width: 920, text: 'PROMO TERBATAS', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 190, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 55, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 355, width: 920, text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU.', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // HEMAT badge text
                { type: 'textbox', left: 80, top: 1033, width: 230, text: 'HEMAT 18%', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 50, originX: 'left', originY: 'top', editable: true },
                // Original price label
                { type: 'textbox', left: 340, top: 1026, width: 240, text: 'Harga Normal', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                // Original price (strikethrough)
                { type: 'textbox', left: 336, top: 1050, width: 310, text: 'Rp 36.000.000', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#94A3B8', linethrough: true, originX: 'left', originY: 'top', editable: true },
                // Discounted price label
                { type: 'textbox', left: 680, top: 1026, width: 240, text: 'Harga Promo', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                // Discounted price
                { type: 'textbox', left: 665, top: 1040, width: 415, text: 'Rp 29.500.000', fontSize: 44, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1155, width: 920, text: 'Quad: Rp 29.500.000 | Triple: Rp 31.500.000 | Double: Rp 33.500.000', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 80, top: 1200, width: 920, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#EF4444', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 120, top: 1258, width: 34, text: '◆\n◆\n◆\n◆', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.46, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 166, top: 1258, width: 754, text: 'Hotel Makkah: Anjum / Setaraf (*5)\nHotel Madinah: Front Taiba / Setaraf (*5)\nTiket Pesawat Saudia Airlines direct Jeddah\nMuthawwif Pembimbing Ibadah Berpengalaman', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.6, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 320, top: 1611, width: 440, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1765, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1765, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1825, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'hotel-airline-post-conversion',
        name: 'Hotel & Penerbangan (Post)',
        description: 'Dua foto berdampingan: hotel bintang 5 dan penerbangan langsung. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#F1F5F9'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 15, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 60, top: 245, width: 200, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Hotel image (left)
                { type: 'image', left: 60, top: 340, width: 455, height: 320, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=455&h=320&q=80', rx: 12, ry: 12, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Airline image (right)
                { type: 'image', left: 565, top: 340, width: 455, height: 320, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=455&h=320&q=80', rx: 12, ry: 12, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Info card 1 background (date)
                { type: 'rect', left: 60, top: 745, width: 300, height: 100, rx: 12, ry: 12, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 2 background (duration)
                { type: 'rect', left: 390, top: 745, width: 300, height: 100, rx: 12, ry: 12, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 3 background (price)
                { type: 'rect', left: 720, top: 745, width: 300, height: 100, rx: 12, ry: 12, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 340, top: 1140, width: 400, height: 60, rx: 30, ry: 30, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 60, top: 100, width: 960, text: 'PAKET PREMIUM UMRAH', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 60, top: 140, width: 960, text: 'Umrah Premium Syawal 1447H', fontSize: 50, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 60, top: 270, width: 960, text: 'Nikmati pengalaman ibadah dengan fasilitas premium — hotel bintang 5 dan penerbangan langsung.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Hotel image label
                { type: 'textbox', left: 60, top: 674, width: 455, text: '🏨 Hotel Bintang 5 Makkah', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Airline image label
                { type: 'textbox', left: 565, top: 674, width: 455, text: '✈ Penerbangan Langsung Jeddah', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 1 text (date)
                { type: 'textbox', left: 60, top: 766, width: 300, text: 'Keberangkatan\n12 Okt 2026', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 2 text (duration)
                { type: 'textbox', left: 390, top: 766, width: 300, text: 'Durasi\n12 Hari', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 3 text (price)
                { type: 'textbox', left: 720, top: 766, width: 300, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 875, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 100, top: 918, width: 30, text: '◆\n◆\n◆', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.3, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 142, top: 918, width: 838, text: 'Hotel Makkah: Anjum / Setaraf (*5) & Madinah: Front Taiba / Setaraf (*5)\nTiket Pesawat Saudia Airlines Penerbangan Langsung Jeddah\nMuthawwif Pembimbing Ibadah & Air Zamzam 5L', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.5, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 340, top: 1159, width: 400, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'hotel-airline-story-conversion',
        name: 'Hotel & Penerbangan (Story)',
        description: 'Dua foto berdampingan: hotel bintang 5 dan penerbangan langsung, format Story. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#F1F5F9'],
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
                // Gold divider
                { type: 'rect', left: 80, top: 315, width: 250, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Hotel image (left)
                { type: 'image', left: 80, top: 500, width: 440, height: 430, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=440&h=430&q=80', rx: 14, ry: 14, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Airline image (right)
                { type: 'image', left: 560, top: 500, width: 440, height: 430, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=440&h=430&q=80', rx: 14, ry: 14, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Info card 1 (date)
                { type: 'rect', left: 80, top: 1060, width: 280, height: 120, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 2 (duration)
                { type: 'rect', left: 400, top: 1060, width: 280, height: 120, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 3 (price)
                { type: 'rect', left: 720, top: 1060, width: 280, height: 120, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 320, top: 1590, width: 440, height: 70, rx: 35, ry: 35, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 140, width: 920, text: 'PAKET PREMIUM UMRAH', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 190, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 55, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 358, width: 920, text: 'Nikmati pengalaman ibadah dengan fasilitas premium — hotel bintang 5 dan penerbangan langsung.', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Hotel label
                { type: 'textbox', left: 80, top: 946, width: 440, text: '🏨 Hotel Bintang 5 Makkah', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Airline label
                { type: 'textbox', left: 560, top: 946, width: 440, text: '✈ Penerbangan Langsung', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 1 text
                { type: 'textbox', left: 80, top: 1082, width: 280, text: 'Keberangkatan\n12 Okt 2026', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 2 text
                { type: 'textbox', left: 400, top: 1082, width: 280, text: 'Durasi\n12 Hari', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 3 text
                { type: 'textbox', left: 720, top: 1082, width: 280, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1215, width: 920, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 120, top: 1270, width: 34, text: '◆\n◆\n◆', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.46, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 166, top: 1270, width: 754, text: 'Hotel Makkah: Anjum / Setaraf (*5) & Madinah: Front Taiba (*5)\nTiket Pesawat Saudia Airlines Penerbangan Langsung Jeddah\nMuthawwif Pembimbing Ibadah & Air Zamzam 5L', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.6, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 320, top: 1611, width: 440, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1765, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1765, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1825, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    }
];

// Backward-compat export: uses default footer for display/listing in non-component contexts
export const STARTER_TEMPLATES: PosterTemplate[] = buildStarterTemplates(DEFAULT_FOOTER);

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
    const siteSettings = useSiteSettings();
    const liveTemplates = useMemo(() => buildStarterTemplates(siteSettings), [siteSettings]);
    const postTemplates  = liveTemplates.filter(t => t.aspectRatio === 'post');
    const storyTemplates = liveTemplates.filter(t => t.aspectRatio === 'story');

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
