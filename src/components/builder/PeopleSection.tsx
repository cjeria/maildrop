import { useCampaignStore } from '../../store/campaignStore'
import { BuilderSection } from './BuilderSection'
import { ImageUpload } from './ImageUpload'
import type { PersonCard } from '../../store/campaignStore'

function validateCard(card: PersonCard): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!card.name.trim()) errors.name = 'Name is required'
  if (card.email) {
    if (!card.email.includes('@')) errors.email = 'Email must include @'
    else if (!/\.[a-zA-Z]{2,}$/.test(card.email.split('@')[1] ?? ''))
      errors.email = 'Email must include a valid domain (e.g. .com)'
  }
  if (card.bioHref && !/^https?:\/\/.+/.test(card.bioHref))
    errors.bioHref = 'Bio URL must start with http:// or https://'
  return errors
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500 w-20 shrink-0">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 border rounded px-2 py-1 text-xs ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />
      </div>
      {error && <p className="text-xs text-red-500 pl-[86px]">{error}</p>}
    </div>
  )
}

export function PeopleSection() {
  const store = useCampaignStore()
  const { people, togglePeopleSection, setPeopleLayout, addPersonCard, duplicatePersonCard, updatePersonCard, removePersonCard } = store

  return (
    <BuilderSection
      title="People"
      enabled={people.enabled}
      onToggle={togglePeopleSection}
    >
      <div className="space-y-3">
        {/* Layout toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Layout</span>
          <div className="flex rounded border border-gray-300 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setPeopleLayout('horizontal')}
              className={`px-2.5 py-1 transition-colors ${people.layout === 'horizontal' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Horizontal
            </button>
            <button
              type="button"
              onClick={() => setPeopleLayout('vertical')}
              className={`px-2.5 py-1 border-l border-gray-300 transition-colors ${people.layout === 'vertical' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Vertical
            </button>
          </div>
        </div>

        {people.cards.map((card, idx) => {
          const errors = validateCard(card)
          return (
            <div key={card.id} className="border border-gray-200 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">
                  Person {idx + 1}{card.name ? ` — ${card.name}` : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => duplicatePersonCard(card.id)}
                    disabled={people.cards.length >= 4}
                    className="text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Duplicate person"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removePersonCard(card.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove person"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              <ImageUpload
                imageUrl={card.imageUrl}
                onChange={(url) => updatePersonCard(card.id, { imageUrl: url })}
                label="photo"
              />
              <Field
                label="Name"
                value={card.name}
                onChange={(v) => updatePersonCard(card.id, { name: v })}
                placeholder="Full name"
                error={errors.name}
              />
              <Field
                label="Title"
                value={card.title}
                onChange={(v) => updatePersonCard(card.id, { title: v })}
                placeholder="Job title"
              />
              <Field
                label="Location"
                value={card.location}
                onChange={(v) => updatePersonCard(card.id, { location: v })}
                placeholder="City, State"
              />
              <Field
                label="Phone"
                value={card.phone}
                onChange={(v) => updatePersonCard(card.id, { phone: v })}
                placeholder="+1 (555) 000-0000"
              />
              <Field
                label="Email"
                value={card.email}
                onChange={(v) => updatePersonCard(card.id, { email: v })}
                placeholder="jane@example.com"
                error={errors.email}
              />
              <Field
                label="Bio URL"
                value={card.bioHref}
                onChange={(v) => updatePersonCard(card.id, { bioHref: v })}
                placeholder="https://example.com/bio"
                error={errors.bioHref}
              />
            </div>
          )
        })}
        <button
          type="button"
          onClick={addPersonCard}
          disabled={people.cards.length >= 4}
          className="w-full text-xs py-1.5 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add person {people.cards.length >= 4 ? '(max 4)' : ''}
        </button>
      </div>
    </BuilderSection>
  )
}
