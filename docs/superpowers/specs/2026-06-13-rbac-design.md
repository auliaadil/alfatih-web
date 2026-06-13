# RBAC & User Management Design

**Date:** 2026-06-13  
**Status:** Approved  
**Scope:** Role-based access control, branch management, and user management UI for the Alfatih Admin panel.

---

## 1. Problem Statement

All authenticated users currently have full access to every admin feature. The business needs three distinct roles: a superadmin who manages everything including users, admins who operate the full platform, and branch admins who manage only their own branch's orders.

---

## 2. Roles

| Role | Description |
|---|---|
| `superadmin` | Full access to all features including user & role management |
| `admin` | Full access to all features except user & role management |
| `branch_admin` | Full CRUD on their own branch's orders; read-only access to packages |

A **branch** is any partner entity — a physical office location or an external reseller. One branch admin can be assigned to multiple branches.

---

## 3. Data Model

### New tables

**`branches`**
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
type        text NOT NULL CHECK (type IN ('office', 'reseller'))
created_at  timestamptz DEFAULT now()
```

**`user_profiles`**  
Pre-created by the `invite-user` Edge Function before the invite email is sent, so role and branch assignments exist before the user signs up. No trigger required.
```sql
id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
display_name  text NOT NULL DEFAULT ''
role          text NOT NULL DEFAULT 'branch_admin'
              CHECK (role IN ('superadmin', 'admin', 'branch_admin'))
created_at    timestamptz DEFAULT now()
```

**`user_branches`**  
Junction table — one user can manage many branches.
```sql
user_id    uuid REFERENCES user_profiles(id) ON DELETE CASCADE
branch_id  uuid REFERENCES branches(id) ON DELETE CASCADE
PRIMARY KEY (user_id, branch_id)
```

### Modified tables

**`orders`** — add column:
```sql
branch_id  uuid REFERENCES branches(id) ON DELETE SET NULL
```
Existing orders default to `NULL` (unassigned). Only admin and superadmin can see unassigned orders.

### Helper DB functions (used in RLS, not callable from client)

```sql
-- Returns the role of the currently authenticated user
get_my_role() RETURNS text

-- Returns the branch IDs assigned to the currently authenticated user
get_my_branch_ids() RETURNS uuid[]
```

Both functions use `SECURITY DEFINER` with `SET search_path = public` and always check `auth.uid() IS NOT NULL`. After creation, `REVOKE EXECUTE ON FUNCTION get_my_role() FROM PUBLIC` and likewise for `get_my_branch_ids()` — they are only invoked internally by RLS policies, never directly by client roles.

---

## 4. Access Control (RLS)

The existing `anon` INSERT policies on `orders` and `participants` (for the public booking form) and public SELECT policies on `packages`, `airlines`, `hotels`, `site_settings` (for the public website) are unchanged.

| Table | `branch_admin` | `admin` | `superadmin` |
|---|---|---|---|
| `packages` | SELECT only | Full CRUD | Full CRUD |
| `airlines` | No access | Full CRUD | Full CRUD |
| `hotels` | No access | Full CRUD | Full CRUD |
| `orders` | Full CRUD where `branch_id = ANY(get_my_branch_ids())` | Full CRUD (all rows) | Full CRUD (all rows) |
| `participants` | Full CRUD where `order_id IN (SELECT id FROM orders WHERE branch_id = ANY(get_my_branch_ids()))` | Full CRUD | Full CRUD |
| `private_trip_requests` | No access | Full CRUD | Full CRUD |
| `site_settings` | No access | Full CRUD | Full CRUD |
| `branches` | SELECT own branches only | SELECT all | Full CRUD |
| `user_profiles` | SELECT own row only | SELECT all | Full CRUD |
| `user_branches` | SELECT own rows only | SELECT all | Full CRUD |

Branch admin access to `orders` and `participants` is enforced at the database level — a UI bug cannot leak another branch's data.

---

## 5. Frontend Auth Context

**New `AuthContext`** at `src/contexts/AuthContext.tsx`:

```ts
interface AuthContextValue {
  user: User | null
  profile: {
    role: 'superadmin' | 'admin' | 'branch_admin'
    display_name: string
  } | null
  branchIds: string[]   // empty array for superadmin and admin
  loading: boolean
}
```

**`useAuth()` hook** — single import for any component needing role or branch info.

**Updated `AuthGuard`** (`src/components/AuthGuard.tsx`):
- Fetches the `user_profiles` row after confirming a valid Supabase session.
- If no profile exists, signs the user out — access is gated by having a profile, not by `VITE_ADMIN_EMAILS`.
- `VITE_ADMIN_EMAILS` env var is removed entirely.

**`RoleGuard`** — a new thin wrapper component for individual sensitive routes:
```tsx
<RoleGuard roles={['superadmin']}>
  <UsersPage />
