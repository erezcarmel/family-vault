'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faHeartPulse, faTimes, faTrash, faEdit, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import type { FamilyMember, HealthcareRecord, HealthcareProviderType } from '@/types'

export const dynamic = 'force-dynamic'

const providerTypes: { id: HealthcareProviderType; title: string }[] = [
  { id: 'primary_care', title: 'Primary Care' },
  { id: 'specialist', title: 'Specialist' },
  { id: 'pharmacy', title: 'Pharmacy' },
  { id: 'dental', title: 'Dental' },
  { id: 'vision', title: 'Vision' },
]

export default function Healthcare() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [healthcareRecords, setHealthcareRecords] = useState<HealthcareRecord[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<HealthcareRecord | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: family } = await supabase
          .from('families')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (family) {
          setFamilyId(family.id)
          await loadMembers(family.id)
          await loadHealthcareData(family.id)
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
      .order('name')

    if (error) {
      console.error('Error loading members:', error)
    } else {
      setMembers(data || [])
    }
  }

  const loadHealthcareData = async (familyId: string) => {
    const recordsResult = await supabase
      .from('healthcare_records')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (recordsResult.error) {
      console.error('Error loading healthcare records:', recordsResult.error)
      setHealthcareRecords([])
      return
    }

    const records = recordsResult.data || []
    setHealthcareRecords(records)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this healthcare record?')) return

    try {
      const { error } = await supabase
        .from('healthcare_records')
        .delete()
        .eq('id', id)

      if (error) throw error
      if (familyId) await loadHealthcareData(familyId)
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete healthcare record. Please try again.')
    }
  }

  const handleEdit = (record: HealthcareRecord) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faHeartPulse} className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Healthcare</h1>
            <p className="text-gray-600">Manage healthcare information for your family</p>
          </div>
        </div>

        {members.length > 0 && (
          <button
            onClick={handleAddNew}
            className="btn-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Healthcare Record
          </button>
        )}
      </div>

      {members.length === 0 ? (
        <div className="text-center py-20 card">
          <FontAwesomeIcon icon={faHeartPulse} className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Family Members</h3>
          <p className="text-gray-600 mb-6">
            Add family members first to manage their healthcare information.
          </p>
        </div>
      ) : (
        <>
          {/* Filter by Provider Type */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {/* All filter */}
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-pink-400 hover:bg-pink-50'
                }`}
              >
                <span className="font-medium">All</span>
                <span className="ml-2 text-sm opacity-75">({healthcareRecords.length})</span>
              </button>

              {/* Provider type filters */}
              {providerTypes.map((pt) => {
                const count = healthcareRecords.filter(r => r.provider_type === pt.id).length
                return (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedFilter(pt.id)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      selectedFilter === pt.id
                        ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                        : 'bg-white text-gray-900 border-gray-200 hover:border-pink-400 hover:bg-pink-50'
                    }`}
                  >
                    <span className="font-medium">{pt.title}</span>
                    <span className="ml-2 text-sm opacity-75">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Healthcare Records Grid */}
          {(() => {
            const filteredRecords = selectedFilter === 'all' 
              ? healthcareRecords 
              : healthcareRecords.filter(r => r.provider_type === selectedFilter)
            
            return filteredRecords.length === 0 ? (
              <div className="text-center py-12 card">
                <FontAwesomeIcon icon={faHeartPulse} className="text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {healthcareRecords.length === 0 ? 'No Healthcare Records Yet' : 'No Records in This Category'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {healthcareRecords.length === 0 
                    ? 'Start by adding your first healthcare provider'
                    : 'Try selecting a different category or add a new record'
                  }
                </p>
                <button
                  onClick={handleAddNew}
                  className="btn-primary"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  {healthcareRecords.length === 0 ? 'Add Your First Record' : 'Add Record'}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecords.map((record) => (
                  <HealthcareCard
                    key={record.id}
                    record={record}
                    member={members.find(m => m.id === record.member_id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )
          })()}
        </>
      )}

      <HealthcareModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRecord(null)
        }}
        onSave={async () => {
          if (familyId) {
            await loadHealthcareData(familyId)
          }
          setIsModalOpen(false)
          setEditingRecord(null)
        }}
        record={editingRecord}
        members={members}
        familyId={familyId}
      />
    </div>
  )
}

interface HealthcareCardProps {
  record: HealthcareRecord
  member: FamilyMember | undefined
  onEdit: (record: HealthcareRecord) => void
  onDelete: (id: string) => void
}

