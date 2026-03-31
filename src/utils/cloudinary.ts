import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_MAX_FILE_SIZE_BYTES,
  CLOUDINARY_ALLOWED_FORMATS,
} from '../config'

export async function uploadToCloudinary(file: File): Promise<string> {
  if (file.size > CLOUDINARY_MAX_FILE_SIZE_BYTES) {
    throw new Error('File too large. Maximum size is 10MB.')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const mimeBase = file.type.split('/').pop()?.toLowerCase() ?? ''
  if (!CLOUDINARY_ALLOWED_FORMATS.includes(ext) && !CLOUDINARY_ALLOWED_FORMATS.includes(mimeBase)) {
    throw new Error('File type not allowed.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.secure_url as string
}
