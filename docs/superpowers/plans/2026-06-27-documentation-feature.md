# Documentation Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a trip album feature — admin manages photo albums optionally linked to packages; albums appear as a masonry grid on the public homepage, feed a new Albums tab in the Poster Maker asset panel, and photos can be assigned per itinerary day when downloading a PDF.

**Architecture:** Normalized DB (documentations + documentation_photos tables + Supabase Storage bucket). Admin UI uses the shared SlideOver component. Public homepage gets a CSS-columns masonry section with a portal lightbox. Poster Maker gains a third asset tab. PDF generation gains an optional photo-picker modal that passes `dayPhotos` to the edge function.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS (CDN), Supabase (Postgres + Storage), pdf-lib (Deno edge function), Fabric.js (poster maker context only)

## Global Constraints

- Tailwind stays CDN-based — no PostCSS, no `tailwind.config.js`
- All UI copy in Bahasa Indonesia where user-facing
- TypeScript strict mode — no `any` except where the existing codebase already uses it; add new types to `types.ts`
- New admin pages → `src/pages/admin/`; new admin components → `src/components/admin/`
- Public-facing components → root `components/`
- Supabase client imported from `@/src/lib/supabase`
- No test runner — verification is manual via `npm run dev` at `http://localhost:3000`
- `@` alias resolves to the project root

---

## File Map

**Create:**
- `supabase/migrations/20260627000002_add_documentations.sql`
- `src/pages/admin/Documentations.tsx`
- `src/components/admin/DocumentationForm.tsx`
- `src/components/admin/DocumentationPhotoUploader.tsx`
- `src/components/admin/DocumentationView.tsx`
- `components/PerjalananKami.tsx`
- `src/components/admin/PosterMaker/AlbumsTab.tsx`
- `src/components/admin/PdfPhotoPickerModal.tsx`

**Modify:**
- `types.ts` — add `Documentation`, `DocumentationPhoto` types
- `App.tsx` — add `/admin/documentations` route
- `src/pages/admin/AdminLayout.tsx` — add Documentations nav item
- `src/pages/Home.tsx` — add `<PerjalananKami />` section
- `src/components/admin/PosterMaker/AssetPanel.tsx` — add Albums tab
- `src/pages/admin/PackageDetailPanel.tsx` — intercept PDF button with picker
- `services/itineraryPdfService.ts` — add `dayPhotos` param
- `supabase/functions/generate-itinerary-pdf/index.ts` — embed day photos

---

## Task 1: Types + DB Migration

**Files:**
- Create: `supabase/migrations/20260627000002_add_documentations.sql`
- Modify: `types.ts`

**Interfaces:**
- Produces: `Documentation`, `DocumentationPhoto` exported from `types.ts`; `documentations` and `documentation_photos` tables live in Supabase; `documentation-photos` storage bucket exists

---

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260627000002_add_documentations.sql`:

```sql
-- documentations: trip album metadata
create table documentations (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  category_id      uuid not null references categories(id),
  package_id       uuid references packages(id) on delete set null,
  departure_date   date,
  arrival_date     date,
  description      text,
  cover_photo_url  text,
  published        boolean not null default false,
  created_at       timestamptz not null default now()
);

-- documentation_photos: individual photos in an album
create table documentation_photos (
  id                  uuid primary key default gen_random_uuid(),
  documentation_id    uuid not null references documentations(id) on delete cascade,
  storage_url         text not null,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now()
);

-- indexes for common queries
create index on documentation_photos (documentation_id, sort_order);

-- RLS
alter table documentations       enable row level security;
alter table documentation_photos enable row level security;

-- public: read published albums only
create policy "documentations_public_read"
  on documentations for select
  using (published = true);

-- authenticated: full access
create policy "documentations_auth_all"
  on documentations for all to authenticated
  using (true) with check (true);

create policy "documentation_photos_public_read"
  on documentation_photos for select
  using (true);

create policy "documentation_photos_auth_all"
  on documentation_photos for all to authenticated
  using (true) with check (true);
```

- [ ] **Step 2: Apply the migration**

```bash
supabase db push
```

Expected: migration applies with no errors. Confirm tables exist in Supabase dashboard.

- [ ] **Step 3: Create the storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `documentation-photos`
- Public: ✅ (public read)

Or via CLI:
```bash
supabase storage create-bucket documentation-photos --public
```

- [ ] **Step 4: Add types to `types.ts`**

Open `types.ts` and append after the existing `Testimonial` interface:

```typescript
export interface Documentation {
  id: string;
  title: string;
  category_id: string;
  package_id: string | null;
  departure_date: string | null;
  arrival_date: string | null;
  description: string | null;
  cover_photo_url: string | null;
  published: boolean;
  created_at: string;
  // joined
  categories?: { id: string; name: string };
  packages?: { id: string; title: string } | null;
  documentation_photos?: { count: number }[];
}

export interface DocumentationPhoto {
  id: string;
  documentation_id: string;
  storage_url: string;
  sort_order: number;
  created_at: string;
}
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260627000002_add_documentations.sql types.ts
git commit -m "feat(docs): add documentations tables, storage bucket, and types"
```

---

## Task 2: Admin Navigation + List Page

**Files:**
- Create: `src/pages/admin/Documentations.tsx`
- Modify: `App.tsx:45-68` — add route inside the admin `<Route element={<AdminLayout />}>` block
- Modify: `src/pages/admin/AdminLayout.tsx:26-55` — add item to Operations nav group

**Interfaces:**
- Consumes: `Documentation` from `types.ts`; `SlideOver`, `PageHeader`, `TableCard`, `THead`, `Th`, `Td`, `SkeletonRows`, `EmptyState`, `SearchInput`, `Pagination`, `SortState`, `compareRows`, `useToast`, `btnPrimary`, `btnGhost`, `inputClass` from `src/components/admin/ui`
- Produces: `/admin/documentations` route; `Documentations` default export

---

- [ ] **Step 1: Add the nav item to `AdminLayout.tsx`**

In `src/pages/admin/AdminLayout.tsx`, in the `NAV_GROUPS` array, inside the `Operations` group's `items` array, add after the Packages item:

```typescript
{ path: '/admin/documentations', icon: BookImage, label: 'Documentations' },
```

Add `BookImage` to the lucide-react import at the top:

```typescript
import {
  LayoutDashboard, Package, Map, Plane, Building2, ShoppingCart,
  Settings, LogOut, Menu, X, Image as ImageIcon, Layers, ChevronRight,
  Megaphone, Users, PlaneTakeoff, Tag, Target, BookImage,
} from 'lucide-react';
```

- [ ] **Step 2: Add the route to `App.tsx`**

In `App.tsx`, import `Documentations`:

```typescript
import Documentations from './src/pages/admin/Documentations';
```

Inside the `<Route element={<AdminLayout />}>` block, add after the packages routes:

```typescript
<Route path="documentations" element={<Documentations />} />
```

- [ ] **Step 3: Create `src/pages/admin/Documentations.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { BookImage } from 'lucide-react';
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState,
  SearchInput, Pagination, SortState, compareRows, useToast,
  btnPrimary, btnGhost,
} from '../../components/admin/ui';
import { Documentation } from '../../../types';

