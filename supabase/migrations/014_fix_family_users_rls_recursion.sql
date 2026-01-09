DROP POLICY IF EXISTS "Users can view family_users for their families" ON public.family_users;
DROP POLICY IF EXISTS "Admins can insert family_users" ON public.family_users;
DROP POLICY IF EXISTS "Admins can update family_users" ON public.family_users;
DROP POLICY IF EXISTS "Admins can delete family_users" ON public.family_users;

CREATE POLICY "Users can view their own family_users entries"
  ON public.family_users
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view family_users for their families"
  ON public.family_users
  FOR SELECT
  USING (
    public.is_family_member(family_users.family_id, auth.uid())
  );

CREATE POLICY "Users can insert their own family_users entry"
  ON public.family_users
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert family_users"
  ON public.family_users
  FOR INSERT
  WITH CHECK (
    public.is_admin(family_users.family_id, auth.uid())
  );

CREATE POLICY "Users can update their own family_users entry"
  ON public.family_users
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update family_users"
  ON public.family_users
  FOR UPDATE
  USING (
    public.is_admin(family_users.family_id, auth.uid())
  );

CREATE POLICY "Users can delete their own family_users entry"
  ON public.family_users
  FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete family_users"
  ON public.family_users
  FOR DELETE
  USING (
    public.is_admin(family_users.family_id, auth.uid())
  );

