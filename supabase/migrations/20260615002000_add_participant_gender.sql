-- Add gender to participants for gender-aware room grouping & manifests.
-- Nullable: existing rows stay NULL until edited; required at the app layer.
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS gender text;

COMMENT ON COLUMN public.participants.gender IS 'male | female — required by the order form for new/edited participants';
