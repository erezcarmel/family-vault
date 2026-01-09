-- Remove all healthcare providers from the providers table
DELETE FROM public.providers
WHERE category = 'healthcare';

