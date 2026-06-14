# Column Sorting for Admin Tables — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clickable column-header sorting to all six admin table views (Orders, Airlines, Hotels, PrivateTrips, Categories, Airports).

**Architecture:** Extend the shared `Th` component with optional sort props; add a `compareRows` utility and `SortState` type to `ui.tsx`. Each page adds a `sort` state, derives a `sorted` array between `filtered` and `paginated`, and resets to page 0 on sort change. All sorting is client-side over already-fetched data — no re-fetches.

**Tech Stack:** React 18, TypeScript strict, Tailwind CDN, lucide-react, Supabase (data only — no query changes)

> **No test runner is configured** (see CLAUDE.md). "Test" steps mean: run `npm run dev`, open the page in a browser, and verify the described behaviour visually.

---

## File Map

| File | Change |
|---|---|
| `src/components/admin/ui.tsx` | Add `SortDir`, `SortState` types; `compareRows` utility; extend `Th` with sort props |
| `src/pages/admin/Orders.tsx` | Add sort state + sorted derivation + sortable Th props |
| `src/pages/admin/Airlines.tsx` | Same |
| `src/pages/admin/Hotels.tsx` | Same |
| `src/pages/admin/PrivateTrips.tsx` | Same |
| `src/pages/admin/Categories.tsx` | Same |
| `src/pages/admin/Airports.tsx` | Same |

---

## Task 1: Extend `Th` in `ui.tsx` — types, comparator, sort UI

**Files:**
- Modify: `src/components/admin/ui.tsx`

- [ ] **Step 1: Add lucide icons and export types + `compareRows` to `ui.tsx`**

Open `src/components/admin/ui.tsx`.

Change the lucide import line (currently line 2) to add `ChevronUp`, `ChevronDown`, `ChevronsUpDown`:

```tsx
import { X, AlertTriangle, CheckCircle, Info, XCircle, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';
```

Then, directly after the existing `// ── Table Wrapper ──` block (after the `Td` export, before `// ── Section Card ──`), insert these exports:

```tsx
// ── Sort Utilities ─────────────────────────────────────────

export type SortDir = 'asc' | 'desc';
export interface SortState { key: string; dir: SortDir; }

export function compareRows(a: any, b: any, key: string, dir: SortDir): number {
    const get = (obj: any, k: string): any => k.split('.').reduce((o, part) => o?.[part], obj);
    const valA = get(a, key);
    const valB = get(b, key);
    let cmp: number;
    if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
    } else {
        cmp = String(valA ?? '').toLowerCase().localeCompare(String(valB ?? '').toLowerCase());
    }
    return dir === 'asc' ? cmp : -cmp;
}
```

- [ ] **Step 2: Replace the `Th` component with the sortable version**

Replace the existing `Th` export (currently):

```tsx
export const Th: React.FC<{ children: ReactNode; align?: 'left' | 'right' | 'center' }> = ({ children, align = 'left' }) => (
    <th className={`px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-${align}`}>
        {children}
    </th>
);
```

With:

```tsx
interface ThProps {
    children: ReactNode;
    align?: 'left' | 'right' | 'center';
    sortKey?: string;
    currentSort?: SortState;
    onSort?: (key: string) => void;
}

export const Th: React.FC<ThProps> = ({ children, align = 'left', sortKey, currentSort, onSort }) => {
    const isSortable = !!sortKey && !!onSort;
    const isActive = isSortable && currentSort?.key === sortKey;

    const SortIcon = !isSortable
        ? null
        : isActive
        ? currentSort!.dir === 'asc'
            ? <ChevronUp className="w-3 h-3 shrink-0" />
            : <ChevronDown className="w-3 h-3 shrink-0" />
        : <ChevronsUpDown className="w-3 h-3 shrink-0 text-gray-300" />;

    const inner = (
        <span className={`inline-flex items-center gap-1 ${isActive ? 'text-primary' : ''}`}>
            {children}
            {SortIcon}
        </span>
    );

    return (
        <th className={`px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-${align}`}>
            {isSortable ? (
                <button
                    type="button"
                    onClick={() => onSort!(sortKey!)}
                    className="hover:text-gray-700 transition-colors cursor-pointer"
                >
                    {inner}
                </button>
            ) : inner}
        </th>
    );
};
```

