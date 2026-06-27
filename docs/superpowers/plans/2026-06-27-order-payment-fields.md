# Order Payment Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `amount_paid` (how much the customer has paid so far) and `payment_proof_url` (uploaded transaction proof image/PDF) to orders, and ensure all money displays use the Indonesian IDR format (dots as thousand separators).

**Architecture:** Add two new nullable columns to the `orders` table via a Supabase migration. Extend the `OrderForm` with a formatted IDR text input for amount paid and a Supabase Storage file upload for payment proof. Show amount paid as a secondary line under Total Price in the Orders list, and show a clickable icon when a proof exists. IDR format (`toLocaleString('id-ID')`) is already used on all existing display fields — only the new input needs explicit formatting.

**Tech Stack:** React, TypeScript, Supabase (Postgres + Storage), Tailwind CSS (CDN)

## Global Constraints

- Tailwind via CDN — no PostCSS
- All UI labels/copy in Bahasa Indonesia where user-facing, English where internal/admin
- `toLocaleString('id-ID')` for all IDR display (dots as thousands separator: `35.000.000`)
- Supabase Storage bucket: `payment-proofs` (public bucket, path: `orders/<timestamp>-<filename>`)
- TypeScript strict mode — no `any` for new code
- New fields are nullable at DB level; no validation blocking save if empty

---

## Files

| Action | Path |
|--------|------|
| Create | `supabase/migrations/20260627000001_add_order_payment_fields.sql` |
| Modify | `src/components/admin/OrderForm/OrderForm.tsx` |
| Modify | `src/pages/admin/Orders.tsx` |

---

### Task 1: Database Migration — add payment columns to orders

**Files:**
- Create: `supabase/migrations/20260627000001_add_order_payment_fields.sql`

**Interfaces:**
- Produces: `orders.amount_paid` (numeric, nullable), `orders.payment_proof_url` (text, nullable)

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260627000001_add_order_payment_fields.sql
alter table orders
  add column if not exists amount_paid   numeric       default null,
  add column if not exists payment_proof_url text      default null;
```

- [ ] **Step 2: Apply migration locally**

```bash
supabase db push
```

Expected output: `Applying migration 20260627000001_add_order_payment_fields.sql`

If using remote only (no local Docker):
```bash
supabase migration up --linked
```

- [ ] **Step 3: Create the Supabase Storage bucket**

Run this once in Supabase SQL editor or via CLI:

```sql
-- Run in Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload
create policy "Authenticated upload payment proofs"
on storage.objects for insert
to authenticated
with check (bucket_id = 'payment-proofs');

-- Allow public read (so the stored URL is directly accessible)
create policy "Public read payment proofs"
on storage.objects for select
to public
using (bucket_id = 'payment-proofs');
```

- [ ] **Step 4: Verify columns exist**

In Supabase Table Editor, open `orders` table. Confirm `amount_paid` (numeric, nullable) and `payment_proof_url` (text, nullable) columns are present.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260627000001_add_order_payment_fields.sql
git commit -m "feat: add amount_paid and payment_proof_url columns to orders"
```

---

### Task 2: OrderForm — state + UI for new payment fields

**Files:**
- Modify: `src/components/admin/OrderForm/OrderForm.tsx`

**Interfaces:**
- Consumes: `initialData?.amount_paid` (number | null), `initialData?.payment_proof_url` (string | null)
- Produces: `amountPaid` (number) and `paymentProofUrl` (string) state included in `handleSubmit` payload

**Context:** The form currently has a 2-column grid with `customer_email` and `payment_status` fields (lines 216–235 in OrderForm.tsx). The new fields go inside that same grid, after payment_status.

- [ ] **Step 1: Add state variables after line 41 (`const [notes, setNotes]...`)**

Add these three new state declarations:

```tsx
  const [amountPaid, setAmountPaid] = useState<number>(initialData?.amount_paid ?? 0);
  const [amountPaidDisplay, setAmountPaidDisplay] = useState<string>(
    initialData?.amount_paid ? (initialData.amount_paid as number).toLocaleString('id-ID') : ''
  );
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>(initialData?.payment_proof_url ?? '');
  const [uploadingProof, setUploadingProof] = useState(false);
```

- [ ] **Step 2: Add the IDR input change handler — add after the `useMemo` block for `roomOptions` (line ~48)**

```tsx
  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
    const num = parseInt(raw, 10) || 0;
    setAmountPaid(num);
    setAmountPaidDisplay(num > 0 ? num.toLocaleString('id-ID') : '');
  };
```

- [ ] **Step 3: Add the file upload handler — add immediately after `handleAmountPaidChange`**

```tsx
  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    const path = `orders/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(data.path);
      setPaymentProofUrl(urlData.publicUrl);
    } else if (error) {
      setErrorMsg('Upload bukti gagal: ' + error.message);
    }
    setUploadingProof(false);
  };
```

- [ ] **Step 4: Add new fields to the payload in `handleSubmit` (around line 113)**

Find the `payload` object in `handleSubmit` and add these two fields:

```tsx
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
      amount_paid: amountPaid > 0 ? amountPaid : null,         // NEW
      payment_proof_url: paymentProofUrl || null,               // NEW
      notes,
      branch_id: selectedBranchId || null,
    };
```

- [ ] **Step 5: Add the new fields to the JSX — inside the 2-column grid after the `payment_status` FormField (around line 233)**

Find this closing tag:
```tsx
              </FormField>
            </div>
          </div>
