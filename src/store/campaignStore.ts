import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface Draft {
  id: string
  name: string
  content: string
}

export interface Section {
  content: string
  drafts: Draft[]
  activeDraftId: string | null
}

export interface SignatureSection extends Section {
  enabled: boolean
  imageUrl: string
}

export interface PersonCard {
  id: string
  name: string
  title: string
  location: string
  phone: string
  email: string
  bioHref: string
  imageUrl: string
}

export interface PeopleSection {
  enabled: boolean
  layout: 'horizontal' | 'vertical'
  cards: PersonCard[]
}

export interface CampaignStore {
  campaignName: string
  recipientName: string
  link: string
  addresses: string[]
  selectedAddress: string

  headerImage: { enabled: boolean; imageUrl: string }
  body: Section
  signature: SignatureSection
  footerImage: { enabled: boolean; imageUrl: string }
  people: PeopleSection

  template: 'Normal' | 'Wide' | 'Narrow'
  font: string
  fontSize: 'small' | 'normal' | 'large' | 'huge'
  cornerRadius: number
  backgroundColor: string
  cardColor: string
  borderEnabled: boolean
  borderColor: string
  linkColor: string

  // Campaign actions
  setCampaignName: (name: string) => void
  setRecipientName: (name: string) => void
  setLink: (link: string) => void
  addAddress: (address: string) => void
  removeAddress: (address: string) => void
  setSelectedAddress: (address: string) => void

  // Section content
  setHeaderImageEnabled: (enabled: boolean) => void
  setHeaderImageUrl: (url: string) => void
  setBodyContent: (content: string) => void
  setSignatureEnabled: (enabled: boolean) => void
  setSignatureContent: (content: string) => void
  setSignatureImage: (url: string) => void
  setFooterImageEnabled: (enabled: boolean) => void
  setFooterImageUrl: (url: string) => void

  // People section
  togglePeopleSection: (enabled: boolean) => void
  setPeopleLayout: (layout: 'horizontal' | 'vertical') => void
  addPersonCard: () => void
  duplicatePersonCard: (id: string) => void
  updatePersonCard: (id: string, fields: Partial<Omit<PersonCard, 'id'>>) => void
  removePersonCard: (id: string) => void
  reorderPersonCards: (newOrder: PersonCard[]) => void

  // Drafts
  saveDraft: (section: 'body' | 'signature', name: string) => void
  switchDraft: (section: 'body' | 'signature', draftId: string) => void
  deleteDraft: (section: 'body' | 'signature', draftId: string) => void

  // Preview settings
  setTemplate: (template: 'Normal' | 'Wide' | 'Narrow') => void
  setFont: (font: string) => void
  setFontSize: (size: 'small' | 'normal' | 'large' | 'huge') => void
  setCornerRadius: (radius: number) => void
  setBackgroundColor: (color: string) => void
  setCardColor: (color: string) => void
  setBorderEnabled: (enabled: boolean) => void
  setBorderColor: (color: string) => void
  setLinkColor: (color: string) => void

  // Persistence
  resetStore: () => void
  loadState: (data: Partial<PersistedState>) => void
}

export type PersistedState = Pick<
  CampaignStore,
  | 'campaignName' | 'recipientName' | 'link' | 'addresses' | 'selectedAddress'
  | 'headerImage' | 'body' | 'signature' | 'footerImage' | 'people'
  | 'template' | 'font' | 'fontSize' | 'cornerRadius'
  | 'backgroundColor' | 'cardColor' | 'borderEnabled' | 'borderColor' | 'linkColor'
>

const DEFAULT_BODY_CONTENT =
  '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>'

const defaultSection = (): Section => ({
  content: '',
  drafts: [],
  activeDraftId: null,
})

export const defaultState: PersistedState = {
  campaignName: 'Untitled Campaign',
  recipientName: '',
  link: '',
  addresses: [],
  selectedAddress: '',
  headerImage: { enabled: true, imageUrl: '' },
  body: { content: DEFAULT_BODY_CONTENT, drafts: [], activeDraftId: null },
  signature: { ...defaultSection(), enabled: true, imageUrl: '' },
  footerImage: { enabled: true, imageUrl: '' },
  people: {
    enabled: false,
    layout: 'vertical',
    cards: [{
      id: nanoid(),
      name: 'Jane Smith',
      title: 'Senior Account Executive',
      location: 'New York, NY',
      phone: '+1 (212) 555-0182',
      email: 'jane.smith@example.com',
      bioHref: 'https://example.com/bio/jane-smith',
      imageUrl: 'https://placehold.co/120x120/e5e7eb/9ca3af?text=Photo',
    }],
  },
  template: 'Normal',
  font: 'Arial',
  fontSize: 'normal',
  cornerRadius: 0,
  backgroundColor: '#f3f4f6',
  cardColor: '#ffffff',
  borderEnabled: true,
  borderColor: '#e5e7eb',
  linkColor: '#c45e1a',
}

function loadPersistedState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem('maildrop_state')
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    // Migration: if people.cards is empty or layout is missing, drop it so defaults are used
    if (parsed.people && (parsed.people.cards.length === 0 || !parsed.people.layout)) {
      delete parsed.people
    }
    return parsed
  } catch {
    return {}
  }
}

const initialState: PersistedState = { ...defaultState, ...loadPersistedState() }

let persistTimer: ReturnType<typeof setTimeout> | null = null

