import React, { useState, useEffect } from 'react';
import type { HotelBooking, BookingStatus, Currency, Agent } from '@/types';
import { hotelBookingService } from '@/src/services/hotelBookingService';
import { agentService } from '@/src/services/agentService';
import { supabase } from '@/src/lib/supabase';
import { useToast, btnPrimary, btnSecondary, FormField, inputClass, selectClass } from './ui';
import { BookingAttachmentList } from './BookingAttachmentList';

interface HotelBookingFormProps {
    booking?: HotelBooking | null;
    onSave: (booking: HotelBooking) => void;
    onCancel: () => void;
}

export const HotelBookingForm: React.FC<HotelBookingFormProps> = ({ booking, onSave, onCancel }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [hotelId, setHotelId] = useState('');
    const [agentId, setAgentId] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [rooms, setRooms] = useState<{ room_type: string; paxes: number }[]>([{ room_type: '', paxes: 1 }]);
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState<Currency>('IDR');
    const [status, setStatus] = useState<BookingStatus>('Planned');

    // Reference data
    const [hotels, setHotels] = useState<{id: string; name: string; location: string}[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loadingRefs, setLoadingRefs] = useState(true);

    useEffect(() => {
        loadReferences();
    }, []);

    useEffect(() => {
        if (booking) {
            setHotelId(booking.hotel_id);
            setAgentId(booking.agent_id || '');
            setCheckIn(booking.check_in_date || '');
            setCheckOut(booking.check_out_date || '');
            setRooms(booking.rooms && booking.rooms.length > 0 ? booking.rooms : [{ room_type: '', paxes: 1 }]);
            setPrice(booking.price?.toString() || '');
            setCurrency(booking.currency);
            setStatus(booking.status);
        } else {
            setHotelId('');
            setAgentId('');
            setCheckIn('');
            setCheckOut('');
            setRooms([{ room_type: '', paxes: 1 }]);
            setPrice('');
            setCurrency('IDR');
            setStatus('Planned');
        }
    }, [booking]);

    const loadReferences = async () => {
        try {
            const [hotelsRes, agentsRes] = await Promise.all([
                supabase.from('hotels').select('id, name, location').order('name'),
                agentService.getAgents()
            ]);
            if (hotelsRes.error) throw hotelsRes.error;
            setHotels(hotelsRes.data || []);
            setAgents(agentsRes || []);
        } catch (err) {
            console.error('Failed to load references:', err);
            toast('error', 'Failed to load hotels and agents');
        } finally {
            setLoadingRefs(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!hotelId) {
            toast('error', 'Please select a hotel');
            return;
        }

        setLoading(true);
        try {
            // Filter out empty rooms
            const validRooms = rooms.filter(r => r.room_type.trim() !== '');

            const bookingData = {
                hotel_id: hotelId,
                agent_id: agentId || undefined,
                check_in_date: checkIn || undefined,
                check_out_date: checkOut || undefined,
                rooms: validRooms,
                price: price ? parseFloat(price) : undefined,
                currency,
                status,
            };

            let savedBooking: HotelBooking;
            if (booking) {
                savedBooking = await hotelBookingService.updateHotelBooking(booking.id, bookingData);
                toast('success', 'Booking updated successfully');
            } else {
                savedBooking = await hotelBookingService.createHotelBooking(bookingData);
                toast('success', 'Booking created successfully');
            }
            onSave(savedBooking);
        } catch (err: any) {
            console.error('Error saving booking:', err);
            toast('error', err.message || 'Failed to save booking');
        } finally {
            setLoading(false);
        }
    };

    const addRoom = () => setRooms(prev => [...prev, { room_type: '', paxes: 1 }]);
    const updateRoom = (i: number, field: 'room_type' | 'paxes', value: string | number) => {
        setRooms(prev => {
            const newRooms = [...prev];
            newRooms[i] = { ...newRooms[i], [field]: value };
            return newRooms;
        });
    };
    const removeRoom = (i: number) => setRooms(prev => prev.filter((_, idx) => idx !== i));

    return (
        <form id="hotel-booking-form" onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Hotel" required>
                <select
                    value={hotelId}
                    onChange={e => setHotelId(e.target.value)}
                    className={selectClass}
                    disabled={loadingRefs}
                >
                    <option value="">Select a hotel...</option>
                    {hotels.map(h => (
                        <option key={h.id} value={h.id}>{h.name} - {h.location}</option>
                    ))}
                </select>
            </FormField>

            <FormField label="Agent / Vendor (Optional)">
                <select
                    value={agentId}
                    onChange={e => setAgentId(e.target.value)}
                    className={selectClass}
                    disabled={loadingRefs}
                >
                    <option value="">No Agent (Direct)</option>
                    {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.name} {a.company ? `(${a.company})` : ''}</option>
                    ))}
                </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Check In">
                    <input
                        type="date"
                        value={checkIn}
                        onChange={e => setCheckIn(e.target.value)}
                        className={inputClass}
                    />
                </FormField>
                <FormField label="Check Out">
                    <input
                        type="date"
                        value={checkOut}
                        onChange={e => setCheckOut(e.target.value)}
                        className={inputClass}
                    />
                </FormField>
            </div>

            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-900">Rooms</label>
                    <button type="button" onClick={addRoom} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                        + Add Room
                    </button>
                </div>
                <div className="space-y-2">
                    {rooms.map((rt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Room Type (e.g., Quad)"
                                className={inputClass + ' flex-1'}
                                value={rt.room_type}
                                onChange={(e) => updateRoom(i, 'room_type', e.target.value)}
                            />
                            <input
                                type="number"
                                min={1}
                                placeholder="Pax"
                                className={inputClass + ' w-24'}
                                value={rt.paxes}
                                onChange={(e) => updateRoom(i, 'paxes', parseInt(e.target.value) || 1)}
                            />
                            <button
                                type="button"
                                onClick={() => removeRoom(i)}
                                className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                    ))}
                    {rooms.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No rooms added. Click "Add Room".</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Price">
                    <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className={inputClass}
                        placeholder="e.g. 5000000"
                    />
                </FormField>
                <FormField label="Currency">
                    <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value as Currency)}
                        className={selectClass}
                    >
                        <option value="IDR">IDR</option>
                        <option value="USD">USD</option>
                    </select>
                </FormField>
            </div>

            <FormField label="Status" required>
                <select
                    value={status}
                    onChange={e => setStatus(e.target.value as BookingStatus)}
                    className={selectClass}
                >
                    <option value="Planned">Planned</option>
                    <option value="Quoted">Quoted</option>
                    <option value="Booked">Booked</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </FormField>

            {/* Attachments Section */}
            {booking?.id ? (
                <div className="pt-4 border-t border-gray-100">
                    <BookingAttachmentList bookingId={booking.id} type="hotel" />
                </div>
            ) : (
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 italic text-center">Save this booking first to attach receipts or invoices.</p>
                </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className={btnSecondary}>
                    Cancel
                </button>
                <button type="submit" disabled={loading} className={btnPrimary}>
                    {loading ? 'Saving...' : 'Save Booking'}
                </button>
            </div>
        </form>
    );
};
