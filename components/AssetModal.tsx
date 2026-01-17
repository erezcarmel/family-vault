'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import DocumentScanner from './DocumentScanner'
import type { Asset, AssetType, Provider, AccountType } from '@/types'

interface CustomField {
  name: string
  value: string
}

interface IdentificationMethod {
  id: string
  method: 'biometrics' | 'screen_lock'
  type: string
  pinValue?: string
}

interface AssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (assetType: string, data: Record<string, unknown>) => void
  asset?: Asset | null
  subCategories: { id: AssetType; title: string }[]
  category: string
}

export default function AssetModal({ isOpen, onClose, onSave, asset, subCategories, category }: AssetModalProps) {
  const [providerName, setProviderName] = useState('')
  const [customProviderName, setCustomProviderName] = useState('')
  const [accountType, setAccountType] = useState('')
  const [customAccountType, setCustomAccountType] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [subCategory, setSubCategory] = useState<AssetType | ''>('')
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [loadingAccountTypes, setLoadingAccountTypes] = useState(false)
  
  // Liability-specific fields
  const [loanAmount, setLoanAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [loanTerm, setLoanTerm] = useState('')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [termLength, setTermLength] = useState('')
  
  // Email account-specific fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordEnabled, setPasswordEnabled] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [notes, setNotes] = useState('')
  
  // Computer access-specific fields
  const [deviceName, setDeviceName] = useState('')
  const [computerUser, setComputerUser] = useState('')
  const [computerPassword, setComputerPassword] = useState('')
  const [showComputerPassword, setShowComputerPassword] = useState(false)
  
  // Phone access-specific fields
  const [phoneName, setPhoneName] = useState('')
  const [phoneOwner, setPhoneOwner] = useState('')
  const [customPhoneOwner, setCustomPhoneOwner] = useState('')
  const [phonePassword, setPhonePassword] = useState('')
  const [showPhonePassword, setShowPhonePassword] = useState(false)
  const [identificationMethods, setIdentificationMethods] = useState<IdentificationMethod[]>([])
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: string; name: string }>>([])
  const [loadingFamilyMembers, setLoadingFamilyMembers] = useState(false)
  
  // Cloud storage-specific fields
  const [cloudProvider, setCloudProvider] = useState('')
  const [cloudUsername, setCloudUsername] = useState('')
  const [cloudPassword, setCloudPassword] = useState('')
  const [showCloudPassword, setShowCloudPassword] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    if (asset) {
      setProviderName(asset.data.provider_name)
      setAccountType(asset.data.account_type)
      setAccountNumber(asset.data.account_number)
      setSubCategory(asset.type as AssetType)
      
      // Set liability-specific fields if they exist
      if (asset.data.loan_amount) setLoanAmount(asset.data.loan_amount)
      if (asset.data.interest_rate) setInterestRate(asset.data.interest_rate)
      if (asset.data.loan_term) setLoanTerm(asset.data.loan_term)
      if (asset.data.monthly_payment) setMonthlyPayment(asset.data.monthly_payment)
      if (asset.data.term_length) setTermLength(asset.data.term_length)
      
      // Set email account-specific fields if they exist
      if (asset.data.email) setEmail(asset.data.email)
      if (asset.data.password) {
        setPassword(asset.data.password)
        setPasswordEnabled(true)
      }
      if (asset.data.recovery_email) setRecoveryEmail(asset.data.recovery_email)
      if (asset.data.notes) setNotes(asset.data.notes)
      
      // Set computer access-specific fields if they exist
      if (asset.data.device_name) setDeviceName(asset.data.device_name)
      if (asset.data.computer_user) setComputerUser(asset.data.computer_user)
      if (asset.data.computer_password) setComputerPassword(asset.data.computer_password)
      
      // Set phone access-specific fields if they exist
      if (asset.data.phone_name) setPhoneName(asset.data.phone_name)
      if (asset.data.phone_owner) setPhoneOwner(asset.data.phone_owner)
      if (asset.data.phone_password) setPhonePassword(asset.data.phone_password)
      if (asset.data.identification_methods) {
        setIdentificationMethods(JSON.parse(JSON.stringify(asset.data.identification_methods)))
      }
      
      // Set cloud storage-specific fields if they exist
      if (asset.data.cloud_provider) setCloudProvider(asset.data.cloud_provider)
      if (asset.data.cloud_username) setCloudUsername(asset.data.cloud_username)
      if (asset.data.cloud_password) setCloudPassword(asset.data.cloud_password)
      
      // Extract custom fields (excluding standard fields)
      const standardFields = ['provider_name', 'account_type', 'account_number', 
                              'loan_amount', 'interest_rate', 'loan_term', 
                              'monthly_payment', 'term_length',
                              'email', 'password', 'recovery_email', 'notes',
                              'device_name', 'computer_user', 'computer_password',
                              'phone_name', 'phone_owner', 'phone_password', 'identification_methods',
                              'cloud_provider', 'cloud_username', 'cloud_password']
      const customData = Object.entries(asset.data)
        .filter(([key]) => !standardFields.includes(key))
        .map(([name, value]) => ({ name, value: String(value) }))
      setCustomFields(customData)
    } else {
      resetForm()
    }
  }, [asset, isOpen])

  // Load providers and account types when sub-category changes
  useEffect(() => {
    if (subCategory) {
      loadProviders(subCategory)
      loadAccountTypes(subCategory)
      if (subCategory === 'phone_access') {
        loadFamilyMembers()
      }
    }
  }, [subCategory])

  const loadProviders = async (type: string) => {
    setLoadingProviders(true)
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('category', category)
        .eq('type', type)
        .order('name')

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error('Error loading providers:', error)
      setProviders([])
    } finally {
      setLoadingProviders(false)
    }
  }

  const loadAccountTypes = async (type: string) => {
    setLoadingAccountTypes(true)
    try {
      const { data, error } = await supabase
        .from('account_types')
        .select('*')
        .eq('category', category)
        .eq('type', type)
        .order('name')

      if (error) throw error
      setAccountTypes(data || [])
    } catch (error) {
      console.error('Error loading account types:', error)
      setAccountTypes([])
    } finally {
      setLoadingAccountTypes(false)
    }
  }

  const loadFamilyMembers = async () => {
    setLoadingFamilyMembers(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get family ID
        const { data: family } = await supabase
          .from('families')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (family) {
          // Load family members
          const { data, error } = await supabase
            .from('family_members')
            .select('id, name')
            .eq('family_id', family.id)
            .order('name')

          if (error) throw error
          setFamilyMembers(data || [])
        }
      }
    } catch (error) {
      console.error('Error loading family members:', error)
      setFamilyMembers([])
    } finally {
      setLoadingFamilyMembers(false)
    }
  }

  const resetForm = () => {
    setProviderName('')
    setCustomProviderName('')
    setAccountType('')
    setCustomAccountType('')
    setAccountNumber('')
    setSubCategory('')
    setCustomFields([])
    setNewFieldName('')
    setNewFieldValue('')
    setProviders([])
    setAccountTypes([])
    setLoanAmount('')
    setInterestRate('')
    setLoanTerm('')
    setMonthlyPayment('')
    setTermLength('')
    setEmail('')
    setPassword('')
    setPasswordEnabled(false)
    setRecoveryEmail('')
    setNotes('')
    setDeviceName('')
    setComputerUser('')
    setComputerPassword('')
    setShowComputerPassword(false)
    setPhoneName('')
    setPhoneOwner('')
    setCustomPhoneOwner('')
    setPhonePassword('')
    setShowPhonePassword(false)
    setIdentificationMethods([])
    setCloudProvider('')
    setCloudUsername('')
    setCloudPassword('')
    setShowCloudPassword(false)
  }

  const addCustomField = () => {
    if (newFieldName && newFieldValue) {
      setCustomFields([
        ...customFields,
        {
          name: newFieldName,
          value: newFieldValue,
        },
      ])
      setNewFieldName('')
      setNewFieldValue('')
    }
  }

  const removeCustomField = (name: string) => {
    setCustomFields(customFields.filter(field => field.name !== name))
  }

  const addIdentificationMethod = () => {
    const newMethod: IdentificationMethod = {
      id: `method-${Date.now()}`,
      method: 'biometrics',
      type: 'fingerprint_scan',
    }
    setIdentificationMethods([...identificationMethods, newMethod])
  }

  const removeIdentificationMethod = (id: string) => {
    setIdentificationMethods(identificationMethods.filter(m => m.id !== id))
  }

  const updateIdentificationMethod = (id: string, field: keyof IdentificationMethod, value: string) => {
    setIdentificationMethods(identificationMethods.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const handleDocumentDataExtracted = (data: Record<string, unknown>) => {
    // Set main fields
    if (data.provider_name) setProviderName(String(data.provider_name))
    if (data.account_type) setAccountType(String(data.account_type))
    if (data.account_number) setAccountNumber(String(data.account_number))

    // Set custom fields (anything that's not the main fields)
    const mainFields = ['provider_name', 'account_type', 'account_number']
    const customFieldsData: CustomField[] = []
    
    Object.entries(data).forEach(([key, value]) => {
      if (!mainFields.includes(key) && value) {
        customFieldsData.push({
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: String(value)
        })
      }
    })

    if (customFieldsData.length > 0) {
      setCustomFields(customFieldsData)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subCategory) return

    // Use custom provider name if "__custom__" was selected
    const finalProviderName = providerName === '__custom__' ? customProviderName : providerName
    const finalAccountType = accountType === '__custom__' ? customAccountType : accountType

    // Validation for email account-specific fields
    if (category === 'digital_assets' && subCategory === 'email_accounts') {
      if (!email) {
        alert('Please enter an email address')
        return
      }
    } else if (category === 'digital_assets' && subCategory === 'computer_access') {
      // Validation for computer access-specific fields
      if (!deviceName) {
        alert('Please enter a device name')
        return
      }
      if (!computerUser) {
        alert('Please enter a user name')
        return
      }
      if (!computerPassword) {
        alert('Please enter a password')
        return
      }
    } else if (category === 'digital_assets' && subCategory === 'phone_access') {
      // Validation for phone access-specific fields
      if (!phoneName) {
        alert('Please enter a phone name')
        return
      }
      if (!phoneOwner && !customPhoneOwner) {
        alert('Please select or enter a phone owner')
        return
      }
      if (!phonePassword) {
        alert('Please enter a password')
        return
      }
    } else if (category === 'digital_assets' && subCategory === 'cloud_storage') {
      // Validation for cloud storage-specific fields
      if (!cloudProvider) {
        alert('Please select a cloud storage provider')
        return
      }
      if (!cloudUsername) {
        alert('Please enter a username or email')
        return
      }
      if (!cloudPassword) {
        alert('Please enter a password')
        return
      }
    } else {
      if (!finalProviderName) {
        alert('Please enter a provider name')
        return
      }
    }

    // No validation for liability-specific fields - all are optional

    // NOTE: Account/Policy Type is now optional for non-liability categories

    // Build data object
    const data: Record<string, unknown> = {}
    
    // For email accounts, only include email-specific fields
    if (category === 'digital_assets' && subCategory === 'email_accounts') {
      if (email) data.email = email
      if (passwordEnabled && password) data.password = password
      if (recoveryEmail) data.recovery_email = recoveryEmail
      if (notes) data.notes = notes
    } else if (category === 'digital_assets' && subCategory === 'computer_access') {
      // For computer access, only include computer access-specific fields
      data.device_name = deviceName
      data.computer_user = computerUser
      data.computer_password = computerPassword
    } else if (category === 'digital_assets' && subCategory === 'phone_access') {
      // For phone access, only include phone access-specific fields
      data.phone_name = phoneName
      data.phone_owner = phoneOwner === '__custom__' ? customPhoneOwner : phoneOwner
      data.phone_password = phonePassword
      if (identificationMethods.length > 0) {
        data.identification_methods = identificationMethods
      }
    } else if (category === 'digital_assets' && subCategory === 'cloud_storage') {
      // For cloud storage, only include cloud storage-specific fields
      data.cloud_provider = cloudProvider
      data.cloud_username = cloudUsername
      data.cloud_password = cloudPassword
    } else {
      // For other categories, include standard fields
      data.provider_name = finalProviderName
      data.account_type = finalAccountType
      data.account_number = accountNumber
      
      // Add liability-specific fields
      if (category === 'liabilities') {
        if (loanAmount) data.loan_amount = loanAmount
        if (interestRate) data.interest_rate = interestRate
        if (loanTerm) data.loan_term = loanTerm
        if (monthlyPayment) data.monthly_payment = monthlyPayment
        if (termLength) data.term_length = termLength
      }

      // Add custom fields
      customFields.forEach(field => {
        data[field.name] = field.value
      })
    }

    onSave(subCategory, data)
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {asset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Document Scanner Section */}
          {!(category === 'digital_assets' && (subCategory === 'email_accounts' || subCategory === 'computer_access' || subCategory === 'phone_access' || subCategory === 'cloud_storage')) && (
            <>
              <DocumentScanner
                category={category}
                subCategory={subCategory}
                onDataExtracted={handleDocumentDataExtracted}
              />
              <div className="border-t border-gray-200 pt-2"></div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub-Category *
            </label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value as AssetType)}
              className="input-field"
              required
            >
              <option value="">Select a sub-category</option>
              {subCategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.title}
                </option>
              ))}
            </select>
          </div>

          {!(category === 'digital_assets' && (subCategory === 'email_accounts' || subCategory === 'computer_access' || subCategory === 'phone_access' || subCategory === 'cloud_storage')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Name *
              </label>
              {subCategory && providers.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={providerName}
                    onChange={(e) => {
                      setProviderName(e.target.value)
                      if (e.target.value !== '__custom__') {
                        setCustomProviderName('')
                      }
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">Select a provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.name}>
                        {provider.name}
                      </option>
                    ))}
                    <option value="__custom__">Other (Enter manually)</option>
                  </select>
                  {providerName === '__custom__' && (
                    <input
                      type="text"
                      value={customProviderName}
                      onChange={(e) => setCustomProviderName(e.target.value)}
                      className="input-field"
                      placeholder="Enter provider name"
                      required
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="input-field"
                  placeholder={loadingProviders ? "Loading providers..." : "e.g., Bank of America, State Farm"}
                  disabled={loadingProviders}
                  required
                />
              )}
              {!subCategory && (
                <p className="text-xs text-gray-500 mt-1">
                  Select a sub-category first to see provider options
                </p>
              )}
            </div>
          )}

          {/* Hide Account/Policy Type field for liabilities, email accounts, computer access, phone access, and cloud storage */}
          {category !== 'liabilities' && !(category === 'digital_assets' && (subCategory === 'email_accounts' || subCategory === 'computer_access' || subCategory === 'phone_access' || subCategory === 'cloud_storage')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account/Policy Type
              </label>
              {subCategory && accountTypes.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={accountType}
                    onChange={(e) => {
                      setAccountType(e.target.value)
                      if (e.target.value !== '__custom__') {
                        setCustomAccountType('')
                      }
                    }}
                    className="input-field"
                  >
                    <option value="">Select account/policy type</option>
                    {accountTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                    <option value="__custom__">Other (Enter manually)</option>
                  </select>
                  {accountType === '__custom__' && (
                    <input
                      type="text"
                      value={customAccountType}
                      onChange={(e) => setCustomAccountType(e.target.value)}
                      className="input-field"
                      placeholder="Enter custom account/policy type"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="input-field"
                  placeholder={loadingAccountTypes ? "Loading types..." : "e.g., Checking, Life Insurance"}
                  disabled={loadingAccountTypes}
                />
              )}
              {!subCategory && (
                <p className="text-xs text-gray-500 mt-1">
                  Select a sub-category first to see account type options
                </p>
              )}
            </div>
          )}

          {!(category === 'digital_assets' && (subCategory === 'email_accounts' || subCategory === 'computer_access' || subCategory === 'phone_access' || subCategory === 'cloud_storage')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number {category !== 'digital_assets' && '*'}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="input-field"
                placeholder="Enter account or policy number"
                required={category !== 'digital_assets'}
              />
            </div>
          )}

          {/* Liability-specific fields */}
          {category === 'liabilities' && subCategory && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount
                </label>
                <input
                  type="text"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="input-field"
                  placeholder="e.g., $250,000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate
                </label>
                <input
                  type="text"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 3.5% or 0.035"
                />
              </div>

              {subCategory === 'mortgage' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Term
                    </label>
                    <input
                      type="text"
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(e.target.value)}
                      className="input-field"
                      placeholder="e.g., 30 years, 15 years"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Payment
                    </label>
                    <input
                      type="text"
                      value={monthlyPayment}
                      onChange={(e) => setMonthlyPayment(e.target.value)}
                      className="input-field"
                      placeholder="e.g., $1,200"
                    />
                  </div>
                </>
              )}

              {subCategory === 'loans' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term Length
                  </label>
                  <input
                    type="text"
                    value={termLength}
                    onChange={(e) => setTermLength(e.target.value)}
                    className="input-field"
                    placeholder="e.g., 5 years, 60 months"
                  />
                </div>
              )}
            </>
          )}

          {/* Email account-specific fields */}
          {category === 'digital_assets' && subCategory === 'email_accounts' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="e.g., user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable-password"
                      checked={passwordEnabled}
                      onChange={(e) => {
                        setPasswordEnabled(e.target.checked)
                        if (!e.target.checked) {
                          setPassword('')
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enable-password" className="ml-2 text-sm text-gray-700">
                      Enable password field
                    </label>
                  </div>
                  {passwordEnabled && (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ <strong>Warning:</strong> Saving passwords in the system is not recommended for security reasons. 
                          Consider using a dedicated password manager instead.
                        </p>
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        placeholder="Enter password (not recommended)"
                      />
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recovery Email
                </label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="input-field"
                  placeholder="e.g., recovery@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Recovery email</strong> is an alternate email address linked to this account for password recovery. 
                  By documenting this instead of the password, you can share access without revealing sensitive credentials. 
                  Account owners can reset their password via the recovery email when needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  placeholder="Enter any additional notes about this email account"
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Computer access-specific fields */}
          {category === 'digital_assets' && subCategory === 'computer_access' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name *
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Living Room Desktop, John's Laptop"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The name or description of the computer or device
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User *
                </label>
                <input
                  type="text"
                  value={computerUser}
                  onChange={(e) => setComputerUser(e.target.value)}
                  className="input-field"
                  placeholder="e.g., john_admin, administrator"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The username for logging into this device
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showComputerPassword ? "text" : "password"}
                    value={computerPassword}
                    onChange={(e) => setComputerPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter device password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowComputerPassword(!showComputerPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-900"
                  >
                    {showComputerPassword ? (
                      <span className="text-sm">Hide</span>
                    ) : (
                      <span className="text-sm">Show</span>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password will be obfuscated when viewing the asset
                </p>
              </div>
            </>
          )}

          {/* Phone access-specific fields */}
          {category === 'digital_assets' && subCategory === 'phone_access' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Name *
                </label>
                <input
                  type="text"
                  value={phoneName}
                  onChange={(e) => setPhoneName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., John's iPhone, Mom's Samsung"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The name or description of the phone
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Owner *
                </label>
                {loadingFamilyMembers ? (
                  <div className="input-field text-gray-500">Loading family members...</div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={phoneOwner}
                      onChange={(e) => {
                        setPhoneOwner(e.target.value)
                        if (e.target.value !== '__custom__') {
                          setCustomPhoneOwner('')
                        }
                      }}
                      className="input-field"
                      required={!customPhoneOwner}
                    >
                      <option value="">Select phone owner</option>
                      {familyMembers.map((member) => (
                        <option key={member.id} value={member.name}>
                          {member.name}
                        </option>
                      ))}
                      <option value="__custom__">Someone else</option>
                    </select>
                    {phoneOwner === '__custom__' && (
                      <input
                        type="text"
                        value={customPhoneOwner}
                        onChange={(e) => setCustomPhoneOwner(e.target.value)}
                        className="input-field"
                        placeholder="Enter phone owner name"
                        required
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPhonePassword ? "text" : "password"}
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter phone password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPhonePassword(!showPhonePassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-900"
                  >
                    {showPhonePassword ? (
                      <span className="text-sm">Hide</span>
                    ) : (
                      <span className="text-sm">Show</span>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password will be obfuscated when viewing the asset
                </p>
              </div>

              {/* Identification Methods */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Identification Methods</h3>
                  <button
                    type="button"
                    onClick={addIdentificationMethod}
                    className="btn-secondary text-sm"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Method
                  </button>
                </div>
                
                {identificationMethods.length > 0 && (
                  <div className="space-y-4">
                    {identificationMethods.map((method, index) => (
                      <div key={method.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Method {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeIdentificationMethod(method.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Method Type
                            </label>
                            <select
                              value={method.method}
                              onChange={(e) => {
                                const newMethod = e.target.value as 'biometrics' | 'screen_lock'
                                updateIdentificationMethod(method.id, 'method', newMethod)
                                // Reset type when method changes
                                if (newMethod === 'biometrics') {
                                  updateIdentificationMethod(method.id, 'type', 'fingerprint_scan')
                                } else {
                                  updateIdentificationMethod(method.id, 'type', 'pin')
                                }
                              }}
                              className="input-field text-sm"
                            >
                              <option value="biometrics">Biometrics</option>
                              <option value="screen_lock">Screen Lock</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {method.method === 'biometrics' ? 'Biometric Type' : 'Screen Lock Type'}
                            </label>
                            {method.method === 'biometrics' ? (
                              <select
                                value={method.type}
                                onChange={(e) => updateIdentificationMethod(method.id, 'type', e.target.value)}
                                className="input-field text-sm"
                              >
                                <option value="fingerprint_scan">Fingerprint Scan</option>
                                <option value="facial_recognition">Facial Recognition</option>
                                <option value="iris_retinal_scan">Iris/Retinal Scan</option>
                                <option value="voice_recognition">Voice Recognition</option>
                              </select>
                            ) : (
                              <select
                                value={method.type}
                                onChange={(e) => updateIdentificationMethod(method.id, 'type', e.target.value)}
                                className="input-field text-sm"
                              >
                                <option value="pin">PIN</option>
                                <option value="pattern">Pattern</option>
                              </select>
                            )}
                          </div>

                          {method.method === 'screen_lock' && method.type === 'pin' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                PIN
                              </label>
                              <input
                                type="password"
                                value={method.pinValue || ''}
                                onChange={(e) => updateIdentificationMethod(method.id, 'pinValue', e.target.value)}
                                className="input-field text-sm"
                                placeholder="Enter PIN (4-6 digits)"
                                pattern="[0-9]{4,6}"
                                maxLength={6}
                                inputMode="numeric"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {identificationMethods.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No identification methods added yet. Click "Add Method" to add one.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Cloud storage-specific fields */}
          {category === 'digital_assets' && subCategory === 'cloud_storage' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cloud Storage Provider *
                </label>
                {subCategory && providers.length > 0 ? (
                  <select
                    value={cloudProvider}
                    onChange={(e) => setCloudProvider(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select a cloud storage provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.name}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="input-field text-gray-500">Loading providers...</div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Choose from the most common cloud storage providers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username / Email *
                </label>
                <input
                  type="text"
                  value={cloudUsername}
                  onChange={(e) => setCloudUsername(e.target.value)}
                  className="input-field"
                  placeholder="e.g., user@example.com or username"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The username or email address used to access this cloud storage account
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showCloudPassword ? "text" : "password"}
                    value={cloudPassword}
                    onChange={(e) => setCloudPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCloudPassword(!showCloudPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-900"
                  >
                    {showCloudPassword ? (
                      <span className="text-sm">Hide</span>
                    ) : (
                      <span className="text-sm">Show</span>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password will be obfuscated when viewing the asset
                </p>
              </div>
            </>
          )}

          {/* Custom Fields */}
          {!(category === 'digital_assets' && (subCategory === 'email_accounts' || subCategory === 'computer_access' || subCategory === 'phone_access' || subCategory === 'cloud_storage')) && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h3>
              
              {customFields.length > 0 && (
                <div className="space-y-2 mb-4">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{field.name}:</span>
                        <span className="text-sm text-gray-900 ml-2">{field.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.name)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="input-field"
                  placeholder="Field name"
                />
                <input
                  type="text"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="input-field"
                  placeholder="Field value"
                />
              </div>
              <button
                type="button"
                onClick={addCustomField}
                disabled={!newFieldName || !newFieldValue}
                className="mt-2 btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Custom Field
              </button>
            </div>
          )}

          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {asset ? 'Update Asset' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}