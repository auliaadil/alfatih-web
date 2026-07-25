import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Plane, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { FlightBooking } from '@/types';
import { flightBookingService } from '@/src/services/flightBookingService';
import {
    PageHeader, TableCard, THead, Th, Td, btnPrimary, btnSecondary, btnGhost,
    SearchInput, SlideOver, ConfirmDialog, SkeletonRows, EmptyState,
    useToast, compareRows, SortState, StatusBadge, selectClass
} from '@/src/components/admin/ui';
import { FlightBookingForm } from '@/src/components/admin/FlightBookingForm';

export default function FlightBookings() {
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlAirlineId = searchParams.get('airline_id') || '';

    const [bookings, setBookings] = useState<FlightBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [currencyFilter, setCurrencyFilter] = useState('');
    const [airlineFilter, setAirlineFilter] = useState(urlAirlineId);

    // Temp Filters (for SlideOver)
    const [tempStatusFilter, setTempStatusFilter] = useState('');
    const [tempCurrencyFilter, setTempCurrencyFilter] = useState('');
    const [tempAirlineFilter, setTempAirlineFilter] = useState(urlAirlineId);

    const [sort, setSort] = useState<SortState>({ key: 'created_at', dir: 'desc' });
    
    const [formOpen, setFormOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<FlightBooking | null>(null);
    
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadBookings();
    }, []);

    useEffect(() => {
        if (urlAirlineId) setAirlineFilter(urlAirlineId);
    }, [urlAirlineId]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await flightBookingService.getFlightBookings();
            setBookings(data);
        } catch (err: any) {
            console.error('Failed to load flight bookings:', err);
            toast('error', 'Failed to load flight bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: string) => {
        setSort(prev => ({
            key,
            dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredBookings = useMemo(() => {
        let result = [...bookings];
        
        // Filters
        if (statusFilter) result = result.filter(b => b.status === statusFilter);
        if (currencyFilter) result = result.filter(b => b.currency === currencyFilter);
        if (airlineFilter) result = result.filter(b => b.airline_id === airlineFilter);

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(b => 
                (b.airlines?.name?.toLowerCase().includes(q)) ||
                (b.agents?.name?.toLowerCase().includes(q)) ||
                (b.flight_route && b.flight_route.toLowerCase().includes(q))
            );
        }
        return result.sort((a, b) => compareRows(a, b, sort.key, sort.dir));
    }, [bookings, search, sort, statusFilter, currencyFilter, airlineFilter]);

    // Unique airlines for the filter dropdown based on loaded bookings
    const uniqueAirlines = useMemo(() => {
        const map = new Map<string, string>();
        bookings.forEach(b => {
            if (b.airlines && !map.has(b.airline_id)) {
                map.set(b.airline_id, b.airlines.name);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [bookings]);

    const handleSave = (savedBooking: FlightBooking) => {
        setBookings(prev => {
            const exists = prev.find(b => b.id === savedBooking.id);
            if (exists) return prev.map(b => b.id === savedBooking.id ? savedBooking : b);
            return [savedBooking, ...prev];
        });
        setFormOpen(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await flightBookingService.deleteFlightBooking(deleteId);
            setBookings(prev => prev.filter(b => b.id !== deleteId));
            toast('success', 'Booking deleted successfully');
        } catch (err: any) {
            console.error('Failed to delete booking:', err);
            toast('error', 'Failed to delete booking');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const openCreate = () => {
        setSelectedBooking(null);
        setFormOpen(true);
    };

    const openEdit = (booking: FlightBooking) => {
        setSelectedBooking(booking);
        setFormOpen(true);
    };

    const formatPrice = (price?: number, curr?: string) => {
        if (!price) return '—';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: curr || 'IDR' }).format(price);
    };

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

    const openFilters = () => {
        setTempAirlineFilter(airlineFilter);
        setTempStatusFilter(statusFilter);
        setTempCurrencyFilter(currencyFilter);
        setFilterOpen(true);
    };

    const applyFilters = () => {
        setAirlineFilter(tempAirlineFilter);
        setStatusFilter(tempStatusFilter);
        setCurrencyFilter(tempCurrencyFilter);
        
        if (tempAirlineFilter !== urlAirlineId) {
            if (tempAirlineFilter) searchParams.set('airline_id', tempAirlineFilter);
            else searchParams.delete('airline_id');
            setSearchParams(searchParams);
        }
        setFilterOpen(false);
    };

    const resetFilters = () => {
        setTempAirlineFilter('');
        setTempStatusFilter('');
        setTempCurrencyFilter('');
        // We do NOT call applyFilters here, we let the user click "Show Results" to apply
    };

    const activeFiltersCount = (statusFilter ? 1 : 0) + (currencyFilter ? 1 : 0) + (airlineFilter ? 1 : 0);

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <PageHeader
                title="Flight Bookings"
                subtitle="Manage and track your flight inventory and ticket costs."
                badge={filteredBookings.length}
                action={
                    <button onClick={openCreate} className={btnPrimary}>
                        <Plus className="w-4 h-4" /> New Booking
                    </button>
                }
            />

            <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="w-full sm:max-w-md">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search airline or route..." />
                </div>
                
                <div className="flex items-center">
                    <button onClick={openFilters} className={`${btnSecondary} flex items-center gap-2`}>
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                        {activeFiltersCount > 0 && (
                            <span className="bg-primary text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ml-1">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <TableCard>
                <table className="w-full text-left border-collapse">
                    <THead>
                        <Th sortKey="airlines.name" currentSort={sort} onSort={handleSort}>Airline</Th>
                        <Th sortKey="flight_route" currentSort={sort} onSort={handleSort}>Route & Dates</Th>
                        <Th sortKey="paxes" currentSort={sort} onSort={handleSort}>Pax</Th>
                        <Th sortKey="price" currentSort={sort} onSort={handleSort}>Price</Th>
                        <Th sortKey="status" currentSort={sort} onSort={handleSort}>Status</Th>
                        <Th align="right">Actions</Th>
                    </THead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                            <SkeletonRows cols={6} />
                        ) : filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12">
                                    <EmptyState
                                        icon={<Plane className="w-8 h-8" />}
                                        title={bookings.length ? 'No bookings match filters' : 'No flight bookings yet'}
                                        description={bookings.length ? 'Try adjusting your search or filters.' : 'Add your first flight booking to start tracking costs.'}
                                        action={!bookings.length ? (
                                            <button onClick={openCreate} className={btnPrimary}>
                                                <Plus className="w-4 h-4" /> New Booking
                                            </button>
                                        ) : undefined}
                                    />
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map(booking => (
                                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            {booking.airlines?.logo_url ? (
                                                <img src={booking.airlines.logo_url} alt="" className="w-6 h-6 object-contain" />
                                            ) : (
                                                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                                                    <Plane className="w-3 h-3 text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{booking.airlines?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Agent: {booking.agents?.name || 'Direct'}
                                                </div>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="text-gray-900 text-sm">{booking.flight_route || '—'}</div>
                                        <div className="text-gray-500 text-xs mt-0.5">
                                            {formatDate(booking.departure_date)} {booking.return_date ? ` - ${formatDate(booking.return_date)}` : ''}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="text-gray-900 text-sm">{booking.paxes || '—'}</div>
                                    </Td>
                                    <Td>
                                        <div className="font-medium text-gray-900">{formatPrice(booking.price, booking.currency)}</div>
                                    </Td>
                                    <Td>
                                        <StatusBadge status={booking.status} />
                                    </Td>
                                    <Td className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(booking)} className={`${btnGhost} text-xs px-2 py-1`}>
                                                Edit
                                            </button>
                                            <button onClick={() => setDeleteId(booking.id)} className={`${btnGhost} text-red-500 hover:bg-red-50 text-xs px-2 py-1`}>
                                                Delete
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
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                title={selectedBooking ? 'Edit Flight Booking' : 'New Flight Booking'}
                subtitle="Track your flight inventory and costs"
                width="md"
            >
                <FlightBookingForm
                    booking={selectedBooking}
                    onSave={handleSave}
                    onCancel={() => setFormOpen(false)}
                />
            </SlideOver>

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Booking"
                message="Are you sure you want to delete this flight booking? This action cannot be undone."
                confirmLabel="Delete Booking"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleting}
            />

            <SlideOver
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                title="Filter Bookings"
                subtitle="Narrow down flight bookings."
                width="sm"
            >
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Airline</label>
                        <select value={tempAirlineFilter} onChange={e => setTempAirlineFilter(e.target.value)} className={selectClass}>
                            <option value="">All Airlines</option>
                            {uniqueAirlines.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select value={tempStatusFilter} onChange={e => setTempStatusFilter(e.target.value)} className={selectClass}>
                            <option value="">All Statuses</option>
                            <option value="Planned">Planned</option>
                            <option value="Quoted">Quoted</option>
                            <option value="Booked">Booked</option>
                            <option value="Paid">Paid</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select value={tempCurrencyFilter} onChange={e => setTempCurrencyFilter(e.target.value)} className={selectClass}>
                            <option value="">All Currencies</option>
                            <option value="IDR">IDR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>

                    <div className="pt-6 flex gap-3 justify-end">
                        <button 
                            onClick={resetFilters}
                            className={btnSecondary}
                        >
                            Reset
                        </button>
                        <button onClick={applyFilters} className={btnPrimary}>
                            Show Results
                        </button>
                    </div>
                </div>
            </SlideOver>
        </div>
    );
}
