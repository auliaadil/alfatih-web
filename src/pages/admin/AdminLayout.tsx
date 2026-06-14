import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Map, Plane, Building2, ShoppingCart,
  Settings, LogOut, Menu, X, Image as ImageIcon, Layers, ChevronRight,
  Megaphone, Users, PlaneTakeoff, Tag,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ToastProvider } from '../../components/admin/ui';
import { useAuth, UserRole } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  allowedRoles?: UserRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  allowedRoles?: UserRole[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
      { path: '/admin/packages', icon: Package, label: 'Packages' },
      { path: '/admin/private-trips', icon: Map, label: 'Private Trips', allowedRoles: ['admin', 'superadmin'] },
    ],
  },
  {
    label: 'Resources',
    allowedRoles: ['admin', 'superadmin'],
    items: [
      { path: '/admin/airlines', icon: Plane, label: 'Airlines' },
      { path: '/admin/hotels', icon: Building2, label: 'Hotels' },
      { path: '/admin/airports', icon: PlaneTakeoff, label: 'Airports' },
      { path: '/admin/categories', icon: Tag, label: 'Categories' },
    ],
  },
  {
    label: 'Marketing',
    allowedRoles: ['admin', 'superadmin'],
    items: [
      { path: '/admin/poster-maker', icon: ImageIcon, label: 'Poster Maker' },
      { path: '/admin/poster-templates', icon: Layers, label: 'Templates' },
      { path: '/admin/text-campaign', icon: Megaphone, label: 'Text Campaign' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/admin/settings', icon: Settings, label: 'Site Settings', allowedRoles: ['admin', 'superadmin'] },
      { path: '/admin/users', icon: Users, label: 'Users & Roles', allowedRoles: ['superadmin'] },
    ],
  },
];

const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  branch_admin: 'Branch Admin',
};

const ROLE_COLOR: Record<UserRole, string> = {
  superadmin: 'text-amber-300',
  admin: 'text-indigo-300',
  branch_admin: 'text-emerald-300',
};

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, branchIds } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [branchNames, setBranchNames] = useState<string[]>([]);
  const isFullHeightPage = location.pathname.startsWith('/admin/poster-maker');

  useEffect(() => {
    if (branchIds.length === 0) { setBranchNames([]); return; }
    supabase
      .from('branches')
      .select('name')
      .in('id', branchIds)
      .then(({ data }) => setBranchNames(data?.map((b) => b.name) ?? []));
  }, [branchIds]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : (path !== '/admin' && location.pathname.startsWith(path));

  const canSee = (roles?: UserRole[]) => {
    if (!roles) return true;
    if (!profile) return false;
    return roles.includes(profile.role);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const branchLabel = branchNames.length === 0
    ? null
    : branchNames.length === 1
      ? branchNames[0]
      : `${branchNames[0]} +${branchNames.length - 1}`;

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 shrink-0">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <img src="/assets/alfatih_logo_only.webp" alt="Logo" className="w-5 h-5 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight truncate font-jakarta">Alfatih Admin</p>
          <p className="text-gray-500 text-xs leading-tight">Dunia Wisata</p>
        </div>
        <button
          onClick={closeSidebar}
          className="lg:hidden ml-auto p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_GROUPS.map((group) => {
          if (!canSee(group.allowedRoles)) return null;
          const visibleItems = group.items.filter((item) => canSee(item.allowedRoles));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.path, item.exact);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group ${
                        active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                      <span className="truncate">{item.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-500 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Identity card + logout */}
      <div className="px-3 py-4 border-t border-white/5 shrink-0 space-y-2">
        {profile && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-white/10 ${ROLE_COLOR[profile.role]}`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold leading-tight truncate">
                {profile.display_name || profile.email}
              </p>
              <p className={`text-[10px] leading-tight truncate ${ROLE_COLOR[profile.role]}`}>
                {ROLE_LABEL[profile.role]}{branchLabel ? ` · ${branchLabel}` : ''}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-950 px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <img src="/assets/alfatih_logo_only.webp" alt="Logo" className="h-7 w-auto" />
            <span className="text-white text-sm font-semibold font-jakarta">Admin</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm animate-fade-in" onClick={closeSidebar} />
        )}

        <div className="hidden lg:flex shrink-0"><Sidebar /></div>

        <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>

        <div className={`flex-1 min-w-0 ${isFullHeightPage ? 'overflow-hidden' : 'overflow-auto'} mt-[52px] lg:mt-0`}>
          <div className={`${isFullHeightPage ? 'h-full' : 'min-h-full'} p-5 sm:p-6 lg:p-8`}>
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
};

export default AdminLayout;
