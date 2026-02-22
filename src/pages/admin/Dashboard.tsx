import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        packages: 0,
        orders: 0,
        participants: 0,
        privateTrips: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [
                    { count: packagesCount },
                    { count: ordersCount },
                    { count: participantsCount },
                    { count: privateTripsCount }
                ] = await Promise.all([
                    supabase.from('packages').select('*', { count: 'exact', head: true }),
                    supabase.from('orders').select('*', { count: 'exact', head: true }),
                    supabase.from('participants').select('*', { count: 'exact', head: true }),
                    supabase.from('private_trip_requests').select('*', { count: 'exact', head: true })
                ]);

                setStats({
                    packages: packagesCount || 0,
                    orders: ordersCount || 0,
                    participants: participantsCount || 0,
                    privateTrips: privateTripsCount || 0
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
            setLoading(false);
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="text-gray-500">Loading dashboard...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Total Packages</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.packages}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.orders}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Total Participants</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.participants}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Private Trip Requests</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.privateTrips}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
