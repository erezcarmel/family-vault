'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faFileAlt, faDownload, faTrash, faSpinner, faEdit } from '@fortawesome/free-solid-svg-icons'
import UploadDocumentModal from '@/components/UploadDocumentModal'
import type { Document } from '@/types'

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
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
          await loadDocuments(family.id)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async (familyId: string) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading documents:', error)
    } else {
      setDocuments(data || [])
    }
  }

  const handleDownload = async (doc: Document) => {
    setDownloadingId(doc.id)
    
    try {
      const { data, error } = await supabase.storage
        .from('family-documents')
        .download(doc.file_path)

      if (error) throw error

      // Create a download link
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Failed to download document. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('family-documents')
        .remove([doc.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)

      if (dbError) throw dbError

      if (familyId) await loadDocuments(familyId)
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingDocument(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingDocument(null)
  }

  const handleUploadSuccess = () => {
    if (familyId) {
      loadDocuments(familyId)
    }
    handleModalClose()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️'
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return '📦'
    return '📄'
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
            <FontAwesomeIcon icon={faFileAlt} className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600">Upload and manage your important documents</p>
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className="btn-primary"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Upload Document
        </button>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12 card">
          <FontAwesomeIcon icon={faFileAlt} className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Documents Yet</h3>
          <p className="text-gray-600 mb-6">Start by uploading your first document</p>
          <button
            onClick={handleAddNew}
            className="btn-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div key={doc.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getFileIcon(doc.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                    <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</p>
                  </div>
                </div>
              </div>

              {doc.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>
              )}

              <div className="mb-4">
                <p className="text-xs text-gray-500 truncate" title={doc.file_name}>
                  {doc.file_name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="flex-1 text-sm px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {downloadingId === doc.id ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faDownload} />
                      <span>Download</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleEdit(doc)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Edit details"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Delete"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadDocumentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleUploadSuccess}
        familyId={familyId}
        document={editingDocument}
      />
    </div>
  )
}

