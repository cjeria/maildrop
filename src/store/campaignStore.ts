import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface Draft {
  id: string
  name: string
  content: string
}

export interface ContentColumn {
  id: string
  imageUrl: string
  title: string
  subtext: string
}

export interface ColumnSection {
  id: string
  type: 'columns'
  title: string
  layout: '1col' | '2col' | '3col'
  columns: ContentColumn[]
  backgroundColor: string
}

export interface PeopleBodySection {
  id: string
  type: 'people'
  title: string
  backgroundColor: string
  peopleLayout: 'horizontal' | 'vertical'
  cards: PersonCard[]
}

export type ContentSection = ColumnSection | PeopleBodySection

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

export type SectionId = 'header' | 'body' | 'footer'
export const DEFAULT_SECTION_ORDER: SectionId[] = ['header', 'body', 'footer']

export type HeaderSectionId = 'logo' | 'title' | 'subtitle' | 'datePill'
export const DEFAULT_HEADER_SECTION_ORDER: HeaderSectionId[] = ['logo', 'title', 'subtitle', 'datePill']

export interface HeaderConfig {
  backgroundColor: string
  alignment: 'left' | 'center' | 'right'
  logo: {
    imageUrl: string
    size: 'small' | 'medium' | 'large'
  }
  title: {
    text: string
    fontSize: 'small' | 'medium' | 'large' | 'xl'
    fontWeight: '400' | '500' | '600' | '700' | '800'
    color: string
    fontFamily: string
  }
  subtitle: {
    text: string
    fontSize: 'small' | 'medium' | 'large'
    color: string
  }
  datePill: {
    text: string
    show: boolean
    style: 'outlined' | 'filled'
    color: string
  }
}

export type SocialPlatform =
  | 'linkedin' | 'whatsapp' | 'instagram' | 'facebook' | 'x'
  | 'youtube' | 'tiktok' | 'pinterest' | 'threads' | 'github' | 'website'

export interface FooterSocialLink {
  platform: SocialPlatform
  enabled: boolean
  url: string
}

export interface FooterConfig {
  enabled: boolean
  backgroundColor: string
  alignment: 'left' | 'center' | 'right'
  logo: {
    imageUrl: string
    alignment: 'left' | 'center' | 'right'
  }
  brandText: {
    text: string
    fontSize: 'small' | 'medium' | 'large'
    color: string
    letterSpacing: 'normal' | 'wide' | 'wider'
    alignment: 'left' | 'center' | 'right'
  }
  socialIcons: {
    links: FooterSocialLink[]
    color: string
    size: 'small' | 'medium' | 'large'
    spacing: 'tight' | 'normal' | 'loose'
    alignment: 'left' | 'center' | 'right'
  }
}

const ALL_PLATFORMS: SocialPlatform[] = [
  'linkedin', 'whatsapp', 'instagram', 'facebook', 'x',
  'youtube', 'tiktok', 'pinterest', 'threads', 'github', 'website',
]

const DEFAULT_SOCIAL_LINKS: FooterSocialLink[] = ALL_PLATFORMS.map((platform) => ({
  platform,
  enabled: false,
  url: '',
}))

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  enabled: true,
  backgroundColor: '#1a4040',
  alignment: 'center',
  logo: { imageUrl: '', alignment: 'center' },
  brandText: {
    text: '',
    fontSize: 'small',
    color: '#ffffff',
    letterSpacing: 'wider',
    alignment: 'center',
  },
  socialIcons: {
    links: DEFAULT_SOCIAL_LINKS,
    color: '#ffffff',
    size: 'medium',
    spacing: 'normal',
    alignment: 'center',
  },
}

export interface CampaignStore {
  campaignName: string
  recipientName: string
  link: string
  addresses: string[]
  selectedAddress: string

  headerImage: { enabled: boolean; imageUrl: string }
  headerSectionOrder: HeaderSectionId[]
  headerConfig: HeaderConfig
  body: Section
  bodySections: ContentSection[]
  footerConfig: FooterConfig

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

  // Header
  setHeaderImageEnabled: (enabled: boolean) => void
  setHeaderImageUrl: (url: string) => void
  setHeaderSectionOrder: (order: HeaderSectionId[]) => void
  setHeaderAlignment: (alignment: 'left' | 'center' | 'right') => void
  updateHeaderLogo: (patch: Partial<HeaderConfig['logo']>) => void
  updateHeaderTitle: (patch: Partial<HeaderConfig['title']>) => void
  updateHeaderSubtitle: (patch: Partial<HeaderConfig['subtitle']>) => void
  updateHeaderDatePill: (patch: Partial<HeaderConfig['datePill']>) => void
  setHeaderBackgroundColor: (color: string) => void

