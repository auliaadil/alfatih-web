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
  // Manual rooms overrides keyed by tier name. An override is dropped whenever
  // that tier's participants change, so the gender-aware auto estimate takes
  // over again instead of a stale manual value silently sticking.
  const [roomOverrides, setRoomOverrides] = useState<Record<string, number>>({});

  const clearOverrides = (affectedTiers: string[]) =>
    setRoomOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const tier of affectedTiers) {
        if (tier in next) { delete next[tier]; changed = true; }
      }
      return changed ? next : prev;
    });

  const upsertParticipant = (draft: ParticipantDraft, index: number | null) => {
    const affected = [draft.room_type];
    if (index !== null) {
      const prevTier = participants[index]?.room_type;
      if (prevTier) affected.push(prevTier);
    }
    clearOverrides(affected);
    setParticipants((prev) => {
      if (index === null) return [...prev, draft];
      const next = [...prev];
      next[index] = draft;
      return next;
    });
  };

  const removeParticipant = (index: number) => {
    const target = participants[index];
    if (target?.id) setDeletedIds((d) => [...d, target.id!]);
    if (target?.room_type) clearOverrides([target.room_type]);
    setParticipants((prev) => prev.filter((_, i) => i !== index));
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
