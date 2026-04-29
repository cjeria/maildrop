import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { TextStyle, FontSize, FontFamily, BackgroundColor } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { useEffect, useCallback, useRef, useState } from 'react'
import { uploadToCloudinary } from '../../utils/cloudinary'
import { ColorPicker } from './ColorPicker'

const FONT_FAMILIES = ['Arial', 'Avenir', 'Georgia', 'Helvetica', 'Times New Roman', 'Trebuchet MS', 'Verdana']

const FONT_SIZES: { value: 'small' | 'normal' | 'large' | 'huge'; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'huge', label: 'Huge' },
]

interface Props {
  content: string
  onChange: (html: string) => void
  font?: string
  onFontChange?: (font: string) => void
  fontSize?: 'small' | 'normal' | 'large' | 'huge'
  onFontSizeChange?: (size: 'small' | 'normal' | 'large' | 'huge') => void
  fullToolbar?: boolean
}

const LinkedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      href: { default: null },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const { href, ...imgAttrs } = HTMLAttributes
    if (href) {
      return ['a', { href, target: '_blank', rel: 'noopener noreferrer' }, ['img', imgAttrs]]
    }
    return ['img', imgAttrs]
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (el) => {
          const img = el as HTMLElement
          const parent = img.parentElement
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') ?? '',
            href: parent?.tagName === 'A' ? parent.getAttribute('href') : null,
          }
        },
      },
    ]
  },
})

const VariableHighlight = Extension.create({
  name: 'variableHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variableHighlight'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = []
            const regex = /\{\{[^}]+\}\}/g
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return
              let match
              regex.lastIndex = 0
              while ((match = regex.exec(node.text)) !== null) {
                decorations.push(
                  Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                    style: 'background: #E6F1FB; color: #185FA5; border-radius: 4px; padding: 0 4px;',
                  })
                )
              }
            })
            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

