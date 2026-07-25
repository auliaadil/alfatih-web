import React, { useState, useEffect } from 'react';
import type { FlightBooking, BookingStatus, Currency, Agent } from '@/types';
import { flightBookingService } from '@/src/services/flightBookingService';
import { agentService } from '@/src/services/agentService';
import { supabase } from '@/src/lib/supabase';
import { useToast, btnPrimary, btnSecondary, FormField, inputClass, selectClass } from './ui';
import { BookingAttachmentList } from './BookingAttachmentList';

interface FlightBookingFormProps {
    booking?: FlightBooking | null;
    onSave: (booking: FlightBooking) => void;
    onCancel: () => void;
}

export const FlightBookingForm: React.FC<FlightBookingFormProps> = ({ booking, onSave, onCancel }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [airlineId, setAirlineId] = useState('');
    const [agentId, setAgentId] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [flightRoute, setFlightRoute] = useState('');
    const [paxes, setPaxes] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState<Currency>('IDR');
    const [status, setStatus] = useState<BookingStatus>('Planned');

    // Reference data
    const [airlines, setAirlines] = useState<{id: string; name: string}[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loadingRefs, setLoadingRefs] = useState(true);

    useEffect(() => {
        loadReferences();
    }, []);

    useEffect(() => {
        if (booking) {
            setAirlineId(booking.airline_id);
            setAgentId(booking.agent_id || '');
            setDepartureDate(booking.departure_date || '');
            setReturnDate(booking.return_date || '');
            setFlightRoute(booking.flight_route || '');
            setPaxes(booking.paxes?.toString() || '');
            setPrice(booking.price?.toString() || '');
            setCurrency(booking.currency);
            setStatus(booking.status);
        } else {
            setAirlineId('');
            setAgentId('');
            setDepartureDate('');
            setReturnDate('');
            setFlightRoute('');
            setPaxes('');
            setPrice('');
            setCurrency('IDR');
            setStatus('Planned');
        }
    }, [booking]);

    const loadReferences = async () => {
        try {
            const [airlinesRes, agentsRes] = await Promise.all([
                supabase.from('airlines').select('id, name').order('name'),
                agentService.getAgents()
            ]);
            if (airlinesRes.error) throw airlinesRes.error;
            setAirlines(airlinesRes.data || []);
            setAgents(agentsRes || []);
        } catch (err) {
            console.error('Failed to load references:', err);
            toast('error', 'Failed to load airlines and agents');
        } finally {
            setLoadingRefs(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!airlineId) {
            toast('error', 'Please select an airline');
            return;
        }

        setLoading(true);
        try {
            const bookingData = {
                airline_id: airlineId,
                agent_id: agentId || undefined,
                departure_date: departureDate || undefined,
                return_date: returnDate || undefined,
                flight_route: flightRoute || undefined,
                paxes: paxes ? parseInt(paxes) : undefined,
                price: price ? parseFloat(price) : undefined,
                currency,
                status,
            };

            let savedBooking: FlightBooking;
            if (booking) {
                savedBooking = await flightBookingService.updateFlightBooking(booking.id, bookingData);
                toast('success', 'Booking updated successfully');
            } else {
                savedBooking = await flightBookingService.createFlightBooking(bookingData);
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

    return (
        <form id="flight-booking-form" onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Airline" required>
                <select
                    value={airlineId}
                    onChange={e => setAirlineId(e.target.value)}
                    className={selectClass}
                    disabled={loadingRefs}
                >
                    <option value="">Select an airline...</option>
                    {airlines.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
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
                <FormField label="Departure Date">
                    <input
                        type="date"
                        value={departureDate}
                        onChange={e => setDepartureDate(e.target.value)}
                        className={inputClass}
                    />
                </FormField>
                <FormField label="Return Date (Optional)">
                    <input
                        type="date"
                        value={returnDate}
                        onChange={e => setReturnDate(e.target.value)}
                        className={inputClass}
                    />
                </FormField>
            </div>

            <FormField label="Flight Route">
                <input
                    type="text"
                    value={flightRoute}
                    onChange={e => setFlightRoute(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. CGK - JED - CGK"
                />
            </FormField>

            <FormField label="Number of Pax">
                <input
                    type="number"
                    min="1"
                    value={paxes}
                    onChange={e => setPaxes(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 40"
                />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Price">
                    <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className={inputClass}
                        placeholder="e.g. 15000000"
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
                    <BookingAttachmentList bookingId={booking.id} type="flight" />
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
