# AI Agent Guidelines

This project has consolidated all AI agent instructions into `AGENTS.md`. 
Please refer to [`AGENTS.md`](./AGENTS.md) for all architecture, style, and context guidelines before modifying this codebase.

## Critical Rules

### Bilingual Public Pages
**All user-visible text on public-facing pages and components MUST be available in both Bahasa Indonesia and English.**

- Use the `t('key')` function from `useLanguage()` (imported from `src/contexts/LanguageContext.tsx`) for every string.
- Never hardcode text directly in public components — always add a translation key first.
- Add both `id` (Indonesian) and `en` (English) values to the `translations` object in `LanguageContext.tsx` before using the key.
- This applies to: all components in `components/` (public UI), all pages in `src/pages/` except `src/pages/admin/`, and any new public pages added.
- Admin pages (`src/pages/admin/`) are exempt — English only is fine there.
