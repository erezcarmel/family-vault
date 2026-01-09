-- Simple diagnostic and insert query
-- First, let's see what we're working with:

-- Check matches between family_members and auth.users
SELECT 
  fm.id as member_id,
  fm.name,
  fm.email as member_email,
  fm.family_id,
  au.id as user_id,
  au.email as user_email,
  CASE 
    WHEN au.id IS NULL THEN 'No matching user'
    WHEN EXISTS (
      SELECT 1 FROM public.family_users fu
      WHERE fu.family_id = fm.family_id AND fu.user_id = au.id
    ) THEN 'Already in family_users'
    ELSE 'READY TO ADD'
  END as status
FROM public.family_members fm
LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(fm.email))
WHERE fm.email IS NOT NULL AND fm.email != ''
ORDER BY status, fm.family_id;

-- If you see "READY TO ADD" entries, run this insert:
/*
INSERT INTO public.family_users (family_id, user_id, role)
SELECT DISTINCT
  fm.family_id,
  au.id as user_id,
  'member'::user_role
FROM public.family_members fm
INNER JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(fm.email))
WHERE fm.email IS NOT NULL
  AND fm.email != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.family_users fu
    WHERE fu.family_id = fm.family_id
    AND fu.user_id = au.id
  )
ON CONFLICT (family_id, user_id) DO NOTHING;
*/

