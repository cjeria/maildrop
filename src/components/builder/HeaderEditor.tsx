import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { ImageUpload } from './ImageUpload'
import type { HeaderConfig, HeaderSectionId } from '../../store/campaignStore'
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

type Alignment = 'left' | 'center' | 'right'

const SECTION_LABELS: Record<HeaderSectionId, string> = {
  logo: 'Logo',
  title: 'Title',
  subtitle: 'Subtitle',
  datePill: 'Date Pill',
}

const TITLE_FONTS = [
  'Georgia', 'Palatino Linotype', 'Times New Roman',
  'Arial', 'Helvetica', 'Trebuchet MS', 'Verdana',
]

const TITLE_SIZES: { value: HeaderConfig['title']['fontSize']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xl', label: 'XL' },
]

const SUBTITLE_SIZES: { value: HeaderConfig['subtitle']['fontSize']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

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
          className={`flex-1 py-1.5 px-2 flex items-center justify-center transition-colors cursor-pointer ${
            value === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Icon />
        </button>
      ))}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 min-w-0 flex items-center gap-2">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors cursor-pointer hover:opacity-80 ${value ? 'bg-gray-900' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-6 h-6 rounded border border-gray-400 cursor-pointer p-0 shrink-0"
    />
  )
}

function SortableSection({ id, children }: { id: HeaderSectionId; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-400 rounded-md overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-400">
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
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:text-gray-900 transition-colors"
        >
          {SECTION_LABELS[id]}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ml-0.5 ${open ? '' : '-rotate-90'}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  )
}

const LOGO_SIZES: { value: 'small' | 'medium' | 'large'; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

function LogoContent() {
  const store = useCampaignStore()
  const hc = store.headerConfig
  return (
    <>
      <ImageUpload
        imageUrl={hc.logo.imageUrl}
        onChange={(url) => store.updateHeaderLogo({ imageUrl: url })}
        label="logo"
      />
      <Row label="Size">
        <select
          value={hc.logo.size ?? 'medium'}
          onChange={(e) => store.updateHeaderLogo({ size: e.target.value as 'small' | 'medium' | 'large' })}
          className="flex-1 min-w-0 text-xs border border-gray-400 rounded px-1.5 py-1 cursor-pointer hover:border-gray-400 transition-colors"
        >
          {LOGO_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Row>
    </>
  )
}

function TitleContent() {
  const store = useCampaignStore()
  const hc = store.headerConfig
  return (
    <>
      <input
        type="text"
        value={hc.title.text}
        onChange={(e) => store.updateHeaderTitle({ text: e.target.value })}
        placeholder="Heading text…"
        className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-500"
      />
      <Row label="Font">
        <select
          value={hc.title.fontFamily}
          onChange={(e) => store.updateHeaderTitle({ fontFamily: e.target.value })}
          className="flex-1 min-w-0 text-xs border border-gray-400 rounded px-1.5 py-1 cursor-pointer hover:border-gray-400 transition-colors"
        >
          {TITLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </Row>
      <Row label="Size">
        <select
          value={hc.title.fontSize}
          onChange={(e) => store.updateHeaderTitle({ fontSize: e.target.value as HeaderConfig['title']['fontSize'] })}
          className="flex-1 min-w-0 text-xs border border-gray-400 rounded px-1.5 py-1 cursor-pointer hover:border-gray-400 transition-colors"
        >
          {TITLE_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <ColorSwatch value={hc.title.color} onChange={(c) => store.updateHeaderTitle({ color: c })} />
      </Row>
      <Row label="Weight">
        <select
          value={hc.title.fontWeight}
          onChange={(e) => store.updateHeaderTitle({ fontWeight: e.target.value as HeaderConfig['title']['fontWeight'] })}
          className="flex-1 min-w-0 text-xs border border-gray-400 rounded px-1.5 py-1 cursor-pointer hover:border-gray-400 transition-colors"
        >
          <option value="400">Normal</option>
          <option value="500">Medium</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
          <option value="800">Extra Bold</option>
        </select>
      </Row>
    </>
  )
}

function SubtitleContent() {
  const store = useCampaignStore()
  const hc = store.headerConfig
  return (
    <>
      <input
        type="text"
        value={hc.subtitle.text}
        onChange={(e) => store.updateHeaderSubtitle({ text: e.target.value })}
        placeholder="Subtitle text…"
        className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-500"
      />
      <Row label="Size">
        <select
          value={hc.subtitle.fontSize}
          onChange={(e) => store.updateHeaderSubtitle({ fontSize: e.target.value as HeaderConfig['subtitle']['fontSize'] })}
          className="flex-1 min-w-0 text-xs border border-gray-400 rounded px-1.5 py-1 cursor-pointer hover:border-gray-400 transition-colors"
        >
          {SUBTITLE_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <ColorSwatch value={hc.subtitle.color} onChange={(c) => store.updateHeaderSubtitle({ color: c })} />
      </Row>
    </>
  )
}

function DatePillContent() {
  const store = useCampaignStore()
  const hc = store.headerConfig
  return (
    <>
      <div className="flex items-center gap-2">
        <Toggle value={hc.datePill.show} onChange={(v) => store.updateHeaderDatePill({ show: v })} />
        <span className="text-xs text-gray-500">Show pill</span>
      </div>
      {hc.datePill.show && (
        <>
          <input
            type="text"
            value={hc.datePill.text}
            onChange={(e) => store.updateHeaderDatePill({ text: e.target.value })}
            placeholder="e.g. April 2026"
            className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-500"
          />
          <Row label="Style">
            <div className="flex border border-gray-400 rounded overflow-hidden">
              {(['outlined', 'filled'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => store.updateHeaderDatePill({ style: s })}
                  className={`px-2.5 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${
                    hc.datePill.style === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <ColorSwatch value={hc.datePill.color} onChange={(c) => store.updateHeaderDatePill({ color: c })} />
          </Row>
        </>
      )}
    </>
  )
}

const SECTION_CONTENT: Record<HeaderSectionId, React.FC> = {
  logo: LogoContent,
  title: TitleContent,
  subtitle: SubtitleContent,
  datePill: DatePillContent,
}

export function HeaderEditor() {
  const store = useCampaignStore()
  const hc = store.headerConfig
  const order = store.headerSectionOrder

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = order.indexOf(active.id as HeaderSectionId)
    const newIndex = order.indexOf(over.id as HeaderSectionId)
    store.setHeaderSectionOrder(arrayMove(order, oldIndex, newIndex))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-24 shrink-0">Background</span>
        <input
          type="color"
          value={hc.backgroundColor}
          onChange={(e) => store.setHeaderBackgroundColor(e.target.value)}
          className="w-6 h-6 rounded border border-gray-400 cursor-pointer p-0 shrink-0"
        />
        <span className="text-xs text-gray-400 font-mono">{hc.backgroundColor}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-24 shrink-0">Alignment</span>
        <AlignPicker value={hc.alignment} onChange={(v) => store.setHeaderAlignment(v)} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {order.map((id) => {
              const Content = SECTION_CONTENT[id]
              return (
                <SortableSection key={id} id={id}>
                  <Content />
                </SortableSection>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
