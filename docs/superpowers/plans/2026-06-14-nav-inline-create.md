# Nav Visibility Fix + Inline Entity Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Categories and Airports to the sidebar nav, and allow users to create new categories, airlines, hotels, and airports inline from the PackageWizard without leaving the form.

**Architecture:** Four targeted file edits — AdminLayout (nav), Step1BasicInfo (category create), PackageWizard (prop wire-up), and Step2FlightHotels (airline/hotel/airport creates). Each entity gets a `SlideOver` panel opened by a small "+ New" button near its selector. On save, the local list refreshes and the new item is auto-selected in the draft (except airports, which appear in dropdowns for the user to place).

**Tech Stack:** React, TypeScript, Supabase JS client, Tailwind CSS (CDN), lucide-react, existing `SlideOver`/`FormField`/`useToast` primitives from `src/components/admin/ui.tsx`.

> **No test suite exists in this project** (`npm run build` is the primary correctness check). Each task ends with a build verification and manual browser smoke-test.

---

## File Map

| File | Change |
|------|--------|
| `src/pages/admin/AdminLayout.tsx` | Add Airports + Categories to Resources nav group |
| `src/components/admin/PackageWizard/Step1BasicInfo.tsx` | Add inline category SlideOver; add `onCategoryCreated` prop |
| `src/pages/admin/PackageWizard.tsx` | Pass `onCategoryCreated` to `Step1BasicInfo` |
| `src/components/admin/PackageWizard/Step2FlightHotels.tsx` | Add inline airline create SlideOver |
| `src/components/admin/PackageWizard/Step2FlightHotels.tsx` | Add inline hotel create SlideOver |
| `src/components/admin/PackageWizard/Step2FlightHotels.tsx` | Add inline airport create SlideOver |

---

## Task 1: Add Categories and Airports to Sidebar Nav

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Add `PlaneTakeoff` and `Tag` to the lucide-react import**

In `AdminLayout.tsx`, line 3-7, the current import is:
```ts
import {
  LayoutDashboard, Package, Map, Plane, Building2, ShoppingCart,
  Settings, LogOut, Menu, X, Image as ImageIcon, Layers, ChevronRight,
  Megaphone, Users,
} from 'lucide-react';
```

Replace with:
```ts
import {
  LayoutDashboard, Package, Map, Plane, Building2, ShoppingCart,
  Settings, LogOut, Menu, X, Image as ImageIcon, Layers, ChevronRight,
  Megaphone, Users, PlaneTakeoff, Tag,
} from 'lucide-react';
```

- [ ] **Step 2: Add Airports and Categories items to the Resources nav group**

In `AdminLayout.tsx`, the current Resources group (lines ~37-43) is:
```ts
{
  label: 'Resources',
  allowedRoles: ['admin', 'superadmin'],
  items: [
    { path: '/admin/airlines', icon: Plane, label: 'Airlines' },
    { path: '/admin/hotels', icon: Building2, label: 'Hotels' },
  ],
},
```

Replace with:
```ts
{
  label: 'Resources',
  allowedRoles: ['admin', 'superadmin'],
  items: [
    { path: '/admin/airlines', icon: Plane, label: 'Airlines' },
    { path: '/admin/hotels', icon: Building2, label: 'Hotels' },
    { path: '/admin/airports', icon: PlaneTakeoff, label: 'Airports' },
    { path: '/admin/categories', icon: Tag, label: 'Categories' },
  ],
},
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Smoke-test in browser**

```bash
npm run dev
```

Log in as superadmin. Confirm the sidebar "Resources" section now shows Airlines, Hotels, Airports, Categories. Click Airports and Categories — both pages load correctly.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx
git commit -m "feat: add Airports and Categories to sidebar Resources nav"
```

---

## Task 2: Inline Category Creation in Step 1 of PackageWizard

**Files:**
- Modify: `src/components/admin/PackageWizard/Step1BasicInfo.tsx`
- Modify: `src/pages/admin/PackageWizard.tsx`

- [ ] **Step 1: Update imports in `Step1BasicInfo.tsx`**

Current import line 2:
```ts
import { Upload, Search as SearchIcon } from 'lucide-react';
```

Replace with:
```ts
import { Upload, Search as SearchIcon, Plus } from 'lucide-react';
```

Current import line 3:
```ts
import { FormField, inputClass, selectClass, SectionCard, btnPrimary } from '../ui';
```

