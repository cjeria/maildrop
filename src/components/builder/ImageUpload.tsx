import { useRef, useState } from 'react'
import { uploadToCloudinary } from '../../utils/cloudinary'

interface Props {
  imageUrl: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ imageUrl, onChange, label = 'image' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadToCloudinary(file)
      onChange(url)
    } catch {
      setError('Upload failed. Check your Cloudinary config.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative group">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="max-h-32 rounded border border-gray-200 object-contain"
          />
          <button
            onClick={() => onChange('')}
            className="absolute top-1 right-1 bg-white border border-gray-300 rounded p-0.5 text-gray-500 cursor-pointer hover:text-red-500 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-all"
            title="Remove image"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
            uploading
              ? 'border-gray-200 bg-gray-50 cursor-wait'
              : dragging
              ? 'border-gray-400 bg-gray-50 cursor-pointer'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
          }`}
        >
          {uploading ? (
            <p className="text-xs text-gray-400">Uploading…</p>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-400 mb-1">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-xs text-gray-500">
                Drop {label} here or <span className="text-gray-700 font-medium">browse</span>
              </p>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
