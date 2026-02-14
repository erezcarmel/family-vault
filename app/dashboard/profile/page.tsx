'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faEnvelope, faShieldAlt, faUsers, faCalendar } from '@fortawesome/free-solid-svg-icons'
import PageHeader from '@/components/PageHeader'
import { getFamilyId, getUserRole } from '@/lib/db-helpers-client'
import type { UserRole } from '@/types'

export default function Profile() {
  const [userEmail, setUserEmail] = useState<string>('')
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [familyName, setFamilyName] = useState<string>('')
  const [createdAt, setCreatedAt] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserEmail(user.email || '')
        setCreatedAt(user.created_at || '')

        const familyId = await getFamilyId(supabase)
        if (familyId) {
          const role = await getUserRole(supabase, familyId)
          setUserRole(role)

          const { data: family } = await supabase
            .from('families')
            .select('family_name')
            .eq('id', familyId)
            .single()

          if (family) {
            setFamilyName(family.family_name || '')
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getRoleLabel = (role: UserRole | null) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'editor':
        return 'Editor'
      case 'member':
        return 'Member'
      default:
        return 'Unknown'
    }
  }

  const getRoleColor = (role: UserRole | null) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'editor':
        return 'bg-blue-100 text-blue-800'
      case 'member':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <PageHeader
          title="My Profile"
          description="View your account information"
          icon={faUser}
          iconBgClassName="bg-indigo-600"
        />
      </div>

      <div className="card">
        <div className="space-y-6">
          <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-indigo-600 text-3xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{userEmail}</h2>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(userRole)}`}>
                {getRoleLabel(userRole)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                <p className="text-gray-900 font-medium">{userEmail || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faShieldAlt} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Role</p>
                <p className="text-gray-900 font-medium">{getRoleLabel(userRole)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faUsers} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Family Name</p>
                <p className="text-gray-900 font-medium">{familyName || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCalendar} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Account Created</p>
                <p className="text-gray-900 font-medium">{formatDate(createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

