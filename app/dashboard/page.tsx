'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDollarSign,
  faShieldAlt,
  faHandHoldingDollar,
  faHeartPulse,
  faLaptop,
  faFileAlt,
  faArrowRight,
  faEdit,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'
import type { Family } from '@/types'

export const dynamic = 'force-dynamic'

const assetSections = [
  {
    id: 'money-accounts',
    title: 'Money Accounts',
    icon: faDollarSign,
    description: 'Manage your checking, savings, and investment accounts',
    color: 'bg-green-500',
  },
  {
    id: 'insurance',
    title: 'Insurance',
    icon: faShieldAlt,
    description: 'Track your life, home, and health insurance policies',
    color: 'bg-blue-500',
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: faFileAlt,
    description: 'Upload and manage important documents',
    color: 'bg-purple-500',
  },
  {
    id: 'liabilities',
    title: 'Liabilities',
    icon: faHandHoldingDollar,
    description: 'Coming soon',
    color: 'bg-red-500',
    disabled: true,
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    icon: faHeartPulse,
    description: 'Manage healthcare records, medications, and providers for your family',
    color: 'bg-pink-500',
  },
  {
    id: 'digital-assets',
    title: 'Digital Assets',
    icon: faLaptop,
    description: 'Coming soon',
    color: 'bg-purple-500',
    disabled: true,
  },
]

export default function Dashboard() {
  const [family, setFamily] = useState<Family | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingFamilyName, setEditingFamilyName] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [savingFamilyName, setSavingFamilyName] = useState(false)
  const [familyMembersCount, setFamilyMembersCount] = useState(0)
  const [activeAccountsCount, setActiveAccountsCount] = useState(0)
  const [totalAssetsCount, setTotalAssetsCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('families')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        setFamily(data)
        
        // Load statistics if family exists
        if (data?.id) {
          await loadStatistics(data.id)
        }
      }
    } catch (error) {
      console.error('Error loading family:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async (familyId: string) => {
    try {
      // Load family members count
      const { count: membersCount } = await supabase
        .from('family_members')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
      
      setFamilyMembersCount(membersCount || 0)

      // Load active accounts count (money_accounts + insurance + liabilities)
      const { count: activeAccounts } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .in('category', ['money_accounts', 'insurance', 'liabilities'])
      
      setActiveAccountsCount(activeAccounts || 0)

      // Load total assets count (all categories)
      const { count: totalAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
      
      setTotalAssetsCount(totalAssets || 0)
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  const handleEditFamilyName = () => {
    setNewFamilyName(family?.family_name || '')
    setEditingFamilyName(true)
  }

  const handleSaveFamilyName = async () => {
    if (!family || !newFamilyName.trim()) return

    setSavingFamilyName(true)

    try {
      const { error } = await supabase
        .from('families')
        .update({ family_name: newFamilyName.trim() })
        .eq('id', family.id)

      if (error) throw error

      setFamily({ ...family, family_name: newFamilyName.trim() })
      setEditingFamilyName(false)
    } catch (error) {
      console.error('Error updating family name:', error)
      alert('Failed to update family name. Please try again.')
    } finally {
      setSavingFamilyName(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingFamilyName(false)
    setNewFamilyName('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {editingFamilyName ? (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-3xl font-bold text-gray-900">The</span>
              <input
                type="text"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                className="input-field text-3xl font-bold py-1 px-3 max-w-md"
                placeholder="Family Name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveFamilyName()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
              />
              <span className="text-3xl font-bold text-gray-900">Family</span>
              <button
                onClick={handleSaveFamilyName}
                disabled={savingFamilyName || !newFamilyName.trim()}
                className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                title="Save"
              >
                <FontAwesomeIcon icon={faCheck} className="text-xl" />
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={savingFamilyName}
                className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Cancel"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900">
                {family?.family_name ? `The ${family.family_name} Family` : `Welcome back, ${family?.main_user || 'User'}!`}
              </h1>
              <button
                onClick={handleEditFamilyName}
                className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                title={family?.family_name ? 'Edit family name' : 'Add family name'}
              >
                <FontAwesomeIcon icon={faEdit} className="text-lg" />
              </button>
            </>
          )}
        </div>
        {!editingFamilyName && (
          <p className="text-gray-600 mt-2">
            Manage your family's assets and important documents in one secure place.
          </p>
        )}
      </div>

      {/* Asset Sections Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assetSections.map((section) => (
          <Link
            key={section.id}
            href={section.disabled ? '#' : `/dashboard/${section.id}`}
            className={`
              card hover:shadow-lg transition-all duration-200 relative
              ${section.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 cursor-pointer'}
            `}
            onClick={(e) => section.disabled && e.preventDefault()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center`}>
                <FontAwesomeIcon icon={section.icon} className="text-white text-xl" />
              </div>
              {!section.disabled && (
                <FontAwesomeIcon icon={faArrowRight} className="text-gray-400" />
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {section.title}
            </h2>
            <p className="text-gray-600 text-sm">
              {section.description}
            </p>

            {section.disabled && (
              <div className="absolute top-4 right-4 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                Coming Soon
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100">
          <div className="text-sm text-indigo-600 font-medium mb-1">Total Assets</div>
          <div className="text-2xl font-bold text-indigo-900">{totalAssetsCount}</div>
        </div>
        
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-sm text-green-600 font-medium mb-1">Active Accounts</div>
          <div className="text-2xl font-bold text-green-900">{activeAccountsCount}</div>
        </div>
        
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-sm text-purple-600 font-medium mb-1">Family Members</div>
          <div className="text-2xl font-bold text-purple-900">{familyMembersCount}</div>
        </div>
      </div>
    </div>
  )
}

