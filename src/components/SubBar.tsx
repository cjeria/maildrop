import { useState, useRef, useEffect } from 'react'
import { useCampaignStore, defaultState } from '../store/campaignStore'
import type { PersistedState } from '../store/campaignStore'
import { useSlotsStore } from '../store/slotsStore'
import type { CampaignSlot } from '../store/slotsStore'

function IconTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-10">
        {label}
      </div>
    </div>
  )
}

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

function isDefaultName(name: string) {
  return DEFAULT_NAMES.has(name.trim())
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'campaign'
}

export function SubBar({ onCampaignSwitch }: { onCampaignSwitch?: () => void }) {
  const store = useCampaignStore()
  const slots = useSlotsStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsub = useCampaignStore.subscribe(() => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => {
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 2000)
      }, 600)
    })
    return () => { unsub(); if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }
  }, [])

  const [newCampaignModal, setNewCampaignModal] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null)
  const [duplicateName, setDuplicateName] = useState('')
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Export/Import state
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

  // Build PersistedState from current store (fallback when no active slot)
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

  const triggerDownload = (slot: CampaignSlot) => {
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
    triggerDownload(slot)
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
    // Also rename the active slot so the session stays consistent
    if (slots.activeSlotId) slots.renameSlot(slots.activeSlotId, name)
    store.setCampaignName(name)
    doExport(name)
    setExportNameModal(false)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset immediately so the same file can be re-imported if needed
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string
        const parsed = JSON.parse(raw) as unknown

        // Validate top-level CampaignSlot shape
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

        // Handle name collision — append "(imported)" suffix
        let name = incoming.name.trim() || 'Imported Campaign'
        if (slots.slots.some((s) => s.name === name)) {
          name = `${name} (imported)`
        }

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

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const handleLoadSlot = (id: string) => {
    const slot = slots.getSlot(id)
    if (!slot) return
    onCampaignSwitch?.()
    slots.setActiveSlot(id)
    store.loadState(slot.state)
    setDropdownOpen(false)
  }

  const handleCreateNewCampaign = () => {
    const name = newCampaignName.trim()
    if (!name) return
    const newState = { ...defaultState, campaignName: name }
    const id = slots.saveSlot(name, newState)
    onCampaignSwitch?.()
    slots.setActiveSlot(id)
    store.loadState(newState)
    setNewCampaignName('')
    setNewCampaignModal(false)
  }

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return
    const idx = slots.slots.findIndex((s) => s.id === deleteConfirmId)
    slots.deleteSlot(deleteConfirmId)
    const remaining = slots.slots.filter((s) => s.id !== deleteConfirmId)
    const next = remaining[idx] ?? remaining[idx - 1]
    if (next) {
      onCampaignSwitch?.()
      slots.setActiveSlot(next.id)
      store.loadState(next.state)
    }
    setDeleteConfirmId(null)
  }

  const handleOpenRename = (id: string) => {
    const slot = slots.getSlot(id)
    if (!slot) return
    setRenameId(id)
    setRenameName(slot.name)
    setDropdownOpen(false)
  }

  const handleConfirmRename = () => {
    const name = renameName.trim()
    if (!name || !renameId) return
    const slot = slots.getSlot(renameId)
    if (slot && store.campaignName === slot.name) store.setCampaignName(name)
    slots.renameSlot(renameId, name)
    setRenameId(null)
    setRenameName('')
  }

  const handleOpenDuplicate = (id: string) => {
    const slot = slots.getSlot(id)
    if (!slot) return
    setDuplicateSourceId(id)
    setDuplicateName(`${slot.name} - Copy`)
    setDropdownOpen(false)
  }

  const handleConfirmDuplicate = () => {
    const name = duplicateName.trim()
    if (!name || !duplicateSourceId) return
    const source = slots.getSlot(duplicateSourceId)
    if (!source) return
    const newState = { ...source.state, campaignName: name }
    const id = slots.saveSlot(name, newState)
    onCampaignSwitch?.()
    slots.setActiveSlot(id)
    store.loadState(newState)
    setDuplicateSourceId(null)
    setDuplicateName('')
  }

  const deleteSlot = slots.slots.find((s) => s.id === deleteConfirmId)

  return (
    <>
      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-300 shrink-0">
        {/* Campaign title dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors"
          >
            <h1 className="text-2xl font-bold leading-none">{store.campaignName}</h1>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-0.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-1">
              {slots.slots.length > 0 && (
                <>
                  {slots.slots.map((slot) => (
                    <div key={slot.id} className="flex items-center px-3 py-2 hover:bg-gray-50 group">
                      <button
                        onClick={() => handleLoadSlot(slot.id)}
                        className="flex-1 text-sm text-gray-700 text-left truncate"
                      >
                        {slot.name}
                      </button>
                      <IconTooltip label="Rename campaign">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenRename(slot.id) }}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </IconTooltip>
                      <IconTooltip label="Duplicate campaign">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenDuplicate(slot.id) }}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        </button>
                      </IconTooltip>
                      <IconTooltip label="Delete campaign">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(slot.id); setDropdownOpen(false) }}
                          className="p-1 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </IconTooltip>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Saved indicator */}
        {showSaved && (
          <span className="text-xs text-gray-400 select-none">Saved</span>
        )}

        {/* Import button */}
        <button
          onClick={() => importInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import
        </button>

        {/* Export button */}
        <button
          onClick={handleExportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>

        {/* New Campaign primary button */}
        <button
          onClick={() => { setNewCampaignName(''); setNewCampaignModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Campaign
        </button>
        {/* Reset button — hidden, reserved for future use */}
      </div>

      {/* Bottom row — hidden, reserved for future use */}
      <div className="hidden">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">Name</label>
          <input
            className="border border-gray-400 rounded px-2 py-1 text-sm w-36"
            placeholder="Recipient name"
            value={store.recipientName}
            onChange={(e) => store.setRecipientName(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Link</label>
          <input
            className="border border-gray-400 rounded px-2 py-1 text-sm w-48"
            placeholder="https://..."
            value={store.link}
            onChange={(e) => store.setLink(e.target.value)}
          />
        </div>
      </div>

      {/* New campaign modal */}
      {newCampaignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h2 className="text-base font-semibold text-gray-900 mb-4">New campaign</h2>
            <input
              autoFocus
              type="text"
              placeholder="Campaign name"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewCampaign()
                if (e.key === 'Escape') setNewCampaignModal(false)
              }}
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:border-gray-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNewCampaignModal(false)}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-400 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewCampaign}
                disabled={!newCampaignName.trim()}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename campaign modal */}
      {renameId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Rename Campaign</h2>
            <input
              autoFocus
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename()
                if (e.key === 'Escape') { setRenameId(null); setRenameName('') }
              }}
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:border-gray-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRenameId(null); setRenameName('') }}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-400 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={!renameName.trim()}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate campaign modal */}
      {duplicateSourceId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Duplicate Campaign?</h2>
            <input
              autoFocus
              type="text"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmDuplicate()
                if (e.key === 'Escape') { setDuplicateSourceId(null); setDuplicateName('') }
              }}
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:border-gray-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setDuplicateSourceId(null); setDuplicateName('') }}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-400 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDuplicate}
                disabled={!duplicateName.trim()}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId && deleteSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Delete campaign</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{deleteSlot.name}"? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-400 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export — name required modal (Phase 3) */}
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
    </>
  )
}
