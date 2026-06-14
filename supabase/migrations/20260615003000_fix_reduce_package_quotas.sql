-- Fix reduce_package_quotas(): it referenced packages.available_rooms, a column
-- dropped in the package-form redesign. That broken reference made every order
-- INSERT fail. Rooms are now a per-order, gender-aware estimate (no package-level
-- available_rooms), so the trigger only decrements the remaining participant quota.
CREATE OR REPLACE FUNCTION public.reduce_package_quotas()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE packages
    SET quotas = quotas - NEW.participant_count
    WHERE id = NEW.package_id;
    RETURN NEW;
END;
$function$;
