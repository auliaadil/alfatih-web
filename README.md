<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Alfatih Dunia Wisata

Welcome to the **Alfatih Dunia Wisata** project repository! This is a modern, responsive web application for a premium travel agency specializing in Umrah and Halal-friendly international tourism.

The application features a sleek UI/UX design and integrates Google's Gemini AI to offer personalized travel itinerary planning for users.

## 🚀 Key Features

- **Dynamic Tour Packages**: Browse featured Umrah and international tour packages with filtering capabilities.
- **AI-Powered Trip Planner**: An intelligent "Private Trip" planner powered by Google Gemini AI that generates personalized itineraries based on destination, duration, travelers, and interests.
- **Responsive Design**: Fully responsive layout optimized for mobile, tablet, and desktop devices.
- **Premium UI**: Modern aesthetics with smooth animations, glassmorphism effects, and high-quality imagery.
- **Interactive Components**: Detailed tour pages, testimonial carousels, and contact forms.

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (configured via CDN for rapid prototyping)
- **AI Integration**: [Google Gemini AI SDK](https://ai.google.dev/) (`@google/genai`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Rendering**: [React Markdown](https://github.com/remarkjs/react-markdown)

## 📦 Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Gemini API Key**: You need a valid API key from [Google AI Studio](https://aistudio.google.com/).

## 💻 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/alfatih-dunia-wisata.git
    cd alfatih-dunia-wisata
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add your Gemini API Key:
    ```env
    gemini_api_key=YOUR_API_KEY_HERE
    ```
    *(Note: The application is configured to read `process.env.API_KEY` or `process.env.GEMINI_API_KEY` via Vite's define plugin.)*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open your browser:**
    Navigate to `http://localhost:3000` (or the port shown in your terminal).

## 📁 Project Structure

```
alfatih-dunia-wisata/
├── components/       # React UI components (Hero, Navbar, TourCard, AIPlanner, etc.)
├── services/         # API services (geminiService.ts)
├── App.tsx           # Main application entry point
├── index.html        # HTML entry point (Tailwind config script is here)
├── types.ts          # TypeScript type definitions
├── constants.ts      # Static data (Tours, Testimonials)
├── vite.config.ts    # Vite configuration
└── package.json      # Project dependencies and scripts
```

## 🤝 Contributing

Contributions are always welcome! Please follow these steps:
1.  Fork the project repository.
2.  Create a new branch: `git checkout -b feature/awesome-feature`.
3.  Make your changes and commit them: `git commit -m 'Add some feature'`.
4.  Push to the original branch: `git push origin feature/awesome-feature`.
5.  Create a pull request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---
*Built with ❤️ by the Alfatih Dunia Wisata Team.*
