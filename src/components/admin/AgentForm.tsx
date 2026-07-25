import React, { useState, useEffect } from 'react';
import type { Agent, AgentType } from '@/types';
import { agentService } from '@/src/services/agentService';
import { useToast, btnPrimary, btnSecondary, FormField, inputClass, selectClass } from './ui';

interface AgentFormProps {
    agent?: Agent | null;
    onSave: (agent: Agent) => void;
    onCancel: () => void;
}

export const AgentForm: React.FC<AgentFormProps> = ({ agent, onSave, onCancel }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [agentType, setAgentType] = useState<AgentType>('Person');

    useEffect(() => {
        if (agent) {
            setName(agent.name);
            setCompany(agent.company || '');
            setContactInfo(agent.contact_info || '');
            setAgentType(agent.agent_type);
        } else {
            setName('');
            setCompany('');
            setContactInfo('');
            setAgentType('Person');
        }
    }, [agent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast('error', 'Name is required');
            return;
        }

        setLoading(true);
        try {
            const agentData = {
                name: name.trim(),
                company: company.trim() || undefined,
                contact_info: contactInfo.trim() || undefined,
                agent_type: agentType,
            };

            let savedAgent: Agent;
            if (agent) {
                savedAgent = await agentService.updateAgent(agent.id, agentData);
                toast('success', 'Agent updated successfully');
            } else {
                savedAgent = await agentService.createAgent(agentData);
                toast('success', 'Agent created successfully');
            }
            onSave(savedAgent);
        } catch (err: any) {
            console.error('Error saving agent:', err);
            toast('error', err.message || 'Failed to save agent');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form id="agent-form" onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Name" required>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. John Doe or Trip.com"
                    autoFocus
                />
            </FormField>

            <FormField label="Agent Type" required>
                <select
                    value={agentType}
                    onChange={e => setAgentType(e.target.value as AgentType)}
                    className={selectClass}
                >
                    <option value="Person">Person / Individual</option>
                    <option value="OTA">Online Travel Agency (OTA)</option>
                    <option value="Direct">Direct Vendor</option>
                </select>
            </FormField>

            <FormField label="Company (Optional)">
                <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Pt. Travel Jaya"
                />
            </FormField>

            <FormField label="Contact Info (Optional)">
                <input
                    type="text"
                    value={contactInfo}
                    onChange={e => setContactInfo(e.target.value)}
                    className={inputClass}
                    placeholder="Phone number, email, etc."
                />
            </FormField>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className={btnSecondary}>
                    Cancel
                </button>
                <button type="submit" disabled={loading} className={btnPrimary}>
                    {loading ? 'Saving...' : 'Save Agent'}
                </button>
            </div>
        </form>
    );
};