  // Body
  setBodyContent: (content: string) => void
  addBodySection: (layout: '1col' | '2col' | '3col' | 'people') => void
  reorderBodySections: (sections: ContentSection[]) => void
  updateBodySectionTitle: (sectionId: string, title: string) => void
  updateBodySectionBackground: (sectionId: string, color: string) => void
  removeBodySection: (id: string) => void
  // Column section actions
  updateBodySectionColumn: (sectionId: string, colId: string, fields: Partial<Omit<ContentColumn, 'id'>>) => void
  // People body section actions
  setPeopleSectionLayout: (sectionId: string, layout: 'horizontal' | 'vertical') => void
  addPersonCardToSection: (sectionId: string) => void
  duplicatePersonCardToSection: (sectionId: string, cardId: string) => void
  updatePersonCardInSection: (sectionId: string, cardId: string, fields: Partial<Omit<PersonCard, 'id'>>) => void
  removePersonCardFromSection: (sectionId: string, cardId: string) => void
  reorderPersonCardsInSection: (sectionId: string, cards: PersonCard[]) => void

  // Footer
  setFooterEnabled: (enabled: boolean) => void
  updateFooterConfig: (patch: Partial<Pick<FooterConfig, 'backgroundColor' | 'alignment' | 'enabled'>>) => void
  updateFooterLogo: (patch: Partial<FooterConfig['logo']>) => void
  updateFooterBrandText: (patch: Partial<FooterConfig['brandText']>) => void
  updateFooterSocialIcons: (patch: Partial<Omit<FooterConfig['socialIcons'], 'links'>>) => void
  updateFooterSocialLink: (platform: SocialPlatform, patch: Partial<Omit<FooterSocialLink, 'platform'>>) => void

  // Drafts
  saveDraft: (section: 'body', name: string) => void
  switchDraft: (section: 'body', draftId: string) => void
  deleteDraft: (section: 'body', draftId: string) => void

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

  // UI state (not persisted)
  focusedSection: SectionId | null
  setFocusedSection: (id: SectionId | null) => void

  // Persistence
  resetStore: () => void
  loadState: (data: Partial<PersistedState>) => void
}

export type PersistedState = Pick<
  CampaignStore,
  | 'campaignName' | 'recipientName' | 'link' | 'addresses' | 'selectedAddress'
  | 'headerImage' | 'headerSectionOrder' | 'headerConfig' | 'body' | 'bodySections' | 'footerConfig'
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
  headerSectionOrder: [...DEFAULT_HEADER_SECTION_ORDER],
  headerConfig: {
    backgroundColor: '#ffffff',
    alignment: 'left',
    logo: { imageUrl: '', size: 'medium' },
    title: { text: '', fontSize: 'xl', fontWeight: '700', color: '#111827', fontFamily: 'Georgia' },
    subtitle: { text: '', fontSize: 'medium', color: '#6b7280' },
    datePill: { text: '', show: false, style: 'outlined', color: '#374151' },
  },
  body: { content: DEFAULT_BODY_CONTENT, drafts: [], activeDraftId: null },
  bodySections: [],
  footerConfig: { ...DEFAULT_FOOTER_CONFIG },
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

function migrateSections(raw: unknown[]): ContentSection[] {
  return raw.map((s: unknown) => {
    const section = s as Record<string, unknown>
    // Old column sections have no `type` field
    if (!section.type || section.type === 'columns') {
      return {
        type: 'columns',
        backgroundColor: '#ffffff',
        ...section,
      } as ColumnSection
    }
    // People body sections
    if (section.type === 'people') {
      return {
        backgroundColor: '#ffffff',
        ...section,
      } as PeopleBodySection
    }
    return section as ContentSection
  })
}

