# Search & Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add polished search + client-side pagination to all admin list pages, and improve the count badge UI in the page header.

**Architecture:** All data is loaded once per page mount (existing pattern). Search filters in-memory; pagination slices the filtered array. Two new shared components (`SearchInput`, `Pagination`) and one updated component (`PageHeader` badge) land in `ui.tsx`, then each list page is updated to wire them up.

**Tech Stack:** React 18, TypeScript, Tailwind CSS (CDN v3), lucide-react

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/admin/ui.tsx` | Add `SearchInput`, `Pagination`; update `PageHeader` badge; add lucide imports |
| `src/pages/admin/Airports.tsx` | Add search state, filtered/paginated compute, render toolbar + pagination |
| `src/pages/admin/Airlines.tsx` | Same pattern |
| `src/pages/admin/Hotels.tsx` | Same pattern |
| `src/pages/admin/Categories.tsx` | Same pattern |
| `src/pages/admin/Orders.tsx` | Same pattern |
| `src/pages/admin/PrivateTrips.tsx` | Same pattern |
| `src/pages/admin/Packages.tsx` | Same pattern (card grid, not table) |

---

## Task 1: Update `ui.tsx` — badge, SearchInput, Pagination

**Files:**
- Modify: `src/components/admin/ui.tsx`

- [ ] **Step 1: Update lucide-react import**

Replace the existing import line at the top of `ui.tsx`:

```tsx
import { X, AlertTriangle, CheckCircle, Info, XCircle, ChevronRight } from 'lucide-react';
```

with:

```tsx
import { X, AlertTriangle, CheckCircle, Info, XCircle, ChevronRight, ChevronLeft, Search } from 'lucide-react';
```

- [ ] **Step 2: Improve PageHeader badge styling**

In the `PageHeader` component, find the badge span and replace it:

Old:
```tsx
<span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full tabular-nums">
    {badge}
</span>
```

New:
```tsx
<span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-primary border border-blue-100 rounded-full tabular-nums">
    {badge}
</span>
```

- [ ] **Step 3: Add SearchInput component**

Add after the `SectionCard` export (before the `StatCard` section) in `ui.tsx`:

```tsx
// ── Search Input ───────────────────────────────────────────

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Search...' }) => (
    <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300"
        />
        {value && (
            <button
                onClick={() => onChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        )}
    </div>
);
```

- [ ] **Step 4: Add Pagination component**

Add after `SearchInput`:

```tsx
// ── Pagination ─────────────────────────────────────────────

