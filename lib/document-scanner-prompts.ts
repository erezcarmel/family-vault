export interface DocumentScannerPrompt {
  category: string
  type: string
  systemPrompt: string
  fields: string[]
}

export const documentScannerPrompts: DocumentScannerPrompt[] = [
  // Money Accounts - Checking/Saving
  {
    category: 'money_accounts',
    type: 'checking_saving',
    systemPrompt: `You are analyzing a bank statement or account document. Extract the following information:
- Provider Name: The name of the bank or financial institution
- Account Type: Type of account (Checking, Savings, Money Market, etc.)
- Account Number: The account number (last 4 digits if partially hidden)
- Additional fields like: balance, routing number, interest rate, account holder name

Return the data in JSON format with keys: provider_name, account_type, account_number, and any additional fields you find.`,
    fields: ['provider_name', 'account_type', 'account_number', 'balance', 'routing_number', 'account_holder']
  },
  
  // Money Accounts - Brokerage
  {
    category: 'money_accounts',
    type: 'brokerage',
    systemPrompt: `You are analyzing a brokerage account statement. Extract the following information:
- Provider Name: The name of the brokerage firm
- Account Type: Type of account (Individual, Joint, Margin, Cash, etc.)
- Account Number: The account number
- Additional fields like: total value, cash balance, account holder name

Return the data in JSON format with keys: provider_name, account_type, account_number, and any additional fields you find.`,
    fields: ['provider_name', 'account_type', 'account_number', 'total_value', 'cash_balance', 'account_holder']
  },
  
  // Money Accounts - Retirement
  {
    category: 'money_accounts',
    type: 'retirement',
    systemPrompt: `You are analyzing a retirement account statement. Extract the following information:
- Provider Name: The name of the retirement plan provider
- Account Type: Type of account (401k, IRA, Roth IRA, etc.)
- Account Number: The account number
- Additional fields like: total balance, vested balance, employer, contribution rate

Return the data in JSON format with keys: provider_name, account_type, account_number, and any additional fields you find.`,
    fields: ['provider_name', 'account_type', 'account_number', 'total_balance', 'vested_balance', 'employer']
  },
  
  // Insurance - Life Insurance
  {
    category: 'insurance',
    type: 'life_insurance',
    systemPrompt: `You are analyzing a life insurance policy document. Extract the following information:
- Provider Name: The name of the insurance company
- Account Type: Type of policy (Term Life, Whole Life, Universal Life, etc.)
- Account Number: The policy number
- Additional fields like: coverage amount, premium amount, beneficiary, policy start date

Return the data in JSON format with keys: provider_name, account_type, account_number, and any additional fields you find.`,
    fields: ['provider_name', 'account_type', 'account_number', 'coverage_amount', 'premium', 'beneficiary', 'policy_start_date']
  },
  
  // Insurance - Home Insurance
  {
    category: 'insurance',
    type: 'home_insurance',
    systemPrompt: `You are analyzing a home insurance policy document. Extract the following information:
- Provider Name: The name of the insurance company
- Account Type: Type of policy (Homeowners, Renters, Condo, etc.)
- Account Number: The policy number
- Additional fields like: coverage amount, deductible, premium amount, property address

Return the data in JSON format with keys: provider_name, account_type, account_number, and any additional fields you find.`,
    fields: ['provider_name', 'account_type', 'account_number', 'coverage_amount', 'deductible', 'premium', 'property_address']
  },
  
  // Insurance - Health Insurance
  {
    category: 'insurance',
    type: 'health_insurance',
    systemPrompt: `You are analyzing a health insurance card or policy document. Extract the following information:
- Provider Name: The name of the insurance company
- Account Type: Type of plan (HMO, PPO, EPO, etc.)
- Account Number: The member ID or policy number
- Additional fields like: group number, copay amounts, deductible, out-of-pocket max

Return the data in JSON format with keys: provider_name, account_type, account_number, and any additional fields you find.`,
    fields: ['provider_name', 'account_type', 'account_number', 'group_number', 'copay', 'deductible', 'out_of_pocket_max']
  }
]

export function getPromptForAsset(category: string, type: string): DocumentScannerPrompt | null {
  return documentScannerPrompts.find(
    p => p.category === category && p.type === type
  ) || null
}

