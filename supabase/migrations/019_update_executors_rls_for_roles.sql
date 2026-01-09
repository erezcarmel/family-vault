-- Update executors RLS policies to use role-based access control
-- Note: This migration assumes migration 012_add_executors.sql has been run first

DO $$
BEGIN
  -- Check if executors table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'executors'
  ) THEN
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Admins can view their own executors" ON public.executors;
    DROP POLICY IF EXISTS "Admins can create executors for their own families" ON public.executors;
    DROP POLICY IF EXISTS "Admins can update their own executors" ON public.executors;
    DROP POLICY IF EXISTS "Admins can delete their own executors" ON public.executors;

    -- Only admins can view executors (sensitive read-only users)
    CREATE POLICY "Admins can view executors"
      ON public.executors
      FOR SELECT
      USING (public.is_admin(family_id, auth.uid()));

    -- Only admins can create executors
    CREATE POLICY "Admins can create executors"
      ON public.executors
      FOR INSERT
      WITH CHECK (public.is_admin(family_id, auth.uid()));

    -- Only admins can update executors
    CREATE POLICY "Admins can update executors"
      ON public.executors
      FOR UPDATE
      USING (public.is_admin(family_id, auth.uid()));

    -- Only admins can delete executors
    CREATE POLICY "Admins can delete executors"
      ON public.executors
      FOR DELETE
      USING (public.is_admin(family_id, auth.uid()));
  ELSE
    RAISE NOTICE 'Executors table does not exist. Please run migration 012_add_executors.sql first.';
  END IF;
END $$;

