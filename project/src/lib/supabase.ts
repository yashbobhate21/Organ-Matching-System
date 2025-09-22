import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          full_name: string;
          role: 'admin' | 'supervisor';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          full_name: string;
          role?: 'admin' | 'supervisor';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          full_name?: string;
          role?: 'admin' | 'supervisor';
          created_at?: string;
          updated_at?: string;
        };
      };
      donors: {
        Row: {
          id: string;
          name: string;
          age: number;
          blood_type: string;
          organs_available: string[];
          hla_typing: Record<string, any>;
          medical_history: string;
          height_cm: number | null;
          weight_kg: number | null;
          cause_of_death: string | null;
          available_until: string;
          status: 'available' | 'allocated' | 'expired' | 'declined';
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          age: number;
          blood_type: string;
          organs_available?: string[];
          hla_typing?: Record<string, any>;
          medical_history?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          cause_of_death?: string | null;
          available_until: string;
          status?: 'available' | 'allocated' | 'expired' | 'declined';
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          age?: number;
          blood_type?: string;
          organs_available?: string[];
          hla_typing?: Record<string, any>;
          medical_history?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          cause_of_death?: string | null;
          available_until?: string;
          status?: 'available' | 'allocated' | 'expired' | 'declined';
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipients: {
        Row: {
          id: string;
          name: string;
          age: number;
          blood_type: string;
          organ_needed: string;
          hla_typing: Record<string, any>;
          urgency_score: number;
          medical_history: string;
          height_cm: number | null;
          weight_kg: number | null;
          meld_score: number | null;
          las_score: number | null;
          unos_status: string | null;
          time_on_list: string;
          status: 'active' | 'transplanted' | 'removed' | 'deceased';
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          age: number;
          blood_type: string;
          organ_needed: string;
          hla_typing?: Record<string, any>;
          urgency_score?: number;
          medical_history?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          meld_score?: number | null;
          las_score?: number | null;
          unos_status?: string | null;
          time_on_list?: string;
          status?: 'active' | 'transplanted' | 'removed' | 'deceased';
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          age?: number;
          blood_type?: string;
          organ_needed?: string;
          hla_typing?: Record<string, any>;
          urgency_score?: number;
          medical_history?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          meld_score?: number | null;
          las_score?: number | null;
          unos_status?: string | null;
          time_on_list?: string;
          status?: 'active' | 'transplanted' | 'removed' | 'deceased';
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      allocations: {
        Row: {
          id: string;
          donor_id: string;
          recipient_id: string;
          organ_type: string;
          match_score: number;
          risk_level: 'low' | 'medium' | 'high';
          risk_percentage: number | null;
          urgency_level: 'routine' | 'urgent' | 'critical';
          compatibility_factors: Record<string, any>;
          allocated_at: string;
          transplant_scheduled: string | null;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes: string | null;
          allocated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          donor_id: string;
          recipient_id: string;
          organ_type: string;
          match_score: number;
          risk_level: 'low' | 'medium' | 'high';
          risk_percentage?: number | null;
          urgency_level: 'routine' | 'urgent' | 'critical';
          compatibility_factors?: Record<string, any>;
          allocated_at?: string;
          transplant_scheduled?: string | null;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes?: string | null;
          allocated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          donor_id?: string;
          recipient_id?: string;
          organ_type?: string;
          match_score?: number;
          risk_level?: 'low' | 'medium' | 'high';
          risk_percentage?: number | null;
          urgency_level?: 'routine' | 'urgent' | 'critical';
          compatibility_factors?: Record<string, any>;
          allocated_at?: string;
          transplant_scheduled?: string | null;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes?: string | null;
          allocated_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
};