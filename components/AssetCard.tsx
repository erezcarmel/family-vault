'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faChevronDown, faChevronUp, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { checkEmailRecoveryStatus, isEmailField, isValidEmail } from '@/lib/email-recovery-checker'
import { detectSocialNetwork } from '@/lib/social-network-detector'
import type { Asset } from '@/types'

interface AssetCardProps {
  asset: Asset
  onEdit: (asset: Asset) => void
  onDelete: (id: string) => void
}

export default function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailRecoveryStatus, setEmailRecoveryStatus] = useState<Record<string, { hasEmailAsset: boolean; hasRecoveryEmail: boolean }>>({})
  const supabase = createClient()

  // Check if this is a digital asset email account
  const isEmailAccount = asset.category === 'digital_assets' && asset.type === 'email_accounts'
  
  // Check if this is a computer access asset
  const isComputerAccess = asset.category === 'digital_assets' && asset.type === 'computer_access'
  
  // Check if this is a phone access asset
  const isPhoneAccess = asset.category === 'digital_assets' && asset.type === 'phone_access'
  
  // Check if this is a cloud storage asset
  const isCloudStorage = asset.category === 'digital_assets' && asset.type === 'cloud_storage'
  
  // Check if this is a social accounts asset
  const isSocialAccount = asset.category === 'digital_assets' && asset.type === 'social_accounts'
  
  // Get custom fields (all fields except the main ones and liability-specific ones)
  const customFields = useMemo(() => {
    return Object.entries(asset.data).filter(
      ([key]) => !['provider_name', 'account_type', 'account_number', 'loan_amount', 'interest_rate', 'loan_term', 'monthly_payment', 'term_length', 'email', 'password', 'recovery_email', 'notes', 'device_name', 'computer_user', 'computer_password', 'phone_name', 'phone_owner', 'phone_pin', 'cloud_provider', 'cloud_username', 'cloud_password', 'social_profile_link', 'social_email', 'social_password'].includes(key)
    )
  }, [asset.data])
  
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

  // Check email recovery status for custom email fields (only for non-email assets)
  // Note: This runs when asset or customFields change. Since AssetCard displays saved data,
  // this typically only runs once on mount or when switching between assets, not during editing.
  useEffect(() => {
    if (isEmailAccount) return // Skip for email assets themselves

    const checkEmailFields = async () => {
      // Find all email fields first
      const emailFieldsToCheck = customFields.filter(
        ([key, value]) => isEmailField(key) && isValidEmail(String(value))
      )
      
      // For social accounts, also check the social_email field
      if (isSocialAccount && asset.data.social_email && isValidEmail(asset.data.social_email)) {
        emailFieldsToCheck.push(['social_email', asset.data.social_email])
      }
      
      if (emailFieldsToCheck.length === 0) {
        setEmailRecoveryStatus({})
        return
      }

      // Check all email fields in parallel for better performance
      const statusChecks = emailFieldsToCheck.map(async ([key, value]) => {
        const status = await checkEmailRecoveryStatus(
          supabase,
          asset.family_id,
          String(value)
        )
        return { fieldName: key, status }
      })

      const results = await Promise.all(statusChecks)
      
      // Convert results to status map
      const statusMap: Record<string, { hasEmailAsset: boolean; hasRecoveryEmail: boolean }> = {}
      results.forEach(({ fieldName, status }) => {
        statusMap[fieldName] = status
      })
      
      setEmailRecoveryStatus(statusMap)
    }

    checkEmailFields()
  }, [asset, customFields, isEmailAccount, supabase, isSocialAccount])

  // Format type for display (e.g. "email_accounts" -> "Email Accounts")
  const typeLabel = asset.type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex text-xs font-medium text-indigo-800">
          {typeLabel}
        </span>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEmailAccount ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900">{asset.data.email}</h3>
              <p className="text-sm text-gray-600 mt-1">Email Account</p>
              {asset.data.recovery_email && (
                <p className="text-xs text-gray-500 mt-1">Recovery: {asset.data.recovery_email}</p>
              )}
            </>
          ) : isComputerAccess ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900">{asset.data.device_name}</h3>
              <p className="text-sm text-gray-600 mt-1">Computer Access</p>
              {asset.data.computer_user && (
                <p className="text-xs text-gray-500 mt-1">User: {asset.data.computer_user}</p>
              )}
              {asset.data.computer_password && (
                <div className="mt-2 flex items-center space-x-2">
                  <p className="text-xs text-gray-500">
                    Password: {showPassword ? asset.data.computer_password : '••••••••'}
                  </p>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
            </>
          ) : isPhoneAccess ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900">{asset.data.phone_name}</h3>
              <p className="text-sm text-gray-600 mt-1">Mobile Phone</p>
              {asset.data.phone_owner && (
                <p className="text-xs text-gray-500 mt-1">Owner: {asset.data.phone_owner}</p>
              )}
              {asset.data.phone_pin && (
                <div className="mt-2 flex items-center space-x-2">
                  <p className="text-xs text-gray-500">
                    PIN Code: {showPassword ? asset.data.phone_pin : '••••••••'}
                  </p>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
            </>
          ) : isCloudStorage ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900">{asset.data.cloud_provider}</h3>
              <p className="text-sm text-gray-600 mt-1">Cloud Storage</p>
              {asset.data.cloud_username && (
                <p className="text-xs text-gray-500 mt-1">Username: {asset.data.cloud_username}</p>
              )}
              {asset.data.cloud_password && (
                <div className="mt-2 flex items-center space-x-2">
                  <p className="text-xs text-gray-500">
                    Password: {showPassword ? asset.data.cloud_password : '••••••••'}
                  </p>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
            </>
          ) : isSocialAccount ? (
            <>
              {asset.data.social_profile_link && (() => {
                const network = detectSocialNetwork(asset.data.social_profile_link)
                return (
                  <div className="flex items-center space-x-2">
                    {network && (
                      <span className="text-2xl" title={network.name}>
                        {network.logo}
                      </span>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {network ? network.name : 'Social Account'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{asset.data.social_email}</p>
                    </div>
                  </div>
                )
              })()}
              {!asset.data.social_profile_link && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900">Social Account</h3>
                  <p className="text-sm text-gray-600 mt-1">{asset.data.social_email}</p>
                </>
              )}
              {asset.data.social_password && (
                <div className="mt-2 flex items-center space-x-2">
                  <p className="text-xs text-gray-500">
                    Password: {showPassword ? asset.data.social_password : '••••••••'}
                  </p>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900">{asset.data.provider_name}</h3>
              <p className="text-sm text-gray-600 mt-1">{asset.data.account_type}</p>
              {asset.data.account_number && (
                <p className="text-xs text-gray-500 mt-1">Account: ****{asset.data.account_number.slice(-4)}</p>
              )}
            </>
          )}
          {isLiability && asset.data.loan_amount && (
            <p className="text-sm font-medium text-gray-900 mt-2">Amount: {asset.data.loan_amount}</p>
          )}
          {isLiability && asset.data.interest_rate && (
            <p className="text-xs text-gray-600 mt-1">Rate: {asset.data.interest_rate}</p>
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

      {(customFields.length > 0 || liabilityFields.length > PRIMARY_LIABILITY_FIELDS_COUNT || (isEmailAccount && asset.data.notes) || (isSocialAccount && asset.data.social_profile_link)) && (
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
              {isSocialAccount && asset.data.social_profile_link && (
                <div className="text-sm">
                  <span className="text-gray-600">Profile Link:</span>
                  <a 
                    href={asset.data.social_profile_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 underline block mt-1 break-all"
                  >
                    {asset.data.social_profile_link}
                  </a>
                </div>
              )}
              {isSocialAccount && asset.data.social_email && (() => {
                const emailStatus = emailRecoveryStatus['social_email']
                const shouldShowWarning = emailStatus && (!emailStatus.hasEmailAsset || !emailStatus.hasRecoveryEmail)
                
                return shouldShowWarning ? (
                  <div className="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <FontAwesomeIcon 
                      icon={faExclamationTriangle} 
                      className="text-red-600 mt-0.5 flex-shrink-0" 
                    />
                    <div className="text-xs text-red-700">
                      {!emailStatus.hasEmailAsset ? (
                        <p>
                          <strong>Warning:</strong> No email asset found for this email address. 
                          Consider adding it to Email Accounts first.
                        </p>
                      ) : (
                        <p>
                          <strong>Warning:</strong> The email asset for this address does not have a recovery email set. 
                          Consider adding a recovery email to the email asset.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null
              })()}
              {isLiability && liabilityFields.slice(PRIMARY_LIABILITY_FIELDS_COUNT).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{key}:</span>
                  <span className="text-gray-900 font-medium">{String(value)}</span>
                </div>
              ))}
              {isEmailAccount && asset.data.notes && (
                <div className="text-sm">
                  <span className="text-gray-600">Notes:</span>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{String(asset.data.notes)}</p>
                </div>
              )}
              {customFields.map(([key, value]) => {
                const isEmail = isEmailField(key) && isValidEmail(String(value))
                const emailStatus = emailRecoveryStatus[key]
                const shouldShowWarning = isEmail && emailStatus && (!emailStatus.hasEmailAsset || !emailStatus.hasRecoveryEmail)
                
                return (
                  <div key={key} className="flex justify-between text-sm items-center">
                    <span className="text-gray-600">{key}:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${shouldShowWarning ? 'text-red-600' : 'text-gray-900'}`}>
                        {String(value)}
                      </span>
                      {shouldShowWarning && (
                        <div className="group relative">
                          <FontAwesomeIcon 
                            icon={faExclamationTriangle} 
                            className="text-red-600 cursor-help"
                          />
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            {!emailStatus.hasEmailAsset ? (
                              'This email has no corresponding email asset. Without a recovery email, password recovery may not be possible.'
                            ) : (
                              'This email asset exists but has no recovery email defined. Without a recovery email and password, account access may be lost.'
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

