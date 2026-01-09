-- Diagnostic queries to understand why no users were added

-- 1. Check how many family_members have emails
SELECT 
  COUNT(*) as total_members,
  COUNT(email) as members_with_email,
  COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') as members_with_valid_email
FROM public.family_members;

-- 2. Check what emails exist in family_members
SELECT 
  id,
  name,
  email,
  family_id,
  LOWER(TRIM(email)) as normalized_email
FROM public.family_members
WHERE email IS NOT NULL AND email != ''
ORDER BY family_id, name;

-- 3. Check what emails exist in auth.users
SELECT 
  id,
  email,
  LOWER(TRIM(email)) as normalized_email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check if there are any matches between family_members and auth.users
SELECT 
  fm.id as member_id,
  fm.name,
  fm.email as member_email,
  fm.family_id,
  au.id as user_id,
  au.email as user_email,
  CASE 
    WHEN au.id IS NULL THEN 'No matching user found'
    WHEN EXISTS (
      SELECT 1 FROM public.family_users fu
      WHERE fu.family_id = fm.family_id AND fu.user_id = au.id
    ) THEN 'Already exists in family_users'
    ELSE 'Ready to add'
  END as status
FROM public.family_members fm
LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(fm.email))
WHERE fm.email IS NOT NULL AND fm.email != ''
ORDER BY fm.family_id, fm.name;

-- 5. Check current family_users entries
SELECT 
  fu.id,
  fu.family_id,
  fu.user_id,
  fu.role,
  au.email as user_email,
  fm.name as member_name,
  fm.email as member_email
FROM public.family_users fu
LEFT JOIN auth.users au ON au.id = fu.user_id
LEFT JOIN public.family_members fm ON fm.family_id = fu.family_id AND LOWER(TRIM(fm.email)) = LOWER(TRIM(au.email))
ORDER BY fu.family_id, fu.role;