function loadPersistedState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem('maildrop_state')
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<PersistedState> & {
      footerImage?: { enabled?: boolean; imageUrl?: string }
      signature?: unknown
      people?: unknown
    }

    // Migration: drop removed sections
    delete parsed.signature
    delete (parsed as Record<string, unknown>).people

    if (parsed.people && (parsed.people as PeopleSection).cards?.length === 0) {
      delete parsed.people
    }

    // Migration: deep-merge headerConfig
    if (parsed.headerConfig) {
      const d = defaultState.headerConfig
      const saved = parsed.headerConfig as Record<string, unknown>
      parsed.headerConfig = {
        ...d, ...parsed.headerConfig,
        alignment: (parsed.headerConfig.alignment ?? (saved.logo as Record<string, unknown>)?.alignment ?? d.alignment) as 'left' | 'center' | 'right',
        logo: { ...d.logo, ...parsed.headerConfig.logo, size: parsed.headerConfig.logo?.size ?? d.logo.size },
        title: { ...d.title, ...parsed.headerConfig.title, fontWeight: parsed.headerConfig.title?.fontWeight ?? d.title.fontWeight },
        subtitle: { ...d.subtitle, ...parsed.headerConfig.subtitle },
        datePill: { ...d.datePill, ...parsed.headerConfig.datePill },
      }
    }
    // Migration: old headerImage.imageUrl → headerConfig.logo
    if (parsed.headerImage?.imageUrl && !parsed.headerConfig?.logo?.imageUrl) {
      if (!parsed.headerConfig) parsed.headerConfig = { ...defaultState.headerConfig }
      parsed.headerConfig.logo = { ...parsed.headerConfig.logo, imageUrl: parsed.headerImage.imageUrl }
    }
    // Migration: footerImage → footerConfig
    if (!parsed.footerConfig && parsed.footerImage) {
      parsed.footerConfig = {
        ...DEFAULT_FOOTER_CONFIG,
        enabled: parsed.footerImage.enabled ?? true,
        logo: { ...DEFAULT_FOOTER_CONFIG.logo, imageUrl: parsed.footerImage.imageUrl ?? '' },
      }
    }
    // Migration: deep-merge footerConfig
    if (parsed.footerConfig) {
      const d = DEFAULT_FOOTER_CONFIG
      parsed.footerConfig = {
        ...d,
        ...parsed.footerConfig,
        logo: { ...d.logo, ...parsed.footerConfig.logo },
        brandText: { ...d.brandText, ...parsed.footerConfig.brandText },
        socialIcons: {
          ...d.socialIcons,
          ...parsed.footerConfig.socialIcons,
          links: ALL_PLATFORMS.map((platform) => {
            const existing = parsed.footerConfig?.socialIcons?.links?.find((l) => l.platform === platform)
            return existing ?? { platform, enabled: false, url: '' }
          }),
        },
      }
    }
    // Migration: body sections — add type + backgroundColor fields
    if (parsed.bodySections) {
      parsed.bodySections = migrateSections(parsed.bodySections as unknown[])
    }

    return parsed
  } catch {
    return {}
  }
}

const initialState: PersistedState = { ...defaultState, ...loadPersistedState() }

let persistTimer: ReturnType<typeof setTimeout> | null = null

