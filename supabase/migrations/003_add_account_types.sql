-- Create account_types table
CREATE TABLE IF NOT EXISTS public.account_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- money_accounts, insurance, etc.
  type TEXT NOT NULL, -- checking_saving, life_insurance, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_types_category ON public.account_types(category);
CREATE INDEX IF NOT EXISTS idx_account_types_type ON public.account_types(type);
CREATE INDEX IF NOT EXISTS idx_account_types_category_type ON public.account_types(category, type);

-- Enable RLS (account types are public, everyone can read)
ALTER TABLE public.account_types ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read account types
CREATE POLICY "Anyone can view account types"
  ON public.account_types
  FOR SELECT
  USING (true);

-- Insert Money Account Types

-- Checking/Saving Account types
INSERT INTO public.account_types (name, category, type) VALUES
  ('Checking account', 'money_accounts', 'checking_saving'),
  ('Saving account', 'money_accounts', 'checking_saving'),
  ('Certificate of deposit (CD)', 'money_accounts', 'checking_saving'),
  ('Money market account', 'money_accounts', 'checking_saving'),
  ('Student checking account', 'money_accounts', 'checking_saving');

-- Brokerage Account types
INSERT INTO public.account_types (name, category, type) VALUES
  ('Individual Brokerage Account', 'money_accounts', 'brokerage'),
  ('Joint Brokerage Account', 'money_accounts', 'brokerage'),
  ('Margin Account', 'money_accounts', 'brokerage'),
  ('Cash Account', 'money_accounts', 'brokerage'),
  ('Options Trading Account', 'money_accounts', 'brokerage'),
  ('Day Trading Account', 'money_accounts', 'brokerage');

-- Retirement Account types
INSERT INTO public.account_types (name, category, type) VALUES
  ('401(k)', 'money_accounts', 'retirement'),
  ('Traditional IRA', 'money_accounts', 'retirement'),
  ('Roth IRA', 'money_accounts', 'retirement'),
  ('SEP IRA', 'money_accounts', 'retirement'),
  ('SIMPLE IRA', 'money_accounts', 'retirement'),
  ('403(b)', 'money_accounts', 'retirement'),
  ('457 Plan', 'money_accounts', 'retirement'),
  ('Pension Plan', 'money_accounts', 'retirement'),
  ('Rollover IRA', 'money_accounts', 'retirement'),
  ('Solo 401(k)', 'money_accounts', 'retirement'),
  ('Thrift Savings Plan (TSP)', 'money_accounts', 'retirement');

-- Insert Insurance Types

-- Life Insurance types
INSERT INTO public.account_types (name, category, type) VALUES
  ('Term Life Insurance', 'insurance', 'life_insurance'),
  ('Whole Life Insurance', 'insurance', 'life_insurance'),
  ('Universal Life Insurance', 'insurance', 'life_insurance'),
  ('Variable Life Insurance', 'insurance', 'life_insurance'),
  ('Variable Universal Life', 'insurance', 'life_insurance'),
  ('Final Expense Insurance', 'insurance', 'life_insurance'),
  ('Guaranteed Issue Life Insurance', 'insurance', 'life_insurance'),
  ('Group Life Insurance', 'insurance', 'life_insurance');

-- Home Insurance types
INSERT INTO public.account_types (name, category, type) VALUES
  ('Homeowners Insurance (HO-3)', 'insurance', 'home_insurance'),
  ('Renters Insurance (HO-4)', 'insurance', 'home_insurance'),
  ('Condo Insurance (HO-6)', 'insurance', 'home_insurance'),
  ('Landlord Insurance', 'insurance', 'home_insurance'),
  ('Mobile Home Insurance', 'insurance', 'home_insurance'),
  ('Flood Insurance', 'insurance', 'home_insurance'),
  ('Earthquake Insurance', 'insurance', 'home_insurance'),
  ('Umbrella Insurance', 'insurance', 'home_insurance');

-- Health Insurance types
INSERT INTO public.account_types (name, category, type) VALUES
  ('HMO (Health Maintenance Organization)', 'insurance', 'health_insurance'),
  ('PPO (Preferred Provider Organization)', 'insurance', 'health_insurance'),
  ('EPO (Exclusive Provider Organization)', 'insurance', 'health_insurance'),
  ('POS (Point of Service)', 'insurance', 'health_insurance'),
  ('HDHP (High Deductible Health Plan)', 'insurance', 'health_insurance'),
  ('Medicare Part A', 'insurance', 'health_insurance'),
  ('Medicare Part B', 'insurance', 'health_insurance'),
  ('Medicare Part C (Medicare Advantage)', 'insurance', 'health_insurance'),
  ('Medicare Part D (Prescription)', 'insurance', 'health_insurance'),
  ('Medicaid', 'insurance', 'health_insurance'),
  ('Dental Insurance', 'insurance', 'health_insurance'),
  ('Vision Insurance', 'insurance', 'health_insurance'),
  ('Short-Term Health Insurance', 'insurance', 'health_insurance'),
  ('Catastrophic Health Insurance', 'insurance', 'health_insurance');

