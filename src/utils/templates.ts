import type { PersistedState } from '../store/campaignStore'

interface TemplatePreset {
  name: string
  description: string
  state: PersistedState
}

const base = (): PersistedState => ({
  campaignName: '',
  recipientName: '',
  link: '',
  addresses: [],
  selectedAddress: '',
  headerImage: { enabled: false, imageUrl: '' },
  body: { content: '', drafts: [], activeDraftId: null },
  signature: { content: '', drafts: [], activeDraftId: null, enabled: true, imageUrl: '' },
  footerImage: { enabled: false, imageUrl: '' },
  people: { enabled: false, layout: 'vertical', cards: [] },
  template: 'Normal',
  font: 'Arial',
  fontSize: 'normal',
  cornerRadius: 0,
  backgroundColor: '#f3f4f6',
  cardColor: '#ffffff',
  borderEnabled: true,
  borderColor: '#e5e7eb',
  linkColor: '#c45e1a',
})

export const TEMPLATES: TemplatePreset[] = [
  {
    name: 'Outreach intro',
    description: 'First-touch introduction to a new prospect.',
    state: {
      ...base(),
      campaignName: 'Outreach intro',
      body: {
        content: `<p>Hi {{name}},</p><p>I hope this message finds you well. I wanted to reach out and introduce myself — I think there may be a great fit between what we offer and what you're working toward.</p><p>You can learn more at <a href="{{link}}">our website</a> — I'd love to hear your thoughts.</p><p>Looking forward to connecting!</p>`,
        drafts: [],
        activeDraftId: null,
      },
    },
  },
  {
    name: 'Follow-up',
    description: 'Gentle nudge after an initial outreach.',
    state: {
      ...base(),
      campaignName: 'Follow-up',
      body: {
        content: `<p>Hi {{name}},</p><p>I wanted to follow up on my previous message and see if you had a chance to take a look.</p><p>All the details are available at <a href="{{link}}">this link</a> — happy to answer any questions or jump on a quick call at your convenience.</p><p>Thanks for your time, and I hope to hear from you soon!</p>`,
        drafts: [],
        activeDraftId: null,
      },
    },
  },
  {
    name: 'Referral request',
    description: 'Ask an existing contact for an introduction.',
    state: {
      ...base(),
      campaignName: 'Referral request',
      body: {
        content: `<p>Hi {{name}},</p><p>I hope you're doing well! I'm reaching out because I think you might know someone who could benefit from what we offer.</p><p>If anyone comes to mind, feel free to share <a href="{{link}}">this link</a> with them — I'd be grateful for any introductions you can make.</p><p>Your mailing address on file: {{address}}.</p><p>Thank you as always for your support!</p>`,
        drafts: [],
        activeDraftId: null,
      },
    },
  },
  {
    name: 'Meeting recap',
    description: 'Summary and next steps after a call or meeting.',
    state: {
      ...base(),
      campaignName: 'Meeting recap',
      body: {
        content: `<p>Hi {{name}},</p><p>Thank you for taking the time to connect today — it was great speaking with you.</p><p>As a quick recap, here are the key points we discussed and the next steps we agreed on. You can find the materials we reviewed at <a href="{{link}}">this link</a>.</p><p>I'll follow up again soon, but please don't hesitate to reach out in the meantime. Looking forward to our continued conversation!</p>`,
        drafts: [],
        activeDraftId: null,
      },
    },
  },
]
