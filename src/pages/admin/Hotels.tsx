import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit } from 'lucide-react';

interface Hotel {
    id: string;
    name: string;
    location: string;
    stars: number;
}

const Hotels: React.FC = () => {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [stars, setStars] = useState<number>(3);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('hotels').select('*').order('name');
        if (!error && data) {
            setHotels(data);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            await supabase.from('hotels').update({ name, location: locationInput, stars }).eq('id', editingId);
        } else {
            await supabase.from('hotels').insert([{ name, location: locationInput, stars }]);
        }

        setName('');
        setLocationInput('');
        setStars(3);
        setEditingId(null);
        fetchHotels();
    };

    const handleEdit = (hotel: Hotel) => {
        setEditingId(hotel.id);
        setName(hotel.name);
        setLocationInput(hotel.location);
        setStars(hotel.stars);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this hotel?')) {
            await supabase.from('hotels').delete().eq('id', id);
            fetchHotels();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Hotels Management</h1>
            </div>

            <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 max-w-4xl flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Anjum Hotel"
                    />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="e.g., Makkah"
                    />
                </div>
                <div className="w-24">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stars</label>
                    <input
                        type="number"
                        required
                        min="1" max="5"
                        className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                        value={stars}
                        onChange={(e) => setStars(parseInt(e.target.value))}
                    />
                </div>
                <button type="submit" className="bg-primary hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {editingId ? 'Update' : 'Add'}
                </button>
                {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setName(''); setLocationInput(''); setStars(3); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md">Cancel</button>
                )}
            </form>

            {loading ? (
                <div className="text-gray-500">Loading hotels...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stars</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {hotels.map((hotel) => (
                                <tr key={hotel.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {hotel.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {hotel.location}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {Array.from({ length: hotel.stars }).map((_, i) => (
                                            <span key={i} className="text-yellow-400">★</span>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(hotel)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(hotel.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {hotels.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No hotels found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Hotels;