Replace with:
```ts
import { FormField, inputClass, selectClass, SectionCard, btnPrimary, btnSecondary, SlideOver, useToast } from '../ui';
```

- [ ] **Step 2: Add `onCategoryCreated` to the Props interface and wire up hooks**

Current `Props` interface (lines 8-13):
```ts
interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  categories: string[];
}
```

Replace with:
```ts
interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  categories: string[];
  onCategoryCreated: (name: string) => void;
}
```

Current component signature (line 15):
```ts
const Step1BasicInfo: React.FC<Props> = ({ draft, updateDraft, onNext, categories }) => {
```

Replace with:
```ts
const Step1BasicInfo: React.FC<Props> = ({ draft, updateDraft, onNext, categories, onCategoryCreated }) => {
```

- [ ] **Step 3: Add category create state and handlers inside the component body**

Add these lines right after the component signature opens (after the `const [isPickerOpen, setIsPickerOpen] = useState(false);` block, before the `duration` calculation):

```ts
  const toast = useToast();
  const [catSlideOpen, setCatSlideOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', slug: '' });
  const [savingCat, setSavingCat] = useState(false);

  const toSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    const slug = catForm.slug || toSlug(catForm.name);
    const { error } = await supabase.from('categories').insert([{ name: catForm.name, slug }]);
    setSavingCat(false);
    if (error) {
      toast('error', error.code === '23505' ? 'Category already exists.' : 'Failed to save category.');
      return;
    }
    onCategoryCreated(catForm.name);
    updateDraft({ category: catForm.name });
    setCatSlideOpen(false);
    setCatForm({ name: '', slug: '' });
  };
```

- [ ] **Step 4: Replace the Category `<FormField>` block with a version that has a "+ New" button**

Current category FormField block (lines ~66-78):
```tsx
          <FormField label="Category" required>
            <select
              required
              className={selectClass}
              value={draft.category}
              onChange={(e) => updateDraft({ category: e.target.value })}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
```

Replace with:
```tsx
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCatSlideOpen(true)}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <select
              required
              className={selectClass}
              value={draft.category}
              onChange={(e) => updateDraft({ category: e.target.value })}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
```

- [ ] **Step 5: Add the category SlideOver at the bottom of the component's return, before `</div>` and the `ImagePickerModal`**

Add this just before the closing `</div>` of the component return (after the `ImagePickerModal` element):

```tsx
      <SlideOver
        isOpen={catSlideOpen}
        onClose={() => setCatSlideOpen(false)}
        title="New Category"
        subtitle="Slug is auto-generated from name."
        width="sm"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setCatSlideOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button form="cat-create-form" type="submit" disabled={savingCat} className={btnPrimary}>
              {savingCat ? 'Saving...' : 'Add Category'}
            </button>
          </div>
        }
      >
        <form id="cat-create-form" onSubmit={handleCreateCategory} className="space-y-5">
          <FormField label="Category Name" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Umrah Plus"
              value={catForm.name}
              onChange={(e) => setCatForm({ name: e.target.value, slug: toSlug(e.target.value) })}
            />
          </FormField>
          <FormField label="Slug" hint="Auto-generated. Edit if needed.">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g., umrah-plus"
              value={catForm.slug}
              onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
            />
          </FormField>
        </form>
      </SlideOver>
```

- [ ] **Step 6: Pass `onCategoryCreated` from `PackageWizard.tsx`**

In `src/pages/admin/PackageWizard.tsx`, find the `Step1BasicInfo` JSX (around line 165):
```tsx
          <Step1BasicInfo
            draft={draft}
            updateDraft={updateDraft}
            onNext={() => setStep(2)}
            categories={categories}
          />
```

Replace with:
```tsx
          <Step1BasicInfo
            draft={draft}
            updateDraft={updateDraft}
            onNext={() => setStep(2)}
            categories={categories}
            onCategoryCreated={(name) => setCategories((prev) => [...prev, name].sort())}
          />
```

- [ ] **Step 7: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 8: Smoke-test in browser**

