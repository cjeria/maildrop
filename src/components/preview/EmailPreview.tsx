import { useMemo, useState, useEffect, useRef } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import type { FocusedSectionId } from '../../store/campaignStore'
import { generateEmailHtml, generatePlainText } from '../../utils/emailGenerator'
import { warmIconCache } from '../../utils/socialIconUploader'
import type { SocialPlatform } from '../../store/campaignStore'

const TEMPLATES = ['Narrow', 'Normal', 'Wide'] as const

const HIGHLIGHT_SHADOW = '0 0 0 2px #3b82f6, 0 0 12px rgba(59, 130, 246, 0.35)'

function applyPreviewHighlight(doc: Document, id: FocusedSectionId | null) {
  doc.querySelectorAll('[data-section-id], [data-field-id]').forEach((el) => {
    (el as HTMLElement).style.boxShadow = ''
    ;(el as HTMLElement).style.cursor = ''
  })
  if (!id) return
  const el = (
    doc.querySelector(`[data-field-id="${id}"]`) ??
    doc.querySelector(`[data-section-id="${id}"]`)
  ) as HTMLElement | null
  if (el) {
    el.style.boxShadow = HIGHLIGHT_SHADOW
    el.style.cursor = 'pointer'
  }
}

function attachPreviewClickListener(
  iframe: HTMLIFrameElement,
  cb: (id: FocusedSectionId | null) => void
) {
  const doc = iframe.contentDocument
  if (!doc) return
  const prev = (iframe as any).__sectionClickListener
  if (prev) doc.removeEventListener('click', prev)
  const handler = (e: Event) => {
    const target = e.target as HTMLElement
    const fieldEl = target.closest('[data-field-id]') as HTMLElement | null
    const sectionEl = target.closest('[data-section-id]') as HTMLElement | null
    if (fieldEl) {
      cb(fieldEl.dataset.fieldId ?? null)
    } else if (sectionEl) {
      cb(sectionEl.dataset.sectionId ?? null)
    } else {
      cb(null)
    }
  }
  doc.addEventListener('click', handler)
  ;(iframe as any).__sectionClickListener = handler
}

