-- Create tables for family and asset management with proper RLS

-- Create families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  main_user TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  relationship TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create asset_categories table
CREATE TABLE IF NOT EXISTS public.asset_categories (
  id TEXT NOT NULL PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for families table
CREATE POLICY "Users can view their own families"
  ON public.families
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own families"
  ON public.families
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own families"
  ON public.families
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own families"
  ON public.families
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for family_members table
CREATE POLICY "Users can view their own family members"
  ON public.family_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = family_members.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create family members for their own families"
  ON public.family_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = family_members.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own family members"
  ON public.family_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = family_members.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own family members"
  ON public.family_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = family_members.family_id
      AND families.user_id = auth.uid()
    )
  );

-- RLS Policies for asset_categories table
CREATE POLICY "Users can view their own asset categories"
  ON public.asset_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = asset_categories.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create asset categories for their own families"
  ON public.asset_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = asset_categories.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own asset categories"
  ON public.asset_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = asset_categories.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own asset categories"
  ON public.asset_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = asset_categories.family_id
      AND families.user_id = auth.uid()
    )
  );

-- RLS Policies for assets table
CREATE POLICY "Users can view their own assets"
  ON public.assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = assets.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assets for their own families"
  ON public.assets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = assets.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own assets"
  ON public.assets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = assets.family_id
      AND families.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own assets"
  ON public.assets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE families.id = assets.family_id
      AND families.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_categories_updated_at
  BEFORE UPDATE ON public.asset_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_families_user_id ON public.families(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_asset_categories_family_id ON public.asset_categories(family_id);
CREATE INDEX IF NOT EXISTS idx_assets_family_id ON public.assets(family_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);

