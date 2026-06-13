-- ============================================================
-- RBAC: New tables, modified orders, helper functions, RLS
-- ============================================================

-- 1. branches
CREATE TABLE public.branches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text NOT NULL CHECK (type IN ('office', 'reseller')),
  created_at timestamptz DEFAULT now()
);

-- 2. user_profiles
CREATE TABLE public.user_profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  display_name  text NOT NULL DEFAULT '',
  role          text NOT NULL DEFAULT 'branch_admin'
                CHECK (role IN ('superadmin', 'admin', 'branch_admin')),
  invite_pending boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- 3. user_branches junction
CREATE TABLE public.user_branches (
  user_id   uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, branch_id)
);

-- 4. Add branch_id to orders (nullable — existing orders stay unassigned)
ALTER TABLE public.orders
  ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- 5. Helper: get_my_role()
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- 6. Helper: get_my_branch_ids()
CREATE OR REPLACE FUNCTION public.get_my_branch_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(SELECT branch_id FROM public.user_branches WHERE user_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_branch_ids() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_my_branch_ids() TO authenticated;

-- 7. Trigger: mark invite_pending = false when user confirms email
CREATE OR REPLACE FUNCTION public.on_auth_user_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.user_profiles
    SET invite_pending = false
    WHERE id = NEW.id AND invite_pending = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_confirmed();

-- ============================================================
-- RLS: new tables
-- ============================================================

ALTER TABLE public.branches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;

-- branches: branch_admin sees own, admin/superadmin sees all, superadmin manages
CREATE POLICY "branches_select"
  ON public.branches FOR SELECT TO authenticated
  USING (
    CASE (SELECT get_my_role())
      WHEN 'superadmin' THEN true
      WHEN 'admin'      THEN true
      ELSE id = ANY(get_my_branch_ids())
    END
  );
CREATE POLICY "branches_manage"
  ON public.branches FOR ALL TO authenticated
  USING      ((SELECT get_my_role()) = 'superadmin')
  WITH CHECK ((SELECT get_my_role()) = 'superadmin');

-- user_profiles: branch_admin sees own row, admin/superadmin see all, superadmin manages
CREATE POLICY "user_profiles_select"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (
    (SELECT get_my_role()) IN ('superadmin', 'admin')
    OR id = auth.uid()
  );
CREATE POLICY "user_profiles_manage"
  ON public.user_profiles FOR ALL TO authenticated
  USING      ((SELECT get_my_role()) = 'superadmin')
  WITH CHECK ((SELECT get_my_role()) = 'superadmin');

-- user_branches: branch_admin sees own rows, admin/superadmin see all, superadmin manages
CREATE POLICY "user_branches_select"
  ON public.user_branches FOR SELECT TO authenticated
  USING (
    (SELECT get_my_role()) IN ('superadmin', 'admin')
    OR user_id = auth.uid()
  );
CREATE POLICY "user_branches_manage"
  ON public.user_branches FOR ALL TO authenticated
  USING      ((SELECT get_my_role()) = 'superadmin')
  WITH CHECK ((SELECT get_my_role()) = 'superadmin');

-- ============================================================
-- RLS: update existing tables
-- ============================================================

-- orders: replace blanket "Admin manage orders" with role-aware policy
DROP POLICY IF EXISTS "Admin manage orders" ON public.orders;
CREATE POLICY "orders_authenticated"
  ON public.orders FOR ALL TO authenticated
  USING (
    CASE (SELECT get_my_role())
      WHEN 'superadmin' THEN true
      WHEN 'admin'      THEN true
      ELSE branch_id = ANY(get_my_branch_ids())
    END
  )
  WITH CHECK (
    CASE (SELECT get_my_role())
      WHEN 'superadmin' THEN true
      WHEN 'admin'      THEN true
      ELSE branch_id = ANY(get_my_branch_ids())
    END
  );

-- participants: replace blanket policy with role-aware
DROP POLICY IF EXISTS "Admin manage participants" ON public.participants;
CREATE POLICY "participants_authenticated"
  ON public.participants FOR ALL TO authenticated
  USING (
    CASE (SELECT get_my_role())
      WHEN 'superadmin' THEN true
      WHEN 'admin'      THEN true
      ELSE order_id IN (
        SELECT id FROM public.orders
        WHERE branch_id = ANY((SELECT get_my_branch_ids()))
      )
    END
  )
  WITH CHECK (
    CASE (SELECT get_my_role())
      WHEN 'superadmin' THEN true
      WHEN 'admin'      THEN true
      ELSE order_id IN (
        SELECT id FROM public.orders
        WHERE branch_id = ANY((SELECT get_my_branch_ids()))
      )
    END
  );

-- packages: branch_admin gets SELECT via existing "Public read packages"; gate writes to admin+
DROP POLICY IF EXISTS "Admin manage packages" ON public.packages;
CREATE POLICY "packages_write"
  ON public.packages FOR ALL TO authenticated
  USING      ((SELECT get_my_role()) IN ('admin', 'superadmin'))
  WITH CHECK ((SELECT get_my_role()) IN ('admin', 'superadmin'));

-- airlines
DROP POLICY IF EXISTS "Admin manage airlines" ON public.airlines;
CREATE POLICY "airlines_write"
  ON public.airlines FOR ALL TO authenticated
  USING      ((SELECT get_my_role()) IN ('admin', 'superadmin'))
  WITH CHECK ((SELECT get_my_role()) IN ('admin', 'superadmin'));

-- hotels
DROP POLICY IF EXISTS "Admin manage hotels" ON public.hotels;
CREATE POLICY "hotels_write"
  ON public.hotels FOR ALL TO authenticated
  USING      ((SELECT get_my_role()) IN ('admin', 'superadmin'))
  WITH CHECK ((SELECT get_my_role()) IN ('admin', 'superadmin'));

-- private_trip_requests
DROP POLICY IF EXISTS "Admin manage private trip requests" ON public.private_trip_requests;
CREATE POLICY "private_trips_write"
  ON public.private_trip_requests FOR ALL TO authenticated
  USING      ((SELECT get_my_role()) IN ('admin', 'superadmin'))
  WITH CHECK ((SELECT get_my_role()) IN ('admin', 'superadmin'));

-- site_settings
DROP POLICY IF EXISTS "Admin manage site_settings" ON public.site_settings;
CREATE POLICY "site_settings_write"
  ON public.site_settings FOR ALL TO authenticated
  USING      ((SELECT get_my_role()) IN ('admin', 'superadmin'))
  WITH CHECK ((SELECT get_my_role()) IN ('admin', 'superadmin'));