export function EmailPreview() {
  const store = useCampaignStore()
  const [copied, setCopied] = useState(false)
  const [iconCacheVersion, setIconCacheVersion] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const focusedSection = store.focusedSection

  // Upload social icons to Cloudinary so they render in Gmail
  const { links, color, size } = store.footerConfig.socialIcons
  useEffect(() => {
    const activePlatforms = links
      .filter((l) => l.enabled && l.url.trim())
      .map((l) => l.platform as SocialPlatform)
    if (activePlatforms.length === 0) return
    const sizePx = size === 'small' ? 18 : size === 'large' ? 30 : 24
    warmIconCache(activePlatforms, color, sizePx).then(() => {
      setIconCacheVersion((v) => v + 1)
    })
  }, [links, color, size])

  const deps = [
    store.recipientName, store.link, store.selectedAddress,
    store.headerImage, store.headerSectionOrder, store.headerConfig, store.body, store.bodySections, store.footerConfig,
    store.template, store.font, store.fontSize, store.cornerRadius,
    store.backgroundColor, store.cardColor, store.borderEnabled, store.borderColor, store.linkColor,
  ]

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewHtml = useMemo(() => generateEmailHtml(store, { isPreview: true }), [...deps, iconCacheVersion])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const emailHtml = useMemo(() => generateEmailHtml(store), [...deps, iconCacheVersion])

  // Write HTML to iframe, then re-apply highlight and re-attach click listener
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const win = iframe.contentWindow
    const doc = iframe.contentDocument
    if (!doc) return
    const scrollX = win?.scrollX ?? 0
    const scrollY = win?.scrollY ?? 0
    doc.open()
    doc.write(previewHtml)
    doc.close()
    win?.scrollTo(scrollX, scrollY)
    applyPreviewHighlight(doc, focusedSection)
    attachPreviewClickListener(iframe, store.setFocusedSection)
  // focusedSection intentionally excluded — the separate effect handles highlight-only updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewHtml])

  // When focused section changes, update highlight in preview, scroll preview to anchor,
  // and scroll the builder panel to the corresponding builder section
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument
    if (!doc) return

    // Highlight in preview
    applyPreviewHighlight(doc, focusedSection)

    // Scroll preview to the highlighted element (field-level first, then section-level, then anchor)
    if (focusedSection) {
      const previewEl = (
        doc.querySelector(`[data-field-id="${CSS.escape(focusedSection)}"]`) ??
        doc.querySelector(`[data-section-id="${CSS.escape(focusedSection)}"]`) ??
        doc.getElementById(`preview-${focusedSection}`)
      ) as HTMLElement | null
      previewEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    // Scroll builder panel to the focused field or section
    if (focusedSection) {
      const builderEl = (
        document.querySelector(`[data-field-id="${CSS.escape(focusedSection)}"]`) ??
        document.querySelector(`[data-section-id="${CSS.escape(focusedSection)}"]`)
      ) as HTMLElement | null
      builderEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [focusedSection])

  // Cleanup click listener on unmount
  useEffect(() => {
    return () => {
      const iframe = iframeRef.current
      if (!iframe) return
      const doc = iframe.contentDocument
      const prev = (iframe as any).__sectionClickListener
      if (doc && prev) doc.removeEventListener('click', prev)
    }
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([emailHtml], { type: 'text/html' }),
        'text/plain': new Blob([emailHtml], { type: 'text/plain' }),
      }),
    ])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const plain = generatePlainText(store)
    const content = `${emailHtml}\n\n<!-- PLAIN TEXT VERSION:\n${plain}\n-->`
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${store.campaignName.replace(/\s+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header label */}
      <div className="flex items-center justify-between px-4 border-b border-gray-300 shrink-0 bg-white h-11">
        <span className="text-sm font-medium text-gray-500">Email Preview</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 px-3 py-2 bg-white border-b border-gray-300 shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Template</label>
          <select
            className="text-xs border border-gray-300 rounded px-1.5 py-1 cursor-pointer hover:border-gray-400 transition-colors"
            value={store.template}
            onChange={(e) => store.setTemplate(e.target.value as typeof store.template)}
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 hover:border-gray-400 transition-colors" title="Corner radius">
          <div className="flex items-center justify-center px-1.5 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 12 L2 5 Q2 2 5 2 L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <input
            type="number"
            min="0"
            max="40"
            value={store.cornerRadius}
            onChange={(e) => store.setCornerRadius(Math.max(0, Math.min(40, Number(e.target.value))))}
            className="w-10 py-1 pr-1.5 text-xs text-gray-700 bg-transparent focus:outline-none cursor-text"
          />
        </div>

        <div className="flex items-center gap-1.5" title="Link color">
          <label className="text-xs text-gray-500">Links</label>
          <input
            type="color"
            value={store.linkColor}
            onChange={(e) => store.setLinkColor(e.target.value)}
            className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0"
          />
        </div>

        <div className="flex items-center gap-1.5" title="Page background color">
          <label className="text-xs text-gray-500">Page</label>
          <input
            type="color"
            value={store.backgroundColor}
            onChange={(e) => store.setBackgroundColor(e.target.value)}
            className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0"
          />
        </div>

        <div className="flex items-center gap-1.5" title="Email card background color">
          <label className="text-xs text-gray-500">Card</label>
          <input
            type="color"
            value={store.cardColor}
            onChange={(e) => store.setCardColor(e.target.value)}
            className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Border</label>
          <button
            type="button"
            onClick={() => store.setBorderEnabled(!store.borderEnabled)}
            className={`w-8 h-4 rounded-full transition-colors ${store.borderEnabled ? 'bg-gray-900' : 'bg-gray-300'}`}
          >
            <span className={`block w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${store.borderEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
          {store.borderEnabled && (
            <input
              type="color"
              value={store.borderColor}
              onChange={(e) => store.setBorderColor(e.target.value)}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0"
            />
          )}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => {
            store.setTemplate('Normal')
            store.setCornerRadius(0)
            store.setBackgroundColor('#f3f4f6')
            store.setCardColor('#ffffff')
            store.setBorderEnabled(true)
            store.setBorderColor('#e5e7eb')
            store.setLinkColor('#c45e1a')
          }}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <iframe
          ref={iframeRef}
          title="Email Preview"
          sandbox="allow-same-origin"
          className="w-full h-full min-h-[600px] bg-white"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  )
}