const PAGE_SIZE = 10;

const Documentations: React.FC = () => {
  const toast = useToast();
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState>({ key: 'created_at', dir: 'desc' });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // SlideOver state — wired in Tasks 3 & 4
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documentation | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Documentation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
    loadDocs();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    if (data) setCategories(data);
  };

  const loadDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documentations')
      .select('*, categories(id, name), packages(id, title), documentation_photos(count)')
      .order('created_at', { ascending: false });
    if (!error && data) setDocs(data as Documentation[]);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    // delete storage files first
    const photos = await supabase
      .from('documentation_photos')
      .select('storage_url')
      .eq('documentation_id', deleteId);
    if (photos.data?.length) {
      const paths = photos.data.map(p => {
        const url = new URL(p.storage_url);
        return url.pathname.split('/object/public/documentation-photos/')[1];
      }).filter(Boolean);
      if (paths.length) await supabase.storage.from('documentation-photos').remove(paths);
    }
    const { error } = await supabase.from('documentations').delete().eq('id', deleteId);
    if (error) toast('error', 'Gagal menghapus dokumentasi.');
    else { toast('success', 'Dokumentasi dihapus.'); loadDocs(); }
    setDeleteId(null);
    setDeleting(false);
  };

  const filtered = docs
    .filter(d =>
      (!searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!categoryFilter || d.category_id === categoryFilter)
    )
    .sort((a, b) => compareRows(a, b, sort));

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const photoCount = (doc: Documentation) =>
    doc.documentation_photos?.[0]?.count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentations"
        subtitle="Manage trip albums and photo collections"
        action={
          <button
            className={btnPrimary}
            onClick={() => { setEditingDoc(null); setFormOpen(true); }}
          >
            + New Album
          </button>
        }
      />

      <div className="flex gap-3">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by title…" />
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <TableCard>
        <THead>
          <Th sortKey="title" sort={sort} onSort={setSort}>Album</Th>
          <Th>Category</Th>
          <Th>Package</Th>
          <Th sortKey="departure_date" sort={sort} onSort={setSort}>Departure</Th>
          <Th>Photos</Th>
          <Th>Status</Th>
          <Th className="text-right">Actions</Th>
        </THead>
        <tbody>
          {loading ? (
            <SkeletonRows cols={7} rows={5} />
          ) : paginated.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState icon={BookImage} title="No albums yet" subtitle="Create your first trip album" />
              </td>
            </tr>
          ) : paginated.map(doc => (
            <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <Td>
                <div className="flex items-center gap-3">
                  {doc.cover_photo_url ? (
                    <img src={doc.cover_photo_url} alt="" className="w-12 h-9 object-cover rounded-md flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-9 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center">
                      <BookImage className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{doc.title}</span>
                </div>
              </Td>
              <Td>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                  {doc.categories?.name ?? '—'}
                </span>
              </Td>
              <Td className="text-blue-600 text-sm">{doc.packages?.title ?? '—'}</Td>
              <Td className="text-sm text-gray-600">{doc.departure_date ?? '—'}</Td>
              <Td className="text-center text-sm text-gray-700">{photoCount(doc)}</Td>
              <Td className="text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  doc.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {doc.published ? 'Published' : 'Draft'}
                </span>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    className={`${btnGhost} text-blue-600 hover:bg-blue-50 text-xs px-2 py-1`}
                    onClick={() => { setViewingDoc(doc); setViewOpen(true); }}
                  >
                    View
                  </button>
                  <button
                    className={`${btnGhost} text-xs px-2 py-1`}
                    onClick={() => { setEditingDoc(doc); setFormOpen(true); }}
                  >
                    Edit
                  </button>
                  <button
                    className={`${btnGhost} text-red-500 hover:bg-red-50 text-xs px-2 py-1`}
                    onClick={() => setDeleteId(doc.id)}
                  >
                    Delete
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
      />

      {/* Delete confirm — inline for now */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <p className="font-semibold text-gray-900 mb-2">Hapus Dokumentasi?</p>
            <p className="text-sm text-gray-500 mb-5">Semua foto akan dihapus permanen.</p>
            <div className="flex gap-3 justify-end">
              <button className={btnGhost} onClick={() => setDeleteId(null)}>Batal</button>
              <button
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DocumentationForm and DocumentationView are wired in Tasks 3 & 4 */}
    </div>
  );
};

export default Documentations;
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Navigate to `http://localhost:3000/admin/documentations`. Expected:
- "Documentations" appears in the sidebar under Operations
- Page loads with empty state (BookImage icon + "No albums yet")
- Search input and category filter render
- "+ New Album" button visible (clicking does nothing yet — wired in Task 3)

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/Documentations.tsx App.tsx src/pages/admin/AdminLayout.tsx
git commit -m "feat(docs): add Documentations list page and admin nav item"
```

---

## Task 3: Documentation Form (New / Edit SlideOver)

**Files:**
- Create: `src/components/admin/DocumentationPhotoUploader.tsx`
- Create: `src/components/admin/DocumentationForm.tsx`
- Modify: `src/pages/admin/Documentations.tsx` — import and render form

**Interfaces:**
- Consumes: `Documentation`, `DocumentationPhoto` from `types.ts`; `SlideOver`, `FormField`, `inputClass`, `selectClass`, `btnPrimary`, `btnSecondary`, `useToast` from `ui`; Supabase storage bucket `documentation-photos`
- Produces:
  - `DocumentationPhotoUploader` — props: `{ docId: string; photos: DocumentationPhoto[]; onPhotosChange: (photos: DocumentationPhoto[]) => void; coverUrl: string | null; onCoverChange: (url: string | null) => void }`
  - `DocumentationForm` — props: `{ isOpen: boolean; onClose: () => void; doc: Documentation | null; onSaved: () => void }`

---

- [ ] **Step 1: Create `src/components/admin/DocumentationPhotoUploader.tsx`**

```typescript
import React, { useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Upload, X, Loader2 } from 'lucide-react';
import { DocumentationPhoto } from '../../../types';
import { useToast } from './ui';

interface Props {
  docId: string;
  photos: DocumentationPhoto[];
  onPhotosChange: (photos: DocumentationPhoto[]) => void;
  coverUrl: string | null;
  onCoverChange: (url: string | null) => void;
}

export const DocumentationPhotoUploader: React.FC<Props> = ({
  docId, photos, onPhotosChange, coverUrl, onCoverChange,
}) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const dragOverRef = useRef<string | null>(null);

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const newPhotos: DocumentationPhoto[] = [];
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${docId}/${Date.now()}-${safeName}`;
      const { data, error } = await supabase.storage
        .from('documentation-photos')
        .upload(path, file, { upsert: false });
      if (error) { toast('error', `Gagal upload: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage
        .from('documentation-photos')
        .getPublicUrl(data.path);
      const nextOrder = photos.length + newPhotos.length;
      const { data: row, error: dbErr } = await supabase
        .from('documentation_photos')
        .insert({ documentation_id: docId, storage_url: urlData.publicUrl, sort_order: nextOrder })
        .select()
        .single();
      if (!dbErr && row) newPhotos.push(row as DocumentationPhoto);
    }
    const updated = [...photos, ...newPhotos];
    onPhotosChange(updated);
    if (!coverUrl && updated.length > 0) onCoverChange(updated[0].storage_url);
    setUploading(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const handleDelete = async (photo: DocumentationPhoto) => {
    const url = new URL(photo.storage_url);
    const storagePath = url.pathname.split('/object/public/documentation-photos/')[1];
    await supabase.storage.from('documentation-photos').remove([storagePath]);
    await supabase.from('documentation_photos').delete().eq('id', photo.id);
    const updated = photos.filter(p => p.id !== photo.id);
    onPhotosChange(updated);
    if (coverUrl === photo.storage_url) onCoverChange(updated[0]?.storage_url ?? null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragOverRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverPhoto = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragOverRef.current || dragOverRef.current === targetId) return;
    const fromIdx = photos.findIndex(p => p.id === dragOverRef.current);
    const toIdx = photos.findIndex(p => p.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...photos];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withOrder = reordered.map((p, i) => ({ ...p, sort_order: i }));
    onPhotosChange(withOrder);
    dragOverRef.current = moved.id;
  };

  const handleDragEnd = async () => {
    // persist new sort_order to DB
    await Promise.all(
      photos.map(p =>
        supabase.from('documentation_photos').update({ sort_order: p.sort_order }).eq('id', p.id)
      )
    );
    dragOverRef.current = null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Photos</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400 hover:border-primary/40 transition cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading…</span>
          </div>
        ) : (
          <>Drag & drop atau klik <strong className="text-primary">Browse</strong></>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInput}
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {photos.map(photo => (
              <div
                key={photo.id}
                draggable
                onDragStart={e => handleDragStart(e, photo.id)}
                onDragOver={e => handleDragOverPhoto(e, photo.id)}
                onDragEnd={handleDragEnd}
                onClick={() => onCoverChange(photo.storage_url === coverUrl ? null : photo.storage_url)}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                  coverUrl === photo.storage_url ? 'border-primary' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img src={photo.storage_url} alt="" className="w-full h-full object-cover" />
                {coverUrl === photo.storage_url && (
                  <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    COVER
                  </span>
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleDelete(photo); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 text-white rounded flex items-center justify-center transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400">Klik foto untuk set cover · Drag untuk urutkan</p>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Create `src/components/admin/DocumentationForm.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { SlideOver, FormField, inputClass, selectClass, btnPrimary, btnSecondary, useToast } from './ui';
import { Documentation, DocumentationPhoto } from '../../../types';
import { DocumentationPhotoUploader } from './DocumentationPhotoUploader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doc: Documentation | null;
  onSaved: () => void;
}

interface FormState {
  title: string;
  category_id: string;
  package_id: string;
  departure_date: string;
  arrival_date: string;
  description: string;
  published: boolean;
}

const EMPTY: FormState = {
  title: '', category_id: '', package_id: '',
  departure_date: '', arrival_date: '', description: '', published: false,
};

export const DocumentationForm: React.FC<Props> = ({ isOpen, onClose, doc, onSaved }) => {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [packages, setPackages] = useState<{ id: string; title: string; category: string; departure_date: string | null; arrival_date: string | null; description: string | null }[]>([]);
  const [linkPackage, setLinkPackage] = useState(false);
  const [photos, setPhotos] = useState<DocumentationPhoto[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  // stable ID used as the documentation's PK so photos can be uploaded before first save
  const [docId] = useState(() => doc?.id ?? crypto.randomUUID());

  useEffect(() => {
    if (!isOpen) return;
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
    supabase.from('packages').select('id, title, category, departure_date, arrival_date, description').order('title').then(({ data }) => {
      if (data) setPackages(data as any);
    });
    if (doc) {
      setForm({
        title: doc.title,
        category_id: doc.category_id,
        package_id: doc.package_id ?? '',
        departure_date: doc.departure_date ?? '',
        arrival_date: doc.arrival_date ?? '',
        description: doc.description ?? '',
        published: doc.published,
      });
      setLinkPackage(!!doc.package_id);
      setCoverUrl(doc.cover_photo_url ?? null);
      // load existing photos
      supabase
        .from('documentation_photos')
        .select('*')
        .eq('documentation_id', doc.id)
        .order('sort_order')
        .then(({ data }) => { if (data) setPhotos(data as DocumentationPhoto[]); });
    } else {
      setForm(EMPTY);
      setLinkPackage(false);
      setPhotos([]);
      setCoverUrl(null);
    }
  }, [isOpen, doc]);

  const applyPackage = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;
    const cat = categories.find(c => c.name === pkg.category);
    setForm(prev => ({
      ...prev,
      package_id: pkgId,
      title: pkg.title,
      category_id: cat?.id ?? prev.category_id,
      departure_date: pkg.departure_date ?? '',
      arrival_date: pkg.arrival_date ?? '',
      description: pkg.description ?? '',
    }));
  };

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id) { toast('error', 'Pilih kategori terlebih dahulu.'); return; }
    setSaving(true);
    const payload = {
      id: docId,
      title: form.title,
      category_id: form.category_id,
      package_id: form.package_id || null,
      departure_date: form.departure_date || null,
      arrival_date: form.arrival_date || null,
      description: form.description || null,
      cover_photo_url: coverUrl,
      published: form.published,
    };
    const { error } = doc
      ? await supabase.from('documentations').update(payload).eq('id', doc.id)
      : await supabase.from('documentations').upsert(payload);
    if (error) { toast('error', 'Gagal menyimpan: ' + error.message); }
    else { toast('success', doc ? 'Dokumentasi diperbarui.' : 'Dokumentasi dibuat.'); onSaved(); onClose(); }
    setSaving(false);
  };

  const footer = (
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2 cursor-pointer">
        <button
          type="button"
          role="switch"
          aria-checked={form.published}
          onClick={() => setForm(prev => ({ ...prev, published: !prev.published }))}
          className={`w-9 h-5 rounded-full transition-colors relative ${form.published ? 'bg-primary' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.published ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <span className="text-sm text-gray-600">Publish</span>
      </label>
      <div className="flex gap-2">
        <button type="button" className={btnSecondary} onClick={onClose}>Batal</button>
        <button type="submit" form="doc-form" className={btnPrimary} disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan Album'}
        </button>
      </div>
    </div>
  );

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={doc ? 'Edit Album' : 'New Album'}
      subtitle="Isi detail atau hubungkan ke paket"
      width="lg"
      footer={footer}
    >
      <form id="doc-form" onSubmit={handleSave} className="space-y-4">
        {/* Package link toggle */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <button
            type="button"
            role="switch"
            aria-checked={linkPackage}
            onClick={() => {
              setLinkPackage(!linkPackage);
              if (linkPackage) setForm(prev => ({ ...prev, package_id: '' }));
            }}
            className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${linkPackage ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${linkPackage ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800">Hubungkan ke paket</p>
            <p className="text-xs text-blue-500">Auto-isi judul, kategori, tanggal & deskripsi</p>
          </div>
          {linkPackage && (
            <select
              className={selectClass + ' ml-auto w-56'}
              value={form.package_id}
              onChange={e => applyPackage(e.target.value)}
            >
              <option value="">Pilih paket…</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
        </div>

        {/* Metadata grid */}
        <FormField label="Judul" required>
          <input className={inputClass} value={form.title} onChange={set('title')} required />
        </FormField>

        <FormField label="Kategori" required>
          <select className={selectClass} value={form.category_id} onChange={set('category_id')} required>
            <option value="">Pilih kategori…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tanggal Keberangkatan">
            <input type="date" className={inputClass} value={form.departure_date} onChange={set('departure_date')} />
          </FormField>
          <FormField label="Tanggal Kepulangan">
            <input type="date" className={inputClass} value={form.arrival_date} onChange={set('arrival_date')} />
          </FormField>
        </div>

        <FormField label="Deskripsi">
          <textarea
            className={inputClass + ' resize-none'}
            rows={3}
            value={form.description}
            onChange={set('description') as any}
          />
        </FormField>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-4">
          <DocumentationPhotoUploader
            docId={docId}
            photos={photos}
            onPhotosChange={setPhotos}
            coverUrl={coverUrl}
            onCoverChange={setCoverUrl}
          />
        </div>
      </form>
    </SlideOver>
  );
};
```

- [ ] **Step 3: Wire `DocumentationForm` into `Documentations.tsx`**

Add import at the top of `src/pages/admin/Documentations.tsx`:

```typescript
import { DocumentationForm } from '../../components/admin/DocumentationForm';
```

Replace the `{/* DocumentationForm and DocumentationView are wired in Tasks 3 & 4 */}` comment at the bottom of the JSX with:

```tsx
<DocumentationForm
  isOpen={formOpen}
  onClose={() => setFormOpen(false)}
  doc={editingDoc}
  onSaved={loadDocs}
/>
```

- [ ] **Step 4: Verify in browser**

Run `npm run dev`. Go to `/admin/documentations`:
- Click "+ New Album" → SlideOver opens from the right at wide (`max-w-2xl`) width
- Toggle "Hubungkan ke paket" → package selector appears
- Select a package → title, category, dates, description auto-fill
- Upload one or more photos → thumbnails appear in the 4-column grid
- Click a photo → COVER badge appears
- Drag photos → order resets
- Click Simpan Album → row appears in the list with cover thumbnail and photo count

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/DocumentationPhotoUploader.tsx src/components/admin/DocumentationForm.tsx src/pages/admin/Documentations.tsx
git commit -m "feat(docs): add DocumentationForm with photo uploader"
```

---

## Task 4: Documentation View SlideOver

**Files:**
- Create: `src/components/admin/DocumentationView.tsx`
- Modify: `src/pages/admin/Documentations.tsx` — import and render view

**Interfaces:**
- Consumes: `Documentation`, `DocumentationPhoto` from `types.ts`; `SlideOver`, `btnGhost` from `ui`
- Produces: `DocumentationView` — props: `{ isOpen: boolean; onClose: () => void; doc: Documentation | null; onEdit: () => void }`

---

- [ ] **Step 1: Create `src/components/admin/DocumentationView.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { BookImage, Edit2, Package } from 'lucide-react';
import { SlideOver, btnPrimary } from './ui';
import { Documentation, DocumentationPhoto } from '../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doc: Documentation | null;
  onEdit: () => void;
}

export const DocumentationView: React.FC<Props> = ({ isOpen, onClose, doc, onEdit }) => {
  const [photos, setPhotos] = useState<DocumentationPhoto[]>([]);

  useEffect(() => {
    if (!isOpen || !doc) return;
    supabase
      .from('documentation_photos')
      .select('*')
      .eq('documentation_id', doc.id)
      .order('sort_order')
      .then(({ data }) => { if (data) setPhotos(data as DocumentationPhoto[]); });
  }, [isOpen, doc]);

  if (!doc) return null;

  const dateRange = [doc.departure_date, doc.arrival_date].filter(Boolean).join(' – ');

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={doc.title}
      subtitle={dateRange || undefined}
      width="lg"
      footer={
        <div className="flex justify-end">
          <button className={btnPrimary} onClick={onEdit}>
            <Edit2 className="w-4 h-4 mr-1.5" /> Edit Album
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
            {doc.categories?.name}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            doc.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {doc.published ? 'Published' : 'Draft'}
          </span>
        </div>

        {/* Cover photo */}
        {doc.cover_photo_url && (
          <img
            src={doc.cover_photo_url}
            alt={doc.title}
            className="w-full h-44 object-cover rounded-xl"
          />
        )}

        {/* Description */}
        {doc.description && (
          <p className="text-sm text-gray-600 leading-relaxed">{doc.description}</p>
        )}

        {/* Package link */}
        {doc.packages && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
            <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-blue-700">Linked to: <strong>{doc.packages.title}</strong></span>
          </div>
        )}

        {/* All photos */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            All Photos ({photos.length})
          </p>
          {photos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-300">
              <BookImage className="w-10 h-10 mb-2" />
              <span className="text-sm">No photos yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {photos.map(p => (
                <div key={p.id} className="aspect-square rounded-lg overflow-hidden">
                  <img src={p.storage_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  );
};
```

- [ ] **Step 2: Wire `DocumentationView` into `Documentations.tsx`**

Add import:

```typescript
import { DocumentationView } from '../../components/admin/DocumentationView';
```

After the `<DocumentationForm … />` element, add:

```tsx
<DocumentationView
  isOpen={viewOpen}
  onClose={() => setViewOpen(false)}
  doc={viewingDoc}
  onEdit={() => { setViewOpen(false); setEditingDoc(viewingDoc); setFormOpen(true); }}
/>
```

- [ ] **Step 3: Verify in browser**

Go to `/admin/documentations`. Create an album with photos, then:
- Click **View** → read-only SlideOver opens showing cover, description, package badge, photo grid
- Click **Edit Album** button → view closes, edit form opens pre-populated with same data
- Photos show in the same order as saved

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/DocumentationView.tsx src/pages/admin/Documentations.tsx
git commit -m "feat(docs): add DocumentationView read-only SlideOver"
```

---

## Task 5: Public Page — "Perjalanan Kami" Section

**Files:**
- Create: `components/PerjalananKami.tsx`
- Modify: `src/pages/Home.tsx` — add section

**Interfaces:**
- Consumes: `Documentation`, `DocumentationPhoto` from `types.ts`; Supabase client
- Produces: `PerjalananKami` default export (no props); renders masonry grid + portal lightbox

---

- [ ] **Step 1: Create `components/PerjalananKami.tsx`**

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../src/lib/supabase';
import { Documentation, DocumentationPhoto } from '../types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PerjalananKami: React.FC = () => {
  const [albums, setAlbums] = useState<Documentation[]>([]);
  const [lightboxAlbum, setLightboxAlbum] = useState<Documentation | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<DocumentationPhoto[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    supabase
      .from('documentations')
      .select('*, categories(name), documentation_photos(count)')
      .eq('published', true)
      .order('departure_date', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (data) setAlbums(data as Documentation[]); });
  }, []);

  const openAlbum = async (doc: Documentation) => {
    setLightboxAlbum(doc);
    setLightboxIdx(0);
    const { data } = await supabase
      .from('documentation_photos')
      .select('*')
      .eq('documentation_id', doc.id)
      .order('sort_order');
    setLightboxPhotos((data ?? []) as DocumentationPhoto[]);
  };

  const closeLightbox = useCallback(() => {
    setLightboxAlbum(null);
    setLightboxPhotos([]);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxAlbum) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightboxIdx(i => Math.min(i + 1, lightboxPhotos.length - 1));
      if (e.key === 'ArrowLeft') setLightboxIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxAlbum, lightboxPhotos.length, closeLightbox]);

  if (albums.length === 0) return null;

  const photoCount = (doc: Documentation) => doc.documentation_photos?.[0]?.count ?? 0;

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-dark font-jakarta">Perjalanan Kami</h2>
        <p className="text-gray-500 mt-2">Kenangan perjalanan bersama jamaah Alfatih Dunia Wisata</p>
      </div>

      {/* CSS columns masonry */}
      <div
        className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
        style={{ columnGap: '1rem' }}
      >
        {albums.map((doc, idx) => (
          <div
            key={doc.id}
            className="break-inside-avoid mb-4 cursor-pointer group relative rounded-2xl overflow-hidden"
            style={{ height: idx % 3 === 0 ? '280px' : '200px' }}
            onClick={() => openAlbum(doc)}
          >
            {doc.cover_photo_url ? (
              <img
                src={doc.cover_photo_url}
                alt={doc.title}
                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-primary/40 text-4xl">📸</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <p className="font-semibold text-sm leading-tight">{doc.title}</p>
              <p className="text-xs opacity-75 mt-0.5">{photoCount(doc)} foto · {doc.categories?.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox portal */}
      {lightboxAlbum && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h3 className="text-white font-semibold">{lightboxAlbum.title}</h3>
              {lightboxAlbum.description && (
                <p className="text-white/60 text-sm">{lightboxAlbum.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/50 text-sm">
                {lightboxIdx + 1} / {lightboxPhotos.length}
              </span>
              <button onClick={closeLightbox} className="text-white/70 hover:text-white p-1 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Photo */}
          <div className="flex-1 flex items-center justify-center relative px-16">
            {lightboxPhotos.length > 0 && (
              <img
                src={lightboxPhotos[lightboxIdx]?.storage_url}
                alt=""
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            )}
            {lightboxIdx > 0 && (
              <button
                onClick={() => setLightboxIdx(i => i - 1)}
                className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {lightboxIdx < lightboxPhotos.length - 1 && (
              <button
                onClick={() => setLightboxIdx(i => i + 1)}
                className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
};

export default PerjalananKami;
```

- [ ] **Step 2: Add section to `src/pages/Home.tsx`**

Add import at the top:

```typescript
import PerjalananKami from '../../components/PerjalananKami';
```

Find the testimonials section in the JSX. Add `<PerjalananKami />` immediately before it:

```tsx
<PerjalananKami />
{/* testimonials section below */}
```

- [ ] **Step 3: Verify in browser**

Create and publish 2+ albums in the admin. Navigate to `http://localhost:3000`:
- "Perjalanan Kami" section appears with masonry tiles
- Tiles alternate height (tall/normal)
- Clicking a tile opens the lightbox showing the full-screen photo
- Arrow keys and arrow buttons navigate between photos
- ESC closes the lightbox
- Section is hidden when no albums are published (returns null)

- [ ] **Step 4: Commit**

```bash
git add components/PerjalananKami.tsx src/pages/Home.tsx
git commit -m "feat(docs): add Perjalanan Kami masonry section and lightbox on homepage"
```

---

## Task 6: Poster Maker — Albums Tab

**Files:**
- Create: `src/components/admin/PosterMaker/AlbumsTab.tsx`
- Modify: `src/components/admin/PosterMaker/AssetPanel.tsx` — add Albums tab

**Interfaces:**
- Consumes: `onAddImage: (url: string) => void` (same prop as other tabs)
- Produces: `AlbumsTab` — props: `{ onAddImage: (url: string) => void }`; `AssetPanel` gains `'albums'` as a third tab option

---

- [ ] **Step 1: Create `src/components/admin/PosterMaker/AlbumsTab.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Loader2, ChevronDown, BookImage } from 'lucide-react';

interface AlbumsTabProps {
  onAddImage: (url: string) => void;
}

interface PhotoRow {
  id: string;
  storage_url: string;
  documentation_id: string;
}

const PAGE = 30;

const AlbumsTab: React.FC<AlbumsTabProps> = ({ onAddImage }) => {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [albums, setAlbums] = useState<{ id: string; title: string }[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [catId, setCatId] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  // Reload albums when category changes
  useEffect(() => {
    let q = supabase.from('documentations').select('id, title').eq('published', true).order('title');
    if (catId) q = q.eq('category_id', catId);
    q.then(({ data }) => {
      setAlbums(data ?? []);
      setAlbumId('');
    });
  }, [catId]);

  // Reload photos when album or category changes
  useEffect(() => {
    loadPhotos(0);
  }, [catId, albumId]);

  const loadPhotos = async (off: number) => {
    setLoading(true);
    let q = supabase
      .from('documentation_photos')
      .select('id, storage_url, documentation_id, documentations!inner(category_id, published)')
      .eq('documentations.published', true)
      .order('sort_order')
      .range(off, off + PAGE - 1);
    if (albumId) q = q.eq('documentation_id', albumId);
    else if (catId) q = q.eq('documentations.category_id', catId);
    const { data } = await q;
    const rows = (data ?? []) as PhotoRow[];
    setPhotos(off === 0 ? rows : prev => [...prev, ...rows]);
    setHasMore(rows.length === PAGE);
    setOffset(off + rows.length);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {/* Category filter */}
      <select
        value={catId}
        onChange={e => { setCatId(e.target.value); setOffset(0); }}
        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
      >
        <option value="">Semua Kategori</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {/* Album filter */}
      <select
        value={albumId}
        onChange={e => { setAlbumId(e.target.value); setOffset(0); }}
        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
      >
        <option value="">Semua Album</option>
        {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
      </select>

      {/* Photo grid */}
      {photos.length === 0 && !loading && (
        <div className="flex flex-col items-center py-8 text-gray-300">
          <BookImage className="w-8 h-8 mb-2" />
          <span className="text-xs">Belum ada foto</span>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map(p => (
            <button
              key={p.id}
              onClick={() => onAddImage(p.storage_url)}
              className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition aspect-square"
            >
              <img src={p.storage_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <BookImage className="w-4 h-4 text-white" />
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={() => loadPhotos(offset)}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Load more
        </button>
      )}
    </div>
  );
};

export default AlbumsTab;
```

- [ ] **Step 2: Add Albums tab to `AssetPanel.tsx`**

In `src/components/admin/PosterMaker/AssetPanel.tsx`, add the import at the top:

```typescript
import AlbumsTab from './AlbumsTab';
import { BookImage } from 'lucide-react';
```

Change the `AssetTab` type:

```typescript
type AssetTab = 'images' | 'apps' | 'albums';
```

In the tab row JSX, add after the Apps button:

```tsx
<button
  onClick={() => setTab('albums')}
  className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition ${tab === 'albums' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
>
  <BookImage className="w-3.5 h-3.5" />
  Albums
</button>
```

After the existing tab render lines, add:

```tsx
{tab === 'albums' && <AlbumsTab onAddImage={onAddImage} />}
```

- [ ] **Step 3: Verify in browser**

Open the Poster Maker. In the right Asset Panel:
- "Albums" tab appears as a third tab
- Selecting "Umrah" in category filter narrows the album dropdown
- Selecting an album shows its photos in a 3-column grid
- Clicking a photo inserts it onto the canvas

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/AlbumsTab.tsx src/components/admin/PosterMaker/AssetPanel.tsx
git commit -m "feat(docs): add Albums tab to Poster Maker asset panel"
```

---

## Task 7: Itinerary PDF — Photo Picker Modal + Edge Function

**Files:**
- Create: `src/components/admin/PdfPhotoPickerModal.tsx`
- Modify: `src/pages/admin/PackageDetailPanel.tsx` — intercept PDF button
- Modify: `services/itineraryPdfService.ts` — add `dayPhotos` param
- Modify: `supabase/functions/generate-itinerary-pdf/index.ts` — embed photos per day

**Interfaces:**
- Consumes: `DayItinerary` from `types.ts`; `DocumentationPhoto` from `types.ts`; `downloadItineraryPdf` from `itineraryPdfService`
- Produces:
  - `PdfPhotoPickerModal` — props: `{ isOpen: boolean; onClose: () => void; pkg: any; onGenerate: (dayPhotos: { day: number; photoUrls: string[] }[]) => void }`
  - `downloadItineraryPdf` updated signature: `(pkg: any, siteSettings: ItinerarySiteSettings, dayPhotos?: { day: number; photoUrls: string[] }[]) => Promise<void>`

---

- [ ] **Step 1: Create `src/components/admin/PdfPhotoPickerModal.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { X, FileDown } from 'lucide-react';
import { btnPrimary, btnSecondary } from './ui';

interface DayAssignment {
  day: number;
  title: string;
  photoUrl: string | null;
}

interface AlbumOption { id: string; title: string; }
interface PhotoOption { id: string; storage_url: string; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pkg: any;
  onGenerate: (dayPhotos: { day: number; photoUrls: string[] }[]) => void;
}

export const PdfPhotoPickerModal: React.FC<Props> = ({ isOpen, onClose, pkg, onGenerate }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<DayAssignment[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [photos, setPhotos] = useState<PhotoOption[]>([]);
  const [catId, setCatId] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const days: { day: number; title: string }[] = (pkg?.itinerary ?? []).map((d: any) => ({
    day: d.day,
    title: d.title ?? `Day ${d.day}`,
  }));

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDay(days[0]?.day ?? null);
    setAssignments(days.map(d => ({ ...d, photoUrl: null })));
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let q = supabase.from('documentations').select('id, title').eq('published', true).order('title');
    if (catId) q = q.eq('category_id', catId);
    q.then(({ data }) => { setAlbums(data ?? []); setAlbumId(''); });
  }, [catId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingPhotos(true);
    let q = supabase
      .from('documentation_photos')
      .select('id, storage_url, documentation_id, documentations!inner(category_id, published)')
      .eq('documentations.published', true)
      .order('sort_order')
      .limit(60);
    if (albumId) q = q.eq('documentation_id', albumId);
    else if (catId) q = q.eq('documentations.category_id', catId);
    q.then(({ data }) => {
      setPhotos((data ?? []) as PhotoOption[]);
      setLoadingPhotos(false);
    });
  }, [catId, albumId, isOpen]);

  const assignPhoto = (url: string) => {
    if (selectedDay === null) return;
    setAssignments(prev =>
      prev.map(a => a.day === selectedDay
        ? { ...a, photoUrl: a.photoUrl === url ? null : url }
        : a
      )
    );
  };

  const handleGenerate = () => {
    const dayPhotos = assignments
      .filter(a => a.photoUrl)
      .map(a => ({ day: a.day, photoUrls: [a.photoUrl!] }));
    onGenerate(dayPhotos);
  };

  const handleSkip = () => onGenerate([]);

  const assignedCount = assignments.filter(a => a.photoUrl).length;
  const selectedAssignment = assignments.find(a => a.day === selectedDay);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-black/60">
      <div className="flex-1 flex flex-col bg-white mx-4 my-6 rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full self-center">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Pilih Foto per Hari</h2>
            <p className="text-sm text-gray-500">Foto opsional — hari tanpa foto tetap tampil sebagai teks</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: day list */}
          <div className="w-56 border-r border-gray-100 flex flex-col overflow-y-auto flex-shrink-0">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hari</p>
            </div>
            {days.map(d => {
              const assign = assignments.find(a => a.day === d.day);
              const isActive = selectedDay === d.day;
              return (
                <button
                  key={d.day}
                  onClick={() => setSelectedDay(d.day)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left transition ${
                    isActive ? 'bg-blue-50 border-l-2 border-l-primary' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                      Day {d.day}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{d.title}</p>
                  </div>
                  {assign?.photoUrl ? (
                    <img
                      src={assign.photoUrl}
                      alt=""
                      className="w-8 h-8 rounded object-cover flex-shrink-0 border-2 border-emerald-400"
                    />
                  ) : (
                    <span className="text-gray-300 text-xs flex-shrink-0">–</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: album browser */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Day label */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                Day {selectedDay}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {days.find(d => d.day === selectedDay)?.title}
              </span>
              {selectedAssignment?.photoUrl && (
                <span className="ml-auto text-xs text-blue-600 font-medium">1 foto dipilih</span>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-3 px-5 py-3 border-b border-gray-100">
              <select
                value={catId}
                onChange={e => setCatId(e.target.value)}
                className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none bg-white"
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                value={albumId}
                onChange={e => setAlbumId(e.target.value)}
                className="flex-2 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none bg-white"
                style={{ flex: 2 }}
              >
                <option value="">Semua Album</option>
                {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>

            {/* Photo grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-[10px] text-gray-400 mb-3">Klik foto untuk memilih · Klik lagi untuk batal</p>
              {loadingPhotos ? (
                <div className="flex justify-center py-8 text-gray-300">Loading…</div>
              ) : photos.length === 0 ? (
                <div className="flex justify-center py-8 text-gray-300 text-sm">Belum ada foto</div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {photos.map(p => {
                    const isSelected = selectedAssignment?.photoUrl === p.storage_url;
                    return (
                      <button
                        key={p.id}
                        onClick={() => assignPhoto(p.storage_url)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                          isSelected ? 'border-primary' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img src={p.storage_url} alt="" className="w-full h-full object-cover" />
                        {isSelected && (
                          <>
                            <div className="absolute inset-0 bg-primary/20" />
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-600">
            {assignedCount > 0 ? (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-xs">
                {assignedCount} hari memiliki foto
              </span>
            ) : (
              <span className="text-gray-400 text-xs">Belum ada foto dipilih</span>
            )}
          </div>
          <div className="flex gap-3">
            <button className={btnSecondary} onClick={handleSkip}>Lewati (tanpa foto)</button>
            <button className={btnPrimary} onClick={handleGenerate}>
              <FileDown className="w-4 h-4 mr-1.5" /> Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Update `services/itineraryPdfService.ts`**

Add `dayPhotos` to the function signature and body:

```typescript
export async function downloadItineraryPdf(
    pkg: any,
    siteSettings: ItinerarySiteSettings,
    dayPhotos?: { day: number; photoUrls: string[] }[],
): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const logoBase64 = await getLogoBase64();

    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-itinerary-pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ package: pkg, siteSettings, logoBase64, dayPhotos: dayPhotos ?? [] }),
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

- [ ] **Step 3: Update `PackageDetailPanel.tsx`**

Add the import at the top of `src/pages/admin/PackageDetailPanel.tsx`:

```typescript
import { PdfPhotoPickerModal } from '../../components/admin/PdfPhotoPickerModal';
```

Add state for the modal (inside the component, alongside `isPdfLoading`):

```typescript
const [showPdfPicker, setShowPdfPicker] = useState(false);
```

Replace the `handleDownloadPdf` function:

```typescript
const handleDownloadPdf = () => setShowPdfPicker(true);

const handleGeneratePdf = async (dayPhotos: { day: number; photoUrls: string[] }[]) => {
    setShowPdfPicker(false);
    setIsPdfLoading(true);
    try {
        const fullPkg = { ...pkg, airlines, hotels };
        await downloadItineraryPdf(fullPkg, { whatsapp: settings.whatsapp, phone: settings.phone }, dayPhotos);
    } catch (err) {
        console.error('PDF generation failed:', err);
        alert('Gagal mengunduh itinerary. Silakan coba lagi.');
    } finally {
        setIsPdfLoading(false);
    }
};
```

At the bottom of the component's JSX (before the closing `</>` fragment), add:

```tsx
<PdfPhotoPickerModal
  isOpen={showPdfPicker}
  onClose={() => setShowPdfPicker(false)}
  pkg={{ ...pkg, airlines, hotels }}
  onGenerate={handleGeneratePdf}
/>
```

- [ ] **Step 4: Update the edge function to embed photos per day**

In `supabase/functions/generate-itinerary-pdf/index.ts`, add a helper function after the existing helpers (e.g. after `drawText`):

```typescript
async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function embedImage(doc: PDFDocument, url: string): Promise<PDFImage | null> {
  const bytes = await fetchImageBytes(url);
  if (!bytes) return null;
  try {
    const lower = url.toLowerCase().split('?')[0];
    if (lower.endsWith('.png')) return await doc.embedPng(bytes);
    return await doc.embedJpg(bytes);
  } catch {
    try { return await doc.embedPng(bytes); } catch { return null; }
  }
}
```

Add the `PDFImage` import — update the existing pdf-lib import line:

```typescript
import { PDFDocument, PDFImage, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
```

In the request handler, extract `dayPhotos` from the JSON body alongside `package` and `siteSettings`:

```typescript
const { package: pkg, siteSettings, logoBase64, dayPhotos = [] } = await req.json() as {
  package: any;
  siteSettings: { whatsapp: string; phone: string };
  logoBase64: string | null;
  dayPhotos: { day: number; photoUrls: string[] }[];
};
```

In the day-rendering loop (where each `DayItinerary` is drawn), after the activities/description are drawn for a day, add the photo embed block. Find the loop that iterates over `pkg.itinerary` and add after each day's text content is rendered:

```typescript
// embed day photo if provided
const dayPhoto = dayPhotos.find((d: { day: number; photoUrls: string[] }) => d.day === itinDay.day);
if (dayPhoto?.photoUrls?.[0]) {
  const img = await embedImage(doc, dayPhoto.photoUrls[0]);
  if (img) {
    const maxW = CONTENT_W;
    const maxH = 160;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    // check if we need a new page
    if (ctx.y - h - 12 < 60) {
      ctx.page = doc.addPage([PAGE_W, PAGE_H]);
      ctx.y = PAGE_H - 48;
    }
    ctx.y -= 8;
    ctx.page.drawImage(img, { x: MARGIN + (CONTENT_W - w) / 2, y: ctx.y - h, width: w, height: h });
    ctx.y -= h + 12;
  }
}
```

- [ ] **Step 5: Deploy the edge function**

```bash
supabase functions deploy generate-itinerary-pdf
```

- [ ] **Step 6: Verify end-to-end**

1. Open a package in the admin panel
2. Click "Download Itinerary PDF" → photo picker modal opens
3. Select a day in the left panel → browse and click a photo → thumbnail preview appears in the day row
4. Click "Generate PDF" → modal closes, PDF downloads
5. Open the PDF → days with photos show the image below the activity list
6. Click "Lewati (tanpa foto)" → PDF downloads without photos (same as before)

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/PdfPhotoPickerModal.tsx services/itineraryPdfService.ts src/pages/admin/PackageDetailPanel.tsx supabase/functions/generate-itinerary-pdf/index.ts
git commit -m "feat(docs): add per-day photo picker for itinerary PDF generation"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ DB tables + RLS (Task 1)
- ✅ Storage bucket `documentation-photos` (Task 1)
- ✅ `Documentation` / `DocumentationPhoto` types (Task 1)
- ✅ Admin list page with search + category filter + sort + pagination (Task 2)
- ✅ New/Edit SlideOver with package link toggle + auto-fill (Task 3)
- ✅ Multi-photo upload → Supabase Storage → `documentation_photos` rows (Task 3)
- ✅ Drag-to-reorder photos (Task 3)
- ✅ Click-to-set-cover (Task 3)
- ✅ Per-photo delete (storage + DB) (Task 3)
- ✅ View SlideOver — read-only, Edit button, photo grid (Task 4)
- ✅ Masonry grid "Perjalanan Kami" on homepage (Task 5)
- ✅ Published-only filter on public page (Task 5)
- ✅ Portal lightbox with ESC + arrow navigation (Task 5)
- ✅ Albums tab in Poster Maker asset panel (Task 6)
- ✅ Cascading category → album → photo filters in Albums tab (Task 6)
- ✅ Click photo inserts onto canvas via `onAddImage` (Task 6)
- ✅ PDF photo picker modal — day list with thumbnail previews (Task 7)
- ✅ Single-select per day (radio-style), deselect on re-click (Task 7)
- ✅ `dayPhotos: { day: number; photoUrls: string[] }[]` shape (Task 7)
- ✅ Skip option — generates PDF without photos (Task 7)
- ✅ Edge function embeds image inline below day activities (Task 7)
- ✅ Package auto-fill: matches `pkg.category` string → `categories.name` to resolve `category_id` (Task 3)
- ✅ New album uses `crypto.randomUUID()` so photos upload before first save (Task 3)

**Placeholder scan:** None found — all steps contain concrete code.

**Type consistency:**
- `DocumentationPhoto` used in Tasks 3, 4, 7 — defined once in `types.ts` Task 1 ✅
- `Documentation` used in Tasks 2, 3, 4, 5 — defined once in `types.ts` Task 1 ✅
- `downloadItineraryPdf` signature updated in Task 7 Step 2 and called in Task 7 Step 3 with matching params ✅
- `onAddImage: (url: string) => void` prop consistent across `AssetPanel`, `AlbumsTab` ✅
