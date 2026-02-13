import { GoogleGenAI } from "@google/genai";
import { AIPlannerInput } from "../types";

// Always initialize with process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateItinerary = async (input: AIPlannerInput): Promise<string> => {
  const prompt = `
    You are the "Alfatih Private Trip Assistant", a world-class travel expert for Alfatih Dunia Wisata.
    Alfatih Dunia Wisata is a premium Indonesian travel agency specializing in Umrah and Halal-friendly international travel.

    Task: Generate a detailed, inspiring, and practical PRIVATE TRIP draft itinerary based on user preferences.
    
    User Preferences:
    - Destination: ${input.destination}
    - Duration: ${input.days} Days
    - Travelers: ${input.travelers}
    - Key Interests: ${input.interests.join(', ')}

    Strict Requirements:
    1. Language: The itinerary MUST be generated in Indonesian (Bahasa Indonesia).
    2. Tone: Warm, professional, and Islamic-friendly (use "Assalamualaikum", "InshaAllah" where appropriate).
    3. Halal Focus: For non-Muslim countries, always suggest specific areas or tips for finding Halal food and mentioning prayer facilities (Masjids or Musallas).
    4. Structure: 
       - Start with an exciting "Draft Overview" for this Private Trip.
       - Day-by-day breakdown with titles (e.g., Hari 1: Kedatangan & Wisata Kota).
       - Include 3-4 specific activities per day.
       - End with "Pro Travel Tips" for this specific destination.
    5. Formatting: Use clean Markdown (Bold headers, bullet points).
    6. Signature: Explicitly remind the user that this is a draft and they must contact Alfatih Dunia Wisata to get the official itinerary and pricing (Cek harga dan itinerary resmi ke tim Alfatih).

    Make it feel personalized and luxurious, but clearly state it's a draft reference.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Mohon maaf, saya tidak dapat membuat itinerary saat ini. Silakan coba lagi.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Maaf, sistem AI kami sedang mengalami kendala. Silakan coba lagi beberapa saat lagi.";
  }
};