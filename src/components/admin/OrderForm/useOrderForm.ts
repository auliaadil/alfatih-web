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
