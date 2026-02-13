# AI Agent Orientation: Alfatih Dunia Wisata

This document provides context and guidelines for AI agents working on the **Alfatih Dunia Wisata** codebase.

## 🧠 Project Context

**Alfatih Dunia Wisata** is a premium travel agency website built with **React**, **Vite**, and **TypeScript**. 
The core value proposition is **Umrah** and **Halal-friendly** international travel. The standout feature is an **AI-powered Private Trip Planner** that generates custom itineraries using Google's Gemini AI.

## 🏗 Architecture & Structure

### Core Technologies
- **Frontend**: React 19 (Hooks, functional components).
- **Build Tool**: Vite (Fast HMR, optimized builds).
- **Styling**: Tailwind CSS (v3 via CDN script in `index.html` - *Note: This is unusual for production apps but intentional for this prototype/demo.*).
- **AI Service**: Google Generative AI (`@google/genai`).

### Directory Layout
- **Root**: Contains configuration (`vite.config.ts`, `package.json`) and entry points (`index.html`, `App.tsx`, `index.tsx`).
- **`components/`**: Reusable UI components. Key components:
  - `AIPlanner.tsx`: The main interface for the AI itinerary generation.
  - `TourCard.tsx` & `TourDetail.tsx`: Display logic for tour packages.
  - `Navbar.tsx` & `Footer.tsx`: Layout structure.
- **`services/`**: API integrations.
  - `geminiService.ts`: Handles communication with Google Gemini API.
- **`types.ts`**: Shared TypeScript interfaces/types.
- **`constants.ts`**: Hardcoded data for tours, testimonials, and interest lists.

## 🤖 AI Implementation Details

### The "AI Planner" Feature
- Located in `components/AIPlanner.tsx`.
- Uses `geminiService.ts` to call the `gemini-3-flash-preview` model.
- **Prompt Engineering**: The prompt is defined in `geminiService.ts`. It instructs the model to act as a "Private Trip Assistant" and output structured Markdown.
- **API Key Handling**: The API key is injected via Vite's `define` plugin in `vite.config.ts` as `process.env.API_KEY`.

### Styling Conventions
- **Tailwind**: Utility classes are used extensively.
- **Colors**: Defined in `index.html` script tag (`primary`, `secondary`, `accent`, `dark`).
- **Animations**: Standard CSS transitions and Tailwind utility classes (e.g., `hover:scale-105`).

## 📝 Guidelines for AI Agents

1.  **Respect the Halal Focus**: When generating content or features, always prioritize Halal-friendly options (prayer times, halal food).
2.  **Maintain Type Safety**: Use strict TypeScript types. Avoid `any`. Update `types.ts` when introducing new data structures.
3.  **Component Modularity**: Keep components focused. Extract logic to custom hooks or services if `components/` files grow too large.
4.  **Environment Variables**: Use `process.env.API_KEY` for accessing the Gemini key. Do not hardcode secrets.
5.  **Tailwind Usage**: continue using the CDN-based configuration unless instructed to migrate to a PostCSS build process.

## 🚀 Future Roadmap (for AI Suggestion)

- [ ] **Migrate Tailwind**: Move from CDN script to standard PostCSS installation for better performance and tooling support.
- [ ] **Backend Integration**: Replace `constants.ts` with a real CMS or Database (Supabase/Firebase).
- [ ] **Booking System**: Implement a real booking flow instead of WhatsApp redirection.
- [ ] **Authentication**: Add user login to save itineraries.
