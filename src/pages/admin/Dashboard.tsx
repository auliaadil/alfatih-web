import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Package, ShoppingCart, Users, Map, ArrowRight, TrendingUp } from 'lucide-react';
import { StatCard, PageHeader, SectionCard } from '../../components/admin/ui';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({ packages: 0, orders: 0, participants: 0, privateTrips: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [
                    { count: packages },
                    { count: orders },
                    { count: participants },
                    { count: privateTrips },
                ] = await Promise.all([
                    supabase.from('packages').select('*', { count: 'exact', head: true }),
                    supabase.from('orders').select('*', { count: 'exact', head: true }),
                    supabase.from('participants').select('*', { count: 'exact', head: true }),
                    supabase.from('private_trip_requests').select('*', { count: 'exact', head: true }),
                ]);
                setStats({
                    packages: packages || 0,
                    orders: orders || 0,
                    participants: participants || 0,
                    privateTrips: privateTrips || 0,
                });
            } catch (e) {
                console.error('Dashboard stats error:', e);
            }
            setLoading(false);
        })();
    }, []);

    const STAT_CARDS = [
        { icon: <Package className="w-5 h-5 text-blue-600" />, label: 'Total Packages', value: stats.packages, color: 'bg-blue-50', href: '/admin/packages' },
        { icon: <ShoppingCart className="w-5 h-5 text-violet-600" />, label: 'Active Orders', value: stats.orders, color: 'bg-violet-50', href: '/admin/orders' },
        { icon: <Users className="w-5 h-5 text-emerald-600" />, label: 'Total Participants', value: stats.participants, color: 'bg-emerald-50', href: '/admin/orders' },
        { icon: <Map className="w-5 h-5 text-amber-600" />, label: 'Private Trip Requests', value: stats.privateTrips, color: 'bg-amber-50', href: '/admin/private-trips' },
    ];

    const QUICK_LINKS = [
        { label: 'Manage Packages', description: 'Add, edit, or remove tour packages', href: '/admin/packages', icon: Package, color: 'text-blue-600 bg-blue-50' },
        { label: 'View Orders', description: 'Track customer bookings and payments', href: '/admin/orders', icon: ShoppingCart, color: 'text-violet-600 bg-violet-50' },
        { label: 'Private Trip Requests', description: 'Review incoming custom trip inquiries', href: '/admin/private-trips', icon: Map, color: 'text-amber-600 bg-amber-50' },
        { label: 'Create a Poster', description: 'Design marketing materials for packages', href: '/admin/poster-maker', icon: TrendingUp, color: 'text-rose-600 bg-rose-50' },
    ];

    return (
        <div>
            <PageHeader
                title="Dashboard"
                subtitle="Welcome back — here's what's happening."
                breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
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
                        <Link key={card.href} to={card.href} className="group block">
                            <StatCard
                                icon={card.icon}
                                label={card.label}
                                value={card.value}
                                color={card.color}
                                trend="View details →"
                            />
                        </Link>
                    ))
                }
            </div>

            {/* Quick Links */}
            <SectionCard
                title="Quick Actions"
                description="Jump to the most common admin tasks"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUICK_LINKS.map((link) => (
                        <Link
                            key={link.href}
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