function ToolbarDropdown({
  label, options, onSelect, dark,
}: {
  label: string
  options: { value: string; label: string }[]
  onSelect: (value: string) => void
  dark?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o) }}
        className={`flex items-center gap-0.5 text-xs border rounded px-1.5 py-0.5 cursor-pointer transition-colors max-w-[90px] ${
          dark
            ? 'border-gray-600 bg-transparent text-white hover:border-gray-400'
            : 'border-gray-400 bg-white text-gray-700 hover:border-gray-500'
        }`}
      >
        <span className="truncate">{label}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-0.5 bg-white border border-gray-400 rounded shadow-lg z-50 min-w-[80px] max-h-52 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(opt.value); setOpen(false) }}
              className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Btn({
  onClick, active, title, children, dark,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode; dark?: boolean
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`px-1.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
        dark
          ? active ? 'bg-white text-gray-900' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          : active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />
}

export function RichTextEditor({ content, onChange, font, onFontChange, fontSize, onFontSizeChange, fullToolbar }: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [, forceUpdate] = useState(0)
  const [localFont, setLocalFont] = useState('Arial')
  const [localFontSize, setLocalFontSize] = useState<'small' | 'normal' | 'large' | 'huge'>('normal')

  const effectiveFont = font ?? localFont
  const effectiveFontChange = onFontChange ?? setLocalFont
  const effectiveFontSize = fontSize ?? localFontSize
  const effectiveFontSizeChange = onFontSizeChange ?? setLocalFontSize

  const [imageToolbar, setImageToolbar] = useState<{ top: number; left: number; width: number } | null>(null)
  const [imageLinkHref, setImageLinkHref] = useState('')
  const imagePosRef = useRef<number | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LinkedImage.configure({ inline: false, allowBase64: true }),
      VariableHighlight,
      ...(fullToolbar ? [TextStyle, FontSize, FontFamily, BackgroundColor, Color] : []),
    ],
    content,
    onUpdate: ({ editor }) => { onChange(editor.getHTML()) },
    editorProps: { attributes: { class: 'tiptap' } },
  })


  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  useEffect(() => {
    if (!editor) return
    const onSel = () => forceUpdate((n) => n + 1)
    editor.on('selectionUpdate', onSel)
    return () => { editor.off('selectionUpdate', onSel) }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const handle = () => {
      const { selection } = editor.state
      if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
        imagePosRef.current = selection.from
        setImageLinkHref(selection.node.attrs.href ?? '')
        const dom = editor.view.nodeDOM(selection.from) as HTMLElement | null
        if (dom && containerRef.current) {
          const cRect = containerRef.current.getBoundingClientRect()
          const iRect = dom.getBoundingClientRect()
          setImageToolbar({ top: iRect.top - cRect.top, left: iRect.left - cRect.left, width: iRect.width })
        }
      } else {
        setImageToolbar(null)
        imagePosRef.current = null
      }
    }
    editor.on('selectionUpdate', handle)
    editor.on('transaction', handle)
    return () => {
      editor.off('selectionUpdate', handle)
      editor.off('transaction', handle)
    }
  }, [editor])

  const applyImageLink = useCallback((href: string) => {
    if (!editor || imagePosRef.current === null) return
    const node = editor.state.doc.nodeAt(imagePosRef.current)
    if (!node || node.type.name !== 'image') return
    const pos = imagePosRef.current
    editor.chain().command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, href: href.trim() || null })
      return true
    }).run()
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback(async (file: File) => {
    if (!editor) return
    setUploadingImage(true)
    try {
      const src = await uploadToCloudinary(file)
      editor.chain().focus().setImage({ src } as never).run()
    } catch {
      alert('Image upload failed. Check your Cloudinary config in src/config.ts.')
    } finally {
      setUploadingImage(false)
    }
  }, [editor])


  if (!editor) return null

  // Read font size directly from PM state — getAttributes misses range selections
  const getActiveFontSize = (): string => {
    const { state } = editor
    const { from, to, empty } = state.selection
    if (empty) {
      const marks = state.storedMarks ?? state.doc.resolve(from).marks()
      const mark = marks.find((m) => m.type.name === 'textStyle')
      return mark?.attrs.fontSize?.replace('px', '') ?? 'Size'
    }
    let found = ''
    state.doc.nodesBetween(from, to, (node) => {
      if (found || !node.isText) return
      const mark = node.marks.find((m) => m.type.name === 'textStyle')
      if (mark?.attrs.fontSize) found = String(mark.attrs.fontSize)
    })
    return found ? found.replace('px', '') : 'Size'
  }

  const currentStyle =
    editor.isActive('bold') && editor.isActive('italic') ? 'bold-italic'
    : editor.isActive('bold') ? 'bold'
    : editor.isActive('italic') ? 'italic'
    : 'regular'

  return (
    <div ref={containerRef} className="relative">
      {/* Floating image link toolbar */}
      {imageToolbar && (
        <div
          style={{
            position: 'absolute',
            top: imageToolbar.top,
            left: imageToolbar.left,
            width: Math.max(imageToolbar.width, 280),
            transform: 'translateY(calc(-100% - 6px))',
            zIndex: 50,
          }}
        >
          <div className="flex items-center gap-1 bg-gray-900 text-white rounded-md px-2 py-1.5 shadow-lg">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-400">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            <input
              ref={linkInputRef}
              type="url"
              placeholder="https://..."
              value={imageLinkHref}
              onChange={(e) => setImageLinkHref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyImageLink(imageLinkHref) }
                if (e.key === 'Escape') setImageToolbar(null)
              }}
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none min-w-0"
            />
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyImageLink(imageLinkHref)}
              className="text-xs px-2 py-0.5 bg-white text-gray-900 rounded cursor-pointer hover:bg-gray-200 transition-colors shrink-0 font-medium">
              Apply
            </button>
            {imageLinkHref && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setImageLinkHref(''); applyImageLink('') }}
                className="text-xs px-2 py-0.5 text-gray-400 rounded cursor-pointer hover:text-white transition-colors shrink-0" title="Remove link">
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      <div className="border border-gray-400 rounded-md overflow-hidden">
        <div className="flex items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-400 flex-wrap">
          {fullToolbar ? (
            <>
              {/* Font family */}
              <ToolbarDropdown
                label={editor.getAttributes('textStyle').fontFamily ?? 'Font'}
                options={FONT_FAMILIES.map((f) => ({ value: f, label: f }))}
                onSelect={(v) => editor.chain().focus().setFontFamily(v).run()}
              />

              {/* Style */}
              <ToolbarDropdown
                label={{ regular: 'Regular', bold: 'Bold', italic: 'Italic', 'bold-italic': 'Bold Italic' }[currentStyle]}
                options={[
                  { value: 'regular', label: 'Regular' },
                  { value: 'bold', label: 'Bold' },
                  { value: 'italic', label: 'Italic' },
                  { value: 'bold-italic', label: 'Bold Italic' },
                ]}
                onSelect={(v) => {
                  const bold = v === 'bold' || v === 'bold-italic'
                  const italic = v === 'italic' || v === 'bold-italic'
                  let ch = bold ? editor.chain().focus().setBold() : editor.chain().focus().unsetBold()
                  ch = italic ? ch.setItalic() : ch.unsetItalic()
                  ch.run()
                }}
              />

              {/* Font size */}
              <ToolbarDropdown
                label={getActiveFontSize()}
                options={[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72].map((s) => ({ value: `${s}px`, label: `${s}` }))}
                onSelect={(v) => editor.chain().focus().setFontSize(v).run()}
              />

              {/* Text color */}
              <ColorPicker
                value={editor.getAttributes('textStyle').color ?? '#000000'}
                onChange={(color) => editor.chain().focus().setColor(color).run()}
                title="Text color"
                keepFocus
              />


              <Sep />

              <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                <strong>B</strong>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                <em>I</em>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                <span className="underline">U</span>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                <span className="line-through">S</span>
              </Btn>

              <Sep />

              <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" />
                </svg>
              </Btn>
              <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="17" y1="12" x2="7" y2="12" /><line x1="19" y1="18" x2="5" y2="18" />
                </svg>
              </Btn>
              <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="7" y2="18" />
                </svg>
              </Btn>
              <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="3" y2="12" /><line x1="21" y1="18" x2="3" y2="18" />
                </svg>
              </Btn>

              <Sep />

              <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
                  <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
                  <path d="M4 6h1v4" stroke="currentColor" strokeWidth="1.5" /><path d="M4 10h2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6 14H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </Btn>
              <Btn onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Decrease indent">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="3" y2="18" />
                  <polyline points="7 8 3 12 7 16" />
                </svg>
              </Btn>
              <Btn onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Increase indent">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="3" y2="18" />
                  <polyline points="3 8 7 12 3 16" />
                </svg>
              </Btn>

              <Sep />

              <Btn onClick={setLink} active={editor.isActive('link')} title="Add link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </Btn>
              <Btn onClick={() => imageInputRef.current?.click()} title={uploadingImage ? 'Uploading…' : 'Add image'}>
                {uploadingImage ? <span className="text-gray-400">…</span> : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
              </Btn>
            </>
          ) : (
            <>
              {(onFontChange && font) && (
                <select
                  value={effectiveFont}
                  onChange={(e) => effectiveFontChange(e.target.value)}
                  className="text-xs border border-gray-400 rounded px-1 py-0.5 bg-white cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              )}
              {(onFontSizeChange && fontSize) && (
                <select
                  value={effectiveFontSize}
                  onChange={(e) => effectiveFontSizeChange(e.target.value as 'small' | 'normal' | 'large' | 'huge')}
                  className="text-xs border border-gray-400 rounded px-1 py-0.5 bg-white cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {FONT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              )}
              {(onFontChange || onFontSizeChange) && <Sep />}

              <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                <strong>B</strong>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                <em>I</em>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                <span className="underline">U</span>
              </Btn>

              <Sep />

              <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
                  <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
                  <path d="M4 6h1v4" stroke="currentColor" strokeWidth="1.5" /><path d="M4 10h2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6 14H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </Btn>

              <Sep />

              <Btn onClick={setLink} active={editor.isActive('link')} title="Link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </Btn>

              <Sep />

              <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" />
                </svg>
              </Btn>
              <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="17" y1="12" x2="7" y2="12" /><line x1="19" y1="18" x2="5" y2="18" />
                </svg>
              </Btn>
              <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="7" y2="18" />
                </svg>
              </Btn>

              <Sep />

              <Btn onClick={() => imageInputRef.current?.click()} title={uploadingImage ? 'Uploading…' : 'Insert image'}>
                {uploadingImage ? <span className="text-gray-400">…</span> : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
              </Btn>
            </>
          )}
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) insertImage(file)
            e.target.value = ''
          }}
        />

        {fullToolbar && (
          <BubbleMenu
            editor={editor}
            options={{ placement: 'top' }}
          >
            <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-lg px-1.5 py-1">
              <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                <strong>B</strong>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                <em>I</em>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                <span className="underline">U</span>
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                <span className="line-through">S</span>
              </Btn>

              <Sep />

              <ToolbarDropdown
                label={getActiveFontSize()}
                options={[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72].map((s) => ({ value: `${s}px`, label: `${s}` }))}
                onSelect={(v) => editor.chain().focus().setFontSize(v).run()}
              />

              <Sep />

              <ColorPicker
                value={editor.getAttributes('textStyle').color ?? '#000000'}
                onChange={(color) => editor.chain().focus().setColor(color).run()}
                title="Text color"
                keepFocus
              />

              <Sep />

              <Btn onClick={setLink} active={editor.isActive('link')} title="Link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </Btn>
            </div>
          </BubbleMenu>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
