DROP POLICY IF EXISTS "Users can view their own families" ON public.families;
DROP POLICY IF EXISTS "Users can create their own families" ON public.families;
DROP POLICY IF EXISTS "Users can update their own families" ON public.families;
DROP POLICY IF EXISTS "Users can delete their own families" ON public.families;

CREATE POLICY "Family members can view their families"
  ON public.families
  FOR SELECT
  USING (public.is_family_member(id, auth.uid()));

CREATE POLICY "Users can create families"
  ON public.families
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update their families"
  ON public.families
  FOR UPDATE
  USING (public.is_admin(id, auth.uid()));

CREATE POLICY "Admins can delete their families"
  ON public.families
  FOR DELETE
  USING (public.is_admin(id, auth.uid()));

DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can create family members for their own families" ON public.family_members;
DROP POLICY IF EXISTS "Users can update their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can delete their own family members" ON public.family_members;

CREATE POLICY "Family members can view family members"
  ON public.family_members
  FOR SELECT
  USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Admins and editors can create family members"
  ON public.family_members
  FOR INSERT
  WITH CHECK (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can update family members"
  ON public.family_members
  FOR UPDATE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can delete family members"
  ON public.family_members
  FOR DELETE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

DROP POLICY IF EXISTS "Users can view their own asset categories" ON public.asset_categories;
DROP POLICY IF EXISTS "Users can create asset categories for their own families" ON public.asset_categories;
DROP POLICY IF EXISTS "Users can update their own asset categories" ON public.asset_categories;
DROP POLICY IF EXISTS "Users can delete their own asset categories" ON public.asset_categories;

CREATE POLICY "Family members can view asset categories"
  ON public.asset_categories
  FOR SELECT
  USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Admins and editors can create asset categories"
  ON public.asset_categories
  FOR INSERT
  WITH CHECK (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can update asset categories"
  ON public.asset_categories
  FOR UPDATE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can delete asset categories"
  ON public.asset_categories
  FOR DELETE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

DROP POLICY IF EXISTS "Users can view their own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can create assets for their own families" ON public.assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON public.assets;

CREATE POLICY "Family members can view assets"
  ON public.assets
  FOR SELECT
  USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Admins and editors can create assets"
  ON public.assets
  FOR INSERT
  WITH CHECK (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can update assets"
  ON public.assets
  FOR UPDATE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can delete assets"
  ON public.assets
  FOR DELETE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

DROP POLICY IF EXISTS "Users can view their own family connections" ON public.family_connections;
DROP POLICY IF EXISTS "Users can create connections for their own families" ON public.family_connections;
DROP POLICY IF EXISTS "Users can update their own family connections" ON public.family_connections;
DROP POLICY IF EXISTS "Users can delete their own family connections" ON public.family_connections;

CREATE POLICY "Family members can view family connections"
  ON public.family_connections
  FOR SELECT
  USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Admins and editors can create family connections"
  ON public.family_connections
  FOR INSERT
  WITH CHECK (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can update family connections"
  ON public.family_connections
  FOR UPDATE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can delete family connections"
  ON public.family_connections
  FOR DELETE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents for their own families" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Family members can view documents"
  ON public.documents
  FOR SELECT
  USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Admins and editors can create documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can update documents"
  ON public.documents
  FOR UPDATE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

CREATE POLICY "Admins and editors can delete documents"
  ON public.documents
  FOR DELETE
  USING (public.is_editor_or_admin(family_id, auth.uid()));

