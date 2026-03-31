import type { Section, SignatureSection, PersonCard } from '../store/campaignStore'

interface StoreState {
  campaignName: string
  recipientName: string
  link: string
  addresses: string[]
  selectedAddress: string
  headerImage: { enabled: boolean; imageUrl: string }
  body: Section
  signature: SignatureSection
  footerImage: { enabled: boolean; imageUrl: string }
  people: { enabled: boolean; layout: 'horizontal' | 'vertical'; cards: PersonCard[] }
  template: 'Normal' | 'Wide' | 'Narrow'
  font: string
  fontSize: 'small' | 'normal' | 'large' | 'huge'
  cornerRadius: number
  backgroundColor: string
  cardColor: string
  borderEnabled: boolean
  borderColor: string
  linkColor: string
}

export interface SpamCheckResult {
  score: number
  signals: string[]
}

const templateWidths: Record<string, number> = {
  Normal: 600,
  Wide: 800,
  Narrow: 540,
}

function resolveVars(html: string, name: string, link: string, address: string): string {
  return html
    .replace(/\{\{name\}\}/g, name || '{{name}}')
    .replace(/\{\{link\}\}/g, link || '{{link}}')
    .replace(/\{\{address\}\}/g, address || '{{address}}')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Replace runs of 2+ spaces in HTML text nodes with alternating &nbsp;/space
// so spaces are visually preserved without needing white-space: pre-wrap
function preserveSpaces(html: string): string {
  return html.replace(/>([^<]*)</g, (_, text: string) => {
    const preserved = text.replace(/ {2,}/g, (run: string) =>
      Array.from(run).map((_, i) => (i % 2 === 0 ? '&nbsp;' : ' ')).join('')
    )
    return `>${preserved}<`
  })
}

// Replace img tags in Tiptap content with table-compatible versions
function processInlineImages(html: string, contentWidth: number): string {
  return html.replace(/<img(\s[^>]*)?>/gi, (_match, attrs = '') => {
    // Strip existing width/height/style attrs
    let clean = attrs
      .replace(/\s*width\s*=\s*["']?[\d%]+["']?/gi, '')
      .replace(/\s*height\s*=\s*["']?[\w%]+["']?/gi, '')
      .replace(/\s*style\s*=\s*["'][^"']*["']/gi, '')
    return `<img${clean} width="${contentWidth}" style="display: block;">`
  })
}

function renderPersonCard(card: PersonCard, fontFamily: string, layout: 'horizontal' | 'vertical', linkColor: string, photoWidth: number): string {
  const nameEsc = escapeHtml(card.name)
  const p = (style: string, content: string) =>
    `<p style="margin: 0; line-height: 1.4; word-break: break-word; overflow-wrap: break-word; ${style}">${content}</p>`

  const textBlock = `
    ${card.name ? p(`font-weight: bold; color: #1a3a4a; font-family: ${fontFamily}; font-size: 14px;`, nameEsc) : ''}
    ${card.title ? p(`font-family: ${fontFamily}; font-size: 13px; color: #374151;`, escapeHtml(card.title)) : ''}
    ${card.location ? p(`font-family: ${fontFamily}; font-size: 13px; color: #374151;`, escapeHtml(card.location)) : ''}
    ${card.phone ? p(`font-family: ${fontFamily}; font-size: 13px; color: #374151;`, escapeHtml(card.phone)) : ''}
    ${card.email ? p(`font-size: 13px;`, `<a href="mailto:${escapeHtml(card.email)}" style="color: ${linkColor}; text-decoration: none; font-family: ${fontFamily};">${escapeHtml(card.email)}</a>`) : ''}
    ${card.bioHref ? p(`font-size: 13px;`, `<a href="${escapeHtml(card.bioHref)}" style="color: ${linkColor}; text-decoration: none; font-family: ${fontFamily};">Full bio</a>`) : ''}
  `.trim()

  const photo = card.imageUrl
    ? card.bioHref
      ? `<a href="${escapeHtml(card.bioHref)}" style="display: block;"><img src="${card.imageUrl}" width="${photoWidth}" alt="${nameEsc}" style="display: block;" /></a>`
      : `<img src="${card.imageUrl}" width="${photoWidth}" alt="${nameEsc}" style="display: block;" />`
    : ''

  if (layout === 'vertical') {
    return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout: fixed; width: 100%;">
      ${photo ? `<tr><td align="left" style="padding-bottom: 8px;">${photo}</td></tr>` : ''}
      <tr><td style="word-break: break-word; overflow-wrap: break-word;">${textBlock}</td></tr>
    </table>`
  }

  const photoTdWidth = photoWidth + 12
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout: fixed; width: 100%;">
    <tr>
      <td valign="top" width="${photoTdWidth}" style="padding-right: 12px; width: ${photoTdWidth}px;">${photo}</td>
      <td valign="top" style="word-break: break-word; overflow-wrap: break-word;">${textBlock}</td>
    </tr>
  </table>`
}

function renderPeopleRows(cards: PersonCard[], fontFamily: string, layout: 'horizontal' | 'vertical', linkColor: string, contentWidth: number): string {
  const perRow = layout === 'horizontal' ? 2 : 4
  const pct = `${Math.floor(100 / perRow)}%`
  // estimate cell content width for photo sizing: (contentWidth / perRow) minus 16px padding each side
  const cellContentWidth = Math.floor(contentWidth / perRow) - 32
  const photoWidth = Math.min(120, cellContentWidth)
  const rows: string[] = []
  for (let i = 0; i < cards.length; i += perRow) {
    const chunk = cards.slice(i, i + perRow)
    const cells = chunk.map((card) =>
      `<td width="${pct}" valign="top" style="padding: 12px 16px; width: ${pct};">${renderPersonCard(card, fontFamily, layout, linkColor, photoWidth)}</td>`
    ).join('')
    const empties = perRow - chunk.length
    const padding = empties > 0 ? `<td width="${pct}" valign="top" style="width: ${pct};"></td>`.repeat(empties) : ''
    rows.push(`<tr>${cells}${padding}</tr>`)
  }
  return rows.join('')
}

function placeholderRow(label: string, borderStyle = 'border-top: 1px solid #e5e7eb;'): string {
  return `<tr><td style="${borderStyle} padding: 16px 24px;"><div style="border: 2px dashed #d1d5db; border-radius: 6px; padding: 24px; text-align: center; color: #9ca3af; font-family: Arial, sans-serif; font-size: 12px;">${label}</div></td></tr>\n`
}

export function generateEmailHtml(state: StoreState, options: { isPreview?: boolean } = {}): string {
  const { isPreview = false } = options
  const { recipientName, link, selectedAddress, headerImage, body, signature, footerImage, people, template, font, fontSize, cornerRadius, backgroundColor, cardColor, borderEnabled, borderColor, linkColor } = state

  const fontSizePx: Record<string, string> = { small: '10px', normal: '14px', large: '18px', huge: '32px' }
  const resolvedFontSize = fontSizePx[fontSize] ?? '14px'

  const maxWidthNum = templateWidths[template] ?? 600
  const fontFamily = `${font}, Arial, sans-serif`
  const contentWidth = maxWidthNum - 48 // subtract 24px padding on each side
  const borderStyle = borderEnabled ? `border: 1px solid ${borderColor};` : ''
  const radiusStyle = cornerRadius > 0 ? `border-radius: ${cornerRadius}px;` : ''
  const divider = `1px solid ${borderColor}`

  const resolve = (html: string) => resolveVars(html, recipientName, link, selectedAddress)

  const sectionStyle = `font-family: ${fontFamily}; font-size: ${resolvedFontSize}; line-height: 1.6; color: #1f2937; padding: 16px 24px;`

  let rows = ''

  // Header image
  if (headerImage.enabled && headerImage.imageUrl) {
    rows += `<tr><td style="border-bottom: ${divider}; padding: 0; line-height: 0; font-size: 0;"><img src="${headerImage.imageUrl}" width="${maxWidthNum}" alt="" style="display: block;" /></td></tr>\n`
  } else if (headerImage.enabled && isPreview) {
    rows += placeholderRow('Header image', `border-bottom: ${divider};`)
  }

  // Body
  if (body.content) {
    const bodyHtml = preserveSpaces(
      processInlineImages(resolve(body.content), contentWidth)
        .replace(/<p><\/p>/g, '<p>&nbsp;</p>')
    )
    rows += `<tr><td style="${sectionStyle}">${bodyHtml}</td></tr>\n`
  }

  // Signature
  if (signature.enabled && !signature.content && !signature.imageUrl && isPreview) {
    rows += placeholderRow('Signature', `border-top: ${divider};`)
  } else if (signature.enabled && (signature.content || signature.imageUrl)) {
    let sigContent = ''
    if (signature.content) {
      sigContent += `<div style="font-family: ${fontFamily}; font-size: ${resolvedFontSize}; line-height: 1.6; color: #1f2937;">${processInlineImages(resolve(signature.content), contentWidth)}</div>`
    }
    if (signature.imageUrl) {
      sigContent += `<img src="${signature.imageUrl}" width="${maxWidthNum - 48}" alt="" style="display: block; margin-top: 8px;" />`
    }
    rows += `    <tr>
      <td style="padding: 16px 24px; border-top: ${divider};">
        ${sigContent}
      </td>
    </tr>\n`
  }

  // People section
  if (people.enabled && people.cards.length === 0 && isPreview) {
    const dummyCard: PersonCard = {
      id: '__placeholder__',
      name: 'Jane Smith',
      title: 'Senior Account Executive',
      location: 'New York, NY',
      phone: '+1 (212) 555-0182',
      email: 'jane.smith@example.com',
      bioHref: 'https://example.com/bio/jane-smith',
      imageUrl: 'https://placehold.co/120x120/e5e7eb/9ca3af?text=Photo',
    }
    const dummyCellPx = Math.floor(maxWidthNum / 4)
    const dummyPhotoPx = Math.min(120, dummyCellPx - 32)
    rows += `<tr><td style="padding: 12px 24px 0; border-top: ${divider};"><p style="margin: 0; font-family: ${fontFamily}; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Connect with us</p></td></tr>\n`
    rows += `<tr><td style="padding: 0;"><table width="${maxWidthNum}" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: ${maxWidthNum}px;"><tr><td width="${dummyCellPx}" valign="top" style="padding: 12px 16px; width: ${dummyCellPx}px;">${renderPersonCard(dummyCard, fontFamily, people.layout, linkColor, dummyPhotoPx)}</td><td valign="top" style="padding: 12px 16px;"></td></tr></table></td></tr>\n`
  } else if (people.enabled && people.cards.length > 0) {
    rows += `    <tr>
      <td style="padding: 12px 24px 0; border-top: ${divider};">
        <p style="margin: 0; font-family: ${fontFamily}; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Connect with us</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0;">
        <table width="${maxWidthNum}" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: ${maxWidthNum}px;">
          ${renderPeopleRows(people.cards, fontFamily, people.layout, linkColor, contentWidth)}
        </table>
      </td>
    </tr>\n`
  }

  // Footer image
  if (footerImage.enabled && footerImage.imageUrl) {
    rows += `<tr><td style="border-top: ${divider}; padding: 0; line-height: 0; font-size: 0;"><img src="${footerImage.imageUrl}" width="${maxWidthNum}" alt="" style="display: block;" /></td></tr>\n`
  } else if (footerImage.enabled && isPreview) {
    rows += placeholderRow('Footer image', `border-top: ${divider};`)
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(state.campaignName)}</title>
  <style>p { margin: 0; padding: 0; line-height: 1.6; } a { color: ${linkColor}; }</style>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${backgroundColor}; font-family: ${fontFamily};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${backgroundColor};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!--[if mso]><table width="${maxWidthNum}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table width="${maxWidthNum}" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: ${maxWidthNum}px; background-color: ${cardColor}; ${borderStyle} ${radiusStyle} max-width: ${maxWidthNum}px; overflow: hidden;">
${rows}        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function generatePlainText(state: StoreState): string {
  const { recipientName, link, selectedAddress, body, signature } = state
  const resolve = (html: string) => resolveVars(html, recipientName, link, selectedAddress)

  function stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const parts: string[] = []
  if (body.content) parts.push(stripHtml(resolve(body.content)))
  if (signature.enabled && signature.content) parts.push(stripHtml(resolve(signature.content)))

  return parts.join('\n\n')
}

export function checkSpam(state: StoreState): SpamCheckResult {
  const signals: string[] = []

  // All-caps words in campaign name
  const capsWords = state.campaignName.match(/\b[A-Z]{3,}\b/g) ?? []
  if (capsWords.length > 0) {
    signals.push('Subject contains ALL-CAPS words, which trigger spam filters.')
  }

  // Missing unsubscribe language
  const bodyLower = (state.body.content ?? '').toLowerCase()
  if (!bodyLower.includes('unsubscribe') && !bodyLower.includes('opt out') && !bodyLower.includes('opt-out')) {
    signals.push('No unsubscribe language found. Add an opt-out link to comply with CAN-SPAM/CASL.')
  }

  // Plain text is empty or near-empty
  const plainText = generatePlainText(state)
  if (plainText.replace(/\s/g, '').length < 20) {
    signals.push('No plain text content. Always provide a plain text version alongside HTML.')
  }

  // Image-heavy with little body text
  const hasImages = (state.headerImage.enabled && !!state.headerImage.imageUrl) ||
    (state.footerImage.enabled && !!state.footerImage.imageUrl)
  const bodyText = plainText.replace(/\s/g, '')
  if (hasImages && bodyText.length < 60) {
    signals.push('Image-heavy with little text. High image-to-text ratio increases spam likelihood.')
  }

  return { score: signals.length, signals }
}
