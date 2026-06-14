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
  quotas: number;          // live remaining quota (decremented by the orders INSERT trigger)
  initial_quotas: number | null;
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
        .select('id, title, quotas, initial_quotas, room_options');
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

  // `quotas` is the live remaining quota (decremented only on order INSERT).
  // When editing, this order's pax were already deducted at insert time, so add
  // them back to avoid falsely blocking an edit that just reshuffles people.
  const quotaRemaining = selectedPackage
    ? (selectedPackage.quotas ?? 0) + (initialData?.participant_count ?? 0)
    : null;

  const unsetGender = form.participants.some((p) => p.gender !== 'male' && p.gender !== 'female');
  const incompleteRoom = form.participants.some((p) => !p.room_type);
  const canSave =
    !!selectedPackageId &&
    !!customerName.trim() &&
    !!customerPhone.trim() &&
    form.participants.length > 0 &&
    form.orphans.length === 0 &&
    !unsetGender &&
    !incompleteRoom &&
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
        const { error: upErr } = await supabase.from('participants').upsert(partsPayload, { onConflict: 'id' });
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
          {incompleteRoom && (
            <p className="text-xs text-amber-600">Some participants have no room tier assigned — required before saving.</p>
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
