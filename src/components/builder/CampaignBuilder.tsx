import { useCampaignStore } from '../../store/campaignStore'
import { BuilderSection } from './BuilderSection'
import { RichTextEditor } from './RichTextEditor'
import { BodySections, AddSectionButton } from './BodySections'
import { HeaderEditor } from './HeaderEditor'
import { FooterEditor } from './FooterEditor'

export function CampaignBuilder() {
  const store = useCampaignStore()
  const focus = (id: typeof store.focusedSection) => () => store.setFocusedSection(id)

  return (
    <div className="space-y-5 p-4">
      <div onFocus={focus('header')}>
        <BuilderSection
          title="Header"
          enabled={store.headerImage.enabled}
          onToggle={store.setHeaderImageEnabled}
        >
          <HeaderEditor />
        </BuilderSection>
      </div>

      <div onFocus={focus('body')}>
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

      <div onFocus={focus('footer')}>
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
