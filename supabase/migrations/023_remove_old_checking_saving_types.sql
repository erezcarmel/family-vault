-- Remove old checking/saving account types that were replaced with shorter list in PR #46
DELETE FROM public.account_types 
WHERE category = 'money_accounts' 
  AND type = 'checking_saving' 
  AND name IN (
    'Checking Account',
    'Savings Account',
    'Money Market Account',
    'Certificate of Deposit (CD)',
    'High-Yield Savings Account',
    'Student Checking Account',
    'Business Checking Account',
    'Joint Account'
  );
