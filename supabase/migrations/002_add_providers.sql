-- Create providers table
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- money_accounts, insurance, etc.
  type TEXT NOT NULL, -- checking_saving, life_insurance, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_providers_category ON public.providers(category);
CREATE INDEX IF NOT EXISTS idx_providers_type ON public.providers(type);
CREATE INDEX IF NOT EXISTS idx_providers_category_type ON public.providers(category, type);

-- Enable RLS (providers are public, everyone can read)
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read providers
CREATE POLICY "Anyone can view providers"
  ON public.providers
  FOR SELECT
  USING (true);

-- Insert Money Account providers

-- Checking/Saving Account providers
INSERT INTO public.providers (name, category, type) VALUES
  ('Bank of America', 'money_accounts', 'checking_saving'),
  ('Chase', 'money_accounts', 'checking_saving'),
  ('Wells Fargo', 'money_accounts', 'checking_saving'),
  ('Citibank', 'money_accounts', 'checking_saving'),
  ('US Bank', 'money_accounts', 'checking_saving'),
  ('PNC Bank', 'money_accounts', 'checking_saving'),
  ('Capital One', 'money_accounts', 'checking_saving'),
  ('TD Bank', 'money_accounts', 'checking_saving'),
  ('Truist Bank', 'money_accounts', 'checking_saving'),
  ('Goldman Sachs (Marcus)', 'money_accounts', 'checking_saving'),
  ('Ally Bank', 'money_accounts', 'checking_saving'),
  ('Discover Bank', 'money_accounts', 'checking_saving'),
  ('American Express Bank', 'money_accounts', 'checking_saving'),
  ('Navy Federal Credit Union', 'money_accounts', 'checking_saving'),
  ('USAA', 'money_accounts', 'checking_saving');

-- Brokerage Account providers
INSERT INTO public.providers (name, category, type) VALUES
  ('Fidelity', 'money_accounts', 'brokerage'),
  ('Charles Schwab', 'money_accounts', 'brokerage'),
  ('Vanguard', 'money_accounts', 'brokerage'),
  ('E*TRADE', 'money_accounts', 'brokerage'),
  ('TD Ameritrade', 'money_accounts', 'brokerage'),
  ('Interactive Brokers', 'money_accounts', 'brokerage'),
  ('Robinhood', 'money_accounts', 'brokerage'),
  ('Merrill Edge', 'money_accounts', 'brokerage'),
  ('Webull', 'money_accounts', 'brokerage'),
  ('Ally Invest', 'money_accounts', 'brokerage'),
  ('SoFi Invest', 'money_accounts', 'brokerage'),
  ('M1 Finance', 'money_accounts', 'brokerage');

-- Retirement Account providers
INSERT INTO public.providers (name, category, type) VALUES
  ('Fidelity', 'money_accounts', 'retirement'),
  ('Vanguard', 'money_accounts', 'retirement'),
  ('Charles Schwab', 'money_accounts', 'retirement'),
  ('T. Rowe Price', 'money_accounts', 'retirement'),
  ('TIAA', 'money_accounts', 'retirement'),
  ('Principal Financial', 'money_accounts', 'retirement'),
  ('Empower Retirement', 'money_accounts', 'retirement'),
  ('ADP', 'money_accounts', 'retirement'),
  ('Betterment', 'money_accounts', 'retirement'),
  ('Wealthfront', 'money_accounts', 'retirement');

-- Insert Insurance providers

-- Life Insurance providers
INSERT INTO public.providers (name, category, type) VALUES
  ('State Farm', 'insurance', 'life_insurance'),
  ('Northwestern Mutual', 'insurance', 'life_insurance'),
  ('New York Life', 'insurance', 'life_insurance'),
  ('MassMutual', 'insurance', 'life_insurance'),
  ('Prudential', 'insurance', 'life_insurance'),
  ('MetLife', 'insurance', 'life_insurance'),
  ('Allstate', 'insurance', 'life_insurance'),
  ('Nationwide', 'insurance', 'life_insurance'),
  ('Liberty Mutual', 'insurance', 'life_insurance'),
  ('Guardian Life', 'insurance', 'life_insurance'),
  ('Lincoln Financial', 'insurance', 'life_insurance'),
  ('Transamerica', 'insurance', 'life_insurance'),
  ('AIG', 'insurance', 'life_insurance'),
  ('Pacific Life', 'insurance', 'life_insurance');

-- Home Insurance providers
INSERT INTO public.providers (name, category, type) VALUES
  ('State Farm', 'insurance', 'home_insurance'),
  ('Allstate', 'insurance', 'home_insurance'),
  ('Farmers Insurance', 'insurance', 'home_insurance'),
  ('USAA', 'insurance', 'home_insurance'),
  ('Liberty Mutual', 'insurance', 'home_insurance'),
  ('Nationwide', 'insurance', 'home_insurance'),
  ('American Family', 'insurance', 'home_insurance'),
  ('Travelers', 'insurance', 'home_insurance'),
  ('Chubb', 'insurance', 'home_insurance'),
  ('Progressive', 'insurance', 'home_insurance'),
  ('Amica Mutual', 'insurance', 'home_insurance'),
  ('Auto-Owners Insurance', 'insurance', 'home_insurance'),
  ('Lemonade', 'insurance', 'home_insurance'),
  ('Hippo', 'insurance', 'home_insurance');

-- Health Insurance providers
INSERT INTO public.providers (name, category, type) VALUES
  ('UnitedHealthcare', 'insurance', 'health_insurance'),
  ('Blue Cross Blue Shield', 'insurance', 'health_insurance'),
  ('Anthem', 'insurance', 'health_insurance'),
  ('Aetna', 'insurance', 'health_insurance'),
  ('Cigna', 'insurance', 'health_insurance'),
  ('Humana', 'insurance', 'health_insurance'),
  ('Kaiser Permanente', 'insurance', 'health_insurance'),
  ('Centene', 'insurance', 'health_insurance'),
  ('Molina Healthcare', 'insurance', 'health_insurance'),
  ('WellCare', 'insurance', 'health_insurance'),
  ('Health Net', 'insurance', 'health_insurance'),
  ('Oscar Health', 'insurance', 'health_insurance'),
  ('Bright Health', 'insurance', 'health_insurance');