- [ ] **Step 3: Verify in browser**

Run `npm run dev`, open any admin table page (e.g., `/admin/airlines`). Confirm the "Airline Name" header still renders correctly (no visual change yet — sort props not wired up in pages yet). No TypeScript errors in the terminal.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ui.tsx
git commit -m "feat: extend Th with sort props and add compareRows utility"
```

---

## Task 2: Wire sorting in `Orders.tsx`

**Files:**
- Modify: `src/pages/admin/Orders.tsx`

**Sortable columns:** Customer (`customer_name`), Package (`packages.title`), Total Price (`total_price`), Payment Status (`payment_status`)  
**Default sort:** `created_at` desc (preserves current server order; no active indicator shown initially)

- [ ] **Step 1: Update imports in `Orders.tsx`**

Add `SortState, compareRows` to the ui import line:

```tsx
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState,
    ConfirmDialog, StatusBadge, btnPrimary, btnGhost, useToast,
    SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add sort state and handler inside the `Orders` component**

After the existing `const [page, setPage] = useState(0);` line, add:

```tsx
const [sort, setSort] = useState<SortState>({ key: 'created_at', dir: 'desc' });
const handleSort = (key: string) =>
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
```

- [ ] **Step 3: Add page-reset effect for sort**

After the existing `useEffect(() => { setPage(0); }, [searchQuery]);` line, add:

```tsx
useEffect(() => { setPage(0); }, [sort]);
```

- [ ] **Step 4: Insert sorted derivation between filtered and paginated**

Replace the two existing derivation lines:

