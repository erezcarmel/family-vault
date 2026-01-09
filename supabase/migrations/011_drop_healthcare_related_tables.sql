-- Drop healthcare related tables (medications, allergies, conditions, emergency contacts)
-- These tables are no longer needed as we've removed this functionality from the healthcare section

DROP TABLE IF EXISTS public.healthcare_emergency_contacts CASCADE;
DROP TABLE IF EXISTS public.healthcare_conditions CASCADE;
DROP TABLE IF EXISTS public.healthcare_allergies CASCADE;
DROP TABLE IF EXISTS public.healthcare_medications CASCADE;

