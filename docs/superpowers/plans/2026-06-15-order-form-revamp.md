# Order Form Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the admin Create/Edit Order form as a right-side slide-over where room counts and pricing are derived from the participant list (each participant has a gender + room tier), eliminating the redundant manual room-configuration step.

**Architecture:** A container component (`OrderForm`) hosted inside the existing `SlideOver` owns data loading and save. Participant CRUD + all derivations live in a thin `useOrderForm` hook backed by pure functions in `orderLogic.ts`. The participant editor opens inline at the bottom of the list. Room tiers come from the selected package's flat `room_options`; rooms-per-tier are an editable, gender-aware auto estimate.

**Tech Stack:** React 18 + TypeScript (strict), Vite, Supabase JS, Tailwind (CDN), lucide-react. No test runner configured — pure logic is verified with `node <file>.ts` (Node 24 native TS) assertion scripts; UI is verified via `npm run dev` and `npx tsc --noEmit`.

**Reference spec:** `docs/superpowers/specs/2026-06-15-order-form-revamp-design.md`
**Supabase project id:** `lceckzzycqfjbhpugxuh`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/migrations/20260615002000_add_participant_gender.sql` | Add `gender` column to `participants` |
| `src/components/admin/OrderForm/types.ts` | `Gender`, `ParticipantDraft`, `TierSummary` types |
| `src/components/admin/OrderForm/orderLogic.ts` | Pure derivation functions (pax/tier, auto rooms, total price, orphan tiers) |
| `src/components/admin/OrderForm/useOrderForm.ts` | Hook: participant array + room overrides + memoized derivations |
| `src/components/admin/OrderForm/ParticipantEditor.tsx` | Inline add/edit participant form |
| `src/components/admin/OrderForm/ParticipantList.tsx` | Participant rows + inline editor host |
| `src/components/admin/OrderForm/OrderSummaryFooter.tsx` | Room-summary strip + total + actions |
| `src/components/admin/OrderForm/OrderForm.tsx` | Container: data load, state wiring, save, `SlideOver` shell |
| `src/pages/admin/OrderForm.tsx` | Thin re-export so `Orders.tsx` import path is unchanged |
| `scripts/verify-order-logic.ts` | Throwaway assertion script for `orderLogic` (committed, runnable) |

---

## Task 1: Add `gender` column to participants

**Files:**
- Create: `supabase/migrations/20260615002000_add_participant_gender.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Add gender to participants for gender-aware room grouping & manifests.
-- Nullable: existing rows stay NULL until edited; required at the app layer.
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS gender text;

COMMENT ON COLUMN public.participants.gender IS 'male | female — required by the order form for new/edited participants';
```

- [ ] **Step 2: Apply the migration**

Preferred (Supabase MCP):
```
apply_migration(project_id="lceckzzycqfjbhpugxuh",
  name="add_participant_gender",
  query=<contents of the .sql file>)
```
CLI fallback (if linked locally): `supabase db push`

- [ ] **Step 3: Verify the column exists**

Run (Supabase MCP `execute_sql` or psql):
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='participants' AND column_name='gender';
```
Expected: one row `gender`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260615002000_add_participant_gender.sql
git commit -m "feat(db): add gender column to participants"
```

---

## Task 2: Shared types

**Files:**
- Create: `src/components/admin/OrderForm/types.ts`

- [ ] **Step 1: Write the types**

```typescript
// src/components/admin/OrderForm/types.ts
export type Gender = 'male' | 'female';

export interface ParticipantDraft {
  id?: string;            // present when editing an existing DB row
  name: string;
  gender: Gender | '';    // '' = unset (legacy rows / new before pick)
  room_type: string;      // tier name, must match a package room_option name
  identity_number: string;
  passport_number: string;
  phone: string;
  address: string;
}

