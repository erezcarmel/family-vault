export interface Family {
  id: string
  user_id: string
  main_user: string
  family_name: string | null
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  name: string
  email: string | null
  relationship: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface FamilyConnection {
  id: string
  family_id: string
  member_id: string
  related_member_id: string
  relationship_type: string
  created_at: string
  updated_at: string
}

export interface AssetCategory {
  id: string
  family_id: string
  title: string
  count: number
  created_at: string
  updated_at: string
}

export type AssetCategoryType = 
  | 'money_accounts'
  | 'insurance'
  | 'liabilities'
  | 'healthcare'
  | 'digital_assets'

export type AssetType = 
  | 'checking_saving'
  | 'brokerage'
  | 'retirement'
  | 'life_insurance'
  | 'home_insurance'
  | 'health_insurance'

export interface AssetData {
  provider_name: string
  account_type: string
  account_number: string
  [key: string]: any // Allow additional custom fields
}

export interface Asset {
  id: string
  family_id: string
  category: string
  type: string
  data: AssetData
  created_at: string
  updated_at: string
}

export interface AssetSection {
  id: AssetCategoryType
  title: string
  icon: string
  subCategories: {
    id: AssetType
    title: string
  }[]
}

export interface Provider {
  id: string
  name: string
  category: string
  type: string
  created_at: string
}

export interface AccountType {
  id: string
  name: string
  category: string
  type: string
  created_at: string
}

export interface Document {
  id: string
  family_id: string
  title: string
  description: string | null
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
  updated_at: string
}
