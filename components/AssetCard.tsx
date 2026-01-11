'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import type { Asset } from '@/types'

interface AssetCardProps {
  asset: Asset
  onEdit: (asset: Asset) => void
  onDelete: (id: string) => void
}

export default function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if this is an email account
  const isEmailAccount = asset.category === 'digital_assets' && asset.type === 'email_accounts'
  
  // Get custom fields (all fields except the main ones and liability-specific ones and email-specific ones)
  const customFields = Object.entries(asset.data).filter(
    ([key]) => !['provider_name', 'account_type', 'account_number', 'loan_amount', 'interest_rate', 'loan_term', 'monthly_payment', 'term_length', 'email', 'password', 'recovery_email', 'notes'].includes(key)
  )
  
  // Check if this is a liability
  const isLiability = asset.category === 'liabilities'
  const liabilityFields: Array<[string, string]> = []
  if (isLiability) {
    if (asset.data.loan_amount) liabilityFields.push(['Loan Amount', asset.data.loan_amount])
    if (asset.data.interest_rate) liabilityFields.push(['Interest Rate', asset.data.interest_rate])
    if (asset.data.loan_term) liabilityFields.push(['Loan Term', asset.data.loan_term])
    if (asset.data.monthly_payment) liabilityFields.push(['Monthly Payment', asset.data.monthly_payment])
    if (asset.data.term_length) liabilityFields.push(['Term Length', asset.data.term_length])
  }
  
  // Number of liability fields to show in main card (rest go to expandable section)
  const PRIMARY_LIABILITY_FIELDS_COUNT = 2

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEmailAccount ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900">{asset.data.email}</h3>
              {asset.data.recovery_email && (
                <p className="text-sm text-gray-600 mt-1">Recovery: {asset.data.recovery_email}</p>
              )}
              {asset.data.password && (
                <p className="text-xs text-gray-500 mt-1">Password: ••••••••</p>
              )}
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900">{asset.data.provider_name}</h3>
              <p className="text-sm text-gray-600 mt-1">{asset.data.account_type}</p>
              <p className="text-xs text-gray-500 mt-1">Account: ****{asset.data.account_number?.slice(-4)}</p>
              {isLiability && asset.data.loan_amount && (
                <p className="text-sm font-medium text-gray-900 mt-2">Amount: {asset.data.loan_amount}</p>
              )}
              {isLiability && asset.data.interest_rate && (
                <p className="text-xs text-gray-600 mt-1">Rate: {asset.data.interest_rate}</p>
              )}
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(asset)}
            className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            onClick={() => onDelete(asset.id)}
            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>

      {(customFields.length > 0 || liabilityFields.length > PRIMARY_LIABILITY_FIELDS_COUNT || (isEmailAccount && asset.data.notes)) && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <span>Additional Details</span>
            <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-4">
              {isLiability && liabilityFields.slice(PRIMARY_LIABILITY_FIELDS_COUNT).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{key}:</span>
                  <span className="text-gray-900 font-medium">{String(value)}</span>
                </div>
              ))}
              {isEmailAccount && asset.data.notes && (
                <div className="text-sm">
                  <span className="text-gray-600 block mb-1">Notes:</span>
                  <span className="text-gray-900 whitespace-pre-wrap">{String(asset.data.notes)}</span>
                </div>
              )}
              {customFields.map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{key}:</span>
                  <span className="text-gray-900 font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