interface PaginationProps {
    page: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalItems, pageSize, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return null;
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, totalItems);

    const pageNumbers = (): (number | '…')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
        if (page < 4) return [0, 1, 2, 3, 4, '…', totalPages - 1];
        if (page > totalPages - 5) return [0, '…', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1];
        return [0, '…', page - 1, page, page + 1, '…', totalPages - 1];
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 pt-4">
            <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of <span className="font-semibold text-gray-700">{totalItems}</span>
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                {pageNumbers().map((n, i) =>
                    n === '…' ? (
                        <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">…</span>
                    ) : (
                        <button
                            key={n}
                            onClick={() => onPageChange(n as number)}
                            className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                                n === page
                                    ? 'bg-primary text-white shadow-sm shadow-blue-200/60'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {(n as number) + 1}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages - 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/ui.tsx
git commit -m "feat: add SearchInput and Pagination to admin ui kit, improve badge styling"
```

---

## Task 2: Airports — search + pagination

**Files:**
- Modify: `src/pages/admin/Airports.tsx`

- [ ] **Step 1: Update imports**

Add `SearchInput`, `Pagination` to the import from `ui`:

```tsx
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost, useToast,
  SearchInput, Pagination,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add search + pagination state constants and state**

After the existing `useState` declarations, add:

```tsx
const PAGE_SIZE = 10;
const [searchQuery, setSearchQuery] = useState('');
const [page, setPage] = useState(0);
```

Also add a `useEffect` to reset the page when search changes. Add this after the existing `useEffect`:

```tsx
useEffect(() => { setPage(0); }, [searchQuery]);
```

- [ ] **Step 3: Add filtered and paginated derivations**

Add these two derived values right before the `return` statement:

```tsx
const filtered = airports.filter((a) =>
    [a.iata_code, a.name, a.city, a.country].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 4: Wire up the search toolbar above the table**

Between `<PageHeader ... />` and `<TableCard>`, add:

```tsx
<div className="mb-4 flex items-center justify-between gap-3">
    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search IATA, name, city..." />
</div>
```

- [ ] **Step 5: Replace `airports` with `paginated` in the table body**

In the `tbody`, change the map source and empty state condition:

- Replace `airports.length === 0` → `filtered.length === 0`
- Replace `airports.map(...)` → `paginated.map(...)`

The loading skeleton row stays as-is (only shows during load, not affected by search).

- [ ] **Step 6: Add Pagination below TableCard**

After `</TableCard>` and before `<SlideOver`, add:

```tsx
{!loading && (
    <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
)}
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Airports.tsx
git commit -m "feat: add search and pagination to Airports page"
```

---

## Task 3: Airlines — search + pagination

**Files:**
- Modify: `src/pages/admin/Airlines.tsx`

- [ ] **Step 1: Update imports**

```tsx
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost,
    useToast, SearchInput, Pagination,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add search + pagination state**

After existing `useState` declarations:

```tsx
const PAGE_SIZE = 10;
const [searchQuery, setSearchQuery] = useState('');
const [page, setPage] = useState(0);
```

And after the existing `useEffect`:

```tsx
useEffect(() => { setPage(0); }, [searchQuery]);
```

- [ ] **Step 3: Derived filtered + paginated**

Before `return`:

```tsx
const filtered = airlines.filter((a) =>
    (a.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 4: Search toolbar**

Between `<PageHeader ... />` and `<TableCard>`:

```tsx
<div className="mb-4">
    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search airline name..." />
</div>
```

- [ ] **Step 5: Replace airlines with paginated in tbody**

- `airlines.length === 0` → `filtered.length === 0`
- `airlines.map(...)` → `paginated.map(...)`

- [ ] **Step 6: Pagination below TableCard**

```tsx
{!loading && (
    <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
)}
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Airlines.tsx
git commit -m "feat: add search and pagination to Airlines page"
```

---

## Task 4: Hotels — search + pagination

**Files:**
- Modify: `src/pages/admin/Hotels.tsx`

- [ ] **Step 1: Update imports**

```tsx
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, FormField, inputClass, selectClass, btnPrimary, btnSecondary, btnGhost,
    useToast, SearchInput, Pagination,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add state**

After existing `useState` declarations:

```tsx
const PAGE_SIZE = 10;
const [searchQuery, setSearchQuery] = useState('');
const [page, setPage] = useState(0);
```

After existing `useEffect`:

```tsx
useEffect(() => { setPage(0); }, [searchQuery]);
```

- [ ] **Step 3: Derived values**

Before `return`:

```tsx
const filtered = hotels.filter((h) =>
    [h.name, h.location].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 4: Search toolbar**

Between `<PageHeader ... />` and `<TableCard>`:

```tsx
<div className="mb-4">
    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search hotel name or location..." />
</div>
```

- [ ] **Step 5: Update tbody**

- `hotels.length === 0` → `filtered.length === 0`
- `hotels.map(...)` → `paginated.map(...)`

- [ ] **Step 6: Pagination**

```tsx
{!loading && (
    <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
)}
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Hotels.tsx
git commit -m "feat: add search and pagination to Hotels page"
```

---

## Task 5: Categories — search + pagination

**Files:**
- Modify: `src/pages/admin/Categories.tsx`

- [ ] **Step 1: Update imports**

```tsx
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost, useToast,
  SearchInput, Pagination,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add state**

After existing `useState` declarations:

```tsx
const PAGE_SIZE = 10;
const [searchQuery, setSearchQuery] = useState('');
const [page, setPage] = useState(0);
```

After existing `useEffect`:

```tsx
useEffect(() => { setPage(0); }, [searchQuery]);
```

- [ ] **Step 3: Derived values**

Before `return` (read the existing Categories component to find the right spot):

```tsx
const filtered = categories.filter((c) =>
    [c.name, c.slug].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 4: Search toolbar**

Between `<PageHeader ... />` and `<TableCard>`:

```tsx
<div className="mb-4">
    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name or slug..." />
</div>
```

- [ ] **Step 5: Update tbody**

- `categories.length === 0` → `filtered.length === 0`
- `categories.map(...)` → `paginated.map(...)`

- [ ] **Step 6: Pagination**

```tsx
{!loading && (
    <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
)}
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Categories.tsx
git commit -m "feat: add search and pagination to Categories page"
```

---

## Task 6: Orders — search + pagination

**Files:**
- Modify: `src/pages/admin/Orders.tsx`

- [ ] **Step 1: Update imports**

```tsx
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState,
    ConfirmDialog, StatusBadge, btnPrimary, btnGhost, useToast,
    SearchInput, Pagination,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add state**

After existing `useState` declarations:

```tsx
const PAGE_SIZE = 10;
const [searchQuery, setSearchQuery] = useState('');
const [page, setPage] = useState(0);
```

After existing `useEffect`:

```tsx
useEffect(() => { setPage(0); }, [searchQuery]);
```

- [ ] **Step 3: Derived values**

Before `return`:

```tsx
const filtered = orders.filter((o) =>
    [o.customer_name, o.customer_phone, o.packages?.title].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 4: Search toolbar**

Between `<PageHeader ... />` and `<TableCard>`:

```tsx
<div className="mb-4">
    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search customer or package..." />
</div>
```

- [ ] **Step 5: Update tbody**

- `orders.length === 0` → `filtered.length === 0`
- `orders.map(...)` → `paginated.map(...)`

- [ ] **Step 6: Pagination**

```tsx
{!loading && (
    <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
)}
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Orders.tsx
git commit -m "feat: add search and pagination to Orders page"
```

---

## Task 7: PrivateTrips — search + pagination

**Files:**
- Modify: `src/pages/admin/PrivateTrips.tsx`

- [ ] **Step 1: Update imports**

```tsx
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, StatusBadge, FormField, textareaClass, btnPrimary, btnSecondary, btnGhost,
    useToast, SearchInput, Pagination,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add state**

After existing `useState` declarations:

```tsx
const PAGE_SIZE = 10;
const [searchQuery, setSearchQuery] = useState('');
const [page, setPage] = useState(0);
```

After existing `useEffect`:

```tsx
useEffect(() => { setPage(0); }, [searchQuery]);
```

- [ ] **Step 3: Derived values**

Before `return`:

```tsx
const filtered = requests.filter((r) =>
    [r.name, r.phone, r.destination, r.email].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 4: Search toolbar**

Between `<PageHeader ... />` and `<TableCard>`:

```tsx
<div className="mb-4">
    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name, destination..." />
</div>
```

- [ ] **Step 5: Update tbody**

- `requests.length === 0` → `filtered.length === 0`
- `requests.map(...)` → `paginated.map(...)`

- [ ] **Step 6: Pagination**

After `</TableCard>` and before the Detail SlideOver:

```tsx
{!loading && (
    <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
)}
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/PrivateTrips.tsx
git commit -m "feat: add search and pagination to PrivateTrips page"
```

---

## Task 8: Packages — search + pagination (card grid)

**Files:**
- Modify: `src/pages/admin/Packages.tsx`

- [ ] **Step 1: Update imports**

```tsx
import {
    PageHeader, SkeletonCard, EmptyState, ConfirmDialog,
    btnPrimary, btnGhost, useToast, StatusBadge,
    SearchInput, Pagination,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add state**

After existing `useState` declarations:

```tsx
const PAGE_SIZE = 12;
const [searchQuery, setSearchQuery] = useState('');
const [page, setPage] = useState(0);
```

After existing `useEffect`:

```tsx
useEffect(() => { setPage(0); }, [searchQuery]);
```

Note: `PAGE_SIZE = 12` so the 3-column grid fills complete rows.

- [ ] **Step 3: Derived values**

Before `return`:

```tsx
const filtered = packages.filter((p) =>
    [p.title, p.category, p.departure_date].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 4: Search toolbar**

Between `<PageHeader ... />` and the loading block (`{loading ? ...}`):

```tsx
<div className="mb-4">
    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search title, category, date..." />
</div>
```

- [ ] **Step 5: Update card grid rendering**

Currently the structure is `{loading ? <skeletons> : packages.length === 0 ? <empty> : <grid>}`.

Change to:

```tsx
{loading ? (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
) : filtered.length === 0 ? (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <EmptyState
            icon={<Package className="w-7 h-7" />}
            title={searchQuery ? 'No packages match your search' : 'No packages yet'}
            description={searchQuery ? 'Try a different search term.' : 'Create your first tour package to start accepting bookings.'}
            action={
                !searchQuery ? (
                    <button onClick={() => navigate('/admin/packages/new')} className={btnPrimary}>
                        <Plus className="w-4 h-4" /> New Package
                    </button>
                ) : undefined
            }
        />
    </div>
) : (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {paginated.map((pkg) => {
            // ... existing card JSX unchanged, just change `packages.map` to `paginated.map`
        })}
    </div>
)}
```

- [ ] **Step 6: Pagination below the grid**

After the closing `)}` of the loading/empty/grid block, before `{isDetailOpen && ...}`:

```tsx
{!loading && (
    <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
)}
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Packages.tsx
git commit -m "feat: add search and pagination to Packages page"
```

---

## Self-Review

**Spec coverage:**
- ✅ Badge UI improvement → Task 1 Step 2
- ✅ `SearchInput` component → Task 1 Step 3
- ✅ `Pagination` component with ellipsis → Task 1 Step 4
- ✅ Airports search (IATA, name, city, country) + pagination → Task 2
- ✅ Airlines search (name) + pagination → Task 3
- ✅ Hotels search (name, location) + pagination → Task 4
- ✅ Categories search (name, slug) + pagination → Task 5
- ✅ Orders search (customer, package) + pagination → Task 6
- ✅ PrivateTrips search (name, destination) + pagination → Task 7
- ✅ Packages (card grid) search + pagination → Task 8

**Placeholder scan:** No TBD/TODO in plan. All code blocks are complete.

**Type consistency:** `SearchInput` props (`value: string`, `onChange: (value: string) => void`) consistent across all uses. `Pagination` props (`page`, `totalItems`, `pageSize`, `onPageChange`) consistent. `PAGE_SIZE` constant defined locally in each page (10 for tables, 12 for Packages grid).
