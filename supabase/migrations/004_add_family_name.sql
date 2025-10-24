-- Add family_name column to families table
ALTER TABLE public.families
ADD COLUMN IF NOT EXISTS family_name TEXT;

-- Update existing families to have a default family name based on main_user
UPDATE public.families
SET family_name = main_user || '''s'
WHERE family_name IS NULL;

