-- Add Cloud Storage providers to the providers table

-- Cloud Storage providers (10 most common)
INSERT INTO public.providers (name, category, type) VALUES
  ('Google Drive', 'digital_assets', 'cloud_storage'),
  ('Dropbox', 'digital_assets', 'cloud_storage'),
  ('Microsoft OneDrive', 'digital_assets', 'cloud_storage'),
  ('iCloud', 'digital_assets', 'cloud_storage'),
  ('Box', 'digital_assets', 'cloud_storage'),
  ('Amazon Drive', 'digital_assets', 'cloud_storage'),
  ('pCloud', 'digital_assets', 'cloud_storage'),
  ('Sync.com', 'digital_assets', 'cloud_storage'),
  ('MEGA', 'digital_assets', 'cloud_storage'),
  ('Backblaze', 'digital_assets', 'cloud_storage');
