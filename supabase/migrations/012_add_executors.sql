-- Create executors table for people with read-only access to family data
CREATE TABLE IF NOT EXISTS public.executors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  relationship_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, email)
);

-- Enable Row Level Security
ALTER TABLE public.executors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for executors table
-- Admin (family owner) can view their executors
CREATE POLICY "Admins can view their own executors"
  ON public.executors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = executors.family_id
      AND families.user_id = auth.uid()
    )
  );

-- Admin can create executors for their own families
CREATE POLICY "Admins can create executors for their own families"
  ON public.executors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = executors.family_id
      AND families.user_id = auth.uid()
    )
  );

-- Admin can update their own executors
CREATE POLICY "Admins can update their own executors"
  ON public.executors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = executors.family_id
      AND families.user_id = auth.uid()
    )
  );

-- Admin can delete their own executors
CREATE POLICY "Admins can delete their own executors"
  ON public.executors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = executors.family_id
      AND families.user_id = auth.uid()
    )
  );

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_executors_updated_at
  BEFORE UPDATE ON public.executors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_executors_family_id ON public.executors(family_id);
CREATE INDEX IF NOT EXISTS idx_executors_email ON public.executors(email);
