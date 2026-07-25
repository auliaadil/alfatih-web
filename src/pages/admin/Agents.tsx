import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Users, Search, Building2, User, Globe2 } from 'lucide-react';
import type { Agent, AgentType } from '@/types';
import { agentService } from '@/src/services/agentService';
import {
    PageHeader, TableCard, THead, Th, Td, btnPrimary, btnGhost,
    SearchInput, SlideOver, ConfirmDialog, SkeletonRows, EmptyState,
    useToast, compareRows, SortState
} from '@/src/components/admin/ui';
import { AgentForm } from '@/src/components/admin/AgentForm';

export default function Agents() {
    const toast = useToast();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
    
    const [formOpen, setFormOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            setLoading(true);
            const data = await agentService.getAgents();
            setAgents(data);
        } catch (err: any) {
            console.error('Failed to load agents:', err);
            toast('error', 'Failed to load agents');
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

    const filteredAgents = useMemo(() => {
        let result = [...agents];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(a => 
                a.name.toLowerCase().includes(q) ||
                (a.company && a.company.toLowerCase().includes(q)) ||
                (a.contact_info && a.contact_info.toLowerCase().includes(q))
            );
        }
        return result.sort((a, b) => compareRows(a, b, sort.key, sort.dir));
    }, [agents, search, sort]);

    const handleSave = (savedAgent: Agent) => {
        setAgents(prev => {
            const exists = prev.find(a => a.id === savedAgent.id);
            if (exists) return prev.map(a => a.id === savedAgent.id ? savedAgent : a);
            return [savedAgent, ...prev];
        });
        setFormOpen(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await agentService.deleteAgent(deleteId);
            setAgents(prev => prev.filter(a => a.id !== deleteId));
            toast('success', 'Agent deleted successfully');
        } catch (err: any) {
            console.error('Failed to delete agent:', err);
            toast('error', 'Failed to delete agent. It might be linked to existing bookings.');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const openCreate = () => {
        setSelectedAgent(null);
        setFormOpen(true);
    };

    const openEdit = (agent: Agent) => {
        setSelectedAgent(agent);
        setFormOpen(true);
    };

    const getAgentTypeIcon = (type: AgentType) => {
        if (type === 'Person') return <User className="w-4 h-4 text-blue-500" />;
        if (type === 'OTA') return <Globe2 className="w-4 h-4 text-emerald-500" />;
        if (type === 'Direct') return <Building2 className="w-4 h-4 text-amber-500" />;
        return <Users className="w-4 h-4 text-gray-400" />;
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <PageHeader
                title="Agents & Vendors"
                subtitle="Manage your booking agents, OTAs, and direct vendors."
                badge={agents.length}
                action={
                    <button onClick={openCreate} className={btnPrimary}>
                        <Plus className="w-4 h-4" /> New Agent
                    </button>
                }
            />

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <SearchInput value={search} onChange={setSearch} placeholder="Search agents..." />
            </div>

            <TableCard>
                <table className="w-full text-left border-collapse">
                    <THead>
                        <Th sortKey="name" currentSort={sort} onSort={handleSort}>Name</Th>
                        <Th sortKey="agent_type" currentSort={sort} onSort={handleSort}>Type</Th>
                        <Th sortKey="company" currentSort={sort} onSort={handleSort}>Company</Th>
                        <Th sortKey="contact_info" currentSort={sort} onSort={handleSort}>Contact</Th>
                        <Th align="right">Actions</Th>
                    </THead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                            <SkeletonRows cols={5} />
                        ) : filteredAgents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12">
                                    <EmptyState
                                        icon={<Users className="w-8 h-8" />}
                                        title={search ? 'No agents found' : 'No agents yet'}
                                        description={search ? 'Try adjusting your search term.' : 'Add your first agent or vendor to start tracking bookings.'}
                                        action={!search ? (
                                            <button onClick={openCreate} className={btnPrimary}>
                                                <Plus className="w-4 h-4" /> New Agent
                                            </button>
                                        ) : undefined}
                                    />
                                </td>
                            </tr>
                        ) : (
                            filteredAgents.map(agent => (
                                <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors">
                                    <Td>
                                        <div className="font-medium text-gray-900">{agent.name}</div>
                                    </Td>
                                    <Td>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
                                            {getAgentTypeIcon(agent.agent_type)}
                                            {agent.agent_type}
                                        </div>
                                    </Td>
                                    <Td>{agent.company || <span className="text-gray-300">—</span>}</Td>
                                    <Td>{agent.contact_info || <span className="text-gray-300">—</span>}</Td>
                                    <Td className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(agent)} className={`${btnGhost} text-xs px-2 py-1`}>
                                                Edit
                                            </button>
                                            <button onClick={() => setDeleteId(agent.id)} className={`${btnGhost} text-red-500 hover:bg-red-50 text-xs px-2 py-1`}>
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
                title={selectedAgent ? 'Edit Agent' : 'New Agent'}
                subtitle={selectedAgent ? 'Update agent details' : 'Add a new agent or vendor'}
                width="sm"
            >
                <AgentForm
                    agent={selectedAgent}
                    onSave={handleSave}
                    onCancel={() => setFormOpen(false)}
                />
            </SlideOver>

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Agent"
                message="Are you sure you want to delete this agent? This action cannot be undone. You will not be able to delete an agent if they are linked to existing bookings."
                confirmLabel="Delete Agent"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleting}
            />
        </div>
    );
}
