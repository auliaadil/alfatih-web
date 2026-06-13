import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Clock, Trash2, Map, Save, X, MessageCircle } from 'lucide-react';
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, StatusBadge, FormField, textareaClass, btnPrimary, btnSecondary, btnGhost,
    useToast, SearchInput, Pagination,
} from '../../components/admin/ui';

const PAGE_SIZE = 10;

const PrivateTrips: React.FC = () => {
    const toast = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);

    useEffect(() => { fetchRequests(); }, []);

    useEffect(() => { setPage(0); }, [searchQuery]);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('private_trip_requests')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setRequests(data);
        setLoading(false);
    };

    const markAsHandled = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'handled' : 'pending';
        await supabase.from('private_trip_requests').update({ status: newStatus }).eq('id', id);
        setPage(0);
        fetchRequests();
        if (selectedRequest?.id === id) {
            setSelectedRequest((prev: any) => prev ? { ...prev, status: newStatus } : null);
        }
        toast('success', newStatus === 'handled' ? 'Marked as handled.' : 'Marked as pending.');
    };

    const saveNotes = async () => {
        if (!selectedRequest) return;
        setSavingNotes(true);
        const { error } = await supabase
            .from('private_trip_requests')
            .update({ admin_notes: notes })
            .eq('id', selectedRequest.id);
        setSavingNotes(false);
        if (error) {
            toast('error', 'Failed to save notes.');
        } else {
            toast('success', 'Notes saved.');
            fetchRequests();
            setSelectedRequest({ ...selectedRequest, admin_notes: notes });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const { error } = await supabase.from('private_trip_requests').delete().eq('id', deleteId);
        setDeleting(false);
        setDeleteId(null);
        if (error) {
            toast('error', 'Failed to delete request.');
        } else {
            toast('success', 'Request deleted.');
            if (selectedRequest?.id === deleteId) setSelectedRequest(null);
            setPage(0);
            fetchRequests();
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const filtered = requests.filter((r) =>
        [r.name, r.phone, r.destination, r.email].some((f) =>
            (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div>
            <PageHeader
                title="Private Trip Requests"
                badge={requests.length}
                subtitle={pendingCount > 0 ? `${pendingCount} pending follow-up` : 'All caught up!'}
                breadcrumbs={[{ label: 'Operations' }, { label: 'Private Trips' }]}
            />

            <div className="mb-4">
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari nama, tujuan..." />
            </div>

            <TableCard>
                <table className="min-w-full">
                    <THead>
                        <Th>Submitter</Th>
                        <Th>Trip Details</Th>
                        <Th>Budget</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </THead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <SkeletonRows cols={5} rows={5} />
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    {requests.length === 0 ? (
                                        <EmptyState
                                            icon={<Map className="w-7 h-7" />}
                                            title="No private trip requests yet"
                                            description="Requests from the public AI planner will appear here."
                                        />
                                    ) : (
                                        <EmptyState
                                            icon={<Map className="w-7 h-7" />}
                                            title="Tidak ada hasil"
                                            description={`Tidak ada permintaan yang cocok dengan "${searchQuery}".`}
                                        />
                                    )}
                                </td>
                            </tr>
                        ) : (
                            paginated.map((req) => (
                                <tr
                                    key={req.id}
                                    onClick={() => { setSelectedRequest(req); setNotes(req.admin_notes || ''); }}
                                    className={`cursor-pointer hover:bg-gray-50/60 transition-colors group ${req.status === 'handled' ? 'opacity-60' : ''}`}
                                >
                                    <Td>
                                        <p className="font-semibold text-gray-900">{req.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{req.phone}</p>
                                        {req.email && <p className="text-xs text-primary mt-0.5">{req.email}</p>}
                                    </Td>
                                    <Td>
                                        <p className="font-medium text-gray-900 line-clamp-1">{req.destination}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{req.dates}</p>
                                        <p className="text-xs text-gray-400">{req.pax_count} Pax</p>
                                    </Td>
                                    <Td>
                                        <p className="font-medium text-emerald-700">{req.budget}</p>
                                    </Td>
                                    <Td>
                                        <StatusBadge status={req.status === 'pending' ? 'Pending' : 'Handled'} />
                                    </Td>
                                    <Td className="text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => markAsHandled(req.id, req.status)}
                                                className={`inline-flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${req.status === 'pending'
                                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                                    : 'text-gray-400 hover:bg-gray-100'
                                                }`}
                                                title={req.status === 'pending' ? 'Mark handled' : 'Unmark'}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(req.id)}
                                                className="inline-flex items-center px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Detail Slide-Over */}
            <SlideOver
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Request Details"
                subtitle={selectedRequest?.name}
                width="lg"
                footer={
                    <div className="flex items-center gap-3">
                        <button onClick={saveNotes} disabled={savingNotes} className={btnPrimary}>
                            <Save className="w-4 h-4" />
                            {savingNotes ? 'Saving...' : 'Save Notes'}
                        </button>
                        <button
                            onClick={() => selectedRequest && markAsHandled(selectedRequest.id, selectedRequest.status)}
                            className={btnSecondary}
                        >
                            {selectedRequest?.status === 'pending' ? (
                                <><CheckCircle className="w-4 h-4 text-emerald-500" /> Mark Handled</>
                            ) : (
                                <><Clock className="w-4 h-4 text-amber-500" /> Mark Pending</>
                            )}
                        </button>
                    </div>
                }
            >
                {selectedRequest && (
                    <div className="space-y-6">
                        {/* Customer info */}
                        <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Customer</p>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{selectedRequest.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">📞 {selectedRequest.phone || '—'}</p>
                                    {selectedRequest.email && <p className="text-sm text-primary mt-0.5">✉️ {selectedRequest.email}</p>}
                                </div>
                                <StatusBadge status={selectedRequest.status === 'pending' ? 'Pending' : 'Handled'} />
                            </div>
                            {selectedRequest.phone && (
                                <a
                                    href={`https://wa.me/${selectedRequest.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Chat on WhatsApp
                                </a>
                            )}
                        </div>

                        {/* Trip specs */}
                        <div className="rounded-2xl border border-gray-200 p-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Trip Specifications</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Destination</p>
                                    <p className="font-semibold text-gray-900">{selectedRequest.destination || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Dates</p>
                                    <p className="font-semibold text-gray-900">{selectedRequest.dates || (selectedRequest.days ? `${selectedRequest.days} Hari` : '—')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Travelers</p>
                                    <p className="font-semibold text-gray-900">{selectedRequest.pax_count ? `${selectedRequest.pax_count} Pax` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Budget</p>
                                    <p className="font-semibold text-emerald-700">{selectedRequest.budget || '—'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        {selectedRequest.special_requirements && (
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Requirements</p>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedRequest.special_requirements}
                                </p>
                            </div>
                        )}

                        {/* Admin notes */}
                        <FormField label="Admin Notes" hint="Internal only — visible to admin team only.">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={5}
                                className={textareaClass}
                                placeholder="Add follow-up notes, quotes offered, conversation history..."
                            />
                        </FormField>
                    </div>
                )}
            </SlideOver>

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Request"
                message="This private trip request will be permanently deleted."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleting}
            />
        </div>
    );
};

export default PrivateTrips;
