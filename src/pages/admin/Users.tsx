import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Users as UsersIcon, GitBranch, RefreshCw } from 'lucide-react';
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState,
  ConfirmDialog, btnPrimary, btnGhost, useToast, SlideOver,
  FormField, inputClass, selectClass,
} from '../../components/admin/ui';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────

interface BranchRow {
  id: string;
  name: string;
  type: 'office' | 'reseller';
  created_at: string;
  user_branches: { user_id: string }[];
}

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  invite_pending: boolean;
  created_at: string;
  user_branches: { branch_id: string; branches: { id: string; name: string } | null }[];
}

// ── Helpers ────────────────────────────────────────────────

const ROLE_CHIP: Record<UserRole, string> = {
  superadmin: 'bg-amber-50 text-amber-700',
  admin: 'bg-indigo-50 text-indigo-700',
  branch_admin: 'bg-emerald-50 text-emerald-700',
};
const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  branch_admin: 'Branch Admin',
};

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function callEdge(fn: string, body: object): Promise<{ error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${EDGE_URL}/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Users tab ─────────────────────────────────────────────

const UsersTab: React.FC<{ currentUserId: string; allBranches: BranchRow[] }> = ({ currentUserId, allBranches }) => {
  const toast = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | UserRole>('all');

  // Invite form
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('branch_admin');
  const [inviteBranchIds, setInviteBranchIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  // Edit form
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('branch_admin');
  const [editName, setEditName] = useState('');
  const [editBranchIds, setEditBranchIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Remove
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('id, email, display_name, role, invite_pending, created_at, user_branches(branch_id, branches(id, name))')
      .order('created_at', { ascending: true });
    if (data) setUsers(data as UserRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    const result = await callEdge('invite-user', {
      email: inviteEmail,
      role: inviteRole,
      display_name: inviteName,
      branch_ids: inviteRole === 'branch_admin' ? inviteBranchIds : [],
    });
    setInviting(false);
    if (result.error) { toast('error', result.error); return; }
    toast('success', `Invite sent to ${inviteEmail}`);
    setIsInviteOpen(false);
    setInviteEmail(''); setInviteName(''); setInviteRole('branch_admin'); setInviteBranchIds([]);
    fetchUsers();
  };

  const handleResend = async (email: string) => {
    const result = await callEdge('invite-user', { action: 'resend', email });
    if (result.error) { toast('error', result.error); return; }
    toast('success', 'Invite resent.');
  };

  const handleEditOpen = (u: UserRow) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditName(u.display_name);
    setEditBranchIds(u.user_branches.map((ub) => ub.branch_id));
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ role: editRole, display_name: editName })
      .eq('id', editUser.id);
    if (profileError) { toast('error', profileError.message); setSaving(false); return; }

    // Rebuild branch assignments
    await supabase.from('user_branches').delete().eq('user_id', editUser.id);
    if (editRole === 'branch_admin' && editBranchIds.length > 0) {
      await supabase.from('user_branches').insert(
        editBranchIds.map((bid) => ({ user_id: editUser.id, branch_id: bid }))
      );
    }

    setSaving(false);
    setEditUser(null);
    toast('success', 'User updated.');
    fetchUsers();
  };

  const handleRemove = async () => {
    if (!removeUserId) return;
    setRemoving(true);
    const result = await callEdge('remove-user', { userId: removeUserId });
    setRemoving(false);
    setRemoveUserId(null);
    if (result.error) { toast('error', result.error); return; }
    toast('success', 'User removed.');
    fetchUsers();
  };

  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter);
  const counts = {
    all: users.length,
    superadmin: users.filter((u) => u.role === 'superadmin').length,
    admin: users.filter((u) => u.role === 'admin').length,
    branch_admin: users.filter((u) => u.role === 'branch_admin').length,
  };

  const toggleBranch = (id: string, current: string[], set: (v: string[]) => void) => {
    set(current.includes(id) ? current.filter((b) => b !== id) : [...current, id]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 text-sm">
          {(['all', 'superadmin', 'admin', 'branch_admin'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {f === 'all' ? 'All' : ROLE_LABEL[f]} ({counts[f]})
            </button>
          ))}
        </div>
        <button onClick={() => setIsInviteOpen(true)} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Invite User
        </button>
      </div>

      <TableCard>
        <table className="min-w-full">
          <THead>
            <Th>User</Th>
            <Th>Role</Th>
            <Th>Branches</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows cols={5} rows={4} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={<UsersIcon className="w-7 h-7" />} title="No users yet" /></td></tr>
            ) : (
              filtered.map((u) => {
                const isMe = u.id === currentUserId;
                const initials = u.display_name
                  ? u.display_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                  : u.email[0].toUpperCase();
                return (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors group">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ROLE_CHIP[u.role]}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{u.display_name || '—'}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_CHIP[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </Td>
                    <Td>
                      {u.user_branches.length === 0 ? (
                        <span className="text-gray-400 text-sm">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.user_branches.map((ub) => ub.branches && (
                            <span key={ub.branch_id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {ub.branches.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </Td>
                    <Td>
                      {isMe ? (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">You</span>
                      ) : u.invite_pending ? (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">Awaiting signup</span>
                      ) : (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">Active</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      {isMe ? null : (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {u.invite_pending && (
                            <button onClick={() => handleResend(u.email)} className={btnGhost} title="Resend invite">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleEditOpen(u)} className={btnGhost} title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRemoveUserId(u.id)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableCard>

      {/* Invite slide-over */}
      <SlideOver
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite User"
        subtitle="They'll receive an email to set their password."
        footer={
          <button form="invite-form" type="submit" disabled={inviting} className={btnPrimary}>
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        }
      >
        <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
          <FormField label="Email" required>
            <input className={inputClass} type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
          </FormField>
          <FormField label="Display Name">
            <input className={inputClass} value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name" />
          </FormField>
          <FormField label="Role" required>
            <select className={selectClass} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)}>
              <option value="branch_admin">Branch Admin</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </FormField>
          {inviteRole === 'branch_admin' && (
            <FormField label="Assign Branches" hint="Select one or more branches this user manages.">
              <div className="space-y-2 mt-1">
                {allBranches.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteBranchIds.includes(b.id)}
                      onChange={() => toggleBranch(b.id, inviteBranchIds, setInviteBranchIds)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{b.name}</span>
                    <span className="text-xs text-gray-400 capitalize">{b.type}</span>
                  </label>
                ))}
                {allBranches.length === 0 && <p className="text-sm text-gray-400">No branches yet. Create one in the Branches tab.</p>}
              </div>
            </FormField>
          )}
        </form>
      </SlideOver>

      {/* Edit slide-over */}
      <SlideOver
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        subtitle={editUser?.email}
        footer={
          <button form="edit-form" type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        }
      >
        <form id="edit-form" onSubmit={handleEditSave} className="space-y-4">
          <FormField label="Display Name">
            <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
          </FormField>
          <FormField label="Role" required>
            <select className={selectClass} value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
              <option value="branch_admin">Branch Admin</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </FormField>
          {editRole === 'branch_admin' && (
            <FormField label="Assigned Branches">
              <div className="space-y-2 mt-1">
                {allBranches.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBranchIds.includes(b.id)}
                      onChange={() => toggleBranch(b.id, editBranchIds, setEditBranchIds)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{b.name}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}
        </form>
      </SlideOver>

      {/* Remove confirm */}
      <ConfirmDialog
        isOpen={!!removeUserId}
        title="Remove User"
        message="This permanently removes the user's access. Their orders remain intact."
        confirmLabel="Remove User"
        onConfirm={handleRemove}
        onCancel={() => setRemoveUserId(null)}
        loading={removing}
      />
    </div>
  );
};

// ── Branches tab ───────────────────────────────────────────

const BranchesTab: React.FC<{ branches: BranchRow[]; onRefresh: () => void }> = ({ branches, onRefresh }) => {
  const toast = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<BranchRow | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'office' | 'reseller'>('office');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => { setEditBranch(null); setName(''); setType('office'); setIsFormOpen(true); };
  const openEdit = (b: BranchRow) => { setEditBranch(b); setName(b.name); setType(b.type); setIsFormOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editBranch) {
      const { error } = await supabase.from('branches').update({ name, type }).eq('id', editBranch.id);
      if (error) { toast('error', error.message); setSaving(false); return; }
      toast('success', 'Branch updated.');
    } else {
      const { error } = await supabase.from('branches').insert({ name, type });
      if (error) { toast('error', error.message); setSaving(false); return; }
      toast('success', 'Branch created.');
    }
    setSaving(false);
    setIsFormOpen(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const branch = branches.find((b) => b.id === deleteId);
    if (branch && branch.user_branches.length > 0) {
      toast('error', 'Reassign all users before deleting this branch.');
      setDeleteId(null);
      return;
    }
    setDeleting(true);
    const { error } = await supabase.from('branches').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) { toast('error', error.message); return; }
    toast('success', 'Branch deleted.');
    onRefresh();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className={btnPrimary}>
          <Plus className="w-4 h-4" /> New Branch
        </button>
      </div>

      <TableCard>
        <table className="min-w-full">
          <THead>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Assigned Users</Th>
            <Th align="right">Actions</Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {branches.length === 0 ? (
              <tr><td colSpan={4}><EmptyState icon={<GitBranch className="w-7 h-7" />} title="No branches yet" description="Create a branch to start assigning users." /></td></tr>
            ) : (
              branches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/60 transition-colors group">
                  <Td><p className="font-semibold text-gray-900">{b.name}</p></Td>
                  <Td>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${b.type === 'office' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {b.type === 'office' ? 'Office' : 'Reseller'}
                    </span>
                  </Td>
                  <Td><p className="text-gray-700">{b.user_branches.length} user{b.user_branches.length !== 1 ? 's' : ''}</p></Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(b)} className={btnGhost} title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button
                        onClick={() => setDeleteId(b.id)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>

      <SlideOver
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editBranch ? 'Edit Branch' : 'New Branch'}
        footer={
          <button form="branch-form" type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Saving...' : (editBranch ? 'Save Changes' : 'Create Branch')}
          </button>
        }
      >
        <form id="branch-form" onSubmit={handleSave} className="space-y-4">
          <FormField label="Branch Name" required>
            <input className={inputClass} required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jakarta Pusat" />
          </FormField>
          <FormField label="Type" required>
            <select className={selectClass} value={type} onChange={(e) => setType(e.target.value as 'office' | 'reseller')}>
              <option value="office">Office</option>
              <option value="reseller">Reseller</option>
            </select>
          </FormField>
        </form>
      </SlideOver>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Branch"
        message="This branch will be permanently deleted. Orders assigned to it will become unassigned."
        confirmLabel="Delete Branch"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
};

// ── Users page ─────────────────────────────────────────────

const Users: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'users' | 'branches'>('users');
  const [branches, setBranches] = useState<BranchRow[]>([]);

  const fetchBranches = async () => {
    const { data } = await supabase
      .from('branches')
      .select('id, name, type, created_at, user_branches(user_id)')
      .order('name');
    if (data) setBranches(data as BranchRow[]);
  };

  useEffect(() => { fetchBranches(); }, []);

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        subtitle="Manage admin access, roles, and branch assignments"
        breadcrumbs={[{ label: 'System' }, { label: 'Users & Roles' }]}
      />

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['users', 'branches'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'users' ? 'Users' : 'Branches'}
          </button>
        ))}
      </div>

      {tab === 'users' && user && (
        <UsersTab currentUserId={user.id} allBranches={branches} />
      )}
      {tab === 'branches' && (
        <BranchesTab branches={branches} onRefresh={fetchBranches} />
      )}
    </div>
  );
};

export default Users;
