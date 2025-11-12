'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faEnvelope, faPlus, faTrash, faUsers, faEdit, faCamera, faTimes } from '@fortawesome/free-solid-svg-icons'
import type { FamilyMember, FamilyConnection } from '@/types'

export const dynamic = 'force-dynamic'

export default function FamilyTree() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [connections, setConnections] = useState<FamilyConnection[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    relationship: '',
  })
  const [memberConnections, setMemberConnections] = useState<Array<{
    relatedMemberId: string
    relationshipType: string
  }>>([])
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
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

  const connectionTypes = [
    'Parent of',
    'Child of',
    'Spouse of',
    'Sibling of',
    'Grandparent of',
    'Grandchild of',
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get family ID
        const { data: family } = await supabase
          .from('families')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (family) {
          setFamilyId(family.id)
          await loadMembers(family.id)
          await loadConnections(family.id)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async (familyId: string) => {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading family members:', error)
    } else {
      setMembers(data || [])
    }
  }

  const loadConnections = async (familyId: string) => {
    const { data, error } = await supabase
      .from('family_connections')
      .select('*')
      .eq('family_id', familyId)

    if (error) {
      console.error('Error loading family connections:', error)
    } else {
      setConnections(data || [])
    }
  }

  const uploadImage = async (file: File, memberId: string): Promise<string | null> => {
    try {
      setUploadingImage(true)
      
      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${familyId}/${memberId}-${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('family-member-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('family-member-photos')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const deleteOldImage = async (imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/family-member-photos/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage
          .from('family-member-photos')
          .remove([filePath])
      }
    } catch (error) {
      console.error('Error deleting old image:', error)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!familyId) return

    try {
      let memberId: string
      let imageUrl: string | null = null

      // Upload image if a new one was selected
      if (uploadedImageFile) {
        // If editing and there's an old image, delete it first
        if (editingMember?.image_url) {
          await deleteOldImage(editingMember.image_url)
        }
      }

      if (editingMember) {
        memberId = editingMember.id

        // Upload new image if provided
        if (uploadedImageFile) {
          imageUrl = await uploadImage(uploadedImageFile, memberId)
        }

        // Update existing member
        const updateData: any = {
          name: newMember.name,
          email: newMember.email || null,
          relationship: newMember.relationship,
        }

        if (imageUrl) {
          updateData.image_url = imageUrl
        }

        const { error } = await supabase
          .from('family_members')
          .update(updateData)
          .eq('id', editingMember.id)

        if (error) throw error

        // Delete existing connections for this member
        await supabase
          .from('family_connections')
          .delete()
          .eq('member_id', memberId)
      } else {
        // Insert new member first to get ID
        const { data, error } = await supabase
          .from('family_members')
          .insert({
            family_id: familyId,
            name: newMember.name,
            email: newMember.email || null,
            relationship: newMember.relationship,
          })
          .select()
          .single()

        if (error) throw error
        memberId = data.id

        // Upload image if provided
        if (uploadedImageFile) {
          imageUrl = await uploadImage(uploadedImageFile, memberId)
          
          // Update member with image URL
          if (imageUrl) {
            await supabase
              .from('family_members')
              .update({ image_url: imageUrl })
              .eq('id', memberId)
          }
        }
      }

      // Insert connections
      if (memberConnections.length > 0) {
        const connectionsToInsert = memberConnections.map(conn => ({
          family_id: familyId,
          member_id: memberId,
          related_member_id: conn.relatedMemberId,
          relationship_type: conn.relationshipType,
        }))

        const { error: connError } = await supabase
          .from('family_connections')
          .insert(connectionsToInsert)

        if (connError) throw connError
      }

      await loadMembers(familyId)
      await loadConnections(familyId)
      setNewMember({ name: '', email: '', relationship: '' })
      setMemberConnections([])
      setUploadedImageFile(null)
      setImagePreview(null)
      setIsAdding(false)
      setEditingMember(null)
    } catch (error) {
      console.error('Error saving family member:', error)
    }
  }

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member)
    setNewMember({
      name: member.name,
      email: member.email || '',
      relationship: member.relationship,
    })

    // Set existing image preview
    if (member.image_url) {
      setImagePreview(member.image_url)
    }

    // Load existing connections for this member
    const existingConnections = connections
      .filter(conn => conn.member_id === member.id)
      .map(conn => ({
        relatedMemberId: conn.related_member_id,
        relationshipType: conn.relationship_type,
      }))
    
    setMemberConnections(existingConnections)
    setIsAdding(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUploadedImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setUploadedImageFile(null)
    setImagePreview(null)
  }

  const addConnection = () => {
    setMemberConnections([...memberConnections, { relatedMemberId: '', relationshipType: '' }])
  }

  const updateConnection = (index: number, field: 'relatedMemberId' | 'relationshipType', value: string) => {
    const updated = [...memberConnections]
    updated[index][field] = value
    setMemberConnections(updated)
  }

  const removeConnection = (index: number) => {
    setMemberConnections(memberConnections.filter((_, i) => i !== index))
  }

  const getMemberConnections = (memberId: string): FamilyConnection[] => {
    return connections.filter(conn => conn.member_id === memberId)
  }

  const getMemberName = (memberId: string): string => {
    return members.find(m => m.id === memberId)?.name || 'Unknown'
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this family member?')) return

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id)

      if (error) throw error
      if (familyId) await loadMembers(familyId)
    } catch (error) {
      console.error('Error deleting family member:', error)
    }
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faUsers} className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Tree</h1>
            <p className="text-gray-600">Manage your family members</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Member
        </button>
      </div>

      {/* Add/Edit Member Form */}
      {isAdding && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingMember ? 'Edit Family Member' : 'Add Family Member'}
          </h2>
          <form onSubmit={handleAddMember} className="space-y-6">
            {/* Image Upload Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100">
                    <img
                      src={imagePreview}
                      alt="Member preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-white text-4xl" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Upload a photo (max 5MB). Supports JPG, PNG, GIF.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Family member name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="member@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship
              </label>
              <select
                value={newMember.relationship}
                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select relationship</option>
                {relationshipOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false)
                  setEditingMember(null)
                  setNewMember({ name: '', email: '', relationship: '' })
                  setMemberConnections([])
                  setUploadedImageFile(null)
                  setImagePreview(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : (editingMember ? 'Update Member' : 'Add Member')}
              </button>
            </div>
            </div>

            {/* Connections Section */}
            {members.length > 0 && (
              <div className="md:col-span-3 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Family Connections (Optional)</h3>
                    <p className="text-sm text-gray-600">Define how this member is related to other family members</p>
                  </div>
                  <button
                    type="button"
                    onClick={addConnection}
                    className="btn-secondary text-sm"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Connection
                  </button>
                </div>

                {memberConnections.length > 0 && (
                  <div className="space-y-3">
                    {memberConnections.map((conn, index) => (
                      <div key={index} className="grid grid-cols-2 gap-3 items-end bg-gray-50 p-3 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            This member is:
                          </label>
                          <select
                            value={conn.relationshipType}
                            onChange={(e) => updateConnection(index, 'relationshipType', e.target.value)}
                            className="input-field text-sm"
                            required
                          >
                            <option value="">Select relationship</option>
                            {connectionTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Related to:
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={conn.relatedMemberId}
                              onChange={(e) => updateConnection(index, 'relatedMemberId', e.target.value)}
                              className="input-field text-sm flex-1"
                              required
                            >
                              <option value="">Select member</option>
                              {members
                                .filter(m => !editingMember || m.id !== editingMember.id)
                                .map((member) => (
                                  <option key={member.id} value={member.id}>
                                    {member.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeConnection(index)}
                              className="text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {memberConnections.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No connections added yet. Click "Add Connection" to define relationships.
                  </p>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Family Members Grid */}
      {members.length === 0 ? (
        <div className="text-center py-12 card">
          <FontAwesomeIcon icon={faUsers} className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Family Members Yet</h3>
          <p className="text-gray-600 mb-6">Start building your family tree</p>
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Your First Member
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-indigo-200">
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="text-white text-2xl" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{member.relationship}</p>
                  {member.email && (
                    <p className="text-xs text-gray-500 mt-1">{member.email}</p>
                  )}

                  {/* Display connections */}
                  {getMemberConnections(member.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Connections:</p>
                      <div className="space-y-1">
                        {getMemberConnections(member.id).map((conn) => (
                          <p key={conn.id} className="text-xs text-gray-600">
                            • {conn.relationship_type} <span className="font-medium">{getMemberName(conn.related_member_id)}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEditMember(member)}
                    className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="Edit member"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete member"
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
