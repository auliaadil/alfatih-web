import { GoogleGenAI } from "@google/genai";
import { TourPackage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generatePromoCopy = async (tour: TourPackage): Promise<{ title: string; hook: string; details: string }> => {
  const prompt = `
    You are an expert copywriter for Alfatih Dunia Wisata, an Indonesian premium travel agency.
    Write a short, punchy, high-converting copy for an Instagram promo poster for this tour package.
    Data:
    Tour: ${tour.title}
    Date: ${tour.departure_date}
    Duration: ${tour.duration}

    The copy should be in Bahasa Indonesia.
    Return strict JSON format with exactly these keys:
    {
      "title": "Short Main Headline (max 4 words, e.g. HALAL TOUR JEPANG)",
      "hook": "An exciting sub-headline or urgency hook (max 8 words, e.g. Sisa 5 Seat! Amankan Posisi Anda)",
      "details": "A summarizing sentence (max 12 words, e.g. Keberangkatan ${tour.departure_date} dengan fasilitas bintang 5)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = response.text || "{}";
    const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI Promo Error:", error);
    return { title: tour.title.substring(0, 20).toUpperCase(), hook: 'Penawaran Spesial', details: `Keberangkatan ${tour.departure_date}` };
  }
};

export const generateEducationalCopy = async (topic: string): Promise<{ title: string; points: string[] }> => {
  const prompt = `
    You are an expert content creator for Alfatih Dunia Wisata.
    Create a highly saveable, educational Instagram post based on this topic: "${topic}".
    Language: Bahasa Indonesia. Tone: Helpful and informative.
    
    Return strict JSON format with exactly these keys:
    {
      "title": "Catchy short title (max 5 words, e.g. 5 Barang Wajib Saat Umrah)",
      "points": [
        "Point 1 (max 10 words)",
        "Point 2 (max 10 words)",
        "Point 3 (max 10 words)"
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = response.text || "{}";
    const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI Educational Error:", error);
    return { title: 'Tips Bermanfaat', points: ['Tips 1...', 'Tips 2...', 'Tips 3...'] };
  }
};

export const generateDocCopy = async (location: string): Promise<{ title: string; sub: string }> => {
  const prompt = `
    You are managing the social media for Alfatih Dunia Wisata.
    Write a caption for a past tour documentation photo in ${location}.
    Language: Bahasa Indonesia. Tone: Grateful, warm.

    Return strict JSON format with exactly these keys:
    {
      "title": "Short warm title (max 4 words, e.g. Alhamdulillah Ceria di Turki)",
      "sub": "A short sub-text (max 8 words, e.g. Momen indah jamaah Alfatih)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = response.text || "{}";
    const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI Doc Error:", error);
    return { title: 'Momen Berharga', sub: 'Bersama jamaah Alfatih Dunia Wisata' };
  }
};

export const generateTemplateAutofill = async (tour: TourPackage, textNodes: { id: string, text: string }[]): Promise<{ id: string, text: string }[]> => {
  if (textNodes.length === 0) return [];

  const prompt = `
    You are an expert travel copywriter for Alfatih Dunia Wisata.
    We have a poster template with placeholder text, and we need to overwrite the placeholders with actual data from a specific tour package.
    
    Data:
    Tour: ${tour.title}
    Price: ${tour.room_options?.[0]?.price ? tour.room_options[0].price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : 'Hubungi Kami'}
    Date: ${tour.departure_date}
    Duration: ${tour.duration}

    Here are the text fields currently on the poster:
    ${JSON.stringify(textNodes, null, 2)}

    Rewrite ONLY the "text" property of each object to realistically pitch the Data above.
    Keep the length of the new text roughly similar to the original text so you don't break the poster layout!
    If a text field looks like a button label (e.g. "Daftar Sekarang"), leave it as is.
    
    Return strict JSON format as an array of objects:
    [
      { "id": "...", "text": "New Text Here" }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const textStr = response.text || "[]";
    const cleaned = textStr.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI Autofill Error:", error);
    return textNodes; // Fallback to original text if error
  }
};
