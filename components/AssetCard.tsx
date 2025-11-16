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

  // Get custom fields (all fields except the main ones)
  const customFields = Object.entries(asset.data).filter(
    ([key]) => !['provider_name', 'account_type', 'account_number'].includes(key)
  )

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{asset.data.provider_name}</h3>
          {asset.data.account_type && (
            <p className="text-sm text-gray-600 mt-1">{asset.data.account_type}</p>
          )}
          {asset.data.account_number && (
            <p className="text-xs text-gray-500 mt-1">Account: ****{asset.data.account_number.slice(-4)}</p>
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

      {customFields.length > 0 && (
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

