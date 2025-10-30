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

interface AssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (assetType: string, data: any) => void
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
  const supabase = createClient()

  useEffect(() => {
    if (asset) {
      setProviderName(asset.data.provider_name)
      setAccountType(asset.data.account_type)
      setAccountNumber(asset.data.account_number)
      setSubCategory(asset.type as AssetType)
      
      // Extract custom fields
      const customData = Object.entries(asset.data)
        .filter(([key]) => !['provider_name', 'account_type', 'account_number'].includes(key))
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

  const handleDocumentDataExtracted = (data: any) => {
    // Set main fields
    if (data.provider_name) setProviderName(data.provider_name)
    if (data.account_type) setAccountType(data.account_type)
    if (data.account_number) setAccountNumber(data.account_number)

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

    if (!finalProviderName) {
      alert('Please enter a provider name')
      return
    }

    if (!finalAccountType) {
      alert('Please enter an account/policy type')
      return
    }

    // Build data object
    const data: any = {
      provider_name: finalProviderName,
      account_type: finalAccountType,
      account_number: accountNumber,
    }

    // Add custom fields
    customFields.forEach(field => {
      data[field.name] = field.value
    })

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
          <DocumentScanner
            category={category}
            subCategory={subCategory}
            onDataExtracted={handleDocumentDataExtracted}
          />

          <div className="border-t border-gray-200 pt-2"></div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account/Policy Type *
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
                  required
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
                    required
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
                required
              />
            )}
            {!subCategory && (
              <p className="text-xs text-gray-500 mt-1">
                Select a sub-category first to see account type options
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="input-field"
              placeholder="Enter account or policy number"
              required
            />
          </div>

          {/* Custom Fields */}
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

