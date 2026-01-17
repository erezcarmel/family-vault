export type UserRole = 'admin' | 'editor' | 'member'

export interface Family {
  id: string
  user_id: string
  main_user: string
  family_name: string | null
  created_at: string
  updated_at: string
}

export interface FamilyUser {
  id: string
  family_id: string
  user_id: string
  role: UserRole
  created_at: string
  updated_at: string
  email?: string
  name?: string
}

export interface Invitation {
  id: string
  family_id: string
  email: string
  role: UserRole
  invited_by: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  token: string
  expires_at: string
  created_at: string
  updated_at: string
  invited_by_email?: string
  invited_by_name?: string
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
  | 'mortgage'
  | 'loans'
  | 'email_accounts'
  | 'computer_access'
  | 'phone_access'
  | 'cloud_storage'

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

export interface CustomField {
  name: string
  value: string
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

export interface HealthcareRecord {
  id: string
  family_id: string
  member_id: string
  provider_id: string | null
  provider_name: string | null
  provider_type: string
  doctor_name: string | null
  specialty: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  policy_number: string | null
  group_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface HealthcareMedication {
  id: string
  healthcare_record_id: string
  medication_name: string
  dosage: string | null
  frequency: string | null
  start_date: string | null
  end_date: string | null
  prescribing_doctor: string | null
  pharmacy_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface HealthcareAllergy {
  id: string
  healthcare_record_id: string
  allergen_name: string
  severity: string | null
  reaction_description: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface HealthcareCondition {
  id: string
  healthcare_record_id: string
  condition_name: string
  diagnosis_date: string | null
  status: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface HealthcareEmergencyContact {
  id: string
  healthcare_record_id: string
  contact_name: string
  relationship: string | null
  phone: string
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type HealthcareProviderType = 
  | 'primary_care'
  | 'specialist'
  | 'pharmacy'
  | 'dental'
  | 'vision'

export interface Executor {
  id: string
  family_id: string
  name: string
  email: string
  password_hash: string
  relationship_description: string
  created_at: string
  updated_at: string
}
