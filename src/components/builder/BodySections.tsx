import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { ImageUpload } from './ImageUpload'
import { RichTextEditor } from './RichTextEditor'
import type { ContentSection, ColumnSection, PeopleBodySection, PersonCard } from '../../store/campaignStore'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Type guards ───────────────────────────────────────────────────────────────

const isColumnSection = (s: ContentSection): s is ColumnSection => s.type === 'columns'
const isPeopleSection = (s: ContentSection): s is PeopleBodySection => s.type === 'people'

// ── Layout modal ──────────────────────────────────────────────────────────────

type Layout = '1col' | '2col' | '3col' | 'people'

function ColumnVisual({ cols }: { cols: number }) {
  return (
    <div className="flex gap-1 w-full h-10 mb-2">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1 rounded bg-gray-200 border border-gray-400" />
      ))}
    </div>
  )
}

function PeopleVisual() {
  return (
    <div className="flex gap-2 w-full h-10 mb-2 items-end justify-center">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div className="w-5 h-5 rounded-full bg-gray-300 border border-gray-400" />
          <div className="w-8 h-2 rounded bg-gray-200 border border-gray-400" />
          <div className="w-6 h-1.5 rounded bg-gray-200 border border-gray-300" />
        </div>
      ))}
    </div>
  )
}

const LAYOUT_OPTIONS: { value: Layout; label: string; cols?: number }[] = [
  { value: '1col', label: '1 Column', cols: 1 },
  { value: '2col', label: '2 Columns', cols: 2 },
  { value: '3col', label: '3 Columns', cols: 3 },
  { value: 'people', label: 'People' },
]

function AddSectionModal({ onClose, onAdd }: { onClose: () => void; onAdd: (layout: Layout) => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[480px]">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Choose a layout</h2>
        <div className="grid grid-cols-4 gap-3 mb-5">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onAdd(opt.value); onClose() }}
              className="flex flex-col items-center p-3 rounded-lg border-2 border-gray-400 hover:border-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {opt.value === 'people' ? <PeopleVisual /> : <ColumnVisual cols={opt.cols!} />}
              <span className="text-xs font-medium text-gray-700">{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-400 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Column editor ─────────────────────────────────────────────────────────────

function ColumnEditor({
  sectionId,
  column,
  index,
  total,
}: {
  sectionId: string
  column: ColumnSection['columns'][number]
  index: number
  total: number
}) {
  const store = useCampaignStore()
  const update = (fields: Parameters<typeof store.updateBodySectionColumn>[2]) =>
    store.updateBodySectionColumn(sectionId, column.id, fields)

  return (
    <div className="space-y-2">
      {total > 1 && (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Column {index + 1}
        </p>
      )}
      <ImageUpload
        imageUrl={column.imageUrl}
        onChange={(url) => update({ imageUrl: url })}
        label="column image"
      />
      <RichTextEditor
        content={column.title}
        onChange={(html) => update({ title: html })}
      />
      <RichTextEditor
        content={column.subtext}
        onChange={(html) => update({ subtext: html })}
        font={store.font}
        onFontChange={store.setFont}
        fontSize={store.fontSize}
        onFontSizeChange={store.setFontSize}
      />
    </div>
  )
}

// ── People section editor (inline, scoped to a body section) ──────────────────

function validateCard(card: PersonCard): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!card.name.trim()) errors.name = 'Name is required'
  if (card.email && !card.email.includes('@')) errors.email = 'Email must include @'
  if (card.bioHref && !/^https?:\/\/.+/.test(card.bioHref))
    errors.bioHref = 'Bio URL must start with http:// or https://'
  return errors
}

function PersonField({
  label, value, onChange, placeholder, error,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500 w-20 shrink-0">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 border rounded px-2 py-1 text-xs ${error ? 'border-red-400 bg-red-50' : 'border-gray-400'}`}
        />
      </div>
      {error && <p className="text-xs text-red-500 pl-[86px]">{error}</p>}
    </div>
  )
}

function SortablePersonCard({
  sectionId,
  card,
  idx,
  total,
}: {
  sectionId: string
  card: PersonCard
  idx: number
  total: number
}) {
  const store = useCampaignStore()
  const [collapsed, setCollapsed] = useState(false)
  const errors = validateCard(card)

  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: card.id })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const update = (fields: Partial<Omit<PersonCard, 'id'>>) =>
    store.updatePersonCardInSection(sectionId, card.id, fields)

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-400 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-400">
        <div className="flex items-center gap-1.5">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
            title="Drag to reorder"
            {...listeners}
            {...attributes}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="2.5" cy="2" r="1.5" /><circle cx="7.5" cy="2" r="1.5" />
              <circle cx="2.5" cy="7" r="1.5" /><circle cx="7.5" cy="7" r="1.5" />
              <circle cx="2.5" cy="12" r="1.5" /><circle cx="7.5" cy="12" r="1.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
          >
            Person {idx + 1}{card.name ? ` — ${card.name}` : ''}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform ml-0.5 ${collapsed ? '-rotate-90' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => store.duplicatePersonCardToSection(sectionId, card.id)}
            disabled={total >= 4}
            className="text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Duplicate"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => store.removePersonCardFromSection(sectionId, card.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Remove"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-2">
          <ImageUpload imageUrl={card.imageUrl} onChange={(url) => update({ imageUrl: url })} label="photo" />
          <PersonField label="Name" value={card.name} onChange={(v) => update({ name: v })} placeholder="Full name" error={errors.name} />
          <PersonField label="Title" value={card.title} onChange={(v) => update({ title: v })} placeholder="Job title" />
          <PersonField label="Location" value={card.location} onChange={(v) => update({ location: v })} placeholder="City, State" />
          <PersonField label="Phone" value={card.phone} onChange={(v) => update({ phone: v })} placeholder="+1 (555) 000-0000" />
          <PersonField label="Email" value={card.email} onChange={(v) => update({ email: v })} placeholder="jane@example.com" error={errors.email} />
          <PersonField label="Bio URL" value={card.bioHref} onChange={(v) => update({ bioHref: v })} placeholder="https://example.com/bio" error={errors.bioHref} />
        </div>
      )}
    </div>
  )
}

