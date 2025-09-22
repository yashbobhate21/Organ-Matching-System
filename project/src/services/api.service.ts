import { supabase } from '../lib/supabase';
import { Donor, Recipient, Allocation, MatchResult } from '../types';
import { matchingService } from './matching.service';

class ApiService {
  // Donor operations
  async getDonors(): Promise<Donor[]> {
    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createDonor(donor: Omit<Donor, 'id' | 'created_at' | 'updated_at'>): Promise<Donor> {
    const { data, error } = await supabase
      .from('donors')
      .insert(donor)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDonor(id: string, updates: Partial<Donor>): Promise<Donor> {
    const { data, error } = await supabase
      .from('donors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDonor(id: string): Promise<void> {
    const { error } = await supabase
      .from('donors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Recipient operations
  async getRecipients(): Promise<Recipient[]> {
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .order('urgency_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createRecipient(recipient: Omit<Recipient, 'id' | 'created_at' | 'updated_at'>): Promise<Recipient> {
    const { data, error } = await supabase
      .from('recipients')
      .insert(recipient)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRecipient(id: string, updates: Partial<Recipient>): Promise<Recipient> {
    const { data, error } = await supabase
      .from('recipients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRecipient(id: string): Promise<void> {
    const { error } = await supabase
      .from('recipients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Allocation operations
  async getAllocations(): Promise<(Allocation & { donor: Donor, recipient: Recipient })[]> {
    const { data, error } = await supabase
      .from('allocations')
      .select(`
        *,
        donor:donors(*),
        recipient:recipients(*)
      `)
      .order('allocated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createAllocation(allocation: Omit<Allocation, 'id' | 'created_at'>): Promise<Allocation> {
    const { data, error } = await supabase
      .from('allocations')
      .insert(allocation)
      .select()
      .single();

    if (error) throw error;

    // Update donor and recipient status
    await this.updateDonorStatus(allocation.donor_id, 'allocated');
    await this.updateRecipientStatus(allocation.recipient_id, 'transplanted');

    return data;
  }

  async updateAllocation(id: string, updates: Partial<Allocation>): Promise<Allocation> {
    const { data, error } = await supabase
      .from('allocations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAllocation(id: string): Promise<void> {
    // Get allocation details first
    const { data: allocation, error: fetchError } = await supabase
      .from('allocations')
      .select('donor_id, recipient_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete allocation
    const { error } = await supabase
      .from('allocations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Restore donor and recipient status
    await this.updateDonorStatus(allocation.donor_id, 'available');
    await this.updateRecipientStatus(allocation.recipient_id, 'active');
  }

  // Matching operations
  async findMatches(donorId: string): Promise<MatchResult[]> {
    const [donors, recipients] = await Promise.all([
      this.getDonors(),
      this.getRecipients()
    ]);

    const donor = donors.find(d => d.id === donorId);
    if (!donor) throw new Error('Donor not found');

    const activeRecipients = recipients.filter(r => r.status === 'active');
    return matchingService.findMatches(donor, activeRecipients);
  }

  // Dashboard statistics
  async getDashboardStats() {
    const [donorsResult, recipientsResult, allocationsResult] = await Promise.all([
      supabase.from('donors').select('status', { count: 'exact' }),
      supabase.from('recipients').select('status', { count: 'exact' }),
      supabase.from('allocations').select('status', { count: 'exact' })
    ]);

    const donorsByStatus = await supabase
      .from('donors')
      .select('status')
      .then(({ data }) => {
        const counts = { available: 0, allocated: 0, expired: 0, declined: 0 };
        data?.forEach(d => counts[d.status]++);
        return counts;
      });

    const recipientsByStatus = await supabase
      .from('recipients')
      .select('status')
      .then(({ data }) => {
        const counts = { active: 0, transplanted: 0, removed: 0, deceased: 0 };
        data?.forEach(r => counts[r.status]++);
        return counts;
      });

    const urgentRecipients = await supabase
      .from('recipients')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .gte('urgency_score', 7);

    return {
      total_donors: donorsResult.count || 0,
      total_recipients: recipientsResult.count || 0,
      total_allocations: allocationsResult.count || 0,
      urgent_recipients: urgentRecipients.count || 0,
      donors_by_status: donorsByStatus,
      recipients_by_status: recipientsByStatus,
    };
  }

  private async updateDonorStatus(id: string, status: Donor['status']) {
    await supabase
      .from('donors')
      .update({ status })
      .eq('id', id);
  }

  private async updateRecipientStatus(id: string, status: Recipient['status']) {
    await supabase
      .from('recipients')
      .update({ status })
      .eq('id', id);
  }
}

export const apiService = new ApiService();