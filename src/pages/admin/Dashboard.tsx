import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Package, ShoppingCart, Users, Map, ArrowRight } from 'lucide-react';
import { StatCard, PageHeader, SectionCard } from '../../components/admin/ui';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_CHIP_STYLE = {
  superadmin: 'bg-amber-50 text-amber-700',
  admin:       'bg-indigo-50 text-indigo-700',
  branch_admin: 'bg-violet-50 text-violet-700',
};
const ROLE_LABEL = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  branch_admin: 'Branch Admin',
};

const Dashboard: React.FC = () => {
  const { profile, branchIds } = useAuth();
  const [stats, setStats] = useState({ packages: 0, orders: 0, participants: 0, privateTrips: 0 });
  const [loading, setLoading] = useState(true);
  const [branchNames, setBranchNames] = useState<string[]>([]);

  useEffect(() => {
    if (branchIds.length === 0) { setBranchNames([]); return; }
    supabase
      .from('branches')
      .select('name')
      .in('id', branchIds)
      .then(({ data }) => setBranchNames(data?.map((b) => b.name) ?? []));
  }, [branchIds]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const queries: Promise<any>[] = [
          supabase.from('packages').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('participants').select('*', { count: 'exact', head: true }),
        ];
        if (profile?.role !== 'branch_admin') {
          queries.push(supabase.from('private_trip_requests').select('*', { count: 'exact', head: true }));
        }

        const results = await Promise.all(queries);
        setStats({
          packages: results[0].count || 0,
          orders: results[1].count || 0,
          participants: results[2].count || 0,
          privateTrips: results[3]?.count || 0,
        });
      } catch (e) {
        console.error('Dashboard stats error:', e);
      }
      setLoading(false);
    })();
  }, [profile]);

  const isBranchAdmin = profile?.role === 'branch_admin';

  const STAT_CARDS = [
    { icon: <Package className="w-5 h-5 text-blue-600" />, label: 'Total Packages', value: stats.packages, color: 'bg-blue-50', href: '/admin/packages' },
    { icon: <ShoppingCart className="w-5 h-5 text-violet-600" />, label: isBranchAdmin ? 'Branch Orders' : 'Active Orders', value: stats.orders, color: 'bg-violet-50', href: '/admin/orders' },
    { icon: <Users className="w-5 h-5 text-emerald-600" />, label: isBranchAdmin ? 'Branch Participants' : 'Total Participants', value: stats.participants, color: 'bg-emerald-50', href: '/admin/orders' },
    ...(!isBranchAdmin ? [{ icon: <Map className="w-5 h-5 text-amber-600" />, label: 'Private Trip Requests', value: stats.privateTrips, color: 'bg-amber-50', href: '/admin/private-trips' }] : []),
  ];

  const QUICK_LINKS = [
    ...(!isBranchAdmin ? [{ label: 'Manage Packages', description: 'Add, edit, or remove tour packages', href: '/admin/packages', icon: Package, color: 'text-blue-600 bg-blue-50' }] : []),
    { label: 'View Orders', description: isBranchAdmin ? 'Track your branch bookings and payments' : 'Track customer bookings and payments', href: '/admin/orders', icon: ShoppingCart, color: 'text-violet-600 bg-violet-50' },
    ...(!isBranchAdmin ? [{ label: 'Private Trip Requests', description: 'Review incoming custom trip inquiries', href: '/admin/private-trips', icon: Map, color: 'text-amber-600 bg-amber-50' }] : [
      { label: 'Browse Packages', description: 'View available tour packages', href: '/admin/packages', icon: Package, color: 'text-blue-600 bg-blue-50' },
    ]),
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={isBranchAdmin ? 'Your branch orders and bookings' : "Welcome back — here's what's happening."}
      />

      {/* Role + branch chips */}
      {profile && (
        <div className="flex flex-wrap items-center gap-2 -mt-5 mb-7">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_CHIP_STYLE[profile.role]}`}>
            {ROLE_LABEL[profile.role]}
          </span>
          {branchNames.map((name) => (
            <span key={name} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Branch filter banner */}
      {isBranchAdmin && branchNames.length > 0 && (
        <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          Showing orders for: <strong>{branchNames.join(', ')}</strong>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: STAT_CARDS.length }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-100" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-7 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          : STAT_CARDS.map((card) => (
              <Link key={card.href + card.label} to={card.href} className="group block">
                <StatCard icon={card.icon} label={card.label} value={card.value} color={card.color} trend="View details →" />
              </Link>
            ))
        }
      </div>

      <SectionCard title="Quick Actions" description="Jump to the most common tasks">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              to={link.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${link.color}`}>
                <link.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{link.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{link.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default Dashboard;
