# CI/CD Tag-Triggered Vercel Production Deploy

**Date:** 2026-05-24
**Status:** Approved

## Goal

Automatically deploy to Vercel production whenever a semantic version tag (`v*.*.*`) is pushed to the GitHub repository. Replaces the current manual `vercel --prod` workflow.

## Trigger

- **Event:** `push` to tag matching `v*.*.*`
- **Examples:** `v1.0.0`, `v1.2.3`, `v2.0.0-rc1` (any tag starting with `v` followed by semver)
- **Deploys the exact tagged commit** — not just `main`

## Workflow File

Single file: `.github/workflows/deploy-prod.yml`

### Steps

| Step | Action | Detail |
|------|--------|--------|
| 1 | Checkout | `actions/checkout@v4` — checks out the tagged commit |
| 2 | Setup Node | `actions/setup-node@v4` — Node 20, npm cache enabled |
| 3 | Install deps | `npm ci` — clean, reproducible install |
| 4 | Build | `vercel build --prod` — builds using Vercel CLI; pulls env vars from Vercel project dashboard |
| 5 | Deploy | `vercel deploy --prebuilt --prod` — uploads artifact, promotes to production |

### Why Prebuilt Deploy

`vercel build` runs locally in GitHub Actions, giving full build logs in the GH Actions UI. `vercel deploy --prebuilt` then uploads the artifact — Vercel does not rebuild. This is Vercel's recommended CI pattern.

### Environment Variables at Build Time

Vercel CLI's `vercel build` fetches production environment variables from the Vercel project dashboard automatically. The `VITE_*` keys (Supabase, Gemini, reCAPTCHA, Unsplash, Pixabay) do **not** need to be duplicated as GitHub secrets.

## Required GitHub Secrets

Add these at `github.com/auliaadil/alfatih-web/settings/secrets/actions`:

| Secret | Value | Source |
|--------|-------|--------|
| `VERCEL_TOKEN` | Personal access token | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `team_tw1XZRbtYHw27co3DO9sbhsD` | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `prj_1FurlgwbripDyuDTZXzTLxuy3trT` | `.vercel/project.json` |

## Deployment Flow

```
git tag v1.0.0
git push origin v1.0.0
        │
        ▼
GitHub Actions triggered
        │
        ├── npm ci
        ├── vercel build --prod   ← pulls env vars from Vercel dashboard
        └── vercel deploy --prebuilt --prod
                │
                ▼
        Vercel Production URL live
```

## Out of Scope

- No manual approval gate (straight tag → deploy)
- No type-check or lint step
- No rollback automation (use Vercel dashboard to revert if needed)
- No staging/preview deploy on PR (can be added later via Vercel GitHub integration)