export const useCampaignStore = create<CampaignStore>((set) => ({
  ...initialState,

  setCampaignName: (name) => set({ campaignName: name }),
  setRecipientName: (name) => set({ recipientName: name }),
  setLink: (link) => set({ link }),
  addAddress: (address) =>
    set((state) => ({
      addresses: [...state.addresses, address],
      selectedAddress: state.selectedAddress || address,
    })),
  removeAddress: (address) =>
    set((state) => {
      const addresses = state.addresses.filter((a) => a !== address)
      return {
        addresses,
        selectedAddress:
          state.selectedAddress === address ? (addresses[0] ?? '') : state.selectedAddress,
      }
    }),
  setSelectedAddress: (address) => set({ selectedAddress: address }),

  setHeaderImageEnabled: (enabled) =>
    set((state) => ({ headerImage: { ...state.headerImage, enabled } })),
  setHeaderImageUrl: (url) =>
    set((state) => ({ headerImage: { ...state.headerImage, imageUrl: url } })),

  setBodyContent: (content) =>
    set((state) => ({ body: { ...state.body, content } })),

  setSignatureEnabled: (enabled) =>
    set((state) => ({ signature: { ...state.signature, enabled } })),
  setSignatureContent: (content) =>
    set((state) => ({ signature: { ...state.signature, content } })),
  setSignatureImage: (url) =>
    set((state) => ({ signature: { ...state.signature, imageUrl: url } })),

  setFooterImageEnabled: (enabled) =>
    set((state) => ({ footerImage: { ...state.footerImage, enabled } })),
  setFooterImageUrl: (url) =>
    set((state) => ({ footerImage: { ...state.footerImage, imageUrl: url } })),

  togglePeopleSection: (enabled) =>
    set((state) => ({ people: { ...state.people, enabled } })),
  setPeopleLayout: (layout) =>
    set((state) => ({ people: { ...state.people, layout } })),
  duplicatePersonCard: (id) =>
    set((state) => {
      if (state.people.cards.length >= 4) return {}
      const source = state.people.cards.find((c) => c.id === id)
      if (!source) return {}
      const copy: PersonCard = { ...source, id: nanoid() }
      const idx = state.people.cards.findIndex((c) => c.id === id)
      const cards = [...state.people.cards]
      cards.splice(idx + 1, 0, copy)
      return { people: { ...state.people, cards } }
    }),

  addPersonCard: () =>
    set((state) => {
      if (state.people.cards.length >= 4) return {}
      const card: PersonCard = {
        id: nanoid(),
        name: '',
        title: '',
        location: '',
        phone: '',
        email: '',
        bioHref: '',
        imageUrl: '',
      }
      return { people: { ...state.people, cards: [...state.people.cards, card] } }
    }),
  updatePersonCard: (id, fields) =>
    set((state) => ({
      people: {
        ...state.people,
        cards: state.people.cards.map((c) => (c.id === id ? { ...c, ...fields } : c)),
      },
    })),
  removePersonCard: (id) =>
    set((state) => ({
      people: { ...state.people, cards: state.people.cards.filter((c) => c.id !== id) },
    })),
  reorderPersonCards: (newOrder) =>
    set((state) => ({ people: { ...state.people, cards: newOrder } })),

  saveDraft: (section, name) =>
    set((state) => {
      const sec = state[section]
      const draft: Draft = { id: nanoid(), name, content: sec.content }
      return {
        [section]: { ...sec, drafts: [...sec.drafts, draft], activeDraftId: draft.id },
      }
    }),

  switchDraft: (section, draftId) =>
    set((state) => {
      const sec = state[section]
      const draft = sec.drafts.find((d) => d.id === draftId)
      if (!draft) return {}
      return { [section]: { ...sec, content: draft.content, activeDraftId: draftId } }
    }),

  deleteDraft: (section, draftId) =>
    set((state) => {
      const sec = state[section]
      const drafts = sec.drafts.filter((d) => d.id !== draftId)
      const activeDraftId = sec.activeDraftId === draftId ? null : sec.activeDraftId
      return { [section]: { ...sec, drafts, activeDraftId } }
    }),

  setTemplate: (template) => set({ template }),
  setFont: (font) => set({ font }),
  setFontSize: (fontSize) => set({ fontSize }),
  setCornerRadius: (cornerRadius) => set({ cornerRadius }),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setCardColor: (cardColor) => set({ cardColor }),
  setBorderEnabled: (borderEnabled) => set({ borderEnabled }),
  setBorderColor: (borderColor) => set({ borderColor }),
  setLinkColor: (linkColor) => set({ linkColor }),

  resetStore: () => {
    localStorage.removeItem('maildrop_state')
    set(defaultState)
  },
  loadState: (data) => set((state) => ({ ...state, ...data })),
}))

// Debounced persistence to localStorage
useCampaignStore.subscribe((state) => {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const persisted: PersistedState = {
      campaignName: state.campaignName,
      recipientName: state.recipientName,
      link: state.link,
      addresses: state.addresses,
      selectedAddress: state.selectedAddress,
      headerImage: state.headerImage,
      body: state.body,
      signature: state.signature,
      footerImage: state.footerImage,
      people: state.people,
      template: state.template,
      font: state.font,
      fontSize: state.fontSize,
      cornerRadius: state.cornerRadius,
      backgroundColor: state.backgroundColor,
      cardColor: state.cardColor,
      borderEnabled: state.borderEnabled,
      borderColor: state.borderColor,
      linkColor: state.linkColor,
    }
    localStorage.setItem('maildrop_state', JSON.stringify(persisted))
  }, 500)
})
