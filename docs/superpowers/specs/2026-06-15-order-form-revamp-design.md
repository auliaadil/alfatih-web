# Order Form Revamp — Design

**Date:** 2026-06-15
**Status:** Approved (pending spec review)
**Area:** Admin → Orders (Create / Edit)

## Problem

The current Create/Edit Order form (`src/pages/admin/OrderForm.tsx`) has two
conflicting sources of truth for room data:

1. A **"Dynamic Room Configuration"** block where the admin manually types
   `pax_booked` and `rooms_booked` per room type.
2. A **"Participants List"** where each participant is *also* assigned a room
   type.

These can drift out of sync (e.g. room config says 5 Quad pax but only 3 Quad
participants are entered). The room configuration step is redundant because
adding a participant already captures their room tier.

Additional goals:

- Replace the centered **modal** dialog with a right-side **slide-over** panel.
- Revamp the UI/UX around the current package room model (flat per-pax tiers
  pulled from `package.room_options`).

## Decisions (confirmed with user)

- **Room model: flat tiers.** A participant picks one tier (e.g. Double / Triple
  / Quad) from the selected package's `room_options`, priced per pax. No
  per-hotel room arrangement — verified that no current package uses per-hotel
  `room_options`; the public booking page already treats rooms as one flat list.
- **Add `gender` to participants** (required: `male` | `female`). Needed for
  gender-aware room grouping and useful for manifests/visa.
- **Per-order rooms = auto estimate + override.** Pax-per-tier is the primary,
  truthful metric. Rooms are auto-estimated (gender-aware) and editable, because
  physical rooms are shared across orders operationally.
- **Add-participant interaction: inline expanding editor** (pattern A) — fast for
  adding several people while keeping the list and summary in view.
- **Required participant fields:** name + gender + room tier. NIK, passport,
  phone, address remain optional.

## Data Model

### Schema change

```sql
ALTER TABLE participants ADD COLUMN gender text;  -- 'male' | 'female'
```

- Required at the application level for new/edited participants.
- Existing rows remain `NULL` until edited (shown as an "unspecified" state that
  must be resolved before save).
- The existing unused `room_group_id` column is left untouched (out of scope).

No `orders` schema change. The same fields are still persisted so the Orders list
keeps working, but they are now **derived from participants** rather than entered:

| Field                | Source                                                             |
|----------------------|-------------------------------------------------------------------|
| `participant_count`  | count of participants                                             |
| `room_breakdown`     | `[{ room_type, capacity, price_per_pax, pax_booked, rooms_booked }]` — one entry per tier in use; `pax_booked` derived, `rooms_booked` auto + editable |
| `room_count_booked`  | Σ `rooms_booked`                                                   |
| `total_price`        | Σ each participant's tier `price` (from `package.room_options`)    |

Room tiers come from the selected package's `room_options` (`name`, `capacity`,
`price`). Participant `room_type` stores the tier `name`.

### Derivation logic (pure functions in `useOrderForm`)

- **pax per tier** = group participants by `room_type`, count.
- **auto rooms per tier** = split tier participants by gender, then
  `ceil(menCount / capacity) + ceil(womenCount / capacity)`. Upper-bound estimate
  (ignores cross-order sharing). Pre-fills the editable rooms input.
- **total price** = for each participant, look up their tier in
  `package.room_options` and sum `price`.

## Component Structure

Replace the centered modal with the existing `SlideOver` component
(`src/components/admin/ui.tsx`, `width="lg"`). Split the ~520-line monolith into
focused units under `src/components/admin/OrderForm/`:

- **`OrderForm.tsx`** (container) — data loading (packages, branches), form state,
  save logic, validation; rendered inside `SlideOver`.
- **`ParticipantList.tsx`** — participant rows + inline editor (pattern A).
- **`ParticipantEditor.tsx`** — inline add/edit form (name, gender, tier, NIK,
  passport, phone, address).
- **`OrderSummaryFooter.tsx`** — sticky footer: per-tier room summary strip
  (pax + editable rooms + price subtotal), grand total, quota, Cancel/Save.
- **`useOrderForm.ts`** — derivation logic (pax-per-tier, gender-aware room
  estimate, total price) as pure, testable functions kept out of the view.

`src/pages/admin/OrderForm.tsx` remains the import path `Orders.tsx` already uses;
it hosts/re-exports the container so `Orders.tsx` needs no change beyond how the
panel opens.

## Layout

Right-side slide-over (~672px), approved mockup:

- **Header** — "Create / Edit Order", package name + quota remaining.
- **Package & Customer card** (compact) — package selector, rep name, phone,
  email (optional), payment status, branch selector (conditional, existing rules).
- **Participants** (main focus) — list of rows; each row shows gender avatar
  (♂/♀), name, docs summary, room-tier chip, edit/delete. "+ Add participant"
  opens the inline editor at the bottom of the list.
- **Room Summary strip** (above footer total) — one line per tier: pax, editable
  rooms number (pre-filled with estimate), price subtotal.
- **Sticky footer** — grand total price, Cancel / Save.
- **Notes** — internal notes textarea.

## Validation & Edge Cases

- At least 1 participant required.
- Each participant requires name + gender + tier.
- Total pax ≤ package remaining quota (existing rule, recomputed from
  participants).
- **Package change after adding people:** re-map each participant's tier by name;
  if a tier no longer exists on the new package, flag those rows and block save
  until reassigned.
- **Editing legacy orders:** rebuild tiers from existing participants;
  participants with `NULL` gender must be set before save; total/pax recomputed
  from participants (may differ from legacy stored values — this is the intended
  correction).
- Editing a tier's rooms only affects `rooms_booked` / `room_count_booked`, never
  pax or price.

## Persistence

On save (matching current upsert flow):

- Upsert `orders` row with derived `participant_count`, `room_breakdown`,
  `room_count_booked`, `total_price`, plus customer fields, `payment_status`,
  `notes`, `branch_id`.
- Sync `participants`: delete removed, upsert active (now including `gender`).

## Testing

No test runner is configured in this repo. The `useOrderForm` derivation
functions (pax-per-tier, gender-aware room estimate, total price) are written as
pure functions so they are trivially unit-testable and can be exercised manually.
UI behavior is verified by running the admin panel (`npm run dev`).

## Out of Scope

- Per-hotel room arrangement.
- Cross-order rooming list / actual physical room assignment (`room_group_id`).
- Changes to the public booking flow.