```tsx
const filtered = orders.filter((o) =>
    [o.customer_name, o.customer_phone, o.packages?.title].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

With:

```tsx
const filtered = orders.filter((o) =>
    [o.customer_name, o.customer_phone, o.packages?.title].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 5: Update `THead` to pass sort props to sortable columns**

Replace the existing `<THead>` block:

```tsx
<THead>
    <Th>Customer</Th>
    <Th>Package</Th>
    {!isBranchAdmin && <Th>Branch</Th>}
    <Th align="center">Pax / Rooms</Th>
    <Th>Total Price</Th>
    <Th>Payment Status</Th>
    <Th align="right">Actions</Th>
</THead>
```

With:

```tsx
<THead>
    <Th sortKey="customer_name" currentSort={sort} onSort={handleSort}>Customer</Th>
    <Th sortKey="packages.title" currentSort={sort} onSort={handleSort}>Package</Th>
    {!isBranchAdmin && <Th>Branch</Th>}
    <Th align="center">Pax / Rooms</Th>
    <Th sortKey="total_price" currentSort={sort} onSort={handleSort}>Total Price</Th>
    <Th sortKey="payment_status" currentSort={sort} onSort={handleSort}>Payment Status</Th>
    <Th align="right">Actions</Th>
</THead>
```

- [ ] **Step 6: Update `SkeletonRows` col count and `colSpan` to account for branch column**

No change needed — the col count is already conditional on `isBranchAdmin`.

- [ ] **Step 7: Verify in browser**

Open `/admin/orders`. Click "Customer" header → rows sort A→Z, icon turns blue with ChevronUp. Click again → Z→A, ChevronDown. Click "Total Price" → sorts numerically. Confirm pagination still works (navigate to page 2, click a sort header → jumps back to page 1 with sorted data). Confirm search + sort work together.

- [ ] **Step 8: Commit**

```bash
git add src/pages/admin/Orders.tsx
git commit -m "feat: add column sorting to Orders table"
```

---

## Task 3: Wire sorting in `Airlines.tsx`

**Files:**
- Modify: `src/pages/admin/Airlines.tsx`

**Sortable columns:** Airline Name (`name`)  
**Default sort:** `name` asc

- [ ] **Step 1: Update imports**

```tsx
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost,
    useToast, SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add sort state and handler**

After `const [page, setPage] = useState(0);`:

```tsx
const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
const handleSort = (key: string) =>
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
```

- [ ] **Step 3: Add page-reset effect**

After `useEffect(() => { setPage(0); }, [searchQuery]);`:

```tsx
useEffect(() => { setPage(0); }, [sort]);
```

- [ ] **Step 4: Insert sorted derivation**

Replace:

```tsx
const filtered = airlines.filter((a) =>
    (a.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

With:

```tsx
const filtered = airlines.filter((a) =>
    (a.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
);
const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 5: Update `THead`**

Replace:

```tsx
<THead>
    <Th>Logo</Th>
    <Th>Airline Name</Th>
    <Th align="right">Actions</Th>
</THead>
```

With:

```tsx
<THead>
    <Th>Logo</Th>
    <Th sortKey="name" currentSort={sort} onSort={handleSort}>Airline Name</Th>
    <Th align="right">Actions</Th>
</THead>
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/Airlines.tsx
git commit -m "feat: add column sorting to Airlines table"
```

---

## Task 4: Wire sorting in `Hotels.tsx`

**Files:**
- Modify: `src/pages/admin/Hotels.tsx`

**Sortable columns:** Hotel Name (`name`), Location (`location`), Rating (`stars`)  
**Default sort:** `name` asc

- [ ] **Step 1: Update imports**

```tsx
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, FormField, inputClass, selectClass, btnPrimary, btnSecondary, btnGhost,
    useToast, SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add sort state and handler**

After `const [page, setPage] = useState(0);`:

```tsx
const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
const handleSort = (key: string) =>
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
```

- [ ] **Step 3: Add page-reset effect**

After `useEffect(() => { setPage(0); }, [searchQuery]);`:

```tsx
useEffect(() => { setPage(0); }, [sort]);
```

- [ ] **Step 4: Insert sorted derivation**

Replace:

```tsx
const filtered = hotels.filter((h) =>
    [h.name, h.location].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

With:

```tsx
const filtered = hotels.filter((h) =>
    [h.name, h.location].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 5: Update `THead`**

Replace:

```tsx
<THead>
    <Th>Hotel Name</Th>
    <Th>Location</Th>
    <Th>Rating</Th>
    <Th align="right">Actions</Th>
</THead>
```

With:

```tsx
<THead>
    <Th sortKey="name" currentSort={sort} onSort={handleSort}>Hotel Name</Th>
    <Th sortKey="location" currentSort={sort} onSort={handleSort}>Location</Th>
    <Th sortKey="stars" currentSort={sort} onSort={handleSort}>Rating</Th>
    <Th align="right">Actions</Th>
</THead>
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/Hotels.tsx
git commit -m "feat: add column sorting to Hotels table"
```

---

## Task 5: Wire sorting in `PrivateTrips.tsx`

**Files:**
- Modify: `src/pages/admin/PrivateTrips.tsx`

**Sortable columns:** Submitter (`name`), Budget (`budget`), Status (`status`)  
**Default sort:** `created_at` desc (no active indicator initially)

- [ ] **Step 1: Update imports**

```tsx
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, StatusBadge, FormField, textareaClass, btnPrimary, btnSecondary, btnGhost,
    useToast, SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add sort state and handler**

After `const [page, setPage] = useState(0);`:

```tsx
const [sort, setSort] = useState<SortState>({ key: 'created_at', dir: 'desc' });
const handleSort = (key: string) =>
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
```

- [ ] **Step 3: Add page-reset effect**

After `useEffect(() => { setPage(0); }, [searchQuery]);`:

```tsx
useEffect(() => { setPage(0); }, [sort]);
```

- [ ] **Step 4: Insert sorted derivation**

Replace:

```tsx
const filtered = requests.filter((r) =>
    [r.name, r.phone, r.destination, r.email].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

With:

```tsx
const filtered = requests.filter((r) =>
    [r.name, r.phone, r.destination, r.email].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 5: Update `THead`**

Replace:

```tsx
<THead>
    <Th>Submitter</Th>
    <Th>Trip Details</Th>
    <Th>Budget</Th>
    <Th>Status</Th>
    <Th align="right">Actions</Th>
</THead>
```

With:

```tsx
<THead>
    <Th sortKey="name" currentSort={sort} onSort={handleSort}>Submitter</Th>
    <Th>Trip Details</Th>
    <Th sortKey="budget" currentSort={sort} onSort={handleSort}>Budget</Th>
    <Th sortKey="status" currentSort={sort} onSort={handleSort}>Status</Th>
    <Th align="right">Actions</Th>
</THead>
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/PrivateTrips.tsx
git commit -m "feat: add column sorting to Private Trips table"
```

---

## Task 6: Wire sorting in `Categories.tsx`

**Files:**
- Modify: `src/pages/admin/Categories.tsx`

**Sortable columns:** Name (`name`), Slug (`slug`)  
**Default sort:** `name` asc

- [ ] **Step 1: Update imports**

```tsx
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost, useToast,
  SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add sort state and handler**

After `const [page, setPage] = useState(0);`:

```tsx
const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
const handleSort = (key: string) =>
  setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
```

- [ ] **Step 3: Add page-reset effect**

After `useEffect(() => { setPage(0); }, [searchQuery]);`:

```tsx
useEffect(() => { setPage(0); }, [sort]);
```

- [ ] **Step 4: Insert sorted derivation**

Replace:

```tsx
const filtered = categories.filter((c) =>
  [c.name, c.slug].some((f) =>
    (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

With:

```tsx
const filtered = categories.filter((c) =>
  [c.name, c.slug].some((f) =>
    (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )
);
const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 5: Update `THead`**

Replace:

```tsx
<THead><Th>Name</Th><Th>Slug</Th><Th align="right">Actions</Th></THead>
```

With:

```tsx
<THead>
  <Th sortKey="name" currentSort={sort} onSort={handleSort}>Name</Th>
  <Th sortKey="slug" currentSort={sort} onSort={handleSort}>Slug</Th>
  <Th align="right">Actions</Th>
</THead>
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/Categories.tsx
git commit -m "feat: add column sorting to Categories table"
```

---

## Task 7: Wire sorting in `Airports.tsx`

**Files:**
- Modify: `src/pages/admin/Airports.tsx`

**Sortable columns:** IATA (`iata_code`), Airport Name (`name`), City (`city`), Country (`country`)  
**Default sort:** `iata_code` asc

- [ ] **Step 1: Update imports**

```tsx
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost, useToast,
  SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
```

- [ ] **Step 2: Add sort state and handler**

After `const [page, setPage] = useState(0);`:

```tsx
const [sort, setSort] = useState<SortState>({ key: 'iata_code', dir: 'asc' });
const handleSort = (key: string) =>
  setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
```

- [ ] **Step 3: Add page-reset effect**

After `useEffect(() => { setPage(0); }, [searchQuery]);`:

```tsx
useEffect(() => { setPage(0); }, [sort]);
```

- [ ] **Step 4: Insert sorted derivation**

Replace:

```tsx
const filtered = airports.filter((a) =>
  [a.iata_code, a.name, a.city, a.country].some((f) =>
    (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )
);
const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

With:

```tsx
const filtered = airports.filter((a) =>
  [a.iata_code, a.name, a.city, a.country].some((f) =>
    (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )
);
const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

- [ ] **Step 5: Update `THead`**

Replace:

```tsx
<THead>
  <Th>IATA</Th><Th>Airport Name</Th><Th>City</Th><Th>Country</Th><Th align="right">Actions</Th>
</THead>
```

With:

```tsx
<THead>
  <Th sortKey="iata_code" currentSort={sort} onSort={handleSort}>IATA</Th>
  <Th sortKey="name" currentSort={sort} onSort={handleSort}>Airport Name</Th>
  <Th sortKey="city" currentSort={sort} onSort={handleSort}>City</Th>
  <Th sortKey="country" currentSort={sort} onSort={handleSort}>Country</Th>
  <Th align="right">Actions</Th>
</THead>
```

- [ ] **Step 6: Final browser check across all tables**

With `npm run dev` running, visit each admin table and verify:
- Sortable column headers are clickable (cursor: pointer)
- Clicking a header sorts data in that direction; icon turns blue
- Clicking the same header again reverses direction
- Clicking a different header switches active column
- Pagination resets to page 1 on every sort change
- Search + sort work together (search first, then sort the filtered result)
- Non-sortable columns (Logo, Actions, Pax/Rooms, Trip Details, Branch) show no sort affordance

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Airports.tsx
git commit -m "feat: add column sorting to Airports table"
```
