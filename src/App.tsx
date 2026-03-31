import { useState, useCallback } from 'react'
import { TopBar } from './components/TopBar'
import { SubBar } from './components/SubBar'
import { CampaignBuilder } from './components/builder/CampaignBuilder'
import { EmailPreview } from './components/preview/EmailPreview'
import { HTMLTab } from './components/tabs/HTMLTab'
import { JSONTab } from './components/tabs/JSONTab'
import { TOSModal, useTOSAccepted } from './components/TOSModal'
import { SkeletonLoader } from './components/SkeletonLoader'

type LeftTab = 'builder' | 'html' | 'json'

const tabs: { id: LeftTab; label: string }[] = [
  { id: 'builder', label: 'Campaign Builder' },
]

export function App() {
  const [activeTab, setActiveTab] = useState<LeftTab>('builder')
  const [tosAccepted, setTosAccepted] = useState(() => useTOSAccepted())
  const [isLoading, setIsLoading] = useState(false)

  const startLoading = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 700)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {!tosAccepted && <TOSModal onAccept={() => setTosAccepted(true)} />}

      <TopBar />
      <SubBar onCampaignSwitch={startLoading} />

      {isLoading ? <SkeletonLoader /> : <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col w-[483px] shrink-0 border-r border-gray-200 bg-white overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 shrink-0 h-11">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'builder' && <CampaignBuilder />}
            {activeTab === 'html' && <HTMLTab />}
            {activeTab === 'json' && <JSONTab />}
          </div>
        </div>

        {/* Right panel — Email Preview */}
        <div className="flex-1 overflow-hidden">
          <EmailPreview />
        </div>
      </div>}
    </div>
  )
}

export default App
