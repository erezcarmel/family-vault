'use client'

import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faSpinner, faTimes, faFile } from '@fortawesome/free-solid-svg-icons'

interface DocumentScannerProps {
  category: string
  subCategory: string
  onDataExtracted: (data: any) => void
}

export default function DocumentScanner({ category, subCategory, onDataExtracted }: DocumentScannerProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [scanningDocument, setScanningDocument] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [scanStatus, setScanStatus] = useState<string>('')
  const [scanCompleted, setScanCompleted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setScanStatus('')
      setScanCompleted(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const scanDocument = async (imageData: string) => {
    setScanningDocument(true)

    try {
      const response = await fetch('/api/scan-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageData,
          category: category,
          type: subCategory,
        }),
      })

      // Check if the response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, try to get the text for error reporting
        const text = await response.text()
        throw new Error(`Server error - please try again. If the problem persists, ensure your file is a valid PDF or image, and contact support. Details: ${text.substring(0, 100)}`)
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scan document')
      }

      // Pass extracted data to parent
      if (result.data) {
        onDataExtracted(result.data)
        setScanStatus('Document scanned successfully! Please review and edit the extracted data.')
        setScanCompleted(true)
      }
    } catch (error: any) {
      console.error('Error scanning document:', error)
      setScanStatus(`Failed to scan document: ${error.message}`)
    } finally {
      setScanningDocument(false)
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-indigo-900 flex items-center">
            <FontAwesomeIcon icon={faCamera} className="mr-2" />
            Smart Document Scanner
          </h3>
          <p className="text-xs text-indigo-700 mt-1">
            Upload a document to automatically extract information
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*;pdf/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="space-y-3">
        {uploadedImage && (
          <div className="border-2 border-indigo-200 bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faFile} className="text-indigo-600 text-2xl" />
                <div>
                  <p className="font-medium text-gray-900">{fileName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedImage(null)
                  setFileName('')
                  setScanStatus('')
                  setScanCompleted(false)
                }}
                className="text-red-600 hover:text-red-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!scanCompleted ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanningDocument}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCamera} className="mr-2" />
                {uploadedImage ? 'Change Document' : 'Upload Document'}
              </button>

              {uploadedImage && (
                <button
                  type="button"
                  onClick={() => scanDocument(uploadedImage)}
                  disabled={scanningDocument || !subCategory}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {scanningDocument ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCamera} className="mr-2" />
                      Scan Document
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-secondary"
            >
              <FontAwesomeIcon icon={faCamera} className="mr-2" />
              Change Document
            </button>
          )}
        </div>

        {!subCategory && uploadedImage && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Please select a sub-category first to enable document scanning
          </p>
        )}

        {scanStatus && (
          <p className={`text-xs rounded px-3 py-2 ${
            scanCompleted 
              ? 'text-green-700 bg-green-50 border border-green-200' 
              : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {scanStatus}
          </p>
        )}
      </div>
    </div>
  )
}

