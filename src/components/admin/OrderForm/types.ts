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
