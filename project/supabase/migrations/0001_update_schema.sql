-- Update recipients table: remove las_score
ALTER TABLE public.recipients
DROP COLUMN IF EXISTS las_score;

-- Update donors table: remove available_until and add cold_ischemia_time_hours
ALTER TABLE public.donors
DROP COLUMN IF EXISTS available_until;

ALTER TABLE public.donors
ADD COLUMN IF NOT EXISTS cold_ischemia_time_hours integer;

-- Update the organ_type enum.
-- This requires creating a new type and migrating the columns.
-- 1. Rename the existing type
ALTER TYPE public.organ_type RENAME TO organ_type_old;

-- 2. Create the new type with the correct values
CREATE TYPE public.organ_type AS ENUM ('kidney', 'liver', 'heart');

-- 3. Update columns in 'donors' table to use the new type
ALTER TABLE public.donors ALTER COLUMN organs_available TYPE public.organ_type[] USING (organs_available::text::public.organ_type[]);

-- 4. Update column in 'recipients' table to use the new type
ALTER TABLE public.recipients ALTER COLUMN organ_needed TYPE public.organ_type USING (organ_needed::text::public.organ_type);

-- 5. Drop the old type
DROP TYPE public.organ_type_old;
