import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'

const SWATCHES = [
  '#000000', '#ffffff', '#6b7280', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
]

const isValidHex = (h: string) => /^#[0-9a-fA-F]{6}$/.test(h)

interface Props {
  value: string
  onChange: (color: string) => void
  title?: string
  /** If true, wraps onMouseDown with e.preventDefault() to keep editor focus */
  keepFocus?: boolean
  /** If true, renders the trigger button in dark style (for bubble menu) */
  dark?: boolean
}

export function ColorPicker({ value, onChange, title, keepFocus, dark }: Props) {
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setHex(value) }, [value])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const commit = (color: string) => {
    setHex(color)
    onChange(color)
  }

  const md = keepFocus
    ? (e: React.MouseEvent) => e.preventDefault()
    : undefined

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => {
          if (keepFocus) e.preventDefault()
          setOpen((o) => !o)
        }}
        className={`flex items-center gap-1 px-1.5 py-0.5 border rounded cursor-pointer transition-colors ${
        dark ? 'border-gray-600 hover:border-gray-400' : 'border-gray-400 hover:border-gray-500'
      }`}
      >
        <span
          className="w-3.5 h-3.5 rounded-sm border border-gray-300 shrink-0"
          style={{ backgroundColor: isValidHex(value) ? value : '#000000' }}
        />
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 w-56"
          onMouseDown={md}
        >
          <HexColorPicker color={isValidHex(hex) ? hex : '#000000'} onChange={commit} style={{ width: '100%' }} />
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-gray-400">#</span>
            <input
              type="text"
              maxLength={6}
              value={hex.replace('#', '')}
              onChange={(e) => {
                const v = `#${e.target.value}`
                setHex(v)
                if (isValidHex(v)) onChange(v)
              }}
              className="flex-1 text-xs border border-gray-300 rounded px-1.5 py-0.5 font-mono focus:outline-none focus:border-gray-500"
            />
          </div>
          <div className="grid grid-cols-5 gap-1 mt-2">
            {SWATCHES.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => {
                  if (keepFocus) e.preventDefault()
                  commit(s)
                  setOpen(false)
                }}
                className="w-6 h-6 rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: s }}
                title={s}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
