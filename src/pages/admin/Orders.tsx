import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2 } from 'lucide-react';
import OrderForm from './OrderForm';

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, packages(title), participants(*)')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure? This will delete the order, and potentially leave quotas unbalanced unless handled by complex triggers.')) {
            await supabase.from('orders').delete().eq('id', id);
            fetchOrders();
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
                <button
                    onClick={() => {
                        setEditingOrder(null);
                        setIsFormOpen(true);
                    }}
                    className="bg-primary hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Order
                </button>
            </div>

            {loading ? (
                <div className="text-gray-500">Loading orders...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pax / Rooms</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-[200px]">
                                        {order.packages?.title || 'Unknown Package'}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm">
                                        <span className="font-bold">{order.participant_count}</span> pax
                                        <br />
                                        <span className="text-gray-500 text-xs">{order.room_count_booked} rooms</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        Rp {order.total_price?.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setEditingOrder(order);
                                                setIsFormOpen(true);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isFormOpen && (
                <OrderForm
                    initialData={editingOrder}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingOrder(null);
                    }}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        setEditingOrder(null);
                        fetchOrders();
                    }}
                />
            )}
        </div>
    );
};

export default Orders;
