import { TEMPLATES } from '../../utils/templates'
import { useCampaignStore } from '../../store/campaignStore'

interface Props {
  onClose: () => void
}

export function TemplatePicker({ onClose }: Props) {
  const store = useCampaignStore()

  const handleLoad = (idx: number) => {
    const t = TEMPLATES[idx]
    if (!window.confirm(`Load "${t.name}"? This will overwrite your current campaign content.`)) return
    store.loadState(t.state)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[480px] max-w-full mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-300">
          <h2 className="text-sm font-semibold text-gray-900">Load template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {TEMPLATES.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => handleLoad(i)}
              className="text-left p-3 border border-gray-300 rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <p className="text-sm font-medium text-gray-900 mb-0.5">{t.name}</p>
              <p className="text-xs text-gray-500">{t.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
