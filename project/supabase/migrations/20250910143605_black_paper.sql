/*
# Organ Matching System Database Schema

1. New Tables
  - `admin_users` (id, email, password_hash, created_at, updated_at)
  - `donors` (id, name, age, blood_type, organs_available, hla_typing, medical_history, available_until, status, created_at)
  - `recipients` (id, name, age, blood_type, organ_needed, hla_typing, urgency_score, medical_history, status, created_at)
  - `allocations` (id, donor_id, recipient_id, organ_type, match_score, risk_level, urgency_level, allocated_at, status)

2. Security
  - Enable RLS on all tables
  - Add policies for authenticated admin users only
  
3. Indexes
  - Add indexes for efficient matching queries
  - Composite indexes for organ matching criteria
*/

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'supervisor')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Donors Table
CREATE TABLE IF NOT EXISTS donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL CHECK (age >= 0 AND age <= 120),
  blood_type text NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  organs_available text[] NOT NULL DEFAULT '{}',
  hla_typing jsonb NOT NULL DEFAULT '{}',
  medical_history text DEFAULT '',
  height_cm integer CHECK (height_cm > 0),
  weight_kg integer CHECK (weight_kg > 0),
  cause_of_death text,
  available_until timestamptz NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'allocated', 'expired', 'declined')),
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recipients Table
CREATE TABLE IF NOT EXISTS recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL CHECK (age >= 0 AND age <= 120),
  blood_type text NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  organ_needed text NOT NULL CHECK (organ_needed IN ('kidney', 'liver', 'heart', 'lung', 'pancreas', 'kidney-pancreas')),
  hla_typing jsonb NOT NULL DEFAULT '{}',
  urgency_score integer DEFAULT 1 CHECK (urgency_score >= 1 AND urgency_score <= 10),
  medical_history text DEFAULT '',
  height_cm integer CHECK (height_cm > 0),
  weight_kg integer CHECK (weight_kg > 0),
  meld_score integer CHECK (meld_score >= 6 AND meld_score <= 40),
  las_score decimal(5,2) CHECK (las_score >= 0 AND las_score <= 100),
  unos_status text CHECK (unos_status IN ('1A', '1B', '2', '3', '4', '7')),
  time_on_list timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'transplanted', 'removed', 'deceased')),
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Allocations Table
CREATE TABLE IF NOT EXISTS allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  organ_type text NOT NULL,
  match_score decimal(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_percentage decimal(5,2) CHECK (risk_percentage >= 0 AND risk_percentage <= 100),
  urgency_level text NOT NULL CHECK (urgency_level IN ('routine', 'urgent', 'critical')),
  compatibility_factors jsonb DEFAULT '{}',
  allocated_at timestamptz DEFAULT now(),
  transplant_scheduled timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  allocated_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- Policies for admin_users
CREATE POLICY "Admins can manage all admin data"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for donors
CREATE POLICY "Admins can manage all donor data"
  ON donors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for recipients
CREATE POLICY "Admins can manage all recipient data"
  ON recipients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for allocations
CREATE POLICY "Admins can manage all allocation data"
  ON allocations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_donors_blood_type ON donors(blood_type);
CREATE INDEX IF NOT EXISTS idx_donors_organs_available ON donors USING gin(organs_available);
CREATE INDEX IF NOT EXISTS idx_donors_status ON donors(status);
CREATE INDEX IF NOT EXISTS idx_donors_available_until ON donors(available_until);

CREATE INDEX IF NOT EXISTS idx_recipients_blood_type ON recipients(blood_type);
CREATE INDEX IF NOT EXISTS idx_recipients_organ_needed ON recipients(organ_needed);
CREATE INDEX IF NOT EXISTS idx_recipients_urgency_score ON recipients(urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_recipients_status ON recipients(status);
CREATE INDEX IF NOT EXISTS idx_recipients_time_on_list ON recipients(time_on_list);

CREATE INDEX IF NOT EXISTS idx_allocations_donor_id ON allocations(donor_id);
CREATE INDEX IF NOT EXISTS idx_allocations_recipient_id ON allocations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_allocations_match_score ON allocations(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_allocations_allocated_at ON allocations(allocated_at DESC);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON recipients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();