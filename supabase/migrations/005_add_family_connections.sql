-- Create family_connections table to define relationships between family members
CREATE TABLE IF NOT EXISTS public.family_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  related_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_members CHECK (member_id != related_member_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_family_connections_family_id ON public.family_connections(family_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_member_id ON public.family_connections(member_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_related_member_id ON public.family_connections(related_member_id);

-- Enable RLS
ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own family connections"
  ON public.family_connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = family_connections.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create connections for their own families"
  ON public.family_connections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = family_connections.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own family connections"
  ON public.family_connections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = family_connections.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own family connections"
  ON public.family_connections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = family_connections.family_id
      AND families.user_id = auth.uid()
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_connections_updated_at
  BEFORE UPDATE ON public.family_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