function HealthcareCard({ record, member, onEdit, onDelete }: HealthcareCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasDetails = record.doctor_name || record.specialty || record.phone || record.email || 
                     record.address || record.policy_number || record.group_number || record.notes

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{record.provider_name || 'Healthcare Provider'}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {providerTypes.find(pt => pt.id === record.provider_type)?.title || record.provider_type}
          </p>
          {member && (
            <p className="text-xs text-gray-500 mt-1">{member.name}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(record)}
            className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            onClick={() => onDelete(record.id)}
            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>

      {hasDetails && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <span>View Details</span>
            <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-4">
              {record.doctor_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="text-gray-900 font-medium">{record.doctor_name}</span>
                </div>
              )}
              {record.specialty && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Specialty:</span>
                  <span className="text-gray-900 font-medium">{record.specialty}</span>
                </div>
              )}
              {record.phone && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phone:</span>
                  <span className="text-gray-900 font-medium">{record.phone}</span>
                </div>
              )}
              {record.email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900 font-medium">{record.email}</span>
                </div>
              )}
              {record.address && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Address:</span>
                  <span className="text-gray-900 font-medium text-right">
                    {record.address}
                    {record.city && `, ${record.city}`}
                    {record.state && `, ${record.state}`}
                    {record.zip_code && ` ${record.zip_code}`}
                  </span>
                </div>
              )}
              {record.policy_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Policy #:</span>
                  <span className="text-gray-900 font-medium">{record.policy_number}</span>
                </div>
              )}
              {record.group_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Group #:</span>
                  <span className="text-gray-900 font-medium">{record.group_number}</span>
                </div>
              )}
              {record.notes && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-sm">
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-gray-900 mt-1">{record.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface HealthcareModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  record: HealthcareRecord | null
  members: FamilyMember[]
  familyId: string | null
}

function HealthcareModal({ isOpen, onClose, onSave, record, members, familyId }: HealthcareModalProps) {
  const [memberId, setMemberId] = useState<string>('')
  const [providerType, setProviderType] = useState<HealthcareProviderType>('primary_care')
  const [providerName, setProviderName] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  const [groupNumber, setGroupNumber] = useState('')
  const [notes, setNotes] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      if (record) {
        setMemberId(record.member_id)
        setProviderType(record.provider_type as HealthcareProviderType)
        setProviderName(record.provider_name || '')
        setDoctorName(record.doctor_name || '')
        setSpecialty(record.specialty || '')
        setPhone(record.phone || '')
        setEmail(record.email || '')
        setAddress(record.address || '')
        setCity(record.city || '')
        setState(record.state || '')
        setZipCode(record.zip_code || '')
        setPolicyNumber(record.policy_number || '')
        setGroupNumber(record.group_number || '')
        setNotes(record.notes || '')
      } else {
        resetForm()
      }
    }
  }, [isOpen, record])

  const resetForm = () => {
    setMemberId(members.length > 0 ? members[0].id : '')
    setProviderType('primary_care')
    setProviderName('')
    setDoctorName('')
    setSpecialty('')
    setPhone('')
    setEmail('')
    setAddress('')
    setCity('')
    setState('')
    setZipCode('')
    setPolicyNumber('')
    setGroupNumber('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!memberId || !familyId) return

    if (!providerName.trim()) {
      alert('Please enter a provider name')
      return
    }

    try {
      let recordId: string

      if (record) {
        const { error: updateError } = await supabase
          .from('healthcare_records')
          .update({
            provider_id: null,
            provider_name: providerName.trim(),
            provider_type: providerType,
            doctor_name: doctorName || null,
            specialty: specialty || null,
            phone: phone || null,
            email: email || null,
            address: address || null,
            city: city || null,
            state: state || null,
            zip_code: zipCode || null,
            policy_number: policyNumber || null,
            group_number: groupNumber || null,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id)

        if (updateError) throw updateError
        recordId = record.id
      } else {
        const { data, error: insertError } = await supabase
          .from('healthcare_records')
          .insert({
            family_id: familyId,
            member_id: memberId,
            provider_id: null,
            provider_name: providerName.trim(),
            provider_type: providerType,
            doctor_name: doctorName || null,
            specialty: specialty || null,
            phone: phone || null,
            email: email || null,
            address: address || null,
            city: city || null,
            state: state || null,
            zip_code: zipCode || null,
            policy_number: policyNumber || null,
            group_number: groupNumber || null,
            notes: notes || null,
          })
          .select()
          .single()

        if (insertError) throw insertError
        recordId = data.id
      }

      resetForm()
      onSave()
    } catch (error) {
      console.error('Error saving healthcare record:', error)
      alert('Failed to save healthcare record. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-white/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {record ? 'Edit Healthcare Record' : 'Add Healthcare Record'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!record && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family Member *
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a family member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Type *
            </label>
            <select
              value={providerType}
              onChange={(e) => {
                setProviderType(e.target.value as HealthcareProviderType)
              }}
              className="input-field"
              required
            >
              {providerTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Name *
            </label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="input-field"
              placeholder="Enter provider name"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="input-field"
                placeholder="Dr. John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialty
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="input-field"
                placeholder="Cardiology, Pediatrics, etc."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="doctor@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
              placeholder="123 Main St"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-field"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input-field"
                placeholder="NY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="input-field"
                placeholder="10001"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Number
              </label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="input-field"
                placeholder="Insurance policy number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Number
              </label>
              <input
                type="text"
                value={groupNumber}
                onChange={(e) => setGroupNumber(e.target.value)}
                className="input-field"
                placeholder="Insurance group number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {record ? 'Update Record' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
