# Design Spec: Text Campaign & Poster Maker Integration

## 1. Overview
Integrate the Text Campaign AI generator with the Poster Maker feature to allow users to seamlessly turn AI-generated content (like educational tips, Islamic reminders, and motivational quotes) into multi-slide carousel posters. Additionally, the Text Campaign UI/UX will be refactored to feel more like a professional "AI Workspace" rather than a generic form.

## 2. Feature Changes: "Content Poster" Type
- **Remove:** "Ucapan Hari Raya" option from the Campaign Type selector.
- **Add:** "Konten Edukasi & Interaksi" (Content Poster) option. This caters to engagement tips, quotes, and reminders.
- **Inputs for Content Poster:**
  - Topic / Title (e.g., "5 Tips Persiapan Umrah")
  - Target Audience (e.g., "Keluarga Muda")
  - Number of Slides (e.g., 3-10 slides)
  - Additional Notes (Optional instructions for tone or specific content)

## 3. UI/UX Refactoring (Frontend Design Principles)
- **Workspace Layout:**
  - **Left Panel (The Brief):** Group inputs logically with a strong typographic hierarchy instead of standard labels.
  - **Right Panel (The Draft):** Output generated text. For multi-slide content, parse the AI's output and render it as distinct "Slide Cards" to give the user a mental model of the final carousel.
- **Visual Identity:**
  - Use deliberate typography and contrasting active states (e.g., deep emerald or warm gold) rather than default Tailwind colors.
  - Implement a subtle, polished micro-animation (e.g., a shimmering pulse) during AI generation instead of a generic spinner.
- **Copywriting:**
  - Change "Generate" to "Tulis Draft".
  - Change "Create Poster" to "Desain ke Poster".
  - Use active voice and specific labels throughout the flow.

## 4. Integration Flow
1. User selects "Konten Edukasi & Interaksi" and fills out the brief.
2. AI generates structured text separated into distinct slides.
3. The right panel renders the output as Slide Cards.
4. User clicks "Desain ke Poster".
5. The application redirects to the `PosterMaker` route, passing the generated slide data (via React Router state or a temporary global store).
6. In `PosterMaker`, the user selects a template, and the system automatically creates the requested number of canvas slides, pre-filling them with the text from the Text Campaign draft.

## 5. Technical Considerations
- Update the `ai-text-campaign` Edge Function (or prompt payload) to enforce structured output (JSON or strict Markdown) when generating multi-slide content.
- Ensure the routing to Poster Maker cleanly passes and handles the initialization data so it can hydrate the Fabric.js canvases.
