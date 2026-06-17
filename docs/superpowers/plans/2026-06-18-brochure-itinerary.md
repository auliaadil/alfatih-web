# Brochure & Itinerary Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Package Detail slide-over panel to the admin Packages page with two actions — "Buat Brosur" (opens Poster Maker pre-loaded with the package) and "Download Itinerary PDF" (generates and downloads a branded PDF via Supabase Edge Function).

**Architecture:** A new `PackageDetailPanel` slide-over replaces the old participants-only modal. PosterMaker detects `?packageId&mode=brochure` URL params on mount and pre-wires the AI Autofill inputs. A new `generate-itinerary-pdf` Deno Edge Function uses `pdf-lib` to build a multi-section A4 PDF and streams it back as a binary response.

**Tech Stack:** React + react-router-dom v6, Tailwind CSS (CDN), Supabase JS v2, pdf-lib@1.17.1 (Deno ESM, no headless browser required)

## Global Constraints

- Tailwind via CDN — no PostCSS, no `@apply`. Use inline `className` strings only.
- Brand colors: primary `#0084FF`, secondary `#F59E0B`, dark `#0F172A`. Use these literal hex values in pdf-lib; in JSX use `text-primary`, `text-secondary`, etc.
- All copy in Bahasa Indonesia.
- No `any` type unless the existing codebase already uses it for that value (packages from Supabase are typed `any[]` in Packages.tsx — match that pattern).
- Edge function auth: verify JWT via `supabaseAdmin.auth.getUser(token)` — same pattern as `supabase/functions/ai-poster-autofill/index.ts`.
- Supabase client import in new frontend files: `import { supabase } from '@/src/lib/supabase'`.
- `VITE_SUPABASE_URL` used for edge function fetch URLs (matches posterAutofillService pattern).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/pages/admin/PackageDetailPanel.tsx` | **Create** | Slide-over drawer: package info + action buttons |
| `src/pages/admin/Packages.tsx` | **Modify** | Wire up panel, replace "Participants" button |
| `src/pages/admin/PosterMaker.tsx` | **Modify** | Detect brochure URL params, pre-set package, show banner |
| `services/itineraryPdfService.ts` | **Create** | Frontend fetch wrapper: calls edge function, triggers download |
| `supabase/functions/generate-itinerary-pdf/index.ts` | **Create** | Deno edge function: builds PDF with pdf-lib |

---

## Task 1: PackageDetailPanel slide-over component

**Files:**
- Create: `src/pages/admin/PackageDetailPanel.tsx`

**Interfaces:**
- Consumes: `pkg: any` (raw row from `packages` table, same shape as Packages.tsx card data), `onClose: () => void`
- Produces: exported `PackageDetailPanel` React component; triggers `navigate` and `downloadItineraryPdf` internally

- [ ] **Step 1: Create the file with imports and props**

```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Image, FileDown, Star, Loader2, Users } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { downloadItineraryPdf } from '../../../services/itineraryPdfService';

interface PackageDetailPanelProps {
    pkg: any;
    onClose: () => void;
}
```

Note: `downloadItineraryPdf` import will fail until Task 4 is done. Add a `// TODO` comment and implement the call in Step 6 after Task 4 is complete, OR stub it with `console.log('pdf')` for now.

- [ ] **Step 2: Add state, data fetching, and panel skeleton**

```tsx
const PackageDetailPanel: React.FC<PackageDetailPanelProps> = ({ pkg, onClose }) => {
    const navigate = useNavigate();
    const settings = useSiteSettings();
    const [airlines, setAirlines] = useState<any[]>([]);
    const [hotels, setHotels] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const fetches: Promise<void>[] = [];

            if (pkg.airline_ids?.length) {
                fetches.push(
                    supabase.from('airlines').select('id, name, logo_url').in('id', pkg.airline_ids)
                        .then(({ data }) => { if (data) setAirlines(data); })
                );
            }
            if (pkg.hotel_ids?.length) {
                fetches.push(
                    supabase.from('hotels').select('id, name, location, stars').in('id', pkg.hotel_ids)
                        .then(({ data }) => { if (data) setHotels(data); })
                );
            }
            fetches.push(
                supabase
                    .from('participants')
                    .select('id, orders!inner(package_id)')
                    .eq('orders.package_id', pkg.id)
                    .then(({ data }) => { if (data) setParticipants(data); })
            );

            await Promise.all(fetches);
            setLoading(false);
        };
        load();
    }, [pkg.id]);
```

