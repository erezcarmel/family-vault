'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faUpload, faSpinner, faFile } from '@fortawesome/free-solid-svg-icons'
import type { Document } from '@/types'

interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  familyId: string | null
  document?: Document | null
}

export default function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  familyId,
  document
}: UploadDocumentModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (document) {
      setTitle(document.title)
      setDescription(document.description || '')
      setSelectedFile(null)
    } else {
      resetForm()
    }
  }, [document, isOpen])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setSelectedFile(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!familyId) {
      alert('Family ID not found')
      return
    }

    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    // If editing, only title and description can be updated
    if (document) {
      await handleUpdate()
      return
    }

    // For new uploads, file is required
    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      // Create unique file path
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('family-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      setUploadProgress(50)

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          family_id: familyId,
          title: title.trim(),
          description: description.trim() || null,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type || 'application/octet-stream',
        })

      if (dbError) {
        // If database insert fails, delete the uploaded file
        await supabase.storage
          .from('family-documents')
          .remove([filePath])
        throw dbError
      }

      setUploadProgress(100)
      onSuccess()
      resetForm()
    } catch (error: any) {
      console.error('Error uploading document:', error)
      alert(`Failed to upload document: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleUpdate = async () => {
    if (!document) return

    setUploading(true)

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', document.id)

      if (error) throw error

      onSuccess()
      resetForm()
    } catch (error: any) {
      console.error('Error updating document:', error)
      alert(`Failed to update document: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {document ? 'Edit Document Details' : 'Upload Document'}
          </h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload - Only show for new uploads */}
          {!document && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              {selectedFile ? (
                <div className="border-2 border-indigo-200 bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faFile} className="text-indigo-600 text-2xl" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faUpload} className="text-4xl text-gray-400 mb-3" />
                  <p className="text-gray-700 font-medium">Click to select a file</p>
                  <p className="text-sm text-gray-500 mt-1">Max file size: 50MB</p>
                </button>
              )}
            </div>
          )}

          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g., Passport Copy, House Insurance Policy"
              required
              disabled={uploading}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/200 characters
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[100px]"
              placeholder="Add any additional details or notes about this document..."
              disabled={uploading}
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-indigo-900">
                  {document ? 'Updating...' : 'Uploading...'}
                </span>
                <span className="text-sm text-indigo-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !title.trim() || (!document && !selectedFile)}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                  {document ? 'Updating...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={document ? faTimes : faUpload} className="mr-2" />
                  {document ? 'Update Details' : 'Upload Document'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

