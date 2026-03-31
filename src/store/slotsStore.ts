import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { PersistedState } from './campaignStore'
import { useCampaignStore } from './campaignStore'

export interface CampaignSlot {
  id: string
  name: string
  savedAt: number
  state: PersistedState
}

interface SlotsStore {
  slots: CampaignSlot[]
  activeSlotId: string | null
  saveSlot: (name: string, state: PersistedState) => string
  deleteSlot: (id: string) => void
  renameSlot: (id: string, name: string) => void
  setActiveSlot: (id: string | null) => void
  getSlot: (id: string) => CampaignSlot | undefined
}

const SLOTS_KEY = 'maildrop_slots'

function loadSlots(): CampaignSlot[] {
  try {
    const raw = localStorage.getItem(SLOTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CampaignSlot[]
  } catch {
    return []
  }
}

function persist(slots: CampaignSlot[]) {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots))
}

export const useSlotsStore = create<SlotsStore>((set, get) => ({
  slots: loadSlots(),
  activeSlotId: null,

  saveSlot: (name, state) => {
    const current = get().slots
    const slot: CampaignSlot = { id: nanoid(), name, savedAt: Date.now(), state }
    const updated = [...current.slice(-9), slot] // keep max 10
    persist(updated)
    set({ slots: updated })
    return slot.id
  },

  deleteSlot: (id) => {
    const updated = get().slots.filter((s) => s.id !== id)
    persist(updated)
    if (get().activeSlotId === id) set({ activeSlotId: null })
    set({ slots: updated })
  },

  renameSlot: (id, name) => {
    const updated = get().slots.map((s) =>
      s.id === id ? { ...s, name, state: { ...s.state, campaignName: name } } : s
    )
    persist(updated)
    set({ slots: updated })
  },

  setActiveSlot: (id) => set({ activeSlotId: id }),

  getSlot: (id) => get().slots.find((s) => s.id === id),
}))

// Auto-sync active slot whenever campaign state changes (debounced)
let syncTimer: ReturnType<typeof setTimeout> | null = null
useCampaignStore.subscribe((campaign) => {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const { activeSlotId, slots } = useSlotsStore.getState()
    if (!activeSlotId) return
    const updated = slots.map((s) =>
      s.id === activeSlotId
        ? { ...s, state: {
            campaignName: campaign.campaignName,
            recipientName: campaign.recipientName,
            link: campaign.link,
            addresses: campaign.addresses,
            selectedAddress: campaign.selectedAddress,
            headerImage: campaign.headerImage,
            body: campaign.body,
            signature: campaign.signature,
            footerImage: campaign.footerImage,
            people: campaign.people,
            template: campaign.template,
            font: campaign.font,
            fontSize: campaign.fontSize,
            cornerRadius: campaign.cornerRadius,
            backgroundColor: campaign.backgroundColor,
            cardColor: campaign.cardColor,
            borderEnabled: campaign.borderEnabled,
            borderColor: campaign.borderColor,
            linkColor: campaign.linkColor,
          }}
        : s
    )
    persist(updated)
    useSlotsStore.setState({ slots: updated })
  }, 600)
})
