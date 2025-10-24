'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faCake, faPlus, faTrash, faArrowRight } from '@fortawesome/free-solid-svg-icons'

interface FamilyMemberForm {
  name: string
  email: string
  relationship: string
}

export default function FamilyTree() {
  const [members, setMembers] = useState<FamilyMemberForm[]>([])
  const [currentMember, setCurrentMember] = useState<FamilyMemberForm>({
    name: '',
    email: '',
    relationship: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const relationshipOptions = [
    'Spouse',
    'Parent',
    'Child',
    'Sibling',
    'Grandparent',
    'Grandchild',
    'Aunt/Uncle',
    'Cousin',
    'Other',
  ]

  const addMember = () => {
    if (currentMember.name && currentMember.relationship) {
      setMembers([...members, currentMember])
      setCurrentMember({ name: '', email: '', relationship: '' })
    }
  }

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  const handleContinue = async () => {
    if (members.length === 0) {
      handleSkip()
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No user found')
      }

      // Get family ID
      const { data: family } = await supabase
        .from('families')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!family) {
        throw new Error('Family not found')
      }

      const membersToInsert = members.map(member => ({
        family_id: family.id,
        name: member.name,
        email: member.email || null,
        relationship: member.relationship,
      }))

      const { error } = await supabase
        .from('family_members')
        .insert(membersToInsert)

      if (error) throw error

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving family members')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Build Your Family Tree</h1>
          <p className="text-gray-600 mt-2">Add your family members (you can skip this and add them later)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Member Form */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Family Member</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={currentMember.name}
                    onChange={(e) => setCurrentMember({ ...currentMember, name: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Family member name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faCake} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={currentMember.email}
                    onChange={(e) => setCurrentMember({ ...currentMember, email: e.target.value })}
                    className="input-field pl-10"
                    placeholder="member@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </label>
                <select
                  id="relationship"
                  value={currentMember.relationship}
                  onChange={(e) => setCurrentMember({ ...currentMember, relationship: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select relationship</option>
                  {relationshipOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={addMember}
                disabled={!currentMember.name || !currentMember.relationship}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Member
              </button>
            </div>
          </div>

          {/* Family Members List */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Family Members ({members.length})
            </h2>
            
            {members.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FontAwesomeIcon icon={faUser} className="text-4xl mb-4" />
                <p>No family members added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.relationship}</p>
                      {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            type="button"
            onClick={handleSkip}
            className="btn-secondary"
          >
            Skip for Now
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (
              <>
                Continue to Dashboard
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