- [ ] **Step 3: Add helper for IDR price formatting**

Inside the component (after state declarations):

```tsx
    const formatPrice = (price?: number) =>
        price
            ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
            : 'Hubungi Kami';

    const makkahHotels = hotels.filter(h => h.location?.toLowerCase().includes('makkah') || h.location?.toLowerCase().includes('mekkah'));
    const madinahHotels = hotels.filter(h => h.location?.toLowerCase().includes('madinah') || h.location?.toLowerCase().includes('medina'));
    const otherHotels = hotels.filter(h => !makkahHotels.includes(h) && !madinahHotels.includes(h));

    const totalQuota = pkg.initial_quotas || pkg.quotas || 1;
    const usedQuota = totalQuota - (pkg.quotas || 0);
    const quotaPct = Math.min(Math.round((usedQuota / totalQuota) * 100), 100);
```

- [ ] **Step 4: Add handleDownloadPdf handler**

```tsx
    const handleDownloadPdf = async () => {
        setIsPdfLoading(true);
        try {
            const fullPkg = {
                ...pkg,
                airlines,
                hotels,
            };
            await downloadItineraryPdf(fullPkg, {
                whatsapp: settings.whatsapp,
                phone: settings.phone,
            });
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Gagal mengunduh itinerary. Silakan coba lagi.');
        } finally {
            setIsPdfLoading(false);
        }
    };
```

- [ ] **Step 5: Build the JSX — backdrop + panel wrapper**

