-- Insert Liabilities providers

-- Mortgage providers (top lenders in the USA)
INSERT INTO public.providers (name, category, type) VALUES
  ('Quicken Loans (Rocket Mortgage)', 'liabilities', 'mortgage'),
  ('Wells Fargo', 'liabilities', 'mortgage'),
  ('Bank of America', 'liabilities', 'mortgage'),
  ('Chase', 'liabilities', 'mortgage'),
  ('United Wholesale Mortgage', 'liabilities', 'mortgage'),
  ('US Bank', 'liabilities', 'mortgage'),
  ('Caliber Home Loans', 'liabilities', 'mortgage'),
  ('Fairway Independent Mortgage', 'liabilities', 'mortgage'),
  ('Guild Mortgage', 'liabilities', 'mortgage'),
  ('PennyMac', 'liabilities', 'mortgage'),
  ('Flagstar Bank', 'liabilities', 'mortgage'),
  ('loanDepot', 'liabilities', 'mortgage'),
  ('Better.com', 'liabilities', 'mortgage'),
  ('Guaranteed Rate', 'liabilities', 'mortgage'),
  ('HomePoint Financial', 'liabilities', 'mortgage');

-- Loan providers (various loan types)
INSERT INTO public.providers (name, category, type) VALUES
  ('SoFi', 'liabilities', 'loans'),
  ('LendingClub', 'liabilities', 'loans'),
  ('Marcus by Goldman Sachs', 'liabilities', 'loans'),
  ('Discover Personal Loans', 'liabilities', 'loans'),
  ('Wells Fargo', 'liabilities', 'loans'),
  ('Bank of America', 'liabilities', 'loans'),
  ('Chase', 'liabilities', 'loans'),
  ('Citibank', 'liabilities', 'loans'),
  ('LightStream', 'liabilities', 'loans'),
  ('Upstart', 'liabilities', 'loans'),
  ('Avant', 'liabilities', 'loans'),
  ('Best Egg', 'liabilities', 'loans'),
  ('Prosper', 'liabilities', 'loans'),
  ('PayPal Credit', 'liabilities', 'loans'),
  ('OneMain Financial', 'liabilities', 'loans'),
  ('Earnest', 'liabilities', 'loans'),
  ('CommonBond', 'liabilities', 'loans'),
  ('Laurel Road', 'liabilities', 'loans');

-- Insert Liabilities Account Types

-- Mortgage types
INSERT INTO public.account_types (name, category, type) VALUES
  ('Conventional Fixed-Rate Mortgage', 'liabilities', 'mortgage'),
  ('Conventional Adjustable-Rate Mortgage (ARM)', 'liabilities', 'mortgage'),
  ('FHA Loan', 'liabilities', 'mortgage'),
  ('VA Loan', 'liabilities', 'mortgage'),
  ('USDA Loan', 'liabilities', 'mortgage'),
  ('Jumbo Loan', 'liabilities', 'mortgage'),
  ('Interest-Only Mortgage', 'liabilities', 'mortgage'),
  ('Reverse Mortgage', 'liabilities', 'mortgage'),
  ('Home Equity Loan', 'liabilities', 'mortgage'),
  ('Home Equity Line of Credit (HELOC)', 'liabilities', 'mortgage');

-- Loan types
INSERT INTO public.account_types (name, category, type) VALUES
  ('Personal Loan', 'liabilities', 'loans'),
  ('Student Loan - Federal', 'liabilities', 'loans'),
  ('Student Loan - Private', 'liabilities', 'loans'),
  ('Auto Loan', 'liabilities', 'loans'),
  ('Business Loan', 'liabilities', 'loans'),
  ('Debt Consolidation Loan', 'liabilities', 'loans'),
  ('Payday Loan', 'liabilities', 'loans'),
  ('Credit Builder Loan', 'liabilities', 'loans'),
  ('Medical Loan', 'liabilities', 'loans'),
  ('Wedding Loan', 'liabilities', 'loans'),
  ('Home Improvement Loan', 'liabilities', 'loans'),
  ('Small Business Administration (SBA) Loan', 'liabilities', 'loans');
