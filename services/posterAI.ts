import { GoogleGenAI } from "@google/genai";
import { TourPackage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
const MODEL = 'gemini-2.5-flash-preview-05-20';

export type TemplateType = 'conversion' | 'aspiration' | 'edu-reminder' | 'social-proof' | 'blank';

export interface TemplateInputs {
    templateType: TemplateType;
    package?: TourPackage;
    topic?: string;
    tagline?: string;
    testimonial?: { quote: string; name: string; batch: string };
}

const formatPrice = (price?: number) =>
    price
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
        : 'Hubungi Kami';

export const applyTemplateContent = async (
    inputs: TemplateInputs,
    textNodes: { id: string; text: string }[]
): Promise<{ id: string; text: string }[]> => {
    if (textNodes.length === 0 || inputs.templateType === 'blank') return textNodes;

    let contextBlock = '';
    let instructionBlock = '';

    switch (inputs.templateType) {
        case 'conversion': {
            const pkg = inputs.package;
            if (!pkg) return textNodes;
            const startingPrice = formatPrice(pkg.room_options?.[0]?.price);
            const tiers = (pkg.room_options || []).slice(0, 3)
                .map(r => `${r.name}: ${formatPrice(r.price)}`)
                .join(' | ');
            const features = (pkg.features || []).slice(0, 6).join(', ');

            contextBlock = `
Nama Paket: ${pkg.title}
Tanggal Keberangkatan: ${pkg.departure_date}
Durasi: ${pkg.duration}
Kategori: ${pkg.category}
Harga Mulai: ${startingPrice} per pax
Tipe Kamar: ${tiers}
Keunggulan: ${features}
Deskripsi: ${(pkg.description || '').substring(0, 200)}`;

            instructionBlock = `
- Ganti headline utama dengan nama paket dan kata kunci unggulan.
- Ganti tanggal, durasi, harga dengan data aktual dari paket.
- Ganti baris benefit/keunggulan dengan fitur aktual dari paket (maks 10 kata per baris).
- Ganti teks kategori/label dengan nama kategori paket.
- Pertahankan teks singkat seperti label tombol (Daftar Sekarang, Hubungi Kami), social handle, nama brand, dan nomor lisensi PPIU.`;
            break;
        }

        case 'edu-reminder': {
            contextBlock = `Topik: ${inputs.topic || 'Tips Umroh'}`;
            instructionBlock = `
- Ganti headline poster dengan judul daftar yang menarik dan sesuai topik (contoh: "5 Barang Wajib Dibawa Saat Umroh").
- Ganti sub-headline dengan kalimat pengantar singkat.
- Ganti setiap judul item daftar bernomor dengan tips/langkah yang relevan dengan topik (maks 6 kata).
- Ganti setiap deskripsi item dengan penjelasan singkat (maks 12 kata).
- Jangan ubah social handle, nama brand, dan tombol.`;
            break;
        }

        case 'aspiration': {
            contextBlock = `Tagline kustom: ${inputs.tagline?.trim() || '(generate tagline spiritual yang menginspirasi)'}`;
            instructionBlock = `
- Ganti teks tagline/kutipan utama dengan tagline spiritual yang menginspirasi (boleh menggunakan kata dari konteks, atau generate sendiri jika kosong).
- Ganti sub-tagline dengan kalimat undangan yang hangat dan profesional.
- Pertahankan nama brand, social handle, badge, dan teks pillar seperti "Islami", "Amanah", "Premium".`;
            break;
        }

        case 'social-proof': {
            const t = inputs.testimonial;
            const hasData = t && (t.quote || t.name || t.batch);
            contextBlock = hasData
                ? `Kutipan: "${t!.quote}"\nNama: ${t!.name}\nRombongan: ${t!.batch}`
                : '(AI akan membuat testimoni jamaah Umroh yang realistis dan positif)';
            instructionBlock = `
- Ganti teks kutipan testimoni dengan kutipan yang diberikan (atau generate jika kosong). Pertahankan gaya italic dan panjang yang mirip.
- Ganti nama jamaah dan info rombongan dengan data yang diberikan (atau generate jika kosong).
- Pertahankan statistik (1000+ Jamaah, 12 Thn, ★5.0), nama brand, social handle, dan tombol.`;
            break;
        }

        default:
            return textNodes;
    }

    const prompt = `
Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Tipe Template: ${inputs.templateType}

Data Konten:
${contextBlock}

Text node yang ada di poster saat ini (field teks yang bisa diedit di kanvas):
${JSON.stringify(textNodes, null, 2)}

Instruksi penggantian:
${instructionBlock}

ATURAN WAJIB:
1. Hanya ubah nilai "text" setiap node — "id" TIDAK boleh diubah.
2. Panjang teks baru harus mirip dengan aslinya agar tata letak poster tidak rusak.
3. JANGAN ubah: "Alfatih Dunia Wisata", "@alfatih.umroh", "adwisata.com", nomor PPIU, label tombol singkat, dan teks brand statis.
4. Gunakan Bahasa Indonesia untuk semua konten kecuali teks yang memang aslinya berbahasa Inggris.
5. Kembalikan HANYA array JSON yang valid — tanpa markdown, tanpa penjelasan.

Format respons:
[{ "id": "...", "text": "..." }, ...]`;

    try {
        const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
        const raw = response.text || "[]";
        const cleaned = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error("applyTemplateContent error:", err);
        return textNodes;
    }
};

// Kept for backward compatibility (DraftPanel / legacy callers)
export const generateTemplateAutofill = async (
    tour: TourPackage,
    textNodes: { id: string; text: string }[]
): Promise<{ id: string; text: string }[]> =>
    applyTemplateContent({ templateType: 'conversion', package: tour }, textNodes);
