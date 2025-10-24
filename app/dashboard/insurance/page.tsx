'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faShieldAlt } from '@fortawesome/free-solid-svg-icons'
import AssetCard from '@/components/AssetCard'
import AssetModal from '@/components/AssetModal'
import type { Asset, AssetType } from '@/types'

const subCategories: { id: AssetType; title: string }[] = [
  { id: 'life_insurance', title: 'Life Insurance' },
  { id: 'home_insurance', title: 'Home Insurance' },
  { id: 'health_insurance', title: 'Health Insurance' },
]

export default function Insurance() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const supabase = createClient()

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
          await loadAssets(family.id)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssets = async (familyId: string) => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('family_id', familyId)
      .eq('category', 'insurance')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading assets:', error)
    } else {
      setAssets(data || [])
    }
  }

  const handleSave = async (assetType: string, data: any) => {
    if (!familyId) return

    try {
      if (editingAsset) {
        // Update existing asset
        const { error } = await supabase
          .from('assets')
          .update({
            type: assetType,
            data: data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAsset.id)

        if (error) throw error
      } else {
        // Create new asset
        const { error } = await supabase
          .from('assets')
          .insert({
            family_id: familyId,
            category: 'insurance',
            type: assetType,
            data: data,
          })

        if (error) throw error
      }

      await loadAssets(familyId)
      setIsModalOpen(false)
      setEditingAsset(null)
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Failed to save insurance policy. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this insurance policy?')) return

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

      if (error) throw error
      if (familyId) await loadAssets(familyId)
    } catch (error) {
      console.error('Error deleting asset:', error)
    }
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingAsset(null)
    setIsModalOpen(true)
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
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faShieldAlt} className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Insurance</h1>
            <p className="text-gray-600">Manage your insurance policies</p>
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className="btn-primary"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Policy
        </button>
      </div>

      {/* Filter by Sub-Category */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {subCategories.map((sub) => {
            const count = assets.filter(a => a.type === sub.id).length
            return (
              <div
                key={sub.id}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg"
              >
                <span className="font-medium text-gray-900">{sub.title}</span>
                <span className="ml-2 text-sm text-gray-500">({count})</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <div className="text-center py-12 card">
          <FontAwesomeIcon icon={faShieldAlt} className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Insurance Policies Yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first insurance policy</p>
          <button
            onClick={handleAddNew}
            className="btn-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Your First Policy
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AssetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAsset(null)
        }}
        onSave={handleSave}
        asset={editingAsset}
        subCategories={subCategories}
        category="insurance"
      />
    </div>
  )
}
