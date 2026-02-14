'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faPlus, faTrash, faEdit, faShieldAlt, faUserEdit, faUser, faEnvelope, faClock, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import PageHeader from '@/components/PageHeader'
import type { FamilyUser, UserRole, Invitation } from '@/types'
import { getFamilyId, isAdmin, getUserRole } from '@/lib/db-helpers-client'

export const dynamic = 'force-dynamic'

export default function UserManagement() {
  const [users, setUsers] = useState<FamilyUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [editingUser, setEditingUser] = useState<FamilyUser | null>(null)
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'member' as UserRole,
  })
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role: 'member' as UserRole,
  })
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const roleOptions: { value: UserRole; label: string; icon: any; description: string }[] = [
    { value: 'admin', label: 'Admin', icon: faShieldAlt, description: 'Can manage the family account' },
    { value: 'editor', label: 'Editor', icon: faUserEdit, description: 'Can update account data, cannot manage members' },
    { value: 'member', label: 'Member', icon: faUser, description: 'Can only view the data' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const fid = await getFamilyId(supabase)
        console.log('Users page - Family ID:', fid)
        if (fid) {
          setFamilyId(fid)
          const role = await getUserRole(supabase, fid)
          console.log('Users page - User role:', role)
          setCurrentUserRole(role)
          
          if (role === 'admin') {
            await loadUsers(fid)
            await loadInvitations(fid)
          } else {
            setError(`You do not have permission to manage users. Your role: ${role || 'none'}`)
          }
        } else {
          setError('No family found. Please complete onboarding first.')
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError(`Failed to load user data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async (fid: string) => {
    const { data, error } = await supabase
      .from('family_users')
      .select('*')
      .eq('family_id', fid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users')
      return
    }

    const usersWithEmail = await Promise.all(
      (data || []).map(async (fu: any) => {
        const response = await fetch(`/api/get-user-email?userId=${fu.user_id}`)
        const result = await response.json()
        return {
          ...fu,
          email: result.email || 'Unknown',
        }
      })
    )

    setUsers(usersWithEmail)
  }

  const loadInvitations = async (fid: string) => {
    const response = await fetch(`/api/invitations?familyId=${fid}`)
    const result = await response.json()
    if (result.success) {
      setInvitations(result.data || [])
    }
  }

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!familyId) return

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newInvitation.email,
          role: newInvitation.role,
          familyId: familyId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create invitation')
      }

      await loadInvitations(familyId)
      setNewInvitation({ email: '', role: 'member' })
      setIsInviting(false)
    } catch (err: any) {
      console.error('Error creating invitation:', err)
      setError(err.message || 'Failed to create invitation')
    }
  }

  const handleDeleteInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return

    try {
      const response = await fetch(`/api/invitations?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete invitation')
      }

      if (familyId) await loadInvitations(familyId)
    } catch (error) {
      console.error('Error deleting invitation:', error)
      alert('Failed to cancel invitation')
    }
  }

  const getInvitationLink = (token: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/auth/signup?token=${token}`
  }

  const copyInvitationLink = (token: string) => {
    const link = getInvitationLink(token)
    navigator.clipboard.writeText(link)
    alert('Invitation link copied to clipboard!')
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!familyId) return

    try {
      if (editingUser) {
        const { error: updateError } = await supabase
          .from('family_users')
          .update({ role: newUser.role })
          .eq('id', editingUser.id)

        if (updateError) throw updateError
      } else {
        const response = await fetch('/api/add-family-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: newUser.email,
            role: newUser.role,
            familyId: familyId,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || result.error || 'Failed to add user')
        }
      }

      await loadUsers(familyId)
      setNewUser({ email: '', role: 'member' })
      setIsAdding(false)
      setEditingUser(null)
    } catch (err: any) {
      console.error('Error saving user:', err)
      setError(err.message || 'Failed to save user')
    }
  }

  const handleEditUser = (user: FamilyUser) => {
    setEditingUser(user)
    setNewUser({
      email: user.email || '',
      role: user.role,
    })
    setIsAdding(true)
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user from your family?')) return

    try {
      const { error } = await supabase
        .from('family_users')
        .delete()
        .eq('id', id)

      if (error) throw error
      if (familyId) await loadUsers(familyId)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to remove user')
    }
  }

  const getRoleIcon = (role: UserRole) => {
    const roleOption = roleOptions.find(r => r.value === role)
    return roleOption?.icon || faUser
  }

  const getRoleLabel = (role: UserRole) => {
    const roleOption = roleOptions.find(r => r.value === role)
    return roleOption?.label || role
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

  if (currentUserRole !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card text-center py-12">
          <FontAwesomeIcon icon={faShieldAlt} className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You need admin permissions to manage users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title="User Management"
          description="Manage family members and their permissions"
          icon={faUsers}
          iconBgClassName="bg-purple-500"
          onAddClick={() => {
            setIsAdding(!isAdding)
            setIsInviting(false)
            setEditingUser(null)
            setNewUser({ email: '', role: 'member' })
            setError(null)
          }}
          addButtonLabel="Add User"
        />
        <button
          onClick={() => {
            setIsInviting(!isInviting)
            setIsAdding(false)
            setNewInvitation({ email: '', role: 'member' })
            setError(null)
          }}
          className="btn-secondary"
        >
          <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
          Invite User
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isInviting && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Invite Family Member
          </h2>
          <form onSubmit={handleCreateInvitation} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newInvitation.email}
                  onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                  className="input-field"
                  placeholder="user@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  They will receive an invitation link to sign up
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={newInvitation.role}
                  onChange={(e) => setNewInvitation({ ...newInvitation, role: e.target.value as UserRole })}
                  className="input-field"
                  required
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {roleOptions.find(r => r.value === newInvitation.role)?.description}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsInviting(false)
                  setNewInvitation({ email: '', role: 'member' })
                  setError(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      {isAdding && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingUser ? 'Edit User Role' : 'Add Family Member'}
          </h2>
          <form onSubmit={handleAddUser} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field"
                  placeholder="user@example.com"
                  required
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="input-field"
                  required
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {roleOptions.find(r => r.value === newUser.role)?.description}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false)
                  setEditingUser(null)
                  setNewUser({ email: '', role: 'member' })
                  setError(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingUser ? 'Update Role' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {invitations.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Invitations</h2>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon 
                      icon={invitation.status === 'pending' ? faClock : invitation.status === 'accepted' ? faCheckCircle : faTimesCircle} 
                      className={`text-lg ${
                        invitation.status === 'pending' ? 'text-yellow-600' : 
                        invitation.status === 'accepted' ? 'text-green-600' : 
                        'text-gray-400'
                      }`} 
                    />
                    <div>
                      <p className="font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-gray-600">
                        Role: {getRoleLabel(invitation.role)} • 
                        {invitation.status === 'pending' ? (
                          <span className="text-yellow-600"> Pending</span>
                        ) : invitation.status === 'accepted' ? (
                          <span className="text-green-600"> Accepted</span>
                        ) : (
                          <span className="text-gray-400"> {invitation.status}</span>
                        )}
                      </p>
                      {invitation.status === 'pending' && (
                        <button
                          onClick={() => copyInvitationLink(invitation.token)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 mt-1"
                        >
                          Copy invitation link
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {invitation.status === 'pending' && (
                  <button
                    onClick={() => handleDeleteInvitation(invitation.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Cancel invitation"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-12 card">
          <FontAwesomeIcon icon={faUsers} className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Yet</h3>
          <p className="text-gray-600 mb-6">Add family members to share access</p>
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Your First User
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <FontAwesomeIcon icon={getRoleIcon(user.role)} className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.email}</h3>
                      <p className="text-sm text-gray-600">{getRoleLabel(user.role)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {roleOptions.find(r => r.value === user.role)?.description}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="Edit role"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  {users.length > 1 && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove user"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

