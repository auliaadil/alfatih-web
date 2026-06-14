import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, ShoppingCart } from 'lucide-react';
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState,
    ConfirmDialog, StatusBadge, btnPrimary, btnGhost, useToast,
    SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
import OrderForm from './OrderForm';
import { useAuth } from '../../contexts/AuthContext';

const BranchBanner: React.FC<{ branchIds: string[] }> = ({ branchIds }) => {
    const [names, setNames] = useState<string[]>([]);
    useEffect(() => {
        if (!branchIds.length) return;
        supabase.from('branches').select('name').in('id', branchIds)
            .then(({ data }) => setNames(data?.map((b) => b.name) ?? []));
    }, [branchIds]);
    if (!names.length) return null;
    return <>Showing orders for: <strong>{names.join(', ')}</strong></>;
};

const PAGE_SIZE = 10;

const Orders: React.FC = () => {
    const toast = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { profile, branchIds } = useAuth();
    const isBranchAdmin = profile?.role === 'branch_admin';

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState<SortState>({ key: 'created_at', dir: 'desc' });
    const handleSort = (key: string) =>
        setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

    useEffect(() => { fetchOrders(); }, []);

    useEffect(() => { setPage(0); }, [searchQuery]);

    useEffect(() => { setPage(0); }, [sort]);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, packages(title), participants(*), branches(name)')
            .order('created_at', { ascending: false });
        if (!error && data) setOrders(data);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const { error } = await supabase.from('orders').delete().eq('id', deleteId);
        setDeleting(false);
        setDeleteId(null);
        if (error) {
            toast('error', 'Failed to delete order.');
        } else {
            toast('success', 'Order deleted.');
            setPage(0);
            fetchOrders();
        }
    };

    const getPaymentVariant = (status: string): 'pending' | 'success' | 'warning' | 'info' => {
        const s = (status || '').toLowerCase();
        if (s.includes('lunas') || s.includes('full')) return 'success';
        if (s.includes('dp') || s.includes('down')) return 'warning';
        if (s.includes('cancel')) return 'pending';
        return 'info';
    };

    const filtered = orders.filter((o) =>
        [o.customer_name, o.customer_phone, o.packages?.title].some((f) =>
            (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
    const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div>
            <PageHeader
                title="Orders"
                badge={orders.length}
                subtitle="Track and manage customer bookings"
                breadcrumbs={[{ label: 'Operations' }, { label: 'Orders' }]}
                action={
                    <button
                        onClick={() => { setEditingOrder(null); setIsFormOpen(true); }}
                        className={btnPrimary}
                    >
                        <Plus className="w-4 h-4" /> New Order
                    </button>
                }
            />

            {isBranchAdmin && (
                <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                    <BranchBanner branchIds={branchIds} />
                </div>
            )}

            <div className="mb-4">
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari nama customer atau paket..." />
            </div>

            <TableCard>
                <table className="min-w-full">
                    <THead>
                        <Th sortKey="customer_name" currentSort={sort} onSort={handleSort}>Customer</Th>
                        <Th sortKey="packages.title" currentSort={sort} onSort={handleSort}>Package</Th>
                        {!isBranchAdmin && <Th>Branch</Th>}
                        <Th align="center">Pax / Rooms</Th>
                        <Th sortKey="total_price" currentSort={sort} onSort={handleSort}>Total Price</Th>
                        <Th sortKey="payment_status" currentSort={sort} onSort={handleSort}>Payment Status</Th>
                        <Th align="right">Actions</Th>
                    </THead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <SkeletonRows cols={isBranchAdmin ? 6 : 7} rows={5} />
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={isBranchAdmin ? 6 : 7}>
                                    {orders.length === 0 ? (
                                        <EmptyState
                                            icon={<ShoppingCart className="w-7 h-7" />}
                                            title="No orders yet"
                                            description="Create your first order to start tracking bookings."
                                            action={
                                                <button
                                                    onClick={() => { setEditingOrder(null); setIsFormOpen(true); }}
                                                    className={btnPrimary}
                                                >
                                                    <Plus className="w-4 h-4" /> New Order
                                                </button>
                                            }
                                        />
                                    ) : (
                                        <EmptyState
                                            icon={<ShoppingCart className="w-7 h-7" />}
                                            title="Tidak ada hasil"
                                            description={`Tidak ada pesanan yang cocok dengan "${searchQuery}".`}
                                        />
                                    )}
                                </td>
                            </tr>
                        ) : (
                            paginated.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">
                                    <Td>
                                        <div>
                                            <p className="font-semibold text-gray-900">{order.customer_name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{order.customer_phone}</p>
                                        </div>
                                    </Td>
                                    <Td>
                                        <p className="text-gray-900 max-w-[200px] truncate">
                                            {order.packages?.title || '—'}
                                        </p>
                                    </Td>
                                    {!isBranchAdmin && (
                                        <Td>
                                            <p className="text-gray-700 text-sm">{(order as any).branches?.name || <span className="text-gray-400">—</span>}</p>
                                        </Td>
                                    )}
                                    <Td className="text-center">
                                        <p className="font-semibold text-gray-900">{order.participant_count} <span className="font-normal text-gray-400 text-xs">pax</span></p>
                                        <p className="text-xs text-gray-400">{order.room_count_booked} rooms</p>
                                    </Td>
                                    <Td>
                                        <p className="font-semibold text-gray-900">
                                            Rp {order.total_price?.toLocaleString('id-ID') ?? '—'}
                                        </p>
                                    </Td>
                                    <Td>
                                        <StatusBadge status={order.payment_status || 'Unknown'} />
                                    </Td>
                                    <Td className="text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingOrder(order); setIsFormOpen(true); }}
                                                className={btnGhost}
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(order.id)}
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

            {!loading && (
                <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            )}

            {isFormOpen && (
                <OrderForm
                    initialData={editingOrder}
                    onClose={() => { setIsFormOpen(false); setEditingOrder(null); }}
                    onSuccess={() => { setIsFormOpen(false); setEditingOrder(null); setPage(0); fetchOrders(); toast('success', editingOrder ? 'Order updated.' : 'Order created.'); }}
                />
            )}

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Order"
                message="This order and its participants will be permanently deleted. Package quotas may become unbalanced."
                confirmLabel="Delete Order"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleting}
            />
        </div>
    );
};

export default Orders;
