import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AssetType, Provider, AccountType, CustomField, Asset } from '@/types'

interface AssetModalProps {
  asset?: Asset
  isOpen: boolean
  onClose: () => void
  onSave: (assetData: any) => void
  category: string
}

export default function AssetModal({
  asset,
  isOpen,
  onClose,
  onSave,
  category
}: AssetModalProps) {
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
      setAccountType(asset.data.account_type || '')
      setAccountNumber(asset.data.account_number || '')
      setSubCategory(asset.type as AssetType)
      const customData = Object.entries(asset.data)
        .filter(([key]) => !['provider_name', 'account_type', 'account_number'].includes(key))
        .map(([name, value]) => ({ name, value: String(value) }))
      setCustomFields(customData)
    } else {
      resetForm()
    }
  }, [asset, isOpen])

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

  if (!isOpen) return null

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="text-xl font-bold mb-4">{asset ? 'Edit Asset' : 'Add Asset'}</h2>
        <form
          onSubmit={e => {
            e.preventDefault()
            const data: any = {
              provider_name: providerName,
              // only include these fields if they have a value; otherwise omit
              ...(accountType ? { account_type: accountType } : {}),
              ...(accountNumber ? { account_number: accountNumber } : {}),
            }
            customFields.forEach(field => {
              data[field.name] = field.value
            })
            onSave({
              ...asset,
              data,
              type: subCategory,
            })
          }}
        >
          {/* Standard fields */}
          <div className="mb-2">
            <label className="block font-medium mb-1">Provider Name</label>
            <input
              type="text"
              value={providerName}
              onChange={e => setProviderName(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="mb-2">
            <label className="block font-medium mb-1">Account Type</label>
            <input
              type="text"
              value={accountType}
              onChange={e => setAccountType(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="mb-2">
            <label className="block font-medium mb-1">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              className="input-field"
            />
          </div>
          {/* Editable custom fields directly below last standard field */}
          {customFields.length > 0 &&
            customFields.map((field, idx) => (
              <div className="mb-2" key={field.name}>
                <label className="block font-medium mb-1">{field.name}</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={field.value}
                    onChange={e => {
                      const updatedFields = [...customFields]
                      updatedFields[idx] = { ...field, value: e.target.value }
                      setCustomFields(updatedFields)
                    }}
                    className="input-field flex-auto"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomField(field.name)}
                    className="ml-2 btn-secondary px-3 py-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          }

          {/* Custom Fields label and add action, always after all custom fields */}
          <div className="mt-4">
            <div className="font-semibold text-gray-900 mb-2">Custom Fields</div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Field name"
                value={newFieldName}
                onChange={e => setNewFieldName(e.target.value)}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Field value"
                value={newFieldValue}
                onChange={e => setNewFieldValue(e.target.value)}
                className="input-field"
              />
              <button
                type="button"
                onClick={addCustomField}
                className="btn-primary px-3 py-1"
              >
                Add
              </button>
            </div>
          </div>
          <div className="mt-6 flex space-x-2">
            <button type="submit" className="btn-primary">
              Save
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}