import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { BuilderSection } from './BuilderSection'
import { RichTextEditor } from './RichTextEditor'
import { ImageUpload } from './ImageUpload'
import { PeopleSection } from './PeopleSection'
import { TemplatePicker } from './TemplatePicker'

export function CampaignBuilder() {
  const store = useCampaignStore()
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  return (
    <div className="space-y-3 p-3">
      {/* Load template button — hidden, reserved for future use */}

      {/* Header Image */}
      <BuilderSection
        title="Header Image"
        enabled={store.headerImage.enabled}
        onToggle={store.setHeaderImageEnabled}
      >
        <ImageUpload
          imageUrl={store.headerImage.imageUrl}
          onChange={store.setHeaderImageUrl}
          label="header image"
        />
      </BuilderSection>

      {/* Body */}
      <BuilderSection title="Body">
        <RichTextEditor
          content={store.body.content}
          onChange={store.setBodyContent}
          font={store.font}
          onFontChange={store.setFont}
          fontSize={store.fontSize}
          onFontSizeChange={store.setFontSize}
        />
      </BuilderSection>

      {/* Signature */}
      <BuilderSection
        title="Signature"
        enabled={store.signature.enabled}
        onToggle={store.setSignatureEnabled}
      >
        <div className="space-y-3">
          <RichTextEditor
            content={store.signature.content}
            onChange={store.setSignatureContent}
            font={store.font}
            onFontChange={store.setFont}
            fontSize={store.fontSize}
            onFontSizeChange={store.setFontSize}
          />
          <ImageUpload
            imageUrl={store.signature.imageUrl}
            onChange={store.setSignatureImage}
            label="signature image"
          />
        </div>
      </BuilderSection>

      {/* People */}
      <PeopleSection />

      {/* Footer Image */}
      <BuilderSection
        title="Footer Image"
        enabled={store.footerImage.enabled}
        onToggle={store.setFooterImageEnabled}
      >
        <ImageUpload
          imageUrl={store.footerImage.imageUrl}
          onChange={store.setFooterImageUrl}
          label="footer image"
        />
      </BuilderSection>

      {showTemplatePicker && (
        <TemplatePicker onClose={() => setShowTemplatePicker(false)} />
      )}
    </div>
  )
}
