import { useRef, useState } from 'react'
import { ImageCropModal } from './ImageCropModal'

interface Props {
  imageUrl: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ imageUrl, onChange, label = 'image' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<File | undefined>(undefined)

  const openCrop = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setCropFile(file)
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) openCrop(file)
  }

  const handleCropDone = (url: string) => {
    setCropSrc(null)
    setCropFile(undefined)
    onChange(url)
  }

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="max-h-32 rounded border border-gray-300 object-contain"
          />
          <div className="absolute top-1 right-1 flex gap-1">
            <button
              type="button"
              onClick={() => setCropSrc(imageUrl)}
              className="bg-white border border-gray-400 rounded px-1.5 py-0.5 text-xs text-gray-600 cursor-pointer hover:text-gray-900 hover:border-gray-600 transition-colors flex items-center gap-1"
              title="Edit / crop image"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white border border-gray-400 rounded px-1.5 py-0.5 text-xs text-gray-600 cursor-pointer hover:text-gray-900 hover:border-gray-600 transition-colors"
              title="Replace image"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => { if (window.confirm('Remove this image?')) onChange('') }}
              className="bg-white border border-gray-400 rounded p-0.5 text-gray-500 cursor-pointer hover:text-red-500 hover:border-red-300 transition-colors"
              title="Remove image"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-md p-4 text-center transition-colors cursor-pointer ${
            dragging
              ? 'border-gray-400 bg-gray-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-400 mb-1">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-xs text-gray-500">
            Drop {label} here or <span className="text-gray-700 font-medium">browse</span>
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) openCrop(file)
          e.target.value = ''
        }}
      />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          originalFile={cropFile}
          onDone={handleCropDone}
          onCancel={() => { setCropSrc(null); setCropFile(undefined) }}
        />
      )}
    </div>
  )
}
