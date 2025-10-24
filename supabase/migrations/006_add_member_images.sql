-- Add image_url column to family_members table
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for family member photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-member-photos', 'family-member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for family-member-photos bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload family member photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'family-member-photos');

-- Allow authenticated users to update their own family's photos
CREATE POLICY "Users can update their own family member photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'family-member-photos');

-- Allow public read access to photos
CREATE POLICY "Public can view family member photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'family-member-photos');

-- Allow authenticated users to delete their own family's photos
CREATE POLICY "Users can delete their own family member photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'family-member-photos');

