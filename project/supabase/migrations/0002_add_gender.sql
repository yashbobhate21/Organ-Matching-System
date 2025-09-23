-- Create a gender enum type
CREATE TYPE public.gender_type AS ENUM ('male', 'female');

-- Add gender column to donors table
ALTER TABLE public.donors
ADD COLUMN gender public.gender_type;

-- Add gender column to recipients table
ALTER TABLE public.recipients
ADD COLUMN gender public.gender_type;
