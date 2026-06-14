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

const participants: ParticipantDraft[] = [
  p({ gender: 'male', room_type: 'Quad' }),
  p({ gender: 'male', room_type: 'Quad' }),
  p({ gender: 'female', room_type: 'Quad' }),
  p({ gender: 'female', room_type: 'Quad' }),
  p({ gender: 'male', room_type: 'Double' }),
  p({ gender: 'female', room_type: 'Double' }),
];

assert.equal(autoRoomsForTier(participants.filter(x => x.room_type === 'Quad'), 4), 2, 'quad rooms = 1 male + 1 female');
assert.equal(autoRoomsForTier(participants.filter(x => x.room_type === 'Double'), 2), 2, 'double rooms = 1 male + 1 female');
assert.equal(autoRoomsForTier([], 4), 0, 'no participants = 0 rooms');
assert.equal(autoRoomsForTier([p({ gender: 'male' })], 0), 1, 'capacity 0 treated as 1');

const tiers = buildTierSummaries(participants, roomOptions);
assert.equal(tiers.length, 2, 'only Quad + Double are in use');
const quad = tiers.find(t => t.room_type === 'Quad')!;
assert.equal(quad.pax_booked, 4, 'quad pax');
assert.equal(quad.rooms_booked, 2, 'quad auto rooms');
assert.equal(quad.price_per_pax, 35_000_000, 'quad price carried through');

const withOverride = buildTierSummaries(participants, roomOptions, { Quad: 1 });
assert.equal(withOverride.find(t => t.room_type === 'Quad')!.rooms_booked, 1, 'override wins');

assert.equal(computeTotalPrice(participants, roomOptions), 4 * 35_000_000 + 2 * 39_000_000, 'total price');
assert.equal(totalRooms(tiers), 4, 'total rooms across tiers');

const orphans = orphanTiers([p({ room_type: 'Suite' }), p({ room_type: 'Quad' })], roomOptions);
assert.deepEqual(orphans, ['Suite'], 'detects orphan tier');

console.log('orderLogic: all assertions passed');
