# Column Sorting for Admin Tables — Design Spec

**Date:** 2026-06-15  
**Status:** Approved

---

## Problem

All admin table views (Orders, Airlines, Hotels, PrivateTrips, Categories, Airports) display data in a fixed server-determined order. Admins have no way to reorder rows by clicking column headers.

---

## Approach

Extend the existing `Th` component in `src/components/admin/ui.tsx` with optional sort props. Each page manages a lightweight `{ key: string; dir: 'asc' | 'desc' }` sort state, derives a sorted array client-side (between filter and paginate), and resets to page 0 on sort change. No new files, no re-fetching.

---

## Data Flow (per page)

```
fetch once → data[]
  → filtered = data.filter(searchQuery)
  → sorted   = [...filtered].sort(comparator)   ← new
  → paginated = sorted.slice(page * PAGE_SIZE, ...)
  → render paginated
```

Sort state change resets `page` to `0` (same pattern as `searchQuery`).

---

## Component Changes

### `Th` in `src/components/admin/ui.tsx`

Add optional props:

```ts
interface ThProps {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  // new sort props — omit to render a plain non-sortable header
  sortKey?: string;
  currentSort?: { key: string; dir: 'asc' | 'desc' };
  onSort?: (key: string) => void;
}
```

Behaviour:
- If `sortKey` is absent → renders exactly as today (no visual change, no regression).
- If `sortKey` is present → renders as a clickable button inside the `<th>`. Clicking toggles `asc → desc → asc`.
- Sort indicator icons (from lucide-react `ChevronUp` / `ChevronDown` / `ChevronsUpDown`) appear inline with the label. Neutral icon shown when column is not the active sort key.

---

## Sort State (per page)

Each sortable page adds:

```ts
type SortState = { key: string; dir: 'asc' | 'desc' };
const [sort, setSort] = useState<SortState>({ key: '<default_key>', dir: '<default_dir>' });

const handleSort = (key: string) =>
  setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

useEffect(() => { setPage(0); }, [sort]);
```

The `sorted` array is derived with a comparator specific to each page's data types (strings case-insensitive, numbers numeric, stars numeric).

---

## Sortable Columns per Page

### Orders
| Column | Sort key | Type |
|---|---|---|
| Customer | `customer_name` | string |
| Package | `packages.title` | string (nested) |
| Total Price | `total_price` | number |
| Payment Status | `payment_status` | string |

Default: `created_at` desc (preserves current fetch order). Because `created_at` is not a visible column, no header shows an active sort indicator on initial load — this is intentional. The first time a user clicks any column header, that column becomes active.

### Airlines
| Column | Sort key | Type |
|---|---|---|
| Airline Name | `name` | string |

Default: `name` asc (matches current fetch order).

### Hotels
| Column | Sort key | Type |
|---|---|---|
| Hotel Name | `name` | string |
| Location | `location` | string |
| Rating | `stars` | number |

Default: `name` asc.

### PrivateTrips
| Column | Sort key | Type |
|---|---|---|
| Submitter | `name` | string |
| Budget | `budget` | string |
| Status | `status` | string |

Default: `created_at` desc (same rationale as Orders — no active indicator initially).

### Categories
| Column | Sort key | Type |
|---|---|---|
| Name | `name` | string |
| Slug | `slug` | string |

Default: `name` asc.

### Airports
| Column | Sort key | Type |
|---|---|---|
| IATA | `iata_code` | string |
| Airport Name | `name` | string |
| City | `city` | string |
| Country | `country` | string |

Default: `iata_code` asc.

---

## Non-sortable Columns

Logo (Airlines), Actions, Pax/Rooms (composite), Trip Details (composite) — no `sortKey` passed; rendered as plain `Th` with no change.

---

## Comparator Logic

A single generic comparator covers all cases:

```ts
function compareRows(a: any, b: any, key: string, dir: 'asc' | 'desc'): number {
  const valA = key.includes('.') ? key.split('.').reduce((o, k) => o?.[k], a) : a[key];
  const valB = key.includes('.') ? key.split('.').reduce((o, k) => o?.[k], b) : b[key];
  let cmp: number;
  if (typeof valA === 'number' && typeof valB === 'number') {
    cmp = valA - valB;
  } else {
    cmp = String(valA ?? '').toLowerCase().localeCompare(String(valB ?? '').toLowerCase());
  }
  return dir === 'asc' ? cmp : -cmp;
}
```

This handles strings (case-insensitive), numbers, and one level of nested keys (e.g., `packages.title`).

---

## UX Details

- Sort indicator uses three states: neutral (ChevronsUpDown, gray), asc (ChevronUp, primary color), desc (ChevronDown, primary color).
- Clicking a new column always starts `asc`. Clicking the active column flips direction.
- Cursor changes to `pointer` on sortable headers.
- Pagination resets to page 1 on every sort change.
- No animation needed — the table re-renders instantly from in-memory data.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/admin/ui.tsx` | Extend `Th` with sort props + sort icon rendering |
| `src/pages/admin/Orders.tsx` | Add sort state, comparator, sorted derivation, sortable `Th` props |
| `src/pages/admin/Airlines.tsx` | Same |
| `src/pages/admin/Hotels.tsx` | Same |
| `src/pages/admin/PrivateTrips.tsx` | Same |
| `src/pages/admin/Categories.tsx` | Same |
| `src/pages/admin/Airports.tsx` | Same |

No new files. No schema changes. No edge function changes.

---

## Out of Scope

- Packages page (card grid, not a table)
- Dashboard, SiteSettings, PosterMaker, Login (not data tables)
- Multi-column sort
- Persisting sort preference across sessions
