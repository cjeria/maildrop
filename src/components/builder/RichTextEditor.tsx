import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { useEffect, useCallback, useRef, useState } from 'react'
import { uploadToCloudinary } from '../../utils/cloudinary'

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
}

// Extends Image to support an optional href that wraps the img in an <a> tag
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

// Highlights {{variable}} patterns with a styled decoration
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
                  Decoration.inline(
                    pos + match.index,
                    pos + match.index + match[0].length,
                    {
                      style:
                        'background: #E6F1FB; color: #185FA5; border-radius: 4px; padding: 0 4px;',
                    }
                  )
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


function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={`px-1.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-gray-900 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ content, onChange, font, onFontChange, fontSize, onFontSizeChange }: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [imageToolbar, setImageToolbar] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
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
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'tiptap' },
    },
  })

  // Sync external content changes (draft switching)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Detect image node selection and position the floating toolbar
  useEffect(() => {
    if (!editor) return

    const handleSelection = () => {
      const { selection } = editor.state
      if (
        selection instanceof NodeSelection &&
        selection.node.type.name === 'image'
      ) {
        imagePosRef.current = selection.from
        setImageLinkHref(selection.node.attrs.href ?? '')

        const dom = editor.view.nodeDOM(selection.from) as HTMLElement | null
        if (dom && containerRef.current) {
          const cRect = containerRef.current.getBoundingClientRect()
          const iRect = dom.getBoundingClientRect()
          setImageToolbar({
            top: iRect.top - cRect.top,
            left: iRect.left - cRect.left,
            width: iRect.width,
          })
        }
      } else {
        setImageToolbar(null)
        imagePosRef.current = null
      }
    }

    editor.on('selectionUpdate', handleSelection)
    editor.on('transaction', handleSelection)
    return () => {
      editor.off('selectionUpdate', handleSelection)
      editor.off('transaction', handleSelection)
    }
  }, [editor])

  const applyImageLink = useCallback(
    (href: string) => {
      if (!editor || imagePosRef.current === null) return
      const node = editor.state.doc.nodeAt(imagePosRef.current)
      if (!node || node.type.name !== 'image') return
      const pos = imagePosRef.current
      editor
        .chain()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            href: href.trim() || null,
          })
          return true
        })
        .run()
    },
    [editor]
  )

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback(
    async (file: File) => {
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
    },
    [editor]
  )

  if (!editor) return null

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
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyImageLink(imageLinkHref)
                }
                if (e.key === 'Escape') {
                  setImageToolbar(null)
                }
              }}
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none min-w-0"
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyImageLink(imageLinkHref)}
              className="text-xs px-2 py-0.5 bg-white text-gray-900 rounded cursor-pointer hover:bg-gray-200 transition-colors shrink-0 font-medium"
            >
              Apply
            </button>
            {imageLinkHref && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setImageLinkHref('')
                  applyImageLink('')
                }}
                className="text-xs px-2 py-0.5 text-gray-400 rounded cursor-pointer hover:text-white transition-colors shrink-0"
                title="Remove link"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      <div className="border border-gray-300 rounded-md overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200 flex-wrap">
          {onFontChange && font && (
            <select
              value={font}
              onChange={(e) => onFontChange(e.target.value)}
              className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white cursor-pointer hover:border-gray-400 transition-colors"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          )}

          {onFontSizeChange && fontSize && (
            <select
              value={fontSize}
              onChange={(e) => onFontSizeChange(e.target.value as 'small' | 'normal' | 'large' | 'huge')}
              className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white cursor-pointer hover:border-gray-400 transition-colors"
            >
              {FONT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          )}

          {(onFontChange || onFontSizeChange) && <div className="w-px h-4 bg-gray-200 mx-0.5" />}

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
            <span className="underline">U</span>
          </ToolbarButton>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </ToolbarButton>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="6" x2="3" y2="6" /><line x1="17" y1="12" x2="7" y2="12" /><line x1="19" y1="18" x2="5" y2="18" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="7" y2="18" />
            </svg>
          </ToolbarButton>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          <ToolbarButton
            onClick={() => imageInputRef.current?.click()}
            title={uploadingImage ? 'Uploading…' : 'Insert image'}
          >
            {uploadingImage ? (
              <span className="text-gray-400">…</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
          </ToolbarButton>
        </div>

        {/* Hidden file input */}
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

        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