```tsx
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="relative flex-shrink-0">
                    {pkg.image_url ? (
                        <img src={pkg.image_url} alt={pkg.title} className="w-full h-40 object-cover" />
                    ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                            <Image className="w-12 h-12 text-blue-300" />
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md text-gray-600 hover:text-gray-900 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="text-white font-bold text-lg leading-tight">{pkg.title}</h2>
                            {pkg.category && (
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-white">
                                    {pkg.category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Key info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Keberangkatan</p>
                            <p className="font-semibold text-gray-900">{pkg.departure_date || '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Durasi</p>
                            <p className="font-semibold text-gray-900">{pkg.duration || '—'}</p>
                        </div>
                        {airlines.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Maskapai</p>
                                <p className="font-semibold text-gray-900">{airlines.map(a => a.name).join(', ')}</p>
                            </div>
                        )}
                    </div>

                    {/* Pricing */}
                    {pkg.room_options?.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Harga Paket</h3>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                {pkg.room_options.map((opt: any, i: number) => (
                                    <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                        <span className="text-sm text-gray-700 font-medium">Kamar {opt.name}</span>
                                        <span className="text-sm font-bold text-secondary">{formatPrice(opt.price)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hotels */}
                    {hotels.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Hotel</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Mekkah', list: makkahHotels },
                                    { label: 'Madinah', list: madinahHotels },
                                    ...(otherHotels.length > 0 ? [{ label: 'Lainnya', list: otherHotels }] : []),
                                ].map(group => group.list.length > 0 && (
                                    <div key={group.label} className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-400 font-medium mb-1">{group.label}</p>
                                        {group.list.map((h: any) => (
                                            <div key={h.id}>
                                                <p className="text-sm font-semibold text-gray-800 leading-tight">{h.name}</p>
                                                <p className="text-xs text-secondary mt-0.5">{'★'.repeat(h.stars || 0)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quota / Participants */}
                    <div>
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Kuota & Peserta</h3>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" /> Terdaftar
                                </span>
                                <span className="font-bold text-gray-800">{loading ? '…' : participants.length} pax</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                <span>Sisa kuota</span>
                                <span className="font-semibold">{pkg.quotas} / {totalQuota}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${quotaPct >= 80 ? 'bg-red-400' : 'bg-primary'}`}
                                    style={{ width: `${quotaPct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Included */}
                    {pkg.included?.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Sudah Termasuk</h3>
                            <ul className="space-y-1">
                                {pkg.included.map((item: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-green-500 font-bold mt-0.5">✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Not Included */}
                    {pkg.not_included?.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Tidak Termasuk</h3>
                            <ul className="space-y-1">
                                {pkg.not_included.map((item: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-red-400 font-bold mt-0.5">✕</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Sticky action bar */}
                <div className="flex-shrink-0 border-t border-gray-100 p-4 grid grid-cols-2 gap-3 bg-white">
                    <button
                        onClick={() => navigate(`/admin/poster-maker?packageId=${pkg.id}&mode=brochure`)}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition"
                    >
                        <Image className="w-4 h-4" />
                        Buat Brosur
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isPdfLoading}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-primary text-primary text-sm font-semibold hover:bg-blue-50 transition disabled:opacity-60"
                    >
                        {isPdfLoading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <FileDown className="w-4 h-4" />}
                        {isPdfLoading ? 'Memuat…' : 'Itinerary PDF'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default PackageDetailPanel;
```

- [ ] **Step 6: Verify the component renders without errors**

Run `npm run dev`, navigate to `/admin/packages` (you'll wire the button in Task 2). Confirm no TypeScript errors in the terminal output. The `downloadItineraryPdf` import will be a broken import until Task 4 — stub it temporarily:

```tsx
// Temporary stub at top of file until Task 4:
const downloadItineraryPdf = async (..._args: any[]) => { alert('PDF coming soon'); };
```

Remove the stub after Task 4.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/PackageDetailPanel.tsx
git commit -m "feat(packages): add PackageDetailPanel slide-over component"
```

---

## Task 2: Wire PackageDetailPanel into Packages page

**Files:**
- Modify: `src/pages/admin/Packages.tsx`

**Interfaces:**
- Consumes: `PackageDetailPanel` from Task 1
- Produces: "Detail" button on each card that opens the panel

- [ ] **Step 1: Add import and state**

At the top of `Packages.tsx`, add the import alongside existing imports:

```tsx
import PackageDetailPanel from './PackageDetailPanel';
```

Inside the `Packages` component, add two new state variables alongside existing `isDetailOpen` / `selectedPackage`:

```tsx
const [isPanelOpen, setIsPanelOpen] = useState(false);
const [panelPackage, setPanelPackage] = useState<any | null>(null);
```

(Keep the existing `isDetailOpen` / `selectedPackage` state — `PackageDetailModal` remains mounted and functional for now.)

- [ ] **Step 2: Replace the "Participants" button with "Detail"**

Find this block in the card JSX (around line 175–181):

```tsx
<button
    onClick={() => { setSelectedPackage(pkg); setIsDetailOpen(true); }}
    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-blue-700 transition-colors"
>
    <Users className="w-3.5 h-3.5" />
    Participants
</button>
```

Replace with:

```tsx
<button
    onClick={() => { setPanelPackage(pkg); setIsPanelOpen(true); }}
    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-blue-700 transition-colors"
>
    <Users className="w-3.5 h-3.5" />
    Detail
</button>
```

- [ ] **Step 3: Render PackageDetailPanel**

After the existing `{isDetailOpen && selectedPackage && <PackageDetailModal ... />}` block, add:

```tsx
{isPanelOpen && panelPackage && (
    <PackageDetailPanel
        pkg={panelPackage}
        onClose={() => { setIsPanelOpen(false); setPanelPackage(null); }}
    />
)}
```

- [ ] **Step 4: Verify**

Run `npm run dev`. On the Packages page, click "Detail" on any card. Confirm:
1. Panel slides in from the right with a backdrop.
2. Package image, title, category badge are visible.
3. Pricing, hotels, quota bar populate correctly (may show blanks if `airline_ids`/`hotel_ids` are empty).
4. Clicking the backdrop or X button closes the panel.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/Packages.tsx
git commit -m "feat(packages): wire PackageDetailPanel into Packages page"
```

---

## Task 3: PosterMaker brochure mode

**Files:**
- Modify: `src/pages/admin/PosterMaker.tsx`

**Interfaces:**
- Consumes: URL params `?packageId=<uuid>&mode=brochure` from navigation
- Produces: pre-selected package in AI Autofill inputs + dismissible brochure banner

- [ ] **Step 1: Add useSearchParams import**

At line 2, `useLocation` is already imported from `react-router-dom`. Add `useSearchParams` to the same import:

```tsx
import { useLocation, useSearchParams } from 'react-router-dom';
```

- [ ] **Step 2: Add brochure mode state inside the PosterMaker component**

After the existing state declarations (around line 328, after `selectedPackageId`), add:

```tsx
const [searchParams] = useSearchParams();
const [isBrochureBannerVisible, setIsBrochureBannerVisible] = useState(false);

const brochurePackageId = searchParams.get('packageId');
const isBrochureMode = searchParams.get('mode') === 'brochure';
```

- [ ] **Step 3: Add brochure mode effect**

After the existing `useEffect` that calls `fetchPackages()` and `loadCustomTemplates()` (around line 330), add a new effect:

```tsx
useEffect(() => {
    if (!isBrochureMode || !brochurePackageId) return;

    // Wait for packages to be loaded by the existing fetchPackages effect
    if (packages.length === 0) return;

    const found = packages.find(p => p.id === brochurePackageId);
    if (found) {
        setSelectedPackageId(found.id);
        setIsBrochureBannerVisible(true);
    }
}, [isBrochureMode, brochurePackageId, packages]);
```

- [ ] **Step 4: Add brochure banner JSX**

Find the section in the main return JSX where the toolbar is rendered (search for `<EditorToolbar`). Add the banner **immediately after** the closing `</EditorToolbar>` tag:

```tsx
{isBrochureMode && isBrochureBannerVisible && (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm flex-shrink-0">
        <p className="text-blue-800">
            <span className="font-semibold">Mode Brosur aktif</span> — pilih template lalu klik{' '}
            <span className="font-semibold">AI Autofill</span> untuk mengisi otomatis dari paket ini.
        </p>
        <button
            onClick={() => setIsBrochureBannerVisible(false)}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition"
            title="Tutup banner"
        >
            <X className="w-4 h-4" />
        </button>
    </div>
)}
```

- [ ] **Step 5: Handle empty-template state in NewDesignModal when brochure mode**

In brochure mode the template picker will be empty (`STARTER_TEMPLATES = []`). The `NewDesignModal` already renders *"Belum ada template."* for empty groups. No code change needed — this is the correct empty state. The user can still pick "Mulai Mendesain →" from a blank canvas.

Confirm by reading `NewDesignModal` JSX (lines ~155–266): the `renderGroup` helper already shows the empty text. No changes needed.

- [ ] **Step 6: Verify**

Run `npm run dev`. Navigate directly to `/admin/poster-maker?packageId=<any-valid-uuid>&mode=brochure`:

1. `NewDesignModal` opens as normal.
2. After selecting a template or blank canvas, the blue banner appears below the toolbar.
3. In the AI tab (right panel), the package dropdown is pre-selected to the brochure package.
4. Dismiss the banner with X — it disappears.

If the `packages` list is empty when the effect runs (async), the effect re-runs when `packages` updates (the dependency array includes `packages`), so the package pre-selection will still happen once packages load.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/PosterMaker.tsx
git commit -m "feat(poster-maker): add brochure mode via URL params"
```

---

## Task 4: Itinerary PDF frontend service

**Files:**
- Create: `services/itineraryPdfService.ts`

**Interfaces:**
- Consumes: `pkg: any` (full package with `airlines`, `hotels`, `itinerary`, `room_options`, `included`, `not_included`), `siteSettings: { whatsapp: string; phone: string }`
- Produces: exported async function `downloadItineraryPdf(pkg, siteSettings)` — triggers browser download, returns `void`

- [ ] **Step 1: Create the service file**

```ts
import { supabase } from '@/src/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ItinerarySiteSettings {
    whatsapp: string;
    phone: string;
}

export async function downloadItineraryPdf(
    pkg: any,
    siteSettings: ItinerarySiteSettings,
): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-itinerary-pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ package: pkg, siteSettings }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PDF generation failed: ${res.status} ${text}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Itinerary - ${pkg.title} - ${pkg.departure_date || ''}.pdf`.replace(/\s+/g, ' ').trim();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Remove the stub from PackageDetailPanel**

In `src/pages/admin/PackageDetailPanel.tsx`, delete the temporary stub (if added in Task 1 Step 6) and update the import to use the real service:

```tsx
import { downloadItineraryPdf } from '../../../services/itineraryPdfService';
```

- [ ] **Step 3: Verify the import resolves without TypeScript errors**

Run `npm run dev` and check the terminal. No import errors should appear. The button will now call the real service (which will fail until Task 5 deploys the edge function).

- [ ] **Step 4: Commit**

```bash
git add services/itineraryPdfService.ts src/pages/admin/PackageDetailPanel.tsx
git commit -m "feat(itinerary): add PDF download service"
```

---

## Task 5: generate-itinerary-pdf Edge Function

**Files:**
- Create: `supabase/functions/generate-itinerary-pdf/index.ts`

**Interfaces:**
- Consumes: `POST` body `{ package: TourPackage, siteSettings: { whatsapp: string, phone: string } }`
- Produces: `application/pdf` binary response, or 401/400/500 error JSON

- [ ] **Step 1: Create the function file with auth boilerplate**

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatPrice = (price?: number) =>
    price
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
        : 'Hubungi Kami';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
        const { package: pkg, siteSettings } = await req.json();
        if (!pkg) return new Response(JSON.stringify({ error: 'Missing package' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const pdfBytes = await buildItineraryPdf(pkg, siteSettings ?? {});

        return new Response(pdfBytes, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Itinerary.pdf"`,
            },
        });
    } catch (err) {
        console.error('generate-itinerary-pdf error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
```

- [ ] **Step 2: Add the layout helper constants and types**

Below the `formatPrice` function, before `Deno.serve`:

```ts
// A4 dimensions in PDF points (1 pt = 1/72 inch)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Brand colors as pdf-lib rgb values
const COLOR_PRIMARY = rgb(0 / 255, 132 / 255, 255 / 255);   // #0084FF
const COLOR_SECONDARY = rgb(245 / 255, 158 / 255, 11 / 255); // #F59E0B
const COLOR_DARK = rgb(15 / 255, 23 / 255, 42 / 255);        // #0F172A
const COLOR_GRAY = rgb(107 / 255, 114 / 255, 128 / 255);     // gray-500
const COLOR_LIGHT_BG = rgb(248 / 255, 250 / 255, 252 / 255); // slate-50
const COLOR_WHITE = rgb(1, 1, 1);

interface DrawContext {
    page: ReturnType<PDFDocument['addPage']>;
    doc: PDFDocument;
    font: Awaited<ReturnType<PDFDocument['embedFont']>>;
    fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>;
    y: number; // current Y cursor (decrements as content is added)
}
```

- [ ] **Step 3: Add a cursor-based text drawing helper**

```ts
// Wraps text to fit within maxWidth, returns array of lines
function wrapText(text: string, font: DrawContext['font'], fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
            current = test;
        } else {
            if (current) lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
}

// Draw wrapped text, advance ctx.y, add new page if needed
function drawText(
    ctx: DrawContext,
    text: string,
    opts: {
        fontSize?: number;
        bold?: boolean;
        color?: ReturnType<typeof rgb>;
        indent?: number;
        lineHeight?: number;
        maxWidth?: number;
    } = {},
): void {
    const {
        fontSize = 10,
        bold = false,
        color = COLOR_DARK,
        indent = 0,
        lineHeight,
        maxWidth,
    } = opts;
    const font = bold ? ctx.fontBold : ctx.font;
    const lh = lineHeight ?? fontSize * 1.5;
    const width = maxWidth ?? CONTENT_W - indent;
    const lines = wrapText(text, font, fontSize, width);

    for (const line of lines) {
        if (ctx.y < MARGIN + fontSize + 10) {
            ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
            ctx.y = PAGE_H - MARGIN;
        }
        ctx.page.drawText(line, {
            x: MARGIN + indent,
            y: ctx.y - fontSize,
            size: fontSize,
            font,
            color,
        });
        ctx.y -= lh;
    }
}

// Draw a filled section header rectangle + white label
function drawSectionHeader(ctx: DrawContext, label: string): void {
    if (ctx.y < MARGIN + 30) {
        ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
        ctx.y = PAGE_H - MARGIN;
    }
    ctx.page.drawRectangle({
        x: MARGIN,
        y: ctx.y - 22,
        width: CONTENT_W,
        height: 22,
        color: COLOR_PRIMARY,
    });
    ctx.page.drawText(label.toUpperCase(), {
        x: MARGIN + 8,
        y: ctx.y - 16,
        size: 9,
        font: ctx.fontBold,
        color: COLOR_WHITE,
    });
    ctx.y -= 30;
}
```

- [ ] **Step 4: Implement the main buildItineraryPdf function**

```ts
async function buildItineraryPdf(
    pkg: any,
    siteSettings: { whatsapp?: string; phone?: string },
): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const firstPage = doc.addPage([PAGE_W, PAGE_H]);
    const ctx: DrawContext = { page: firstPage, doc, font, fontBold, y: PAGE_H - MARGIN };

    // ── Cover ────────────────────────────────────────────────────────────────
    // Blue top bar
    ctx.page.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: COLOR_PRIMARY });
    ctx.page.drawText('ALFATIH DUNIA WISATA', { x: MARGIN, y: PAGE_H - 38, size: 14, font: fontBold, color: COLOR_WHITE });
    ctx.page.drawText('adwisata.com', { x: MARGIN, y: PAGE_H - 54, size: 9, font, color: rgb(0.8, 0.9, 1) });

    ctx.y = PAGE_H - 80;

    // Package title
    drawText(ctx, 'ITINERARY PROGRAM', { fontSize: 10, color: COLOR_GRAY, bold: false });
    ctx.y -= 4;
    drawText(ctx, pkg.title || 'Paket Wisata', { fontSize: 20, bold: true, color: COLOR_PRIMARY });
    ctx.y -= 8;

    // Key info row
    const infoItems = [
        pkg.departure_date && `Keberangkatan: ${pkg.departure_date}`,
        pkg.duration && `Durasi: ${pkg.duration}`,
        pkg.airlines?.length && `Maskapai: ${pkg.airlines.map((a: any) => a.name).join(', ')}`,
    ].filter(Boolean) as string[];

    for (const info of infoItems) {
        drawText(ctx, info, { fontSize: 10, color: COLOR_GRAY });
    }
    ctx.y -= 16;

    // Divider line
    ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: PAGE_W - MARGIN, y: ctx.y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    ctx.y -= 20;

    // ── Day-by-day itinerary ──────────────────────────────────────────────────
    const itinerary: any[] = pkg.itinerary || [];
    if (itinerary.length > 0) {
        drawSectionHeader(ctx, 'Program Perjalanan');
        ctx.y -= 4;

        for (const day of itinerary) {
            // Day header
            const dayLabel = `Hari ${day.day}${day.title ? ` — ${day.title}` : ''}`;
            // Add extra spacing and a new page check before each day
            if (ctx.y < MARGIN + 60) {
                ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
                ctx.y = PAGE_H - MARGIN;
            }
            drawText(ctx, dayLabel, { fontSize: 11, bold: true, color: COLOR_PRIMARY });

            if (day.description) {
                drawText(ctx, day.description, { fontSize: 9, color: COLOR_GRAY, indent: 8 });
            }
            const activities: string[] = day.activities || [];
            for (const act of activities) {
                drawText(ctx, `• ${act}`, { fontSize: 9, color: COLOR_DARK, indent: 8 });
            }
            ctx.y -= 8;
        }
        ctx.y -= 8;
    }

    // ── Hotels ───────────────────────────────────────────────────────────────
    const hotels: any[] = pkg.hotels || [];
    if (hotels.length > 0) {
        drawSectionHeader(ctx, 'Akomodasi Hotel');
        ctx.y -= 4;

        const makkah = hotels.filter((h: any) => /makkah|mekkah/i.test(h.location || ''));
        const madinah = hotels.filter((h: any) => /madinah|medina/i.test(h.location || ''));
        const others = hotels.filter((h: any) => !makkah.includes(h) && !madinah.includes(h));

        for (const [label, list] of [['Hotel Mekkah', makkah], ['Hotel Madinah', madinah], ['Hotel Lainnya', others]] as const) {
            if ((list as any[]).length === 0) continue;
            drawText(ctx, label, { fontSize: 9, bold: true, color: COLOR_GRAY });
            for (const h of list as any[]) {
                const stars = '★'.repeat(h.stars || 0);
                drawText(ctx, `${h.name}${stars ? `  ${stars}` : ''}`, { fontSize: 10, bold: false, color: COLOR_DARK, indent: 8 });
            }
            ctx.y -= 4;
        }
        ctx.y -= 8;
    }

    // ── Pricing ───────────────────────────────────────────────────────────────
    const roomOptions: any[] = pkg.room_options || [];
    if (roomOptions.length > 0) {
        drawSectionHeader(ctx, 'Harga Paket');
        ctx.y -= 4;

        const colW = CONTENT_W / Math.max(roomOptions.length, 1);
        for (let i = 0; i < roomOptions.length; i++) {
            const opt = roomOptions[i];
            const x = MARGIN + i * colW;
            ctx.page.drawText(`Kamar ${opt.name}`, { x, y: ctx.y, size: 8, font, color: COLOR_GRAY });
            ctx.page.drawText(formatPrice(opt.price), { x, y: ctx.y - 14, size: 11, font: fontBold, color: COLOR_SECONDARY });
        }
        ctx.y -= 36;
    }

    // ── Included / Not Included ───────────────────────────────────────────────
    const included: string[] = pkg.included || [];
    const notIncluded: string[] = pkg.not_included || [];

    if (included.length > 0) {
        drawSectionHeader(ctx, 'Sudah Termasuk');
        ctx.y -= 4;
        included.forEach((item, i) => {
            drawText(ctx, `${i + 1}. ${item}`, { fontSize: 9, color: COLOR_DARK, indent: 4 });
        });
        ctx.y -= 8;
    }

    if (notIncluded.length > 0) {
        drawSectionHeader(ctx, 'Tidak Termasuk');
        ctx.y -= 4;
        notIncluded.forEach((item, i) => {
            drawText(ctx, `${i + 1}. ${item}`, { fontSize: 9, color: COLOR_GRAY, indent: 4 });
        });
        ctx.y -= 8;
    }

    // ── Closing ───────────────────────────────────────────────────────────────
    if (ctx.y < MARGIN + 80) {
        ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
        ctx.y = PAGE_H - MARGIN;
    }

    ctx.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 80, color: COLOR_PRIMARY });
    if (siteSettings.whatsapp) {
        ctx.page.drawText(`WhatsApp: ${siteSettings.whatsapp}`, { x: MARGIN, y: 54, size: 10, font: fontBold, color: COLOR_WHITE });
    }
    if (siteSettings.phone) {
        ctx.page.drawText(`Telp: ${siteSettings.phone}`, { x: MARGIN, y: 36, size: 9, font, color: rgb(0.8, 0.9, 1) });
    }
    ctx.page.drawText('Alfatih Dunia Wisata — adwisata.com', { x: MARGIN, y: 18, size: 8, font, color: rgb(0.7, 0.8, 0.9) });

    return doc.save();
}
```

- [ ] **Step 5: Deploy the edge function**

```bash
supabase functions deploy generate-itinerary-pdf
```

Expected output ends with: `Deployed Function generate-itinerary-pdf`

- [ ] **Step 6: Verify end-to-end**

Run `npm run dev`. Open Packages page → click "Detail" on a package that has `itinerary`, `room_options`, `included`, and `not_included` data. Click "Itinerary PDF":

1. Button shows spinner while loading.
2. Browser downloads `Itinerary - <title> - <date>.pdf`.
3. Open the PDF — confirm:
   - Blue top header with "ALFATIH DUNIA WISATA"
   - Package title in primary blue
   - Day-by-day section (if `itinerary` has entries)
   - Hotel section (if `hotels` is populated)
   - Pricing table (if `room_options` is present)
   - Included / Not Included lists
   - Blue footer with WhatsApp and phone from site settings

If a package has no itinerary data, only the cover, pricing, and closing sections render — this is correct (no error).

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/generate-itinerary-pdf/index.ts
git commit -m "feat(itinerary): add generate-itinerary-pdf edge function with pdf-lib"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in |
|---|---|
| Package Detail slide-over with image, title, dates, pricing, hotels, participants, included/not-included | Task 1 |
| "Buat Brosur" button navigates to Poster Maker | Task 1 Step 5 |
| "Download Itinerary PDF" button with spinner | Task 1 Steps 4–5 |
| "Detail" button on package card | Task 2 |
| PosterMaker detects `?packageId&mode=brochure` | Task 3 |
| Package pre-selected in AI Autofill inputs | Task 3 Step 3 |
| Brochure mode banner | Task 3 Step 4 |
| Empty-template graceful state | Task 3 Step 5 |
| `itineraryPdfService.ts` fetch wrapper | Task 4 |
| JWT-authenticated edge function | Task 5 Step 1 |
| PDF: cover, day-by-day, hotels, pricing, included, not-included, closing | Task 5 Step 4 |
| PDF filename format | Task 4 Step 1 |
| WhatsApp / phone from site settings in closing | Task 5 Step 4 |
| Empty itinerary → no error, just fewer sections | Task 5 Step 4 (each section guarded by `if` check) |

**Placeholder scan:** No TBD, TODO (the Task 1 Step 1 stub note is an implementation instruction, not a placeholder). All code blocks are complete.

**Type consistency:** `DrawContext.page` is typed as `ReturnType<PDFDocument['addPage']>` and reassigned the same way throughout — consistent. `formatPrice` defined once in the edge function, not reused elsewhere — no collision.
