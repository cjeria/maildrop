import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_MAX_FILE_SIZE_BYTES,
  CLOUDINARY_ALLOWED_FORMATS,
} from '../config'

const NATIVELY_SUPPORTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

async function normaliseToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Conversion failed')); return }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.92)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')) }
    img.src = url
  })
}

export async function uploadToCloudinary(file: File): Promise<string> {
  if (file.size > CLOUDINARY_MAX_FILE_SIZE_BYTES) {
    throw new Error('File too large. Maximum size is 10MB.')
  }

  if (!file.type.startsWith('image/') && !CLOUDINARY_ALLOWED_FORMATS.includes(file.name.split('.').pop()?.toLowerCase() ?? '')) {
    throw new Error('File type not allowed.')
  }

  const uploadFile = NATIVELY_SUPPORTED.includes(file.type) ? file : await normaliseToJpeg(file)

  const formData = new FormData()
  formData.append('file', uploadFile)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? 'Upload failed')
  return data.secure_url as string
}