Open `http://localhost:3000/admin/packages/new`. Go to Step 1. Click the "+ New" link next to Category. Fill in a new category name, click "Add Category". Confirm: the SlideOver closes, the new category is auto-selected in the dropdown, the category list now includes the new entry.

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/PackageWizard/Step1BasicInfo.tsx src/pages/admin/PackageWizard.tsx
git commit -m "feat: inline category creation in package wizard step 1"
```

---

## Task 3: Inline Airline Creation in Step 2 of PackageWizard

**Files:**
- Modify: `src/components/admin/PackageWizard/Step2FlightHotels.tsx`

- [ ] **Step 1: Add `SlideOver`, `btnSecondary`, and `useToast` to the ui import**

Current import line 3:
```ts
import { FormField, SectionCard, inputClass, selectClass, textareaClass, btnPrimary, btnSecondary } from '../ui';
```

Replace with:
```ts
import { FormField, SectionCard, inputClass, selectClass, textareaClass, btnPrimary, btnSecondary, SlideOver, useToast } from '../ui';
```

- [ ] **Step 2: Add airline-create state and handler inside the component body**

In `Step2FlightHotels`, after the existing `useState` declarations (after `const [genFeat, setGenFeat] = useState(false);`), add:

```ts
  const toast = useToast();
  const [airlineSlideOpen, setAirlineSlideOpen] = useState(false);
  const [newAirlineForm, setNewAirlineForm] = useState({ name: '', iata_code: '', logo_url: '' });
  const [savingAirline, setSavingAirline] = useState(false);

  const handleCreateAirline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAirline(true);
    const { data, error } = await supabase
      .from('airlines')
      .insert([{
        name: newAirlineForm.name,
        iata_code: newAirlineForm.iata_code.toUpperCase() || null,
        logo_url: newAirlineForm.logo_url || null,
      }])
      .select()
      .single();
    setSavingAirline(false);
    if (error) { toast('error', 'Failed to create airline.'); return; }
    const { data: fresh } = await supabase.from('airlines').select('*').order('name');
    if (fresh) setAirlines(fresh);
    setAirlineSlideOpen(false);
    setNewAirlineForm({ name: '', iata_code: '', logo_url: '' });
    if (data) toggleAirline(data.id);
  };
