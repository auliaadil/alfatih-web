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
