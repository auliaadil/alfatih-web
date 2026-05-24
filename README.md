# Alfatih Dunia Wisata

Welcome to the **Alfatih Dunia Wisata** project repository! This is a modern, enterprise-grade web application for a premium travel agency specializing in Umrah and Halal-friendly international tourism.

The application features a sleek, responsive UI/UX and integrates **Google Gemini AI** (via Supabase Edge Functions) and **Supabase** to offer a full-featured platform including a dynamic public site and a powerful administrative suite.

## 🚀 Key Features

### 🌐 Public Experience
- **Dynamic Tour Packages**: Browse and filter premium Umrah and international tour packages with real-time data from Supabase.
- **AI-Powered Trip Planner**: An intelligent "Private Trip" planner that generates personalized itineraries based on user interests and constraints.
- **Premium UI/UX**: Modern aesthetics featuring glassmorphism, smooth animations, and a focus on high-quality visuals.

### 🛡️ Administrative Suite
- **Comprehensive Dashboard**: Manage tour packages, view detailed stats, and handle private trip requests from a unified interface.
- **Advanced AI Poster Maker**:
  - **Fabric.js Canvas Editor**: Interactive drag-and-drop editor for creating marketing posters.
  - **AI Magic Auto-Fill**: Automatically populate poster text and image placeholders with package-specific data using Gemini AI.
  - **Template System**: 10+ professional starter templates for Instagram Posts and Stories.
  - **History & Shortcuts**: Native Undo/Redo stack with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z).
  - **Drafts Management**: Save and resume design drafts with auto-generated canvas thumbnails.
  - **High-Res Export**: Instant PNG export for production-ready social media assets.

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Backend**: [Supabase](https://supabase.com/) (Database, Auth, Storage, Edge Functions)
- **AI Engine**: [Google Gemini](https://ai.google.dev/) via Supabase Edge Functions (Deno, REST API — API key never exposed to the browser)
- **Canvas Engine**: [Fabric.js v7](http://fabricjs.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (CDN)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Rendering**: [React Markdown](https://github.com/remarkjs/react-markdown)

## 📦 Prerequisites

Before you begin, ensure you have:
- **Node.js**: v18.0.0+
- **npm**: v9.0.0+
- **Supabase Account**: A project set up with the required schema and Edge Functions deployed.
- **Supabase CLI**: For deploying edge functions (`brew install supabase/tap/supabase`).

## 💻 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/auliaadil/alfatih-web.git
    cd alfatih-web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_API_KEY=your_supabase_anon_key
    VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
    VITE_UNSPLASH_ACCESS_KEY=your_unsplash_client_id
    VITE_PIXABAY_API_KEY=your_pixabay_api_key
    ```

    AI keys are stored as Supabase secrets (never in `.env.local`):
    ```bash
    supabase secrets set \
      GEMINI_API_KEY=your_gemini_api_key \
      GEMINI_MODEL=gemini-2.5-flash-preview-05-20 \
      RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
    ```

4.  **Deploy Edge Functions:**
    ```bash
    supabase functions deploy ai-itinerary
    supabase functions deploy ai-poster-autofill
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 📁 Project Structure

```
alfatih-web/
├── components/          # Public-facing UI (Hero, Navbar, AIPlanner, etc.)
├── services/            # Thin fetch wrappers for Edge Functions
│   ├── itineraryService.ts       # Calls ai-itinerary edge function
│   └── posterAutofillService.ts  # Calls ai-poster-autofill edge function
├── src/
│   ├── components/      # Reusable UI components (Public & Admin)
│   │   ├── admin/       # Specialized admin components (PosterMaker, etc.)
│   ├── contexts/        # React Contexts (Language, SiteSettings)
│   ├── hooks/           # Custom hooks (useRecaptcha, etc.)
│   ├── lib/             # Third-party configurations (Supabase client)
│   ├── pages/           # Page components (Home, TourDetails, Admin Dashboard)
│   ├── types/           # Global TypeScript definitions
│   └── services/        # Non-AI services (posterTemplates, etc.)
├── supabase/
│   ├── functions/       # Supabase Edge Functions (Deno)
│   │   ├── ai-itinerary/         # reCAPTCHA-gated itinerary generation
│   │   └── ai-poster-autofill/   # JWT-gated poster copy generation
│   └── migrations/      # Database migrations
└── public/              # Static public assets
```

## 🤝 Contributing

1.  Fork the project.
2.  Create your feature branch: `git checkout -b feature/amazing-feature`.
3.  Commit changes: `git commit -m 'Add some amazing feature'`.
4.  Push: `git push origin feature/amazing-feature`.
5.  Create a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---
*Built with ❤️ for Alfatih Dunia Wisata.*
