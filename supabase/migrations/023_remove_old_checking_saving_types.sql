-- Remove old checking/saving account types that were replaced with shorter list in PR #46
-- First, delete all old checking_saving account types
DELETE FROM public.account_types 
WHERE category = 'money_accounts' 
  AND type = 'checking_saving';

-- Then insert the new shorter list
INSERT INTO public.account_types (name, category, type) VALUES
  ('Checking account', 'money_accounts', 'checking_saving'),
  ('Saving account', 'money_accounts', 'checking_saving'),
  ('Certificate of deposit (CD)', 'money_accounts', 'checking_saving'),
  ('Money market account', 'money_accounts', 'checking_saving'),
  ('Student checking account', 'money_accounts', 'checking_saving');
