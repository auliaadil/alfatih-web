import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Map, Plane, Building2, ShoppingCart, Settings, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/admin/packages', icon: Package, label: 'Packages' },
        { path: '/admin/private-trips', icon: Map, label: 'Private Trips' },
        { path: '/admin/airlines', icon: Plane, label: 'Airlines' },
        { path: '/admin/hotels', icon: Building2, label: 'Hotels' },
        { path: '/admin/settings', icon: Settings, label: 'Site Settings' },
    ];

    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            {/* Mobile Header & Hamburger */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-20 px-4 py-3 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                    <img src="/assets/alfatih_logo_only.webp" alt="Alfatih Logo" className="h-8 w-auto object-contain" />
                    <span className="text-lg font-medium text-gray-700">Admin</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/assets/alfatih_logo_only.webp" alt="Alfatih Logo" className="h-8 w-auto object-contain hidden lg:block" />
                        <span className="text-lg font-medium text-gray-700 hidden lg:block">Admin Menu</span>
                        <span className="text-lg font-medium text-gray-700 lg:hidden">Menu</span>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeSidebar}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium text-sm">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-gray-50 lg:static mt-16 lg:mt-0 relative w-full">
                <div className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
