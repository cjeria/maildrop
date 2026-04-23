import { useEffect } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { BuilderSection } from './BuilderSection'
import { RichTextEditor } from './RichTextEditor'
import { BodySections, AddSectionButton } from './BodySections'
import { HeaderEditor } from './HeaderEditor'
import { FooterEditor } from './FooterEditor'

const FIELD_OUTLINE = '2px solid #3b82f6'
const FIELD_OUTLINE_OFFSET = '2px'

export function CampaignBuilder() {
  const store = useCampaignStore()
  const focusedSection = store.focusedSection

  // Apply/clear outline on the matching [data-field-id] element in the builder DOM
  useEffect(() => {
    document.querySelectorAll('[data-field-id]').forEach((el) => {
      const htmlEl = el as HTMLElement
      // Skip elements inside the preview iframe — only target the main document
      htmlEl.style.outline = ''
      htmlEl.style.outlineOffset = ''
    })
    if (!focusedSection) return
    const el = document.querySelector(`[data-field-id="${focusedSection}"]`) as HTMLElement | null
    if (el) {
      el.style.outline = FIELD_OUTLINE
      el.style.outlineOffset = FIELD_OUTLINE_OFFSET
    }
  }, [focusedSection])

  return (
    <div
      className="space-y-5 p-4"
      onMouseDown={(e) => {
        // Clear focus when clicking anything that isn't a form field
        if (!(e.target as HTMLElement).closest('[data-field-id]')) {
          store.setFocusedSection(null)
        }
      }}
    >
      <div data-section-id="header">
        <BuilderSection
          title="Header"
          enabled={store.headerImage.enabled}
          onToggle={store.setHeaderImageEnabled}
        >
          <HeaderEditor />
        </BuilderSection>
      </div>

      <div data-section-id="body">
        <BuilderSection title="Body" headerActions={<AddSectionButton />}>
          <div onFocus={() => store.setFocusedSection('body')} data-field-id="body">
            <RichTextEditor
              content={store.body.content}
              onChange={store.setBodyContent}
              font={store.font}
              onFontChange={store.setFont}
              fontSize={store.fontSize}
              onFontSizeChange={store.setFontSize}
            />
          </div>
          <BodySections />
        </BuilderSection>
      </div>

      <div data-section-id="footer">
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
