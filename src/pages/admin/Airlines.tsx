import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit } from 'lucide-react';

interface Airline {
    id: string;
    name: string;
    logo_url: string | null;
}

const Airlines: React.FC = () => {
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchAirlines();
    }, []);

    const fetchAirlines = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('airlines').select('*').order('name');
        if (!error && data) {
            setAirlines(data);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            await supabase.from('airlines').update({ name, logo_url: logoUrl || null }).eq('id', editingId);
        } else {
            await supabase.from('airlines').insert([{ name, logo_url: logoUrl || null }]);
        }

        setName('');
        setLogoUrl('');
        setEditingId(null);
        fetchAirlines();
    };

    const handleEdit = (airline: Airline) => {
        setEditingId(airline.id);
        setName(airline.name);
        setLogoUrl(airline.logo_url || '');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this airline?')) {
            await supabase.from('airlines').delete().eq('id', id);
            fetchAirlines();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Airlines Management</h1>
            </div>

            <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 max-w-2xl flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Airline Name</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
                    <input
                        type="url"
                        className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                    />
                </div>
                <button type="submit" className="bg-primary hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {editingId ? 'Update' : 'Add'}
                </button>
                {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setName(''); setLogoUrl(''); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md">Cancel</button>
                )}
            </form>

            {loading ? (
                <div className="text-gray-500">Loading airlines...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {airlines.map((airline) => (
                                <tr key={airline.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {airline.logo_url ? (
                                            <img src={airline.logo_url} alt={airline.name} className="h-8 max-w-xs object-contain" />
                                        ) : (
                                            <span className="text-gray-400 italic text-sm">No logo</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {airline.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(airline)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(airline.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {airlines.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No airlines found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Airlines;