```

- [ ] **Step 3: Add "+ New Airline" button above the airline search input**

In the Airlines section JSX, the current structure starts with:
```tsx
          {/* Airlines */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Airlines</h3>
            <input
              type="text"
              className={inputClass + ' mb-2'}
              placeholder="Search airlines..."
```

Replace the header line with:
```tsx
          {/* Airlines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Airlines</h3>
              <button
                type="button"
                onClick={() => setAirlineSlideOpen(true)}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> New Airline
              </button>
            </div>
            <input
              type="text"
              className={inputClass + ' mb-2'}
              placeholder="Search airlines..."
```

- [ ] **Step 4: Add the airline SlideOver before the closing `</div>` of the component return**

Add this immediately before the final `</div>` closing tag of the `Step2FlightHotels` return:

```tsx
      <SlideOver
        isOpen={airlineSlideOpen}
        onClose={() => setAirlineSlideOpen(false)}
        title="New Airline"
        width="sm"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setAirlineSlideOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button form="airline-create-form" type="submit" disabled={savingAirline} className={btnPrimary}>
              {savingAirline ? 'Saving...' : 'Add Airline'}
            </button>
          </div>
        }
      >
        <form id="airline-create-form" onSubmit={handleCreateAirline} className="space-y-5">
          <FormField label="Airline Name" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Garuda Indonesia"
              value={newAirlineForm.name}
              onChange={(e) => setNewAirlineForm({ ...newAirlineForm, name: e.target.value })}
            />
          </FormField>
          <FormField label="IATA Code" hint="2–3 letter code, e.g. GA">
            <input
              type="text"
              maxLength={3}
              className={inputClass}
              placeholder="e.g., GA"
              value={newAirlineForm.iata_code}
              onChange={(e) => setNewAirlineForm({ ...newAirlineForm, iata_code: e.target.value })}
            />
          </FormField>
          <FormField label="Logo URL" hint="Optional. Paste a direct image URL.">
            <input
              type="url"
              className={inputClass}
              placeholder="https://..."
              value={newAirlineForm.logo_url}
              onChange={(e) => setNewAirlineForm({ ...newAirlineForm, logo_url: e.target.value })}
            />
          </FormField>
        </form>
      </SlideOver>
```

- [ ] **Step 5: Verify `Plus` is imported from lucide-react**

Check the existing lucide-react import in `Step2FlightHotels.tsx` (line 2):
```ts
import { Plus, X, Loader2 } from 'lucide-react';
```

`Plus` is already imported. No change needed.

- [ ] **Step 6: Verify build passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 7: Smoke-test in browser**

Open the wizard, go to Step 2. Click "+ New Airline" above the airline list. Fill name + IATA code, save. Confirm: new airline appears in the list already checked, route section for it appears below.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/PackageWizard/Step2FlightHotels.tsx
git commit -m "feat: inline airline creation in package wizard step 2"
```

---

## Task 4: Inline Hotel Creation in Step 2 of PackageWizard

**Files:**
- Modify: `src/components/admin/PackageWizard/Step2FlightHotels.tsx`

- [ ] **Step 1: Add hotel-create state and handler inside the component body**

After the airline-create state block (added in Task 3), add:

```ts
  const [hotelSlideOpen, setHotelSlideOpen] = useState(false);
  const [newHotelForm, setNewHotelForm] = useState({ name: '', location: '', stars: 4 });
  const [savingHotel, setSavingHotel] = useState(false);

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHotel(true);
    const { data, error } = await supabase
      .from('hotels')
      .insert([{ name: newHotelForm.name, location: newHotelForm.location, stars: newHotelForm.stars }])
      .select()
      .single();
    setSavingHotel(false);
    if (error) { toast('error', 'Failed to create hotel.'); return; }
    const { data: fresh } = await supabase.from('hotels').select('*').order('name');
    if (fresh) setHotels(fresh);
    setHotelSlideOpen(false);
    setNewHotelForm({ name: '', location: '', stars: 4 });
    if (data) toggleHotel(data.id);
  };
```

- [ ] **Step 2: Add "+ New Hotel" button above the hotel search input**

In the Hotels section JSX, current header:
```tsx
          {/* Hotels */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Hotels</h3>
            <input
              type="text"
              className={inputClass + ' mb-2'}
              placeholder="Search hotels..."
```

Replace header with:
```tsx
          {/* Hotels */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Hotels</h3>
              <button
                type="button"
                onClick={() => setHotelSlideOpen(true)}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> New Hotel
              </button>
            </div>
            <input
              type="text"
              className={inputClass + ' mb-2'}
              placeholder="Search hotels..."
```

- [ ] **Step 3: Add the hotel SlideOver before the closing `</div>` of the return, after the airline SlideOver**

```tsx
      <SlideOver
        isOpen={hotelSlideOpen}
        onClose={() => setHotelSlideOpen(false)}
        title="New Hotel"
        width="sm"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setHotelSlideOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button form="hotel-create-form" type="submit" disabled={savingHotel} className={btnPrimary}>
              {savingHotel ? 'Saving...' : 'Add Hotel'}
            </button>
          </div>
        }
      >
        <form id="hotel-create-form" onSubmit={handleCreateHotel} className="space-y-5">
          <FormField label="Hotel Name" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Hilton Makkah Convention"
              value={newHotelForm.name}
              onChange={(e) => setNewHotelForm({ ...newHotelForm, name: e.target.value })}
            />
          </FormField>
          <FormField label="Location" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Makkah"
              value={newHotelForm.location}
              onChange={(e) => setNewHotelForm({ ...newHotelForm, location: e.target.value })}
            />
          </FormField>
          <FormField label="Stars">
            <select
              className={selectClass}
              value={newHotelForm.stars}
              onChange={(e) => setNewHotelForm({ ...newHotelForm, stars: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </FormField>
        </form>
      </SlideOver>
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Smoke-test in browser**

Step 2, click "+ New Hotel". Fill name + location, pick stars, save. Confirm: new hotel appears in the list already checked.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/PackageWizard/Step2FlightHotels.tsx
git commit -m "feat: inline hotel creation in package wizard step 2"
```

---

## Task 5: Inline Airport Creation in Step 2 of PackageWizard

**Files:**
- Modify: `src/components/admin/PackageWizard/Step2FlightHotels.tsx`

- [ ] **Step 1: Add airport-create state and handler inside the component body**

After the hotel-create state block (added in Task 4), add:

```ts
  const [airportSlideOpen, setAirportSlideOpen] = useState(false);
  const [newAirportForm, setNewAirportForm] = useState({ iata_code: '', name: '', city: '', country: '' });
  const [savingAirport, setSavingAirport] = useState(false);

  const handleCreateAirport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAirport(true);
    const { error } = await supabase
      .from('airports')
      .insert([{
        iata_code: newAirportForm.iata_code.toUpperCase(),
        name: newAirportForm.name,
        city: newAirportForm.city || null,
        country: newAirportForm.country || null,
      }]);
    setSavingAirport(false);
    if (error) { toast('error', error.code === '23505' ? 'Airport code already exists.' : 'Failed to create airport.'); return; }
    const { data: fresh } = await supabase.from('airports').select('*').order('iata_code');
    if (fresh) setAirports(fresh);
    setAirportSlideOpen(false);
    setNewAirportForm({ iata_code: '', name: '', city: '', country: '' });
    // No auto-select: airport now appears in all leg dropdowns; user places it in the correct leg/direction.
  };
```

- [ ] **Step 2: Find the flight routes section and add a "+ New Airport" button**

The flight routes section is rendered inside the expanded airline panel. Find this block in the JSX (the `{checked && route && (` section, around line 189). Add a "+ New Airport" button at the top of the route legs panel, right after the `<p className="text-xs font-semibold text-gray-500 mb-2">Route legs</p>` line:

Current:
```tsx
                      <div className="px-4 pb-3 pt-2 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Route legs</p>
                        {route.legs.map((leg, i) => (
```

Replace with:
```tsx
                      <div className="px-4 pb-3 pt-2 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-500">Route legs</p>
                          <button
                            type="button"
                            onClick={() => setAirportSlideOpen(true)}
                            className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3 h-3" /> New Airport
                          </button>
                        </div>
                        {route.legs.map((leg, i) => (
```

- [ ] **Step 3: Add the airport SlideOver at the bottom of the return, after the hotel SlideOver**

```tsx
      <SlideOver
        isOpen={airportSlideOpen}
        onClose={() => setAirportSlideOpen(false)}
        title="New Airport"
        subtitle="After saving, the airport appears in all leg dropdowns."
        width="sm"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setAirportSlideOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button form="airport-create-form" type="submit" disabled={savingAirport} className={btnPrimary}>
              {savingAirport ? 'Saving...' : 'Add Airport'}
            </button>
          </div>
        }
      >
        <form id="airport-create-form" onSubmit={handleCreateAirport} className="space-y-5">
          <FormField label="IATA Code" required hint="3-letter code, e.g. CGK">
            <input
              type="text"
              required
              maxLength={3}
              className={inputClass}
              placeholder="e.g., CGK"
              value={newAirportForm.iata_code}
              onChange={(e) => setNewAirportForm({ ...newAirportForm, iata_code: e.target.value.toUpperCase() })}
            />
          </FormField>
          <FormField label="Airport Name" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Soekarno-Hatta International Airport"
              value={newAirportForm.name}
              onChange={(e) => setNewAirportForm({ ...newAirportForm, name: e.target.value })}
            />
          </FormField>
          <FormField label="City">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g., Tangerang"
              value={newAirportForm.city}
              onChange={(e) => setNewAirportForm({ ...newAirportForm, city: e.target.value })}
            />
          </FormField>
          <FormField label="Country">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g., Indonesia"
              value={newAirportForm.country}
              onChange={(e) => setNewAirportForm({ ...newAirportForm, country: e.target.value })}
            />
          </FormField>
        </form>
      </SlideOver>
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Smoke-test in browser**

Step 2, check an airline to expand its route legs panel. Click "+ New Airport". Fill IATA code + name, save. Confirm: SlideOver closes, the new airport now appears in the From/To dropdowns on all legs.

- [ ] **Step 6: Final end-to-end test**

Create a full package from scratch:
1. Step 1: use "+ New" to create a brand-new category; confirm it is auto-selected.
2. Step 2: use "+ New Airline" to create an airline; confirm it is auto-checked and route legs appear.
3. Step 2: use "+ New Hotel" to create a hotel; confirm it is auto-checked.
4. Step 2: expand an airline's legs, use "+ New Airport" to create an airport; confirm it appears in the From/To dropdowns.
5. Complete the wizard through Step 4 and save. Confirm package is saved with the correct category, airline, hotel.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/PackageWizard/Step2FlightHotels.tsx
git commit -m "feat: inline airport creation in package wizard step 2"
```
