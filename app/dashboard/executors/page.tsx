'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faEnvelope, faPlus, faTrash, faUserTie, faEdit, faKey, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import PageHeader from '@/components/PageHeader'
import type { Executor } from '@/types'
import { getFamilyId, isAdmin } from '@/lib/db-helpers-client'

export const dynamic = 'force-dynamic'

export default function Executors() {
  const [executors, setExecutors] = useState<Executor[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingExecutor, setEditingExecutor] = useState<Executor | null>(null)
  const [newExecutor, setNewExecutor] = useState({
    name: '',
    email: '',
    password: '',
    relationship_description: '',
  })
  const [saving, setSaving] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      const fid = await getFamilyId(supabase)
      if (fid) {
        setFamilyId(fid)
        const isAdminUser = await isAdmin(supabase, fid)
        setCanManage(isAdminUser)
        if (isAdminUser) {
          await loadExecutors(fid)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExecutors = async (familyId: string) => {
    const { data, error } = await supabase
      .from('executors')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading executors:', error)
    } else {
      setExecutors(data || [])
    }
  }

  const handleAddExecutor = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!familyId) return

    try {
      setSaving(true)

      // Use server-side API for secure password hashing
      const response = await fetch('/api/executors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          executor_id: editingExecutor?.id,
          name: newExecutor.name,
          email: newExecutor.email,
          password: newExecutor.password,
          relationship_description: newExecutor.relationship_description,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save executor')
      }

      await loadExecutors(familyId)
      setNewExecutor({ name: '', email: '', password: '', relationship_description: '' })
      setIsAdding(false)
      setEditingExecutor(null)
    } catch (error: unknown) {
      console.error('Error saving executor:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save executor. Please try again.'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleEditExecutor = (executor: Executor) => {
    setEditingExecutor(executor)
    setNewExecutor({
      name: executor.name,
      email: executor.email,
      password: '', // Don't pre-fill password for security
      relationship_description: executor.relationship_description,
    })
    setIsAdding(true)
  }

  const handleDeleteExecutor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this executor? They will lose access to the system.')) return

    try {
      const { error } = await supabase
        .from('executors')
        .delete()
        .eq('id', id)

      if (error) throw error
      if (familyId) await loadExecutors(familyId)
    } catch (error) {
      console.error('Error deleting executor:', error)
      alert('Failed to delete executor. Please try again.')
    }
  }

  const cancelEdit = () => {
    setIsAdding(false)
    setEditingExecutor(null)
    setNewExecutor({ name: '', email: '', password: '', relationship_description: '' })
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

  if (!canManage) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card text-center py-12">
          <FontAwesomeIcon icon={faUserTie} className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You need admin permissions to manage executors.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <PageHeader
          title="Executors"
          description="Manage people with read-only access to your family vault"
          icon={faUserTie}
          iconBgClassName="bg-teal-500"
          onAddClick={() => setIsAdding(!isAdding)}
          addButtonLabel="Add Executor"
        />
      </div>

      {/* Info Box */}
      <div className="card mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 text-xl mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Executors</h3>
            <p className="text-sm text-blue-800">
              Executors are trusted individuals who have read-only access to your family vault. 
              They cannot modify any information or change their password. Common examples include 
              estate executors, trusted advisors, or family friends who may need access to your information.
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Executor Form */}
      {isAdding && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingExecutor ? 'Edit Executor' : 'Add Executor'}
          </h2>
          <form onSubmit={handleAddExecutor} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={newExecutor.name}
                    onChange={(e) => setNewExecutor({ ...newExecutor, name: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Executor name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={newExecutor.email}
                    onChange={(e) => setNewExecutor({ ...newExecutor, email: e.target.value })}
                    className="input-field pl-10"
                    placeholder="executor@example.com"
                    required
                    disabled={editingExecutor != null}
                  />
                </div>
                {editingExecutor && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed after creation</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {editingExecutor ? '(leave blank to keep current)' : <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faKey} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={newExecutor.password}
                    onChange={(e) => setNewExecutor({ ...newExecutor, password: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Enter password"
                    required={!editingExecutor}
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {editingExecutor 
                    ? 'Only you (admin) can set/change the password' 
                    : 'Minimum 8 characters. Only you can set this password.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newExecutor.relationship_description}
                  onChange={(e) => setNewExecutor({ ...newExecutor, relationship_description: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Uncle, Dad's friend, Estate lawyer"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Describe who this person is</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : (editingExecutor ? 'Update Executor' : 'Add Executor')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Executors Grid */}
      {executors.length === 0 ? (
        <div className="text-center py-12 card">
          <FontAwesomeIcon icon={faUserTie} className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Executors Yet</h3>
          <p className="text-gray-600 mb-6">Add trusted individuals who need read-only access to your family vault</p>
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Your First Executor
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {executors.map((executor) => (
            <div key={executor.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-teal-200">
                    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                      <FontAwesomeIcon icon={faUserTie} className="text-white text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{executor.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{executor.relationship_description}</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-1" />
                    {executor.email}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Read-Only Access
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEditExecutor(executor)}
                    className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="Edit executor"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => handleDeleteExecutor(executor.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete executor"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