function updateSection<T extends ContentSection>(
  sections: ContentSection[],
  id: string,
  updater: (s: T) => T
): ContentSection[] {
  return sections.map((s) => (s.id === id ? updater(s as T) : s))
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  ...initialState,
  focusedSection: null,
  setFocusedSection: (id) => set({ focusedSection: id }),

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
        selectedAddress: state.selectedAddress === address ? (addresses[0] ?? '') : state.selectedAddress,
      }
    }),
  setSelectedAddress: (address) => set({ selectedAddress: address }),

  setHeaderImageEnabled: (enabled) =>
    set((state) => ({ headerImage: { ...state.headerImage, enabled } })),
  setHeaderImageUrl: (url) =>
    set((state) => ({ headerImage: { ...state.headerImage, imageUrl: url } })),
  setHeaderSectionOrder: (order) => set({ headerSectionOrder: order }),
  setHeaderAlignment: (alignment) =>
    set((state) => ({ headerConfig: { ...state.headerConfig, alignment } })),
  updateHeaderLogo: (patch) =>
    set((state) => ({ headerConfig: { ...state.headerConfig, logo: { ...state.headerConfig.logo, ...patch } } })),
  updateHeaderTitle: (patch) =>
    set((state) => ({ headerConfig: { ...state.headerConfig, title: { ...state.headerConfig.title, ...patch } } })),
  updateHeaderSubtitle: (patch) =>
    set((state) => ({ headerConfig: { ...state.headerConfig, subtitle: { ...state.headerConfig.subtitle, ...patch } } })),
  updateHeaderDatePill: (patch) =>
    set((state) => ({ headerConfig: { ...state.headerConfig, datePill: { ...state.headerConfig.datePill, ...patch } } })),
  setHeaderBackgroundColor: (color) =>
    set((state) => ({ headerConfig: { ...state.headerConfig, backgroundColor: color } })),

  setBodyContent: (content) =>
    set((state) => ({ body: { ...state.body, content } })),

  addBodySection: (layout) =>
    set((state) => {
      if (layout === 'people') {
        const section: PeopleBodySection = {
          id: nanoid(),
          type: 'people',
          title: '',
          backgroundColor: '#ffffff',
          peopleLayout: 'vertical',
          cards: [],
        }
        return { bodySections: [...state.bodySections, section] }
      }
      const colCount = layout === '1col' ? 1 : layout === '2col' ? 2 : 3
      const columns: ContentColumn[] = Array.from({ length: colCount }, () => ({
        id: nanoid(), imageUrl: '', title: '', subtext: '',
      }))
      const section: ColumnSection = {
        id: nanoid(), type: 'columns', title: '', layout, columns, backgroundColor: '#ffffff',
      }
      return { bodySections: [...state.bodySections, section] }
    }),

  reorderBodySections: (sections) => set({ bodySections: sections }),

  updateBodySectionTitle: (sectionId, title) =>
    set((state) => ({
      bodySections: updateSection(state.bodySections, sectionId, (s) => ({ ...s, title })),
    })),

  updateBodySectionBackground: (sectionId, color) =>
    set((state) => ({
      bodySections: updateSection(state.bodySections, sectionId, (s) => ({ ...s, backgroundColor: color })),
    })),

  removeBodySection: (id) =>
    set((state) => ({ bodySections: state.bodySections.filter((s) => s.id !== id) })),

  updateBodySectionColumn: (sectionId, colId, fields) =>
    set((state) => ({
      bodySections: updateSection<ColumnSection>(state.bodySections, sectionId, (s) => ({
        ...s,
        columns: s.columns.map((c) => c.id === colId ? { ...c, ...fields } : c),
      })),
    })),

  setPeopleSectionLayout: (sectionId, layout) =>
    set((state) => ({
      bodySections: updateSection<PeopleBodySection>(state.bodySections, sectionId, (s) => ({
        ...s, peopleLayout: layout,
      })),
    })),

  addPersonCardToSection: (sectionId) =>
    set((state) => ({
      bodySections: updateSection<PeopleBodySection>(state.bodySections, sectionId, (s) => {
        if (s.cards.length >= 4) return s
        return {
          ...s,
          cards: [...s.cards, {
            id: nanoid(), name: '', title: '', location: '', phone: '', email: '', bioHref: '', imageUrl: '',
          }],
        }
      }),
    })),

  duplicatePersonCardToSection: (sectionId, cardId) =>
    set((state) => ({
      bodySections: updateSection<PeopleBodySection>(state.bodySections, sectionId, (s) => {
        if (s.cards.length >= 4) return s
        const source = s.cards.find((c) => c.id === cardId)
        if (!source) return s
        const copy: PersonCard = { ...source, id: nanoid() }
        const idx = s.cards.findIndex((c) => c.id === cardId)
        const cards = [...s.cards]
        cards.splice(idx + 1, 0, copy)
        return { ...s, cards }
      }),
    })),

  updatePersonCardInSection: (sectionId, cardId, fields) =>
    set((state) => ({
      bodySections: updateSection<PeopleBodySection>(state.bodySections, sectionId, (s) => ({
        ...s,
        cards: s.cards.map((c) => c.id === cardId ? { ...c, ...fields } : c),
      })),
    })),

  removePersonCardFromSection: (sectionId, cardId) =>
    set((state) => ({
      bodySections: updateSection<PeopleBodySection>(state.bodySections, sectionId, (s) => ({
        ...s,
        cards: s.cards.filter((c) => c.id !== cardId),
      })),
    })),

  reorderPersonCardsInSection: (sectionId, cards) =>
    set((state) => ({
      bodySections: updateSection<PeopleBodySection>(state.bodySections, sectionId, (s) => ({
        ...s, cards,
      })),
    })),

  setFooterEnabled: (enabled) =>
    set((state) => ({ footerConfig: { ...state.footerConfig, enabled } })),
  updateFooterConfig: (patch) =>
    set((state) => ({ footerConfig: { ...state.footerConfig, ...patch } })),
  updateFooterLogo: (patch) =>
    set((state) => ({ footerConfig: { ...state.footerConfig, logo: { ...state.footerConfig.logo, ...patch } } })),
  updateFooterBrandText: (patch) =>
    set((state) => ({ footerConfig: { ...state.footerConfig, brandText: { ...state.footerConfig.brandText, ...patch } } })),
  updateFooterSocialIcons: (patch) =>
    set((state) => ({ footerConfig: { ...state.footerConfig, socialIcons: { ...state.footerConfig.socialIcons, ...patch } } })),
  updateFooterSocialLink: (platform, patch) =>
    set((state) => ({
      footerConfig: {
        ...state.footerConfig,
        socialIcons: {
          ...state.footerConfig.socialIcons,
          links: state.footerConfig.socialIcons.links.map((l) =>
            l.platform === platform ? { ...l, ...patch } : l
          ),
        },
      },
    })),

  saveDraft: (section, name) =>
    set((state) => {
      const sec = state[section]
      const draft: Draft = { id: nanoid(), name, content: sec.content }
      return { [section]: { ...sec, drafts: [...sec.drafts, draft], activeDraftId: draft.id } }
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

// Debounced persistence
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
      headerSectionOrder: state.headerSectionOrder,
      headerConfig: state.headerConfig,
      body: state.body,
      bodySections: state.bodySections,
      footerConfig: state.footerConfig,
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