// One row per tier currently used by at least one participant.
export interface TierSummary {
  room_type: string;
  capacity: number;
  price_per_pax: number;
  pax_booked: number;     // derived: count of participants in this tier
  rooms_booked: number;   // auto estimate, admin-editable
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors referencing `types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/OrderForm/types.ts
git commit -m "feat(orders): add OrderForm shared types"
```

---

## Task 3: Pure derivation logic (TDD)

**Files:**
- Create: `src/components/admin/OrderForm/orderLogic.ts`
- Create: `scripts/verify-order-logic.ts`

- [ ] **Step 1: Write the failing verification script**

```typescript
// scripts/verify-order-logic.ts
// Run with: node scripts/verify-order-logic.ts   (Node >= 23.6 strips TS types)
import assert from 'node:assert/strict';
import {
  autoRoomsForTier,
  buildTierSummaries,
  computeTotalPrice,
  orphanTiers,
  totalRooms,
} from '../src/components/admin/OrderForm/orderLogic.ts';
import type { ParticipantDraft } from '../src/components/admin/OrderForm/types.ts';

const roomOptions = [
  { name: 'Quad', capacity: 4, price: 35_000_000 },
  { name: 'Triple', capacity: 3, price: 37_000_000 },
  { name: 'Double', capacity: 2, price: 39_000_000 },
];

const p = (over: Partial<ParticipantDraft>): ParticipantDraft => ({
  name: 'x', gender: 'male', room_type: 'Quad',
  identity_number: '', passport_number: '', phone: '', address: '', ...over,
});

// Scenario from the spec: 2 men + 2 women Quad, 1 man + 1 woman Double.
const participants: ParticipantDraft[] = [
  p({ gender: 'male', room_type: 'Quad' }),
  p({ gender: 'male', room_type: 'Quad' }),
  p({ gender: 'female', room_type: 'Quad' }),
  p({ gender: 'female', room_type: 'Quad' }),
  p({ gender: 'male', room_type: 'Double' }),
  p({ gender: 'female', room_type: 'Double' }),
];

// autoRoomsForTier: gender-aware ceil
assert.equal(autoRoomsForTier(participants.filter(x => x.room_type === 'Quad'), 4), 2, 'quad rooms = 1 male + 1 female');
assert.equal(autoRoomsForTier(participants.filter(x => x.room_type === 'Double'), 2), 2, 'double rooms = 1 male + 1 female');
assert.equal(autoRoomsForTier([], 4), 0, 'no participants = 0 rooms');
assert.equal(autoRoomsForTier([p({ gender: 'male' })], 0), 1, 'capacity 0 treated as 1');

// buildTierSummaries: only used tiers, pax derived, rooms auto unless overridden
const tiers = buildTierSummaries(participants, roomOptions);
assert.equal(tiers.length, 2, 'only Quad + Double are in use');
const quad = tiers.find(t => t.room_type === 'Quad')!;
assert.equal(quad.pax_booked, 4, 'quad pax');
assert.equal(quad.rooms_booked, 2, 'quad auto rooms');
assert.equal(quad.price_per_pax, 35_000_000, 'quad price carried through');

const withOverride = buildTierSummaries(participants, roomOptions, { Quad: 1 });
assert.equal(withOverride.find(t => t.room_type === 'Quad')!.rooms_booked, 1, 'override wins');

// computeTotalPrice: sum of each participant tier price
assert.equal(computeTotalPrice(participants, roomOptions), 4 * 35_000_000 + 2 * 39_000_000, 'total price');

// totalRooms
assert.equal(totalRooms(tiers), 4, 'total rooms across tiers');

// orphanTiers: participant tier no longer offered by package
const orphans = orphanTiers([p({ room_type: 'Suite' }), p({ room_type: 'Quad' })], roomOptions);
assert.deepEqual(orphans, ['Suite'], 'detects orphan tier');

console.log('orderLogic: all assertions passed');
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node scripts/verify-order-logic.ts`
Expected: FAIL — `Cannot find module '.../orderLogic.ts'` (file not created yet).

- [ ] **Step 3: Implement the pure functions**

```typescript
// src/components/admin/OrderForm/orderLogic.ts
import type { RoomOption } from '../../../../types';
import type { ParticipantDraft, TierSummary } from './types';

const ceilCap = (count: number, capacity: number): number =>
  Math.ceil(count / (capacity > 0 ? capacity : 1));

/** Gender-aware upper-bound room estimate for one tier's participants. */
export function autoRoomsForTier(participants: ParticipantDraft[], capacity: number): number {
  const men = participants.filter((p) => p.gender === 'male').length;
  const women = participants.filter((p) => p.gender === 'female').length;
  const unspecified = participants.filter((p) => p.gender !== 'male' && p.gender !== 'female').length;
  return ceilCapZero(men, capacity) + ceilCapZero(women, capacity) + ceilCapZero(unspecified, capacity);
}

function ceilCapZero(count: number, capacity: number): number {
  return count === 0 ? 0 : ceilCap(count, capacity);
}

/** One summary row per tier that has at least one participant. */
export function buildTierSummaries(
  participants: ParticipantDraft[],
  roomOptions: RoomOption[],
  roomOverrides: Record<string, number> = {},
): TierSummary[] {
  return roomOptions
    .filter((opt) => participants.some((p) => p.room_type === opt.name))
    .map((opt) => {
      const tierParts = participants.filter((p) => p.room_type === opt.name);
      const auto = autoRoomsForTier(tierParts, opt.capacity);
      return {
        room_type: opt.name,
        capacity: opt.capacity,
        price_per_pax: opt.price,
        pax_booked: tierParts.length,
        rooms_booked: opt.name in roomOverrides ? roomOverrides[opt.name] : auto,
      };
    });
}

/** Total price = sum of each participant's tier price. */
export function computeTotalPrice(participants: ParticipantDraft[], roomOptions: RoomOption[]): number {
  return participants.reduce((sum, p) => {
    const opt = roomOptions.find((o) => o.name === p.room_type);
    return sum + (opt ? opt.price : 0);
  }, 0);
}

export function totalRooms(tiers: TierSummary[]): number {
  return tiers.reduce((s, t) => s + (Number(t.rooms_booked) || 0), 0);
}

/** Tier names assigned to participants but not offered by the package. */
export function orphanTiers(participants: ParticipantDraft[], roomOptions: RoomOption[]): string[] {
  const valid = new Set(roomOptions.map((o) => o.name));
  return [...new Set(participants.map((p) => p.room_type).filter((rt) => rt && !valid.has(rt)))];
}
```

- [ ] **Step 4: Run the verification script to confirm it passes**

Run: `node scripts/verify-order-logic.ts`
Expected: `orderLogic: all assertions passed`

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/OrderForm/orderLogic.ts scripts/verify-order-logic.ts
git commit -m "feat(orders): pure room/price derivation logic with verification"
```

---

## Task 4: useOrderForm hook

**Files:**
- Create: `src/components/admin/OrderForm/useOrderForm.ts`

- [ ] **Step 1: Implement the hook**

```typescript
// src/components/admin/OrderForm/useOrderForm.ts
import { useMemo, useState } from 'react';
import type { RoomOption } from '../../../../types';
import type { ParticipantDraft } from './types';
import { buildTierSummaries, computeTotalPrice, orphanTiers, totalRooms } from './orderLogic';

export function useOrderForm(
  initialParticipants: ParticipantDraft[],
  roomOptions: RoomOption[],
) {
  const [participants, setParticipants] = useState<ParticipantDraft[]>(initialParticipants);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  // Manual rooms overrides keyed by tier name; cleared by re-deriving when empty.
  const [roomOverrides, setRoomOverrides] = useState<Record<string, number>>({});

  const upsertParticipant = (draft: ParticipantDraft, index: number | null) => {
    setParticipants((prev) => {
      if (index === null) return [...prev, draft];
      const next = [...prev];
      next[index] = draft;
      return next;
    });
  };

  const removeParticipant = (index: number) => {
    setParticipants((prev) => {
      const target = prev[index];
      if (target?.id) setDeletedIds((d) => [...d, target.id!]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const setRoomOverride = (tier: string, rooms: number) =>
    setRoomOverrides((prev) => ({ ...prev, [tier]: rooms }));

  const tiers = useMemo(
    () => buildTierSummaries(participants, roomOptions, roomOverrides),
    [participants, roomOptions, roomOverrides],
  );
  const totalPrice = useMemo(() => computeTotalPrice(participants, roomOptions), [participants, roomOptions]);
  const orphans = useMemo(() => orphanTiers(participants, roomOptions), [participants, roomOptions]);

  return {
    participants,
    deletedIds,
    tiers,
    totalPrice,
    totalPax: participants.length,
    totalRooms: totalRooms(tiers),
    orphans,
    upsertParticipant,
    removeParticipant,
    setRoomOverride,
  };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors in `useOrderForm.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/OrderForm/useOrderForm.ts
git commit -m "feat(orders): useOrderForm hook for participant state + derivations"
```

---

## Task 5: ParticipantEditor (inline form)

**Files:**
- Create: `src/components/admin/OrderForm/ParticipantEditor.tsx`

- [ ] **Step 1: Implement the editor**

```tsx
// src/components/admin/OrderForm/ParticipantEditor.tsx
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { RoomOption } from '../../../../types';
import type { Gender, ParticipantDraft } from './types';
import { inputClass, selectClass } from '../ui';

interface Props {
  initial?: ParticipantDraft;
  roomOptions: RoomOption[];
  onSave: (draft: ParticipantDraft) => void;
  onCancel: () => void;
}

const EMPTY: ParticipantDraft = {
  name: '', gender: '', room_type: '',
  identity_number: '', passport_number: '', phone: '', address: '',
};

const ParticipantEditor: React.FC<Props> = ({ initial, roomOptions, onSave, onCancel }) => {
  const [draft, setDraft] = useState<ParticipantDraft>(initial ?? EMPTY);
  const [error, setError] = useState('');

  const set = (patch: Partial<ParticipantDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = () => {
    if (!draft.name.trim()) return setError('Name is required.');
    if (draft.gender !== 'male' && draft.gender !== 'female') return setError('Gender is required.');
    if (!draft.room_type) return setError('Room type is required.');
    setError('');
    onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-primary mb-3">
        {initial ? 'Edit participant' : 'New participant'}
      </p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <input className={inputClass} placeholder="Full name" value={draft.name}
            onChange={(e) => set({ name: e.target.value })} />
        </div>

        <select className={selectClass} value={draft.gender}
          onChange={(e) => set({ gender: e.target.value as Gender | '' })}>
          <option value="" disabled>Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select className={selectClass} value={draft.room_type}
          onChange={(e) => set({ room_type: e.target.value })}>
          <option value="" disabled>Room type</option>
          {roomOptions.map((r) => (
            <option key={r.name} value={r.name}>
              {r.name} · {r.capacity} pax · Rp {r.price.toLocaleString('id-ID')}
            </option>
          ))}
        </select>

        <input className={inputClass} placeholder="NIK (optional)" value={draft.identity_number}
          onChange={(e) => set({ identity_number: e.target.value })} />
        <input className={inputClass} placeholder="Passport (optional)" value={draft.passport_number}
          onChange={(e) => set({ passport_number: e.target.value })} />
        <input className={inputClass} placeholder="Phone (optional)" value={draft.phone}
          onChange={(e) => set({ phone: e.target.value })} />
        <input className={inputClass} placeholder="Address (optional)" value={draft.address}
          onChange={(e) => set({ address: e.target.value })} />
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="button" onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg">
          <Check className="w-4 h-4" /> Save participant
        </button>
      </div>
    </div>
  );
};

export default ParticipantEditor;
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors in `ParticipantEditor.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/OrderForm/ParticipantEditor.tsx
git commit -m "feat(orders): inline ParticipantEditor"
```

---

## Task 6: ParticipantList (rows + inline editor host)

**Files:**
- Create: `src/components/admin/OrderForm/ParticipantList.tsx`

- [ ] **Step 1: Implement the list**

```tsx
// src/components/admin/OrderForm/ParticipantList.tsx
import React, { useState } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import type { RoomOption } from '../../../../types';
import type { ParticipantDraft } from './types';
import ParticipantEditor from './ParticipantEditor';

interface Props {
  participants: ParticipantDraft[];
  roomOptions: RoomOption[];
  orphans: string[];
  disabled: boolean;               // no package selected / no room options
  onUpsert: (draft: ParticipantDraft, index: number | null) => void;
  onRemove: (index: number) => void;
}

const GenderAvatar: React.FC<{ gender: ParticipantDraft['gender'] }> = ({ gender }) => {
  const map = {
    male: 'bg-blue-100 text-blue-600',
    female: 'bg-pink-100 text-pink-600',
    '': 'bg-gray-100 text-gray-400',
  } as const;
  return (
    <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${map[gender]}`}>
      <User className="w-3.5 h-3.5" />
    </span>
  );
};

const ParticipantList: React.FC<Props> = ({
  participants, roomOptions, orphans, disabled, onUpsert, onRemove,
}) => {
  // null = closed, -1 = adding new, >=0 = editing that index
  const [editing, setEditing] = useState<number | null>(null);

  const handleSave = (draft: ParticipantDraft) => {
    onUpsert(draft, editing === -1 ? null : editing);
    setEditing(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">
          Participants <span className="text-gray-400 font-normal">({participants.length})</span>
        </h3>
        <button type="button" disabled={disabled || editing !== null}
          onClick={() => setEditing(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add participant
        </button>
      </div>

      {participants.length === 0 && editing !== -1 && (
        <p className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
          {disabled ? 'Select a package first.' : 'No participants yet.'}
        </p>
      )}

      <div className="space-y-2">
        {participants.map((p, i) =>
          editing === i ? (
            <ParticipantEditor key={p.id ?? i} initial={p} roomOptions={roomOptions}
              onSave={handleSave} onCancel={() => setEditing(null)} />
          ) : (
            <div key={p.id ?? i}
              className="flex items-center gap-3 px-3 py-2.5 border border-gray-100 rounded-lg">
              <GenderAvatar gender={p.gender} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {p.identity_number || 'No NIK'} · {p.passport_number || 'No passport'}
                </p>
              </div>
              {orphans.includes(p.room_type) ? (
                <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-md">
                  {p.room_type || 'No tier'} — unavailable
                </span>
              ) : (
                <span className="text-xs bg-blue-50 text-primary px-2 py-1 rounded-md">{p.room_type}</span>
              )}
              <button type="button" onClick={() => setEditing(i)}
                className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-md">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => onRemove(i)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ),
        )}

        {editing === -1 && (
          <ParticipantEditor roomOptions={roomOptions}
            onSave={handleSave} onCancel={() => setEditing(null)} />
        )}
      </div>
    </div>
  );
};

export default ParticipantList;
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors in `ParticipantList.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/OrderForm/ParticipantList.tsx
git commit -m "feat(orders): ParticipantList with inline add/edit"
```

---

## Task 7: OrderSummaryFooter

**Files:**
- Create: `src/components/admin/OrderForm/OrderSummaryFooter.tsx`

- [ ] **Step 1: Implement the footer**

```tsx
// src/components/admin/OrderForm/OrderSummaryFooter.tsx
import React from 'react';
import type { TierSummary } from './types';

interface Props {
  tiers: TierSummary[];
  totalPax: number;
  totalRooms: number;
  totalPrice: number;
  quotaRemaining: number | null;
  saving: boolean;
  canSave: boolean;
  submitLabel: string;
  onRoomsChange: (tier: string, rooms: number) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const OrderSummaryFooter: React.FC<Props> = ({
  tiers, totalPax, totalRooms, totalPrice, quotaRemaining,
  saving, canSave, submitLabel, onRoomsChange, onCancel, onSubmit,
}) => {
  const overQuota = quotaRemaining !== null && totalPax > quotaRemaining;

  return (
    <div className="space-y-3">
      {tiers.length > 0 && (
        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
          {tiers.map((t) => (
            <div key={t.room_type} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="font-medium text-gray-900 w-16">{t.room_type}</span>
              <span className="text-gray-500 w-16">{t.pax_booked} pax</span>
              <div className="flex items-center gap-1.5">
                <input type="number" min={0} value={t.rooms_booked}
                  onChange={(e) => onRoomsChange(t.room_type, Number(e.target.value))}
                  className="w-16 px-2 py-1 text-right border border-gray-200 rounded-lg text-sm" />
                <span className="text-xs text-gray-400">rooms</span>
              </div>
              <span className="ml-auto text-gray-700 tabular-nums">
                Rp {(t.pax_booked * t.price_per_pax).toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-xl font-extrabold text-gray-900 tabular-nums">
            Rp {totalPrice.toLocaleString('id-ID')}
          </p>
          <p className={`text-xs mt-0.5 ${overQuota ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
            {totalPax} pax · {totalRooms} rooms
            {quotaRemaining !== null && ` · ${quotaRemaining} quota left`}
            {overQuota && ' · exceeds quota'}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl">
            Cancel
          </button>
          <button type="button" onClick={onSubmit} disabled={saving || !canSave || overQuota}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-xl disabled:opacity-60">
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryFooter;
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors in `OrderSummaryFooter.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/OrderForm/OrderSummaryFooter.tsx
git commit -m "feat(orders): OrderSummaryFooter with editable room estimate"
```

---

## Task 8: OrderForm container

**Files:**
- Create: `src/components/admin/OrderForm/OrderForm.tsx`

This reuses the existing `SlideOver` (`src/components/admin/ui.tsx`) and ports the
package/branch loading + save logic from the old form, swapping the manual room
config for the derivation hook.

- [ ] **Step 1: Implement the container**

```tsx
// src/components/admin/OrderForm/OrderForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { SlideOver, FormField, inputClass, selectClass, textareaClass } from '../ui';
import type { RoomOption } from '../../../../types';
import type { ParticipantDraft } from './types';
import { useOrderForm } from './useOrderForm';
import ParticipantList from './ParticipantList';
import OrderSummaryFooter from './OrderSummaryFooter';

interface PackageRow {
  id: string;
  title: string;
  quotas: number;
  available_quotas: number | null;
  room_options: RoomOption[];
}

interface OrderFormProps {
  initialData?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ initialData, onClose, onSuccess }) => {
  const { profile, branchIds } = useAuth();
  const isBranchAdmin = profile?.role === 'branch_admin';

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedPackageId, setSelectedPackageId] = useState(initialData?.package_id || '');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialData?.branch_id || '');
  const [customerName, setCustomerName] = useState(initialData?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState(initialData?.customer_email || '');
  const [paymentStatus, setPaymentStatus] = useState(initialData?.payment_status || 'Down Payment');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );
  const roomOptions = selectedPackage?.room_options ?? [];

  const initialParticipants: ParticipantDraft[] = useMemo(
    () => (initialData?.participants ?? []).map((p: any): ParticipantDraft => ({
      id: p.id,
      name: p.name ?? '',
      gender: p.gender === 'male' || p.gender === 'female' ? p.gender : '',
      room_type: p.room_type ?? '',
      identity_number: p.identity_number ?? '',
      passport_number: p.passport_number ?? '',
      phone: p.phone ?? '',
      address: p.address ?? '',
    })),
    [initialData],
  );

  const form = useOrderForm(initialParticipants, roomOptions);

  useEffect(() => {
    const load = async () => {
      const { data: pkgs } = await supabase
        .from('packages')
        .select('id, title, quotas, available_quotas, room_options');
      if (pkgs) setPackages(pkgs as PackageRow[]);

      if (isBranchAdmin) {
        if (branchIds.length === 1) {
          setSelectedBranchId((prev) => prev || branchIds[0]);
        } else if (branchIds.length > 1) {
          const { data } = await supabase.from('branches').select('id, name').in('id', branchIds);
          if (data) setBranches(data);
          if (!initialData?.branch_id && data?.[0]) setSelectedBranchId(data[0].id);
        }
      } else {
        const { data } = await supabase.from('branches').select('id, name').order('name');
        if (data) setBranches(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  const quotaRemaining = selectedPackage
    ? (selectedPackage.available_quotas ?? selectedPackage.quotas ?? 0)
    : null;

  const unsetGender = form.participants.some((p) => p.gender !== 'male' && p.gender !== 'female');
  const canSave =
    !!selectedPackageId &&
    !!customerName.trim() &&
    !!customerPhone.trim() &&
    form.participants.length > 0 &&
    form.orphans.length === 0 &&
    !unsetGender &&
    (!isBranchAdmin || !!selectedBranchId);

  const handleSubmit = async () => {
    setSaving(true);
    setErrorMsg('');

    const payload = {
      package_id: selectedPackageId,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || null,
      room_breakdown: form.tiers,
      room_count_booked: form.totalRooms,
      participant_count: form.totalPax,
      total_price: form.totalPrice,
      payment_status: paymentStatus,
      notes,
      branch_id: selectedBranchId || null,
    };

    let savedOrderId = initialData?.id;
    let error;
    if (initialData) {
      ({ error } = await supabase.from('orders').update(payload).eq('id', savedOrderId));
    } else {
      const { data, error: insertError } = await supabase.from('orders').insert([payload]).select().single();
      error = insertError;
      if (data) savedOrderId = data.id;
    }
    if (error) { setErrorMsg(error.message); setSaving(false); return; }

    if (savedOrderId) {
      if (form.deletedIds.length > 0) {
        await supabase.from('participants').delete().in('id', form.deletedIds);
      }
      if (form.participants.length > 0) {
        const partsPayload = form.participants.map((p) => ({
          ...(p.id ? { id: p.id } : {}),
          order_id: savedOrderId,
          name: p.name,
          gender: p.gender || null,
          room_type: p.room_type,
          identity_number: p.identity_number,
          passport_number: p.passport_number,
          phone: p.phone,
          address: p.address,
        }));
        const { error: upErr } = await supabase.from('participants').upsert(partsPayload);
        if (upErr) { setErrorMsg('Order saved, but participants failed: ' + upErr.message); setSaving(false); return; }
      }
    }

    setSaving(false);
    onSuccess();
  };

  return (
    <SlideOver
      isOpen
      onClose={onClose}
      width="lg"
      title={initialData ? 'Edit Order' : 'Create Order'}
      subtitle={selectedPackage
        ? `${selectedPackage.title}${quotaRemaining !== null ? ` · ${quotaRemaining} quota left` : ''}`
        : 'Select a package to begin'}
      footer={
        <OrderSummaryFooter
          tiers={form.tiers}
          totalPax={form.totalPax}
          totalRooms={form.totalRooms}
          totalPrice={form.totalPrice}
          quotaRemaining={quotaRemaining}
          saving={saving}
          canSave={canSave}
          submitLabel={initialData ? 'Update Order' : 'Create Order'}
          onRoomsChange={form.setRoomOverride}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      }
    >
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          {errorMsg && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{errorMsg}</div>}

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Package & Customer</p>
            <FormField label="Package" required>
              <select className={selectClass} value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}>
                <option value="" disabled>— Select a package —</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </FormField>

            {(branches.length > 1 || (!isBranchAdmin && branches.length > 0)) && (
              <FormField label="Branch" required={isBranchAdmin}>
                <select className={selectClass} value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}>
                  {!isBranchAdmin && <option value="">— No branch —</option>}
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </FormField>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Customer name (rep)" required>
                <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </FormField>
              <FormField label="WhatsApp / phone" required>
                <input className={inputClass} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </FormField>
              <FormField label="Email (optional)">
                <input type="email" className={inputClass} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </FormField>
              <FormField label="Payment status">
                <select className={selectClass} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  <option value="Down Payment">Down Payment</option>
                  <option value="Payment term 1">Payment term 1</option>
                  <option value="Payment term 2">Payment term 2</option>
                  <option value="Payment term 3">Payment term 3</option>
                  <option value="Paid in Full">Paid in Full</option>
                </select>
              </FormField>
            </div>
          </div>

          <ParticipantList
            participants={form.participants}
            roomOptions={roomOptions}
            orphans={form.orphans}
            disabled={!selectedPackageId || roomOptions.length === 0}
            onUpsert={form.upsertParticipant}
            onRemove={form.removeParticipant}
          />

          {unsetGender && (
            <p className="text-xs text-amber-600">Some participants have no gender set — required before saving.</p>
          )}

          <FormField label="Internal notes">
            <textarea rows={2} className={textareaClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
        </div>
      )}
    </SlideOver>
  );
};

export default OrderForm;
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors. (Note: `available_quotas` is read from `packages`; if the
column name differs, adjust the select + `PackageRow` type — confirm with
`SELECT column_name FROM information_schema.columns WHERE table_name='packages';`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/OrderForm/OrderForm.tsx
git commit -m "feat(orders): slide-over OrderForm container with derived totals"
```

---

## Task 9: Wire up the page & verify end-to-end

**Files:**
- Modify: `src/pages/admin/OrderForm.tsx` (replace entire contents with a re-export)

- [ ] **Step 1: Replace the old page form with a re-export**

```tsx
// src/pages/admin/OrderForm.tsx
export { default } from '../../components/admin/OrderForm/OrderForm';
```

- [ ] **Step 2: Confirm Orders.tsx still compiles unchanged**

`src/pages/admin/Orders.tsx` imports `OrderForm from './OrderForm'` and renders it
with `initialData` / `onClose` / `onSuccess` — the new container keeps that exact
prop contract, so no change is needed.

Run: `npx tsc --noEmit`
Expected: no errors across the project.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual verification (dev server)**

Run: `npm run dev`, then in the admin panel:
1. Orders → **New Order** opens a **right-side slide-over** (not a centered modal).
2. Pick a package → tiers populate the participant editor's room dropdown.
3. **Add participant** opens an inline editor; saving without name/gender/tier shows an error.
4. Add the spec scenario (2♂+2♀ Quad, 1♂+1♀ Double) → footer shows Quad 4 pax / 2 rooms, Double 2 pax / 2 rooms, total = 4×Quad + 2×Double price.
5. Edit a tier's rooms number → total rooms updates; pax and price stay fixed.
6. Save → Orders list shows correct pax/rooms; reopen the order → participants (with gender) reload.
7. Exceeding quota disables Save and shows "exceeds quota".

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/OrderForm.tsx
git commit -m "feat(orders): point Orders page at the revamped slide-over form"
```

---

## Notes for the implementer

- **Tailwind is CDN-based** — only use utility classes already used elsewhere; no new build config.
- **Strict TypeScript** — `any` is used only where the old code already did (Supabase rows / `initialData`); keep new code typed.
- **No room-config block** — the old "Dynamic Room Configuration" UI is intentionally gone; pax/rooms/price are derived. Do not reintroduce it.
- **Legacy orders** — opening an order whose participants have `NULL` gender shows the amber warning and blocks save until each gender is set; recomputed totals may differ from stored legacy values (intended correction).
- If `npx tsc --noEmit` flags `allowImportingTsExtensions` on the `scripts/verify-order-logic.ts` imports, run the script directly with `node scripts/verify-order-logic.ts` (it is not part of the app build).
```
