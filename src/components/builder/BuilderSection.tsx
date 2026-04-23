import { useState } from 'react'
import type { Draft } from '../../store/campaignStore'

interface Props {
  title: string
  children: React.ReactNode
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
  drafts?: Draft[]
  activeDraftId?: string | null
  onSaveDraft?: (name: string) => void
  onSwitchDraft?: (id: string) => void
  onDeleteDraft?: (id: string) => void
  headerActions?: React.ReactNode
}

export function BuilderSection({
  title,
  children,
  enabled,
  onToggle,
  drafts,
  activeDraftId,
  onSaveDraft,
  onSwitchDraft,
  onDeleteDraft,
  headerActions,
}: Props) {
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const hasToggle = onToggle !== undefined

  return (
    <div className="border border-gray-400 rounded-md overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-400">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 font-semibold text-gray-900 cursor-pointer hover:text-gray-600 transition-colors text-[20px]"
          >
            {title}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {hasToggle && (
            <button
              type="button"
              onClick={() => onToggle(!enabled)}
              className={`relative inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors cursor-pointer hover:opacity-80 ${
                enabled ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                  enabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          )}
        </div>

        {/* Header actions slot */}
        {headerActions && !collapsed && (
          <div className="flex items-center">{headerActions}</div>
        )}

        {/* Drafts controls */}
        {drafts !== undefined && !collapsed && (
          <div className="flex items-center gap-1">
            {drafts.length > 0 && (
              <select
                value={activeDraftId ?? ''}
                onChange={(e) => e.target.value && onSwitchDraft?.(e.target.value)}
                className="text-xs border border-gray-400 rounded px-1.5 py-0.5 max-w-[120px] cursor-pointer hover:border-gray-400 transition-colors"
              >
                <option value="">Drafts</option>
                {drafts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
            {activeDraftId && (
              <button
                type="button"
                onClick={() => { if (window.confirm('Delete this draft?')) onDeleteDraft?.(activeDraftId) }}
                className="p-0.5 text-gray-400 cursor-pointer hover:text-red-500 transition-colors"
                title="Delete draft"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
              </button>
            )}
            {savingDraft ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  className="text-xs border border-gray-400 rounded px-1.5 py-0.5 w-24 cursor-text"
                  placeholder="Draft name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && draftName.trim()) {
                      onSaveDraft?.(draftName.trim())
                      setDraftName('')
                      setSavingDraft(false)
                    }
                    if (e.key === 'Escape') setSavingDraft(false)
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (draftName.trim()) {
                      onSaveDraft?.(draftName.trim())
                      setDraftName('')
                      setSavingDraft(false)
                    }
                  }}
                  className="text-xs px-1.5 py-0.5 bg-gray-900 text-white rounded cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSavingDraft(true)}
                className="text-xs px-1.5 py-0.5 border border-gray-400 rounded text-gray-600 cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors"
                title="Save draft"
              >
                + Save
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {!collapsed && (
        <div className={`p-4 ${hasToggle && !enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {children}
        </div>
      )}
    </div>
  )
}