function PeopleBodySectionEditor({ section }: { section: PeopleBodySection }) {
  const store = useCampaignStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = section.cards.map((c) => c.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    store.reorderPersonCardsInSection(section.id, arrayMove(section.cards, oldIndex, newIndex))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Layout</span>
        <div className="flex rounded border border-gray-400 overflow-hidden text-xs">
          {(['horizontal', 'vertical'] as const).map((l, i) => (
            <button
              key={l}
              type="button"
              onClick={() => store.setPeopleSectionLayout(section.id, l)}
              className={`px-2.5 py-1 transition-colors capitalize ${i > 0 ? 'border-l border-gray-400' : ''} ${section.peopleLayout === l ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={section.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {section.cards.map((card, idx) => (
              <SortablePersonCard
                key={card.id}
                sectionId={section.id}
                card={card}
                idx={idx}
                total={section.cards.length}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => store.addPersonCardToSection(section.id)}
        disabled={section.cards.length >= 4}
        className="w-full text-xs py-1.5 border border-dashed border-gray-400 rounded-md text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        + Add person {section.cards.length >= 4 ? '(max 4)' : ''}
      </button>
    </div>
  )
}

// ── Section editor (wraps both types) ─────────────────────────────────────────

function SectionEditor({ section, index }: { section: ContentSection; index: number }) {
  const store = useCampaignStore()
  const [collapsed, setCollapsed] = useState(false)
  const isHighlighted = store.focusedSection === `body-${section.id}`

  const layoutLabel =
    isPeopleSection(section)
      ? 'People'
      : section.layout === '1col' ? '1 Column'
      : section.layout === '2col' ? '2 Columns'
      : '3 Columns'

  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: section.id })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-section-id={`body-${section.id}`}
      className={`border border-gray-400 rounded-md overflow-hidden mt-3 transition-shadow ${isHighlighted ? 'ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.35)]' : ''}`}
      onClick={() => store.setFocusedSection(`body-${section.id}`)}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
            title="Drag to reorder"
            {...listeners}
            {...attributes}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="2.5" cy="2" r="1.5" /><circle cx="7.5" cy="2" r="1.5" />
              <circle cx="2.5" cy="7" r="1.5" /><circle cx="7.5" cy="7" r="1.5" />
              <circle cx="2.5" cy="12" r="1.5" /><circle cx="7.5" cy="12" r="1.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
          >
            Section {index + 1}
            <span className="font-normal text-gray-400">· {layoutLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform ml-0.5 ${collapsed ? '-rotate-90' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Background color picker */}
          <input
            type="color"
            value={section.backgroundColor}
            onChange={(e) => store.updateBodySectionBackground(section.id, e.target.value)}
            className="w-5 h-5 rounded border border-gray-400 cursor-pointer p-0 shrink-0"
            title="Section background color"
          />
          <button
            type="button"
            onClick={() => store.removeBodySection(section.id)}
            title="Remove section"
            className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-5">
          <RichTextEditor
            content={section.title}
            onChange={(html) => store.updateBodySectionTitle(section.id, html)}
          />

          {isColumnSection(section)
            ? section.columns.map((col, i) => (
                <ColumnEditor
                  key={col.id}
                  sectionId={section.id}
                  column={col}
                  index={i}
                  total={section.columns.length}
                />
              ))
            : <PeopleBodySectionEditor section={section} />
          }
        </div>
      )}
    </div>
  )
}

// ── Body sections list ────────────────────────────────────────────────────────

export function BodySections() {
  const store = useCampaignStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = store.bodySections.map((s) => s.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    store.reorderBodySections(arrayMove(store.bodySections, oldIndex, newIndex))
  }

  if (store.bodySections.length === 0) return null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={store.bodySections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div>
          {store.bodySections.map((section, i) => (
            <SectionEditor key={section.id} section={section} index={i} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

// ── Add section button ────────────────────────────────────────────────────────

export function AddSectionButton() {
  const [showModal, setShowModal] = useState(false)
  const store = useCampaignStore()

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        title="Add section"
        className="flex items-center gap-1 px-2 py-0.5 text-xs border border-gray-400 rounded text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add section
      </button>
      {showModal && (
        <AddSectionModal
          onClose={() => setShowModal(false)}
          onAdd={(layout) => store.addBodySection(layout)}
        />
      )}
    </>
  )
}
