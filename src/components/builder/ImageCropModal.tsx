import { useState, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { uploadToCloudinary } from '../../utils/cloudinary'

const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '2:3', value: 2 / 3 },
  { label: '9:16', value: 9 / 16 },
]

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  // Leave canvas background transparent — preserves PNG alpha channels
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/png')
  })
}

interface Props {
  imageSrc: string
  /** Original File object — if provided, "Skip crop" uploads it unmodified */
  originalFile?: File
  onDone: (url: string) => void
  onCancel: () => void
}

export function ImageCropModal({ imageSrc, originalFile, onDone, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspectIndex, setAspectIndex] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setUploading(true)
    setError(null)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      const file = new File([blob], 'cropped.png', { type: 'image/png' })
      const url = await uploadToCloudinary(file)
      onDone(url)
    } catch {
      setError('Upload failed. Please try again.')
      setUploading(false)
    }
  }

  const handleSkip = async () => {
    setUploading(true)
    setError(null)
    try {
      if (originalFile) {
        // Upload the untouched original file
        const url = await uploadToCloudinary(originalFile)
        onDone(url)
      } else {
        // Editing an existing image — just return the URL unchanged
        onDone(imageSrc)
      }
    } catch {
      setError('Upload failed. Please try again.')
      setUploading(false)
    }
  }

  const selectedAspect = ASPECT_RATIOS[aspectIndex]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[560px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Edit image</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full bg-gray-900" style={{ height: 340 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={selectedAspect.value ?? undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-4">
          {/* Aspect ratio */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 shrink-0">Aspect ratio</span>
            <div className="flex flex-wrap gap-1.5">
              {ASPECT_RATIOS.map((ar, i) => (
                <button
                  key={ar.label}
                  type="button"
                  onClick={() => setAspectIndex(i)}
                  className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                    aspectIndex === i
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-300 text-gray-600 hover:border-gray-500'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-10 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-gray-900"
            />
            <span className="text-xs text-gray-400 w-8 text-right">{zoom.toFixed(1)}×</span>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleSkip}
              disabled={uploading}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Skip crop
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={uploading}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={uploading}
                className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading && (
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                )}
                {uploading ? 'Uploading…' : 'Apply crop'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