```
(It's the closing of the `payment_status` FormField and then the grid div.)

Replace the grid section (lines 216–235) with:

```tsx
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nama customer (rep)" required>
                <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </FormField>
              <FormField label="WhatsApp / telepon" required>
                <input className={inputClass} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </FormField>
              <FormField label="Email (opsional)">
                <input type="email" className={inputClass} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </FormField>
              <FormField label="Status pembayaran">
                <select className={selectClass} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  <option value="Down Payment">Down Payment</option>
                  <option value="Payment term 1">Payment term 1</option>
                  <option value="Payment term 2">Payment term 2</option>
                  <option value="Payment term 3">Payment term 3</option>
                  <option value="Paid in Full">Paid in Full</option>
                </select>
              </FormField>
              <FormField label="Jumlah dibayar (Rp)">
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="0"
                  value={amountPaidDisplay}
                  onChange={handleAmountPaidChange}
                />
              </FormField>
              <FormField label="Bukti transaksi">
                <div className="space-y-1.5">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={uploadingProof}
                    onChange={handleProofUpload}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
                  />
                  {uploadingProof && <p className="text-xs text-gray-400">Mengunggah…</p>}
                  {paymentProofUrl && !uploadingProof && (
                    <a href={paymentProofUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline">
                      Lihat bukti →
                    </a>
                  )}
                </div>
              </FormField>
            </div>
```

- [ ] **Step 6: Verify the form renders without TypeScript errors**

```bash
npm run build
```

Expected: no TypeScript errors related to OrderForm.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/OrderForm/OrderForm.tsx
git commit -m "feat(orders): add amount_paid IDR input and payment proof file upload"
```

---

### Task 3: Orders List — show amount paid and proof link

**Files:**
- Modify: `src/pages/admin/Orders.tsx`

**Interfaces:**
- Consumes: `order.amount_paid` (number | null), `order.payment_proof_url` (string | null) from Supabase query
- Produces: Amount paid shown as secondary line under Total Price; proof shown as a clickable link icon

**Context:** The Total Price cell is at line 183–186 in Orders.tsx. The `fetch` query already uses `select('*', ...)` so new columns are automatically included.

- [ ] **Step 1: Add ExternalLink import from lucide-react (line 3)**

Find:
```tsx
import { Plus, Edit2, Trash2, ShoppingCart } from 'lucide-react';
```

Replace with:
```tsx
import { Plus, Edit2, Trash2, ShoppingCart, ExternalLink } from 'lucide-react';
```

- [ ] **Step 2: Update the Total Price cell to show amount paid as a secondary line (lines 183–186)**

Find:
```tsx
                                    <Td>
                                        <p className="font-semibold text-gray-900">
                                            Rp {order.total_price?.toLocaleString('id-ID') ?? '—'}
                                        </p>
                                    </Td>
```

Replace with:
```tsx
                                    <Td>
                                        <p className="font-semibold text-gray-900">
                                            Rp {order.total_price?.toLocaleString('id-ID') ?? '—'}
                                        </p>
                                        {order.amount_paid != null && order.amount_paid > 0 && (
                                            <p className="text-xs text-emerald-600 mt-0.5">
                                                Dibayar: Rp {(order.amount_paid as number).toLocaleString('id-ID')}
                                            </p>
                                        )}
                                    </Td>
```

- [ ] **Step 3: Add payment proof link icon in the Payment Status cell (lines 186–188)**

Find:
```tsx
                                    <Td>
                                        <StatusBadge status={order.payment_status || 'Unknown'} />
                                    </Td>
```

Replace with:
```tsx
                                    <Td>
                                        <div className="flex items-center gap-1.5">
                                            <StatusBadge status={order.payment_status || 'Unknown'} />
                                            {order.payment_proof_url && (
                                                <a
                                                    href={order.payment_proof_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Lihat bukti transaksi"
                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </Td>
```

- [ ] **Step 4: Build to check for TypeScript errors**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 5: Run dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:3000/admin/orders` and:
- Create a new order → confirm "Jumlah dibayar" and "Bukti transaksi" fields appear
- Enter a number like `5000000` in Jumlah dibayar → should display as `5.000.000`
- Upload a test image → "Lihat bukti →" link should appear
- Save the order → confirm it saves without errors
- In the orders list → "Dibayar: Rp 5.000.000" should appear in green below the total price
- The external link icon should appear next to the payment status badge if proof was uploaded
- Edit the saved order → amount paid and proof URL should be pre-filled

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/Orders.tsx
git commit -m "feat(orders): show amount paid and proof link in orders table"
```

---

## Self-Review

**Spec coverage:**
- ✅ `amount_paid` field added (DB + form + list)
- ✅ `payment_proof_url` with file upload (DB + form + list)
- ✅ IDR format on `amount_paid` input (formatted text input with dots)
- ✅ IDR format on `amount_paid` display in list (`toLocaleString('id-ID')`)
- ✅ Existing money displays already use `toLocaleString('id-ID')` — no changes needed

**Placeholder scan:** None found.

**Type consistency:**
- `amountPaid: number` state → `amount_paid: number | null` in payload ✅
- `paymentProofUrl: string` state → `payment_proof_url: string | null` in payload ✅
- `order.amount_paid as number` cast safe because we guard with `!= null && > 0` ✅
