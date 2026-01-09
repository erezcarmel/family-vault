-- Add Digital Assets providers and account types

-- Email Account providers
INSERT INTO public.providers (name, category, type) VALUES
  ('Gmail', 'digital_assets', 'email_accounts'),
  ('Outlook', 'digital_assets', 'email_accounts'),
  ('Yahoo Mail', 'digital_assets', 'email_accounts'),
  ('ProtonMail', 'digital_assets', 'email_accounts'),
  ('iCloud Mail', 'digital_assets', 'email_accounts'),
  ('Zoho Mail', 'digital_assets', 'email_accounts'),
  ('AOL Mail', 'digital_assets', 'email_accounts'),
  ('FastMail', 'digital_assets', 'email_accounts'),
  ('Mail.com', 'digital_assets', 'email_accounts'),
  ('GMX Mail', 'digital_assets', 'email_accounts');

-- Email Account types
INSERT INTO public.account_types (name, category, type) VALUES
  ('Personal Email', 'digital_assets', 'email_accounts'),
  ('Work Email', 'digital_assets', 'email_accounts'),
  ('Business Email', 'digital_assets', 'email_accounts'),
  ('Secondary Email', 'digital_assets', 'email_accounts'),
  ('Family Email', 'digital_assets', 'email_accounts');
