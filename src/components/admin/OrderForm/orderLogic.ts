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
