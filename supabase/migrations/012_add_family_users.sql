CREATE TYPE user_role AS ENUM ('admin', 'editor', 'member');

CREATE TABLE IF NOT EXISTS public.family_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_family_users_family_id ON public.family_users(family_id);
CREATE INDEX IF NOT EXISTS idx_family_users_user_id ON public.family_users(user_id);

ALTER TABLE public.family_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view family_users for their families"
  ON public.family_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_users fu
      WHERE fu.family_id = family_users.family_id
      AND fu.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert family_users"
  ON public.family_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_users fu
      WHERE fu.family_id = family_users.family_id
      AND fu.user_id = auth.uid()
      AND fu.role = 'admin'
    )
  );

CREATE POLICY "Admins can update family_users"
  ON public.family_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_users fu
      WHERE fu.family_id = family_users.family_id
      AND fu.user_id = auth.uid()
      AND fu.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete family_users"
  ON public.family_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_users fu
      WHERE fu.family_id = family_users.family_id
      AND fu.user_id = auth.uid()
      AND fu.role = 'admin'
    )
  );

CREATE TRIGGER update_family_users_updated_at
  BEFORE UPDATE ON public.family_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_user_role(p_family_id UUID, p_user_id UUID)
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role
  FROM public.family_users
  WHERE family_id = p_family_id
  AND user_id = p_user_id;
  
  RETURN COALESCE(v_role, 'member'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_users
    WHERE family_id = p_family_id
    AND user_id = p_user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_editor_or_admin(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_users
    WHERE family_id = p_family_id
    AND user_id = p_user_id
    AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_family_member(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_users
    WHERE family_id = p_family_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO public.family_users (family_id, user_id, role)
SELECT id, user_id, 'admin'::user_role
FROM public.families
WHERE NOT EXISTS (
  SELECT 1 FROM public.family_users
  WHERE family_users.family_id = families.id
  AND family_users.user_id = families.user_id
);

CREATE OR REPLACE FUNCTION public.create_family_user_on_family_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.family_users (family_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'admin'::user_role)
  ON CONFLICT (family_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_family_user_on_family_insert
  AFTER INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.create_family_user_on_family_insert();

