'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faLaptop } from '@fortawesome/free-solid-svg-icons'
import AssetCard from '@/components/AssetCard'
import AssetModal from '@/components/AssetModal'
import type { Asset, AssetType } from '@/types'

export const dynamic = 'force-dynamic'

const subCategories: { id: AssetType; title: string }[] = [
  { id: 'email_accounts', title: 'Email Accounts' },
  { id: 'computer_access', title: 'Computer Access' },
  { id: 'phone_access', title: 'Phone Access' },
  { id: 'cloud_storage', title: 'Cloud Storage' },
]

export default function DigitalAssets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
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
      .eq('category', 'digital_assets')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading assets:', error)
    } else {
      setAssets(data || [])
    }
  }

  const handleSave = async (assetType: string, data: Record<string, unknown>) => {
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
            category: 'digital_assets',
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
      alert('Failed to save asset. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

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
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faLaptop} className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Digital Assets</h1>
            <p className="text-gray-600">Manage your digital assets and accounts</p>
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className="btn-primary"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Digital Asset
        </button>
      </div>

      {/* Filter by Sub-Category */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {/* All filter */}
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-gray-900 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          >
            <span className="font-medium">All</span>
            <span className="ml-2 text-sm opacity-75">({assets.length})</span>
          </button>

          {/* Category filters */}
          {subCategories.map((sub) => {
            const count = assets.filter(a => a.type === sub.id).length
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedFilter(sub.id)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedFilter === sub.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                <span className="font-medium">{sub.title}</span>
                <span className="ml-2 text-sm opacity-75">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Assets Grid */}
      {(() => {
        const filteredAssets = selectedFilter === 'all' 
          ? assets 
          : assets.filter(a => a.type === selectedFilter)
        
        return filteredAssets.length === 0 ? (
          <div className="text-center py-12 card">
            <FontAwesomeIcon icon={faLaptop} className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {assets.length === 0 ? 'No Digital Assets Yet' : 'No Assets in This Category'}
            </h3>
            <p className="text-gray-600 mb-6">
              {assets.length === 0 
                ? 'Start by adding your first digital asset'
                : 'Try selecting a different category or add a new asset'
              }
            </p>
            <button
              onClick={handleAddNew}
              className="btn-primary"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {assets.length === 0 ? 'Add Your First Asset' : 'Add Asset'}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      })()}

      <AssetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAsset(null)
        }}
        onSave={handleSave}
        asset={editingAsset}
        subCategories={subCategories}
        category="digital_assets"
      />
    </div>
  )
}

