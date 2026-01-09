CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, email, status) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_invitations_family_id ON public.invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view invitations for their families"
  ON public.invitations
  FOR SELECT
  USING (
    public.is_family_member(family_id, auth.uid())
  );

CREATE POLICY "Admins can create invitations"
  ON public.invitations
  FOR INSERT
  WITH CHECK (
    public.is_admin(family_id, auth.uid())
    AND invited_by = auth.uid()
  );

CREATE POLICY "Admins can update invitations"
  ON public.invitations
  FOR UPDATE
  USING (
    public.is_admin(family_id, auth.uid())
  );

CREATE POLICY "Admins can delete invitations"
  ON public.invitations
  FOR DELETE
  USING (
    public.is_admin(family_id, auth.uid())
  );

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token UUID, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or expired invitation'::TEXT;
    RETURN;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.family_users
    WHERE family_id = v_invitation.family_id
    AND user_id = p_user_id
  ) THEN
    UPDATE public.invitations
    SET status = 'accepted'
    WHERE id = v_invitation.id;
    RETURN QUERY SELECT true, 'User already in family'::TEXT;
    RETURN;
  END IF;
  
  INSERT INTO public.family_users (family_id, user_id, role)
  VALUES (v_invitation.family_id, p_user_id, v_invitation.role)
  ON CONFLICT (family_id, user_id) DO UPDATE
  SET role = v_invitation.role;
  
  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = v_invitation.id;
  
  RETURN QUERY SELECT true, 'Invitation accepted'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

