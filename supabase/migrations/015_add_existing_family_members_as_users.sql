-- Diagnostic query: Check what family members have emails and if they match users
-- Run this first to see what data we're working with:
/*
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
WHERE fm.email IS NOT NULL AND fm.email != '';
*/

-- Add existing family members as users with 'member' role
-- This uses a function with SECURITY DEFINER to bypass RLS

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.add_family_members_as_users();

CREATE OR REPLACE FUNCTION public.add_family_members_as_users()
RETURNS TABLE(
  added_count INTEGER, 
  skipped_count INTEGER,
  no_match_count INTEGER,
  total_members_with_email INTEGER
) AS $$
DECLARE
  v_added INTEGER := 0;
  v_skipped INTEGER := 0;
  v_no_match INTEGER := 0;
  v_total INTEGER := 0;
  v_record RECORD;
  v_inserted UUID;
BEGIN
  -- Count total members with email
  SELECT COUNT(*) INTO v_total
  FROM public.family_members
  WHERE email IS NOT NULL AND email != '';
  
  -- Count members with no matching user
  SELECT COUNT(*) INTO v_no_match
  FROM public.family_members fm
  LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(fm.email))
  WHERE fm.email IS NOT NULL 
    AND fm.email != ''
    AND au.id IS NULL;
  
  -- Process matches
  FOR v_record IN
    SELECT DISTINCT
      fm.family_id,
      au.id as user_id,
      fm.email,
      fm.name
    FROM public.family_members fm
    INNER JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(fm.email))
    WHERE fm.email IS NOT NULL
      AND fm.email != ''
      AND NOT EXISTS (
        SELECT 1 FROM public.family_users fu
        WHERE fu.family_id = fm.family_id
        AND fu.user_id = au.id
      )
  LOOP
    BEGIN
      INSERT INTO public.family_users (family_id, user_id, role)
      VALUES (v_record.family_id, v_record.user_id, 'member'::user_role)
      ON CONFLICT (family_id, user_id) DO NOTHING
      RETURNING id INTO v_inserted;
      
      IF v_inserted IS NOT NULL THEN
        v_added := v_added + 1;
        RAISE NOTICE 'Added user % (%) to family %', v_record.name, v_record.email, v_record.family_id;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_skipped := v_skipped + 1;
      RAISE NOTICE 'Error adding user % (%): %', v_record.name, v_record.email, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_added, v_skipped, v_no_match, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function
SELECT * FROM public.add_family_members_as_users();

-- Clean up the function (optional - you can keep it for future use)
-- DROP FUNCTION IF EXISTS public.add_family_members_as_users();

