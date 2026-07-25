import { supabase } from '@/src/lib/supabase';
import type { Agent, AgentType } from '@/types';

export const agentService = {
  async getAgents() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Agent[];
  },

  async createAgent(agent: Omit<Agent, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('agents')
      .insert([agent])
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  async updateAgent(id: string, agent: Partial<Omit<Agent, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('agents')
      .update(agent)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  async deleteAgent(id: string) {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
