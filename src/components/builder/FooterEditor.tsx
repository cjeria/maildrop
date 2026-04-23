import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { ImageUpload } from './ImageUpload'
import type { SocialPlatform } from '../../store/campaignStore'

type Alignment = 'left' | 'center' | 'right'

// ── Alignment icons ──────────────────────────────────────────────────────────

const AlignLeft = () => (
  <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor">
    <rect y="0" width="13" height="2" rx="1" />
    <rect y="4.5" width="9" height="2" rx="1" />
    <rect y="9" width="11" height="2" rx="1" />
  </svg>
)
const AlignCenter = () => (
  <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor">
    <rect y="0" width="13" height="2" rx="1" />
    <rect x="2" y="4.5" width="9" height="2" rx="1" />
    <rect x="1" y="9" width="11" height="2" rx="1" />
  </svg>
)
const AlignRight = () => (
  <svg width="13" height="11" viewBox="0 0 13 11" fill="currentColor">
    <rect y="0" width="13" height="2" rx="1" />
    <rect x="4" y="4.5" width="9" height="2" rx="1" />
    <rect x="2" y="9" width="11" height="2" rx="1" />
  </svg>
)

function AlignPicker({ value, onChange }: { value: Alignment; onChange: (v: Alignment) => void }) {
  const options: { v: Alignment; Icon: React.FC }[] = [
    { v: 'left', Icon: AlignLeft },
    { v: 'center', Icon: AlignCenter },
    { v: 'right', Icon: AlignRight },
  ]
  return (
    <div className="flex border border-gray-400 rounded overflow-hidden shrink-0">
      {options.map(({ v, Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-2 py-1.5 transition-colors cursor-pointer ${
            value === v ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Icon />
        </button>
      ))}
    </div>
  )
}

// ── Pill button group ─────────────────────────────────────────────────────────

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex border border-gray-400 rounded overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1 text-xs transition-colors cursor-pointer ${
            value === opt.value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Label + control row ───────────────────────────────────────────────────────

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  )
}

// ── Collapsible sub-section ───────────────────────────────────────────────────

function SubSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-400 rounded-md overflow-hidden mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-400 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <span>{title}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          className={`transition-transform ${open ? '' : '-rotate-90'}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  )
}

// ── Platform meta ─────────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  threads: 'Threads',
  github: 'GitHub',
  website: 'Website',
}

// Simple recognizable SVG icons for the builder UI (stroke-based, 16×16)
const PLATFORM_UI_ICONS: Record<SocialPlatform, React.ReactNode> = {
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  whatsapp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  ),
  instagram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.733-8.835L2.25 2.25h6.946l4.262 5.634L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  ),
  youtube: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20.06 12 20.06 12 20.06s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
    </svg>
  ),
  tiktok: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.96a8.18 8.18 0 004.79 1.53V7.05a4.85 4.85 0 01-1.02-.36z" />
    </svg>
  ),
  pinterest: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.852 0 1.264.64 1.264 1.408 0 .858-.548 2.142-.83 3.33-.236.995.498 1.806 1.476 1.806 1.773 0 3.137-1.868 3.137-4.566 0-2.39-1.718-4.061-4.169-4.061-2.837 0-4.502 2.128-4.502 4.328 0 .857.33 1.776.741 2.279" />
    </svg>
  ),
  threads: (
    <svg width="14" height="14" viewBox="0 0 192 192" fill="currentColor">
      <path d="M141.537 88.988a66.667 66.667 0 00-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.23c8.248.054 14.474 2.452 18.502 7.13 2.932 3.405 4.893 8.11 5.864 14.05-7.314-1.244-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 9.944 15.86 12.7 26.21l16.013-4.106c-3.357-12.483-8.81-23.382-16.37-32.394C147.098 11.205 125.968 1.555 97.07 1.351h-.215c-28.84.204-50.038 9.893-63.908 28.799C20.89 44.217 14.785 65.798 14.583 95.83l-.001.17.001.17c.202 30.032 6.308 51.613 18.363 66.68 13.87 18.906 35.069 28.595 63.908 28.799h.215c25.96-.18 44.283-6.989 59.368-22.053 19.73-19.706 19.107-44.07 12.645-59.138-4.585-10.696-13.32-19.343-27.545-24.5zm-47.918 40.663c-10.437.582-21.265-4.1-21.809-14.146-.407-7.638 5.44-16.166 23.076-17.194 2.018-.116 3.996-.173 5.937-.173 6.138 0 11.936.605 17.29 1.782-1.968 24.558-13.797 29.181-24.494 29.731z" />
    </svg>
  ),
  github: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
  website: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
}

// ── Social platform row ───────────────────────────────────────────────────────

function SocialRow({
  platform,
  enabled,
  url,
  onToggle,
  onUrl,
}: {
  platform: SocialPlatform
  enabled: boolean
  url: string
  onToggle: (enabled: boolean) => void
  onUrl: (url: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 shrink-0">{PLATFORM_UI_ICONS[platform]}</span>
        <span className="text-xs text-gray-700 flex-1">{PLATFORM_LABELS[platform]}</span>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`w-8 h-4 rounded-full transition-colors shrink-0 ${enabled ? 'bg-gray-900' : 'bg-gray-300'}`}
        >
          <span
            className={`block w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </button>
      </div>
      {enabled && (
        <input
          type="url"
          value={url}
          onChange={(e) => onUrl(e.target.value)}
          placeholder={`https://...`}
          className="w-full border border-gray-400 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-gray-500"
        />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function FooterEditor() {
  const store = useCampaignStore()
  const fc = store.footerConfig

  const setGlobalAlignment = (align: Alignment) => {
    store.updateFooterConfig({ alignment: align })
    store.updateFooterLogo({ alignment: align })
    store.updateFooterBrandText({ alignment: align })
    store.updateFooterSocialIcons({ alignment: align })
  }

  return (
    <div className="space-y-3">
      {/* Global controls */}
      <ControlRow label="Alignment">
        <AlignPicker value={fc.alignment} onChange={setGlobalAlignment} />
      </ControlRow>
      <ControlRow label="Background">
        <input
          type="color"
          value={fc.backgroundColor}
          onChange={(e) => store.updateFooterConfig({ backgroundColor: e.target.value })}
          className="w-6 h-6 rounded border border-gray-400 cursor-pointer p-0"
        />
        <span className="text-xs text-gray-400 font-mono">{fc.backgroundColor}</span>
      </ControlRow>

      {/* Logo */}
      <SubSection title="Logo" defaultOpen>
        <ImageUpload
          imageUrl={fc.logo.imageUrl}
          onChange={(url) => store.updateFooterLogo({ imageUrl: url })}
          label="logo"
        />
        <ControlRow label="Align">
          <AlignPicker
            value={fc.logo.alignment}
            onChange={(a) => store.updateFooterLogo({ alignment: a })}
          />
        </ControlRow>
      </SubSection>

      {/* Brand Text */}
      <SubSection title="Brand Text">
        <input
          type="text"
          value={fc.brandText.text}
          onChange={(e) => store.updateFooterBrandText({ text: e.target.value })}
          onFocus={() => store.setFocusedSection('footer-brand')}
          placeholder="Brand name / tagline"
          className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-500"
          data-field-id="footer-brand"
        />
        <ControlRow label="Size">
          <PillGroup
            options={[
              { value: 'small' as const, label: 'S' },
              { value: 'medium' as const, label: 'M' },
              { value: 'large' as const, label: 'L' },
            ]}
            value={fc.brandText.fontSize}
            onChange={(v) => store.updateFooterBrandText({ fontSize: v })}
          />
        </ControlRow>
        <ControlRow label="Color">
          <input
            type="color"
            value={fc.brandText.color}
            onChange={(e) => store.updateFooterBrandText({ color: e.target.value })}
            className="w-6 h-6 rounded border border-gray-400 cursor-pointer p-0"
          />
        </ControlRow>
        <ControlRow label="Spacing">
          <PillGroup
            options={[
              { value: 'normal' as const, label: 'Normal' },
              { value: 'wide' as const, label: 'Wide' },
              { value: 'wider' as const, label: 'Wider' },
            ]}
            value={fc.brandText.letterSpacing}
            onChange={(v) => store.updateFooterBrandText({ letterSpacing: v })}
          />
        </ControlRow>
        <ControlRow label="Align">
          <AlignPicker
            value={fc.brandText.alignment}
            onChange={(a) => store.updateFooterBrandText({ alignment: a })}
          />
        </ControlRow>
      </SubSection>

      {/* Social Icons */}
      <SubSection title="Social Icons">
        <div className="space-y-3">
          {fc.socialIcons.links.map((link) => (
            <SocialRow
              key={link.platform}
              platform={link.platform}
              enabled={link.enabled}
              url={link.url}
              onToggle={(enabled) => store.updateFooterSocialLink(link.platform, { enabled })}
              onUrl={(url) => store.updateFooterSocialLink(link.platform, { url })}
            />
          ))}
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-3">
          <ControlRow label="Color">
            <input
              type="color"
              value={fc.socialIcons.color}
              onChange={(e) => store.updateFooterSocialIcons({ color: e.target.value })}
              className="w-6 h-6 rounded border border-gray-400 cursor-pointer p-0"
            />
          </ControlRow>
          <ControlRow label="Size">
            <PillGroup
              options={[
                { value: 'small' as const, label: 'S' },
                { value: 'medium' as const, label: 'M' },
                { value: 'large' as const, label: 'L' },
              ]}
              value={fc.socialIcons.size}
              onChange={(v) => store.updateFooterSocialIcons({ size: v })}
            />
          </ControlRow>
          <ControlRow label="Gap">
            <PillGroup
              options={[
                { value: 'tight' as const, label: 'Tight' },
                { value: 'normal' as const, label: 'Normal' },
                { value: 'loose' as const, label: 'Loose' },
              ]}
              value={fc.socialIcons.spacing}
              onChange={(v) => store.updateFooterSocialIcons({ spacing: v })}
            />
          </ControlRow>
          <ControlRow label="Align">
            <AlignPicker
              value={fc.socialIcons.alignment}
              onChange={(a) => store.updateFooterSocialIcons({ alignment: a })}
            />
          </ControlRow>
        </div>
      </SubSection>
    </div>
  )
}
