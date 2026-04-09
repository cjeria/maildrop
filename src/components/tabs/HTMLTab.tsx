import { useMemo } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { generateEmailHtml } from '../../utils/emailGenerator'

export function HTMLTab() {
  const store = useCampaignStore()
  const html = useMemo(() => generateEmailHtml(store), [store])

  return (
    <div className="p-3 h-full flex flex-col">
      <p className="text-xs text-gray-500 mb-2">Generated email HTML (read-only)</p>
      <textarea
        readOnly
        value={html}
        className="flex-1 w-full font-mono text-xs border border-gray-400 rounded-md p-3 bg-gray-50 resize-y focus:outline-none"
      />
    </div>
  )
}
