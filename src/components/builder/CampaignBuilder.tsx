import { useCampaignStore } from '../../store/campaignStore'
import type { FocusedSectionId } from '../../store/campaignStore'
import { BuilderSection } from './BuilderSection'
import { RichTextEditor } from './RichTextEditor'
import { BodySections, AddSectionButton } from './BodySections'
import { HeaderEditor } from './HeaderEditor'
import { FooterEditor } from './FooterEditor'

const FOCUS_RING = 'ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.35)] rounded-md'

export function CampaignBuilder() {
  const store = useCampaignStore()
  const focusedSection = store.focusedSection
  const focus = (id: FocusedSectionId) => () => store.setFocusedSection(id)
  const ring = (id: FocusedSectionId) => focusedSection === id ? FOCUS_RING : ''

  return (
    <div
      className="space-y-5 p-4"
      onMouseDown={(e) => {
        if (!(e.target as HTMLElement).closest('[data-section-id]')) {
          store.setFocusedSection(null)
        }
      }}
    >
      <div
        data-section-id="header"
        className={`transition-shadow ${ring('header')}`}
        onFocus={focus('header')}
        onClick={() => store.setFocusedSection('header')}
      >
        <BuilderSection
          title="Header"
          enabled={store.headerImage.enabled}
          onToggle={store.setHeaderImageEnabled}
        >
          <HeaderEditor />
        </BuilderSection>
      </div>

      <div
        data-section-id="body"
        className={`transition-shadow ${ring('body')}`}
        onFocus={focus('body')}
        onClick={(e) => {
          // Only focus 'body' if not clicking inside a sub-section
          if (!(e.target as HTMLElement).closest('[data-section-id]:not([data-section-id="body"])')) {
            store.setFocusedSection('body')
          }
        }}
      >
        <BuilderSection title="Body" headerActions={<AddSectionButton />}>
          <RichTextEditor
            content={store.body.content}
            onChange={store.setBodyContent}
            font={store.font}
            onFontChange={store.setFont}
            fontSize={store.fontSize}
            onFontSizeChange={store.setFontSize}
          />
          <BodySections />
        </BuilderSection>
      </div>

      <div
        data-section-id="footer"
        className={`transition-shadow ${ring('footer')}`}
        onFocus={focus('footer')}
        onClick={() => store.setFocusedSection('footer')}
      >
        <BuilderSection
          title="Footer"
          enabled={store.footerConfig.enabled}
          onToggle={store.setFooterEnabled}
        >
          <FooterEditor />
        </BuilderSection>
      </div>
    </div>
  )
}
