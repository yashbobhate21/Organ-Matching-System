-- Create the 'gender_type' enum if it does not already exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE public.gender_type AS ENUM ('male', 'female');
    END IF;
END$$;

-- Add the 'gender' column to the 'donors' table if it does not exist.
ALTER TABLE public.donors
ADD COLUMN IF NOT EXISTS gender public.gender_type;

-- Add the 'gender' column to the 'recipients' table if it does not exist.
ALTER TABLE public.recipients
ADD COLUMN IF NOT EXISTS gender public.gender_type;

-- Add the 'cold_ischemia_time_hours' column to the 'donors' table if it does not exist.
ALTER TABLE public.donors
ADD COLUMN IF NOT EXISTS cold_ischemia_time_hours integer;
