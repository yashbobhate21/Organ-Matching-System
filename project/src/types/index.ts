import { ReactNode } from "react";

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'supervisor';
  created_at: string;
  updated_at: string;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type OrganType = 'kidney' | 'liver' | 'heart';

export type UNOSStatus = '1A' | '1B' | '2' | '3' | '4' | '7';

export type Gender = 'male' | 'female';

export interface HlaTyping {
  'HLA-A': string[];
  'HLA-B': string[];
  'HLA-C': string[];
  'HLA-DR': string[];
  'HLA-DQ': string[];
  'HLA-DP': string[];
  [key: string]: string[];
}

export interface BasePerson {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  blood_type: BloodType;
  hla_typing: HlaTyping;
  location: string;
  height_cm: number | null;
  weight_kg: number | null;
  medical_history: string;
  created_at: string;
  updated_at: string;
}

export interface Donor extends BasePerson {
  organs_available: OrganType[];
  cause_of_death: string;
  cold_ischemia_time_hours: number | null;
  status: 'available' | 'matched' | 'unavailable';
}

export interface Recipient extends BasePerson {
  time_on_list: string | number | Date;
  organ_needed: OrganType;
  urgency_score: number;
  meld_score: number | null;
  unos_status: UNOSStatus | null;
  status: 'active' | 'transplanted' | 'inactive';
}

export interface MatchResult {
  viability_window: ReactNode;
  cold_ischemia_time: ReactNode;
  recipient: Recipient;
  match_score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_percentage: number;
  urgency_level: 'routine' | 'urgent' | 'critical';
  compatibility_factors: {
    blood_compatibility: boolean;
    hla_compatibility: number; // Score from 0 to 1
    age_compatibility: boolean;
    size_compatibility: boolean;
    gender_compatibility: boolean;
    urgency_bonus: number;
  };
  viability_window_hours: number;
}

export interface OrganViability {
  kidney: { min: 24, max: 36 };
  heart: { min: 4, max: 6 };
  liver: { min: 8, max: 12 };
}

export interface CompatibilityFactors {
  age_compatibility: any;
  blood_compatibility: boolean;
  hla_compatibility: number; // Assuming it's a percentage (e.g., 0.85 for 85%)
  size_compatibility: boolean;
  urgency_bonus: number;
}

export interface Allocation {
  id: string;
  donor_id: string;
  recipient_id: string;
  organ_type: OrganType;
  match_score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_percentage: number;
  urgency_level: 'routine' | 'urgent' | 'critical';
  compatibility_factors: CompatibilityFactors; // Use the object type here
  allocated_at: string;
  transplant_scheduled: string | null;
  status: 'pending' | 'completed' | 'cancelled' | 'confirmed';
  notes: string | null;
  allocated_by: string | null;
}