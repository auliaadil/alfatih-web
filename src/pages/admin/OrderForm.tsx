import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Trash2, Edit } from 'lucide-react';

interface ParticipantDraft {
    id?: string;
    name: string;
    identity_number: string;
    passport_number: string;
    phone: string;
    address: string;
    room_type: string;
}

interface OrderFormProps {
    initialData?: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ initialData, onClose, onSuccess }) => {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Form State
    const [selectedPackageId, setSelectedPackageId] = useState(initialData?.package_id || '');
    const [customerName, setCustomerName] = useState(initialData?.customer_name || '');
    const [customerPhone, setCustomerPhone] = useState(initialData?.customer_phone || '');
    const [customerEmail, setCustomerEmail] = useState(initialData?.customer_email || '');
    const [paymentStatus, setPaymentStatus] = useState(initialData?.payment_status || 'Down Payment');
    const [notes, setNotes] = useState(initialData?.notes || '');

    // Dynamic Breakdown State
    const [roomBreakdown, setRoomBreakdown] = useState<any[]>([]);

    // Participants State Manager
    const [participants, setParticipants] = useState<ParticipantDraft[]>(initialData?.participants || []);
    const [deletedParticipantIds, setDeletedParticipantIds] = useState<string[]>([]);

    // Inline Participant Form State
    const [isParticipantFormOpen, setIsParticipantFormOpen] = useState(false);
    const [editingParticipantIndex, setEditingParticipantIndex] = useState<number | null>(null);
    const [pName, setPName] = useState('');
    const [pIdentity, setPIdentity] = useState('');
    const [pPassport, setPPassport] = useState('');
    const [pPhone, setPPhone] = useState('');
    const [pAddress, setPAddress] = useState('');
    const [pRoomType, setPRoomType] = useState('');

    useEffect(() => {
        const loadPackages = async () => {
            const { data } = await supabase.from('packages').select('id, title, room_options, quotas, available_rooms');
            if (data) {
                setPackages(data);
            }
            setLoading(false);
        };
        loadPackages();
    }, []);

    // When package changes, setup the breakdown inputs
    useEffect(() => {
        if (selectedPackageId && packages.length > 0) {
            const pkg = packages.find(p => p.id === selectedPackageId);
            if (pkg && pkg.room_options) {
                const mappedBreakdown = pkg.room_options.map((opt: any) => {
                    const isOriginalPackage = selectedPackageId === initialData?.package_id;
                    const existing = isOriginalPackage ? initialData?.room_breakdown?.find((b: any) => b.room_type === opt.name) : null;
                    return {
                        room_type: opt.name,
                        price_per_pax: opt.price,
                        capacity: opt.capacity,
                        pax_booked: existing ? existing.pax_booked : 0,
                        rooms_booked: existing ? existing.rooms_booked : 0
                    };
                });
                setRoomBreakdown(mappedBreakdown);
            } else {
                setRoomBreakdown([]);
            }
        }
    }, [selectedPackageId, packages]);

    const handleBreakdownChange = (index: number, field: string, value: number) => {
        const updated = [...roomBreakdown];
        updated[index] = { ...updated[index], [field]: value };
        setRoomBreakdown(updated);
    };

    const totalPax = roomBreakdown.reduce((sum, item) => sum + (Number(item.pax_booked) || 0), 0);
    const totalRooms = roomBreakdown.reduce((sum, item) => sum + (Number(item.rooms_booked) || 0), 0);
    const totalPrice = roomBreakdown.reduce((sum, item) => sum + ((Number(item.pax_booked) || 0) * (Number(item.price_per_pax) || 0)), 0);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');

        if (totalPax === 0) {
            setErrorMsg("You must book at least 1 pax.");
            setSaving(false);
            return;
        }

        const pkg = packages.find(p => p.id === selectedPackageId);
        if (pkg) {
            if (totalPax > pkg.quotas) {
                setErrorMsg(`Cannot exceed package quotas. Available: ${pkg.quotas}`);
                setSaving(false);
                return;
            }
            if (totalRooms > pkg.available_rooms) {
                setErrorMsg(`Cannot exceed available physical rooms. Available: ${pkg.available_rooms}`);
                setSaving(false);
                return;
            }
        }

        const payload = {
            package_id: selectedPackageId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            room_breakdown: roomBreakdown.filter(b => b.pax_booked > 0),
            room_count_booked: totalRooms,
            participant_count: totalPax,
            total_price: totalPrice,
            payment_status: paymentStatus,
            notes
        };

        let error;
        let savedOrderId = initialData?.id;

        if (initialData) {
            const { error: updateError } = await supabase.from('orders').update(payload).eq('id', savedOrderId);
            error = updateError;
        } else {
            const { data: newOrder, error: insertError } = await supabase.from('orders').insert([payload]).select().single();
            error = insertError;
            if (newOrder) savedOrderId = newOrder.id;
        }

        if (error) {
            setErrorMsg(error.message);
            setSaving(false);
            return;
        }

        // Handle Participants Sync
        if (savedOrderId) {
            // 1. Delete removed participants
            if (deletedParticipantIds.length > 0) {
                const { error: deleteError } = await supabase.from('participants').delete().in('id', deletedParticipantIds);
                if (deleteError) console.error("Failed to delete participants:", deleteError);
            }

            // 2. Upsert active participants
            if (participants.length > 0) {
                const partsPayload = participants.map(p => ({
                    ...(p.id ? { id: p.id } : {}), // only include ID if it exists (update)
                    order_id: savedOrderId,
                    name: p.name,
                    identity_number: p.identity_number,
                    passport_number: p.passport_number,
                    phone: p.phone,
                    address: p.address,
                    room_type: p.room_type
                }));

                const { error: upsertError } = await supabase.from('participants').upsert(partsPayload);
                if (upsertError) {
                    setErrorMsg("Order saved, but failed to sync participants: " + upsertError.message);
                    setSaving(false);
                    return;
                }
            }
        }

        setSaving(false);
        onSuccess();
    };

    const handleOpenParticipantForm = (index: number | null = null) => {
        setEditingParticipantIndex(index);
        if (index !== null) {
            const p = participants[index];
            setPName(p.name);
            setPIdentity(p.identity_number);
            setPPassport(p.passport_number);
            setPPhone(p.phone);
            setPAddress(p.address);
            setPRoomType(p.room_type);
        } else {
            setPName('');
            setPIdentity('');
            setPPassport('');
            setPPhone('');
            setPAddress('');
            setPRoomType('');
        }
        setIsParticipantFormOpen(true);
    };

    const handleSaveParticipant = () => {
        if (!pName || !pRoomType) {
            alert("Name and Room Type are required");
            return;
        }

        const draft: ParticipantDraft = {
            id: editingParticipantIndex !== null ? participants[editingParticipantIndex].id : undefined,
            name: pName,
            identity_number: pIdentity,
            passport_number: pPassport,
            phone: pPhone,
            address: pAddress,
            room_type: pRoomType
        };

        const updated = [...participants];
        if (editingParticipantIndex !== null) {
            updated[editingParticipantIndex] = draft;
        } else {
            updated.push(draft);
        }

        setParticipants(updated);
        setIsParticipantFormOpen(false);
    };

    const handleRemoveParticipant = (index: number) => {
        const p = participants[index];
        if (p.id) {
            setDeletedParticipantIds([...deletedParticipantIds, p.id]);
        }
        const updated = [...participants];
        updated.splice(index, 1);
        setParticipants(updated);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{initialData ? 'Edit Order' : 'Create New Order'}</h2>

                    {errorMsg && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 text-sm">
                            {errorMsg}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-gray-500">Loading configurations...</div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-6">

                            <div className="bg-gray-50 p-6 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Package</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                                    value={selectedPackageId}
                                    onChange={(e) => setSelectedPackageId(e.target.value)}
                                >
                                    <option value="" disabled>-- Select a Package --</option>
                                    {packages.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.title} (Quotas: {p.quotas} | Rooms: {p.available_rooms})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Rep)</label>
                                    <input type="text" required className="w-full px-4 py-2 border rounded-md" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp/Phone</label>
                                    <input type="text" required className="w-full px-4 py-2 border rounded-md" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <input type="email" className="w-full px-4 py-2 border rounded-md" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                    <select required className="w-full px-4 py-2 border rounded-md" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                                        <option value="Down Payment">Down Payment</option>
                                        <option value="Payment term 1">Payment term 1</option>
                                        <option value="Payment term 2">Payment term 2</option>
                                        <option value="Payment term 3">Payment term 3</option>
                                        <option value="Paid in Full">Paid in Full</option>
                                    </select>
                                </div>
                            </div>

                            {selectedPackageId && roomBreakdown.length > 0 && (
                                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-lg space-y-4">
                                    <h3 className="font-semibold text-emerald-900">Dynamic Room Configuration</h3>
                                    <p className="text-sm text-emerald-700">Specify exactly how many pax are booking which rooms.</p>

                                    <div className="space-y-3 mt-4">
                                        {roomBreakdown.map((room, i) => (
                                            <div key={i} className="flex gap-4 items-center bg-white p-4 rounded-md shadow-sm">
                                                <div className="w-32 font-medium text-gray-900">{room.room_type}</div>
                                                <div className="text-gray-500 text-sm">Rp{(room.price_per_pax || 0).toLocaleString()}/pax</div>
                                                <div className="flex-1 flex justify-end gap-4 items-center">
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Pax Booked</label>
                                                        <input type="number" min="0" className="w-20 px-2 py-1 border rounded text-right" value={room.pax_booked} onChange={e => handleBreakdownChange(i, 'pax_booked', Number(e.target.value))} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Rooms Needed</label>
                                                        <input type="number" min="0" className="w-20 px-2 py-1 border rounded text-right" value={room.rooms_booked} onChange={e => handleBreakdownChange(i, 'rooms_booked', Number(e.target.value))} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-end border-t border-emerald-200 pt-4 mt-6">
                                        <div className="text-sm text-emerald-800">
                                            Total: <strong>{totalPax}</strong> Pax across <strong>{totalRooms}</strong> Rooms
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-1">Total Calculated Price</div>
                                            <div className="text-2xl font-bold text-emerald-900">Rp {totalPrice.toLocaleString('id-ID')}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                                <textarea rows={2} className="w-full px-4 py-2 border rounded-md" value={notes} onChange={e => setNotes(e.target.value)} />
                            </div>

                            {/* Embedded Participants Section */}
                            <div className="border-t pt-8 mt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Participants List</h3>
                                        <p className="text-sm text-gray-500">Add individuals to this order and assign their room types.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenParticipantForm(null)}
                                        disabled={!selectedPackageId || roomBreakdown.length === 0}
                                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Participant
                                    </button>
                                </div>

                                {participants.length > 0 ? (
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name & Contact</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Manage</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {participants.map((p, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-sm">
                                                            <div className="font-bold text-gray-900">{p.name}</div>
                                                            <div className="text-gray-500">{p.phone || '-'}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-500">
                                                            <div>ID: {p.identity_number || '-'}</div>
                                                            <div>Pass: {p.passport_number || '-'}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="bg-amber-50 text-amber-800 px-2 py-1 rounded-md font-medium text-xs">
                                                                {p.room_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button type="button" onClick={() => handleOpenParticipantForm(idx)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button type="button" onClick={() => handleRemoveParticipant(idx)} className="text-red-600 hover:text-red-900">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm">
                                        No participants added to this order yet.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4 gap-4 border-t">
                                <button type="button" onClick={onClose} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving || !selectedPackageId} className="bg-primary hover:bg-emerald-700 text-white px-8 py-2 rounded-md font-medium shadow-sm disabled:opacity-70">
                                    {saving ? 'Processing...' : (initialData ? 'Update Order' : 'Create Order')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Inline Participant Modal Overlay */}
            {isParticipantFormOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
                            <h3 className="text-lg font-bold text-gray-900">{editingParticipantIndex !== null ? 'Edit Participant' : 'Add Participant'}</h3>
                            <button type="button" onClick={() => setIsParticipantFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" className="w-full px-3 py-2 border mb-1 rounded-md" value={pName} onChange={e => setPName(e.target.value)} placeholder="Legal Name" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input type="text" className="w-full px-3 py-2 border mb-1 rounded-md" value={pPhone} onChange={e => setPPhone(e.target.value)} placeholder="+62..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                                    <select className="w-full px-3 py-2 border mb-1 rounded-md bg-white" value={pRoomType} onChange={e => setPRoomType(e.target.value)}>
                                        <option value="" disabled>Select Room</option>
                                        {roomBreakdown.map((r, i) => (
                                            <option key={i} value={r.room_type}>{r.room_type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Identity (NIK)</label>
                                    <input type="text" className="w-full px-3 py-2 border mb-1 rounded-md" value={pIdentity} onChange={e => setPIdentity(e.target.value)} placeholder="16 Digit NIK" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Passport</label>
                                    <input type="text" className="w-full px-3 py-2 border mb-1 rounded-md" value={pPassport} onChange={e => setPPassport(e.target.value)} placeholder="A..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea rows={2} className="w-full px-3 py-2 border mb-1 rounded-md" value={pAddress} onChange={e => setPAddress(e.target.value)} placeholder="Full Address" />
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                            <button type="button" onClick={() => setIsParticipantFormOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                            <button type="button" onClick={handleSaveParticipant} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium">Save to Manifest</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderForm;