</RoleGuard>
```
Redirects to `/admin` if the current user's role is not in the allowed list.

---

## 6. Navigation per Role

`AdminLayout` reads `useAuth()` and conditionally renders nav items. Items are not hidden via CSS — they are not rendered at all.

| Nav group | Item | `branch_admin` | `admin` | `superadmin` |
|---|---|---|---|---|
| Operations | Dashboard | ✓ | ✓ | ✓ |
| Operations | Orders | ✓ | ✓ | ✓ |
| Operations | Packages | ✓ (read-only UI) | ✓ | ✓ |
| Operations | Private Trips | — | ✓ | ✓ |
| Resources | Airlines | — | ✓ | ✓ |
| Resources | Hotels | — | ✓ | ✓ |
| Marketing | Poster Maker | — | ✓ | ✓ |
| Marketing | Templates | — | ✓ | ✓ |
| Marketing | Text Campaign | — | ✓ | ✓ |
| System | Site Settings | — | ✓ | ✓ |
| System | Users & Roles | — | — | ✓ |

---

## 7. User Identity Display

### Sidebar footer (all roles)
An identity card above the Logout button shows:
- Avatar (initials, role-coloured)
- Display name
- Role label · branch name(s)

For users managing multiple branches: *"Jakarta Pusat +2"* with a tooltip listing all branches.

### Dashboard page header (all roles)
- Role chip (e.g., `Branch Admin`) in indigo
- Branch chip(s) (e.g., `Jakarta Pusat`) in green — only shown for `branch_admin`

### Dashboard stat cards & quick links per role

| Element | `branch_admin` | `admin` / `superadmin` |
|---|---|---|
| Packages stat | ✓ (all packages, RLS allows) | ✓ |
| Orders stat | ✓ (own branch only, via RLS) | ✓ (all) |
| Participants stat | ✓ (own branch only, via RLS) | ✓ (all) |
| Private Trips stat | — (hidden) | ✓ |
| Quick link: Manage Packages | — | ✓ |
| Quick link: View Orders | ✓ | ✓ |
| Quick link: Private Trips | — | ✓ |
| Quick link: Create a Poster | — | ✓ |

Dashboard subtitle adapts per role: branch admins see *"Your branch orders and bookings"*.
Branch admins also see a banner: *"Showing orders for: Jakarta Pusat, Depok"*.

---

## 8. Users & Roles Page (`/admin/users`)

**Route:** `/admin/users` — wrapped in `<RoleGuard roles={['superadmin']} />`.  
**Nav:** New item under System group, superadmin only.  
**Two tabs:** Users | Branches

### Users tab
A table with columns: User (avatar + name + email), Role (colour-coded chip), Branches (chips), Last Active, Actions.

- Filter tabs: All / Superadmin / Admin / Branch Admin
- **Invite User** button → modal: email, role, branch(es) if branch_admin → Supabase `auth.admin.inviteUserByEmail()` called via Edge Function → `user_profiles` row pre-created with role + branch assignments → user receives invite email → sets password → ready.
- **Edit** → modal to change role and add/remove branch assignments. Changing role to admin/superadmin clears branch assignments.
- **Remove** → disables Supabase auth access and deletes `user_profiles` row. Historical orders are preserved (branch_id FK is SET NULL on cascade).
- Current user's own row shows "You" badge with no Edit/Remove actions (prevents self-lockout).
- Pending (uninvited) users show grayed row, "Awaiting signup" badge, Resend / Cancel Invite actions.

### Branches tab
A simple CRUD list: Branch name + type badge (Office / Reseller) + assigned user count.  
Add / Edit / Delete branch. Deleting a branch with assigned users is blocked with an error prompt — reassign users first.

---

## 9. Orders Page Changes

### Table columns
- **Admin/Superadmin:** New Branch column showing assigned branch name or "—" for unassigned.
- **Branch Admin:** No Branch column (redundant — RLS already scopes their view). A header banner shows *"Showing orders for: [branch names]"*.

### Order form (create/edit)
- **Admin/Superadmin:** Optional branch selector (dropdown of all branches). Can leave unassigned.
- **Branch Admin, one branch:** `branch_id` silently set to their branch. No selector shown.
- **Branch Admin, multiple branches:** Required dropdown of their own branches only.

### Existing orders
All existing orders remain with `branch_id = NULL`. Admin and superadmin see them. Branch admins never see unassigned orders.

---

## 10. New Edge Function

**`invite-user`** — called by the Users & Roles page to send Supabase invites.  
Requires a valid superadmin JWT. Uses the `service_role` key (stored as a Supabase secret) to call `auth.admin.inviteUserByEmail()`. Also pre-creates the `user_profiles` row and `user_branches` entries so the role and branches are ready before the user accepts the invite.

---

## 11. Migration Strategy

1. Create `branches`, `user_profiles`, `user_branches` tables.
2. Add `branch_id` column to `orders` (nullable, defaults NULL).
3. Create `get_my_role()` and `get_my_branch_ids()` helper functions.
4. Apply new RLS policies to all tables (replace existing authenticated-blanket policies with role-aware ones).
5. Revoke public execute on `get_my_role()` and `get_my_branch_ids()`.
6. Manually INSERT the first superadmin row into `user_profiles` in the DB (bootstrapping — no invite needed for the first user, since they already have a Supabase auth account).
7. Deploy `invite-user` Edge Function.
8. Update frontend: `AuthContext`, `AuthGuard`, `AdminLayout`, `Dashboard`, `Orders`, `OrderForm`.
9. Add `/admin/users` page and `RoleGuard`.

---

## 12. Out of Scope

- Audit log / activity history per user
- Password reset flow (handled natively by Supabase Auth)
- Granular per-package branch quotas (branches sell seats on shared packages; quota management remains at the package level)
- Branch admin access to Poster Maker, Private Trips, Airlines, Hotels, or Marketing features
