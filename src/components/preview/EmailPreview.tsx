import { useMemo, useState, useEffect, useRef } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import type { FocusedSectionId, PersistedState } from '../../store/campaignStore'
import { generateEmailHtml, generatePlainText } from '../../utils/emailGenerator'
import { warmIconCache } from '../../utils/socialIconUploader'
import type { SocialPlatform } from '../../store/campaignStore'
import { useSlotsStore } from '../../store/slotsStore'
import type { CampaignSlot } from '../../store/slotsStore'

const TEMPLATES = ['Narrow', 'Normal', 'Wide'] as const

const HIGHLIGHT_SHADOW = '0 0 0 2px #3b82f6, 0 0 12px rgba(59, 130, 246, 0.35)'

function Toast({ message, type }: { message: string; type: 'error' | 'success' }) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white ${
        type === 'error' ? 'bg-red-600' : 'bg-gray-800'
      }`}>
        {type === 'error' ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {message}
      </div>
    </div>
  )
}

const DEFAULT_NAMES = new Set(['Untitled Campaign', 'untitled campaign', ''])
const isDefaultName = (name: string) => DEFAULT_NAMES.has(name.trim())
const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'campaign'

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

export function EmailPreview({ onCampaignSwitch }: { onCampaignSwitch?: () => void }) {
  const store = useCampaignStore()
  const slots = useSlotsStore()
  const [copied, setCopied] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [iconCacheVersion, setIconCacheVersion] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const focusedSection = store.focusedSection

  // Import/Export state
  const [exportNameModal, setExportNameModal] = useState(false)
  const [exportNameValue, setExportNameValue] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3500)
  }

  // Close more dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

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
    const slug = store.campaignName.replace(/\s+/g, '-').toLowerCase()
    const boundary = `----=_Part_${Date.now()}`

    // Encode a UTF-8 string to base64 with 76-char line wrapping (MIME spec)
    const toBase64 = (str: string): string => {
      const bytes = new TextEncoder().encode(str)
      let binary = ''
      bytes.forEach(b => { binary += String.fromCharCode(b) })
      return btoa(binary).match(/.{1,76}/g)?.join('\r\n') ?? btoa(binary)
    }

    const eml = [
      'MIME-Version: 1.0',
      `Subject: ${store.campaignName}`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      toBase64(plain),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      toBase64(emailHtml),
      '',
      `--${boundary}--`,
    ].join('\r\n')
    const blob = new Blob([eml], { type: 'message/rfc822' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.eml`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Import / Export ---

  const getCurrentState = (): PersistedState => {
    if (slots.activeSlotId) {
      const slot = slots.getSlot(slots.activeSlotId)
      if (slot) return slot.state
    }
    const s = store
    return {
      campaignName: s.campaignName,
      recipientName: s.recipientName,
      link: s.link,
      addresses: s.addresses,
      selectedAddress: s.selectedAddress,
      headerImage: s.headerImage,
      headerSectionOrder: s.headerSectionOrder,
      headerConfig: s.headerConfig,
      body: s.body,
      bodySections: s.bodySections,
      footerConfig: s.footerConfig,
      template: s.template,
      font: s.font,
      fontSize: s.fontSize,
      cornerRadius: s.cornerRadius,
      backgroundColor: s.backgroundColor,
      cardColor: s.cardColor,
      borderEnabled: s.borderEnabled,
      borderColor: s.borderColor,
      linkColor: s.linkColor,
    }
  }

  const triggerDownloadJson = (slot: CampaignSlot) => {
    const json = JSON.stringify(slot, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slugify(slot.name)}.maildrop.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const doExport = (name: string) => {
    const state = { ...getCurrentState(), campaignName: name }
    const slot: CampaignSlot = {
      id: slots.activeSlotId ?? 'export',
      name,
      savedAt: Date.now(),
      state,
    }
    triggerDownloadJson(slot)
  }

  const handleExportClick = () => {
    const name = store.campaignName
    if (isDefaultName(name)) {
      setExportNameValue('')
      setExportNameModal(true)
    } else {
      doExport(name)
    }
  }

  const handleExportWithName = () => {
    const name = exportNameValue.trim()
    if (!name) return
    if (slots.activeSlotId) slots.renameSlot(slots.activeSlotId, name)
    store.setCampaignName(name)
    doExport(name)
    setExportNameModal(false)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string
        const parsed = JSON.parse(raw) as unknown
        if (
          typeof parsed !== 'object' || parsed === null ||
          typeof (parsed as Record<string, unknown>).name !== 'string' ||
          typeof (parsed as Record<string, unknown>).savedAt !== 'number' ||
          typeof (parsed as Record<string, unknown>).state !== 'object' ||
          (parsed as Record<string, unknown>).state === null ||
          typeof ((parsed as Record<string, unknown>).state as Record<string, unknown>).campaignName !== 'string'
        ) {
          showToast("Couldn't import campaign — file may be corrupted.")
          return
        }
        const incoming = parsed as CampaignSlot
        let name = incoming.name.trim() || 'Imported Campaign'
        if (slots.slots.some((s) => s.name === name)) name = `${name} (imported)`
        const newState: PersistedState = { ...incoming.state, campaignName: name }
        const id = slots.saveSlot(name, newState)
        onCampaignSwitch?.()
        slots.setActiveSlot(id)
        store.loadState(newState)
        showToast(`"${name}" imported successfully.`, 'success')
      } catch {
        showToast("Couldn't import campaign — file may be corrupted.")
      }
    }
    reader.onerror = () => showToast("Couldn't import campaign — file may be corrupted.")
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input for import */}
      <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 border-b border-gray-300 shrink-0 bg-white h-11">
        <span className="text-sm font-medium text-gray-500">Email Preview</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download for Outlook
          </button>

          {/* Three-dots more menu */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className="flex items-center justify-center w-7 h-7 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition-colors"
              title="More options"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>

            {moreOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => { handleExportClick(); setMoreOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export .json file
                </button>
                <button
                  onClick={() => { importInputRef.current?.click(); setMoreOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Import .json file
                </button>
                <button
                  onClick={() => { handleCopy(); setMoreOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  {copied ? 'Copied!' : 'Copy to clipboard'}
                </button>
              </div>
            )}
          </div>
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

      {/* Export — name required modal */}
      {exportNameModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Name your campaign</h2>
            <p className="text-xs text-gray-500 mb-4">Give this campaign a name before exporting so it's recognisable when imported.</p>
            <input
              autoFocus
              type="text"
              placeholder="e.g. HGC April 2026"
              value={exportNameValue}
              onChange={(e) => setExportNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExportWithName()
                if (e.key === 'Escape') setExportNameModal(false)
              }}
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:border-gray-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setExportNameModal(false)}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-400 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExportWithName}
                disabled={!exportNameValue.trim()}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
