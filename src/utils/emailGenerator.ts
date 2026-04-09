import type { Section, PersonCard, ColumnSection, PeopleBodySection, ContentSection, HeaderConfig, HeaderSectionId, FooterConfig, SocialPlatform } from '../store/campaignStore'

interface StoreState {
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
}

// Fill-based SVG paths for social icons (24×24 viewBox)
const SOCIAL_ICON_PATHS: Record<SocialPlatform, string> = {
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.733-8.835L2.25 2.25h6.946l4.262 5.634L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z',
  youtube: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  pinterest: 'M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z',
  threads: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068c0-3.515.85-6.37 2.495-8.423C5.845 1.341 8.599.16 12.18.137h.014c2.814.017 5.125.806 6.867 2.345 1.674 1.476 2.696 3.571 3.038 6.229l-2.498.332c-.271-2.068-1.049-3.654-2.315-4.713-1.209-1.007-2.842-1.521-4.856-1.534h-.01c-2.66.018-4.716.879-6.116 2.559C5.085 6.846 4.358 9.246 4.358 12.068c0 2.822.727 5.222 2.21 7.135 1.356 1.756 3.414 2.619 6.11 2.637h.008c2.37-.018 4.219-.64 5.495-1.849 1.382-1.303 2.08-3.264 2.08-5.831 0-1.261-.11-2.315-.328-3.132-.264-.98-.694-1.688-1.277-2.103-.486-.349-1.047-.524-1.67-.524-.042 0-.083.001-.124.003.123.616.152 1.272.086 1.95-.222 2.259-1.502 3.74-3.464 3.924-.397.036-.784.038-1.156.01-1.516-.114-2.667-.824-3.154-1.97-.278-.654-.296-1.393-.056-2.07.48-1.353 1.849-2.148 3.785-2.148.367 0 .742.026 1.116.077.077.012.154.024.231.037-.059-.51-.194-.963-.405-1.348-.403-.72-1.037-1.079-1.886-1.079-1.02 0-1.727.5-2.1 1.485l-2.32-.879C8.98 5.853 10.476 4.96 12.48 4.96c1.625 0 2.895.538 3.775 1.599.759.916 1.14 2.148 1.14 3.665 0 .077-.001.153-.003.228 1.164.315 2.163 1.003 2.889 2.014.658.918 1.05 2.107 1.167 3.537.07.856.105 1.748.105 2.651 0 3.296-.916 5.871-2.723 7.654-1.637 1.615-3.972 2.457-6.644 2.692z',
  github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  website: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
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
      `<td width="${pct}" valign="top" style="padding: 18px 16px; width: ${pct};">${renderPersonCard(card, fontFamily, layout, linkColor, photoWidth)}</td>`
    ).join('')
    const empties = perRow - chunk.length
    const padding = empties > 0 ? `<td width="${pct}" valign="top" style="width: ${pct};"></td>`.repeat(empties) : ''
    rows.push(`<tr>${cells}${padding}</tr>`)
  }
  return rows.join('')
}

function placeholderRow(label: string, borderStyle = 'border-top: 1px solid #e5e7eb;'): string {
  return `<tr><td style="${borderStyle} padding: 24px 24px;"><div style="border: 2px dashed #d1d5db; border-radius: 6px; padding: 24px; text-align: center; color: #9ca3af; font-family: Arial, sans-serif; font-size: 12px;">${label}</div></td></tr>\n`
}

export function generateEmailHtml(state: StoreState, options: { isPreview?: boolean } = {}): string {
  const { isPreview = false } = options
  const { recipientName, link, selectedAddress, headerImage, headerSectionOrder, headerConfig, body, bodySections, footerConfig, template, font, fontSize, cornerRadius, backgroundColor, cardColor, borderEnabled, borderColor, linkColor } = state

  const fontSizePx: Record<string, string> = { small: '10px', normal: '14px', large: '18px', huge: '32px' }
  const resolvedFontSize = fontSizePx[fontSize] ?? '14px'

  const maxWidthNum = templateWidths[template] ?? 600
  const fontFamily = `${font}, Arial, sans-serif`
  const contentWidth = maxWidthNum - 48
  const borderStyle = borderEnabled ? `border: 1px solid ${borderColor};` : ''
  const radiusStyle = cornerRadius > 0 ? `border-radius: ${cornerRadius}px;` : ''
  const divider = `1px solid ${borderColor}`

  const resolve = (html: string) => resolveVars(html, recipientName, link, selectedAddress)
  const sectionStyle = `font-family: ${fontFamily}; font-size: ${resolvedFontSize}; line-height: 1.6; color: #1f2937; padding: 24px 24px;`

  // Per-section renderers — each receives whether it is the first visible row
  const renderHeader = (topBorder: string): string => {
    if (!headerImage.enabled) return ''
    const hc = headerConfig
    const hasContent = hc.logo.imageUrl || hc.title.text || hc.subtitle.text || (hc.datePill.show && hc.datePill.text)
    if (!hasContent && isPreview) return placeholderRow('Header', topBorder || `border-bottom: ${divider};`)
    if (!hasContent) return ''
    const titlePx: Record<string, string> = { small: '28px', medium: '40px', large: '52px', xl: '64px' }
    const subtitlePx: Record<string, string> = { small: '12px', medium: '15px', large: '20px' }
    let inner = ''
    const paddingBottom: Record<string, string> = {
      logo: '20px',
      title: '8px',
      subtitle: '20px',
      datePill: '0',
    }
    const visibleSections = headerSectionOrder.filter((id) => {
      if (id === 'logo') return !!hc.logo.imageUrl
      if (id === 'title') return !!hc.title.text
      if (id === 'subtitle') return !!hc.subtitle.text
      if (id === 'datePill') return hc.datePill.show && !!hc.datePill.text
      return false
    })
    for (let i = 0; i < visibleSections.length; i++) {
      const sectionId = visibleSections[i]
      const isLast = i === visibleSections.length - 1
      const pb = isLast ? '0' : paddingBottom[sectionId]
      const align = hc.alignment
      const logoMargin = align === 'center' ? 'margin: 0 auto;' : align === 'right' ? 'margin: 0 0 0 auto;' : 'margin: 0;'
      const logoPx: Record<string, string> = { small: '28px', medium: '40px', large: '60px' }
      if (sectionId === 'logo') {
        const lh = logoPx[hc.logo.size ?? 'medium']
        inner += `<tr><td align="${align}" style="padding-bottom:${pb};"><img src="${escapeHtml(hc.logo.imageUrl)}" height="${lh.replace('px', '')}" alt="" style="display: block; height: ${lh}; ${logoMargin}" /></td></tr>\n`
      } else if (sectionId === 'title') {
        inner += `<tr><td align="${align}" style="padding-bottom:${pb};"><p style="margin:0;font-family:${escapeHtml(hc.title.fontFamily)},serif;font-size:${titlePx[hc.title.fontSize] ?? '64px'};color:${hc.title.color};line-height:1.1;font-weight:${hc.title.fontWeight ?? '700'};text-align:${align};">${escapeHtml(hc.title.text)}</p></td></tr>\n`
      } else if (sectionId === 'subtitle') {
        inner += `<tr><td align="${align}" style="padding-bottom:${pb};"><p style="margin:0;font-family:Arial,sans-serif;font-size:${subtitlePx[hc.subtitle.fontSize] ?? '15px'};color:${hc.subtitle.color};line-height:1.5;font-weight:300;text-align:${align};">${escapeHtml(hc.subtitle.text)}</p></td></tr>\n`
      } else if (sectionId === 'datePill') {
        const pillCss = hc.datePill.style === 'filled'
          ? `display:inline-block;background-color:${hc.datePill.color};border-radius:20px;padding:3px 13px;font-family:Arial,sans-serif;font-size:11px;color:#ffffff;letter-spacing:0.06em;font-weight:600;`
          : `display:inline-block;border:1.5px solid ${hc.datePill.color};border-radius:20px;padding:3px 13px;font-family:Arial,sans-serif;font-size:11px;color:${hc.datePill.color};letter-spacing:0.06em;font-weight:600;`
        inner += `<tr><td align="${align}" style="padding-bottom:${pb};"><span style="${pillCss}">${escapeHtml(hc.datePill.text)}</span></td></tr>\n`
      }
    }
    return `<tr><td style="background-color:${hc.backgroundColor};padding:42px 24px;${topBorder}"><table width="100%" cellpadding="0" cellspacing="0" border="0">${inner}</table></td></tr>\n`
  }

  const renderBody = (topBorder: string): string => {
    let out = ''
    if (body.content) {
      const bodyHtml = preserveSpaces(
        processInlineImages(resolve(body.content), contentWidth).replace(/<p><\/p>/g, '<p>&nbsp;</p>')
      )
      out += `<tr><td style="${sectionStyle}${topBorder ? ` border-top: ${divider};` : ''}">${bodyHtml}</td></tr>\n`
      topBorder = ''
    }

    for (const section of bodySections) {
      const bg = section.backgroundColor ?? '#ffffff'
      const bgStyle = `background-color: ${bg};`
      const sectionBorder = topBorder || `border-top: ${divider};`

      if (section.type === 'people') {
        const ps = section as PeopleBodySection
        if (ps.cards.length === 0 && isPreview) {
          const dummy: PersonCard = { id: '__placeholder__', name: 'Jane Smith', title: 'Senior Account Executive', location: 'New York, NY', phone: '+1 (212) 555-0182', email: 'jane.smith@example.com', bioHref: 'https://example.com/bio/jane-smith', imageUrl: 'https://placehold.co/120x120/e5e7eb/9ca3af?text=Photo' }
          const dummyCellPx = Math.floor(maxWidthNum / 4)
          out += `<tr><td style="padding: 18px 24px 0; ${sectionBorder} ${bgStyle}"><p style="margin: 0; font-family: ${fontFamily}; font-size: 24px; font-weight: 600; color: #6b7280;">${ps.title ? escapeHtml(ps.title) : 'People'}</p></td></tr>\n`
          out += `<tr><td style="padding: 0; ${bgStyle}"><table width="${maxWidthNum}" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: ${maxWidthNum}px;"><tr><td width="${dummyCellPx}" valign="top" style="padding: 18px 16px; ${bgStyle}">${renderPersonCard(dummy, fontFamily, ps.peopleLayout, linkColor, Math.min(120, dummyCellPx - 32))}</td></tr></table></td></tr>\n`
        } else if (ps.cards.length > 0) {
          const titleRow = ps.title
            ? `<tr><td style="padding: 18px 24px 0; ${sectionBorder} ${bgStyle}"><p style="margin: 0; font-family: ${fontFamily}; font-size: 24px; font-weight: 600; color: #6b7280;">${escapeHtml(ps.title)}</p></td></tr>\n`
            : ''
          const rowBorder = titleRow ? '' : sectionBorder
          out += titleRow
          out += `<tr><td style="padding: 0; ${rowBorder} ${bgStyle}"><table width="${maxWidthNum}" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: ${maxWidthNum}px;">${renderPeopleRows(ps.cards, fontFamily, ps.peopleLayout, linkColor, contentWidth)}</table></td></tr>\n`
        }
      } else {
        const cs = section as ColumnSection
        const colCount = cs.columns.length
        const gap = 16
        const colWidth = Math.floor((contentWidth - gap * (colCount - 1)) / colCount)
        const titleRow = cs.title
          ? `<tr><td style="padding: 18px 24px 0; ${sectionBorder} ${bgStyle}"><p style="margin: 0; font-family: ${fontFamily}; font-size: 24px; font-weight: 600; color: #6b7280;">${escapeHtml(cs.title)}</p></td></tr>\n`
          : ''
        const cells = cs.columns.map((col, i) => {
          const paddingLeft = i === 0 ? 24 : gap / 2
          const paddingRight = i === colCount - 1 ? 24 : gap / 2
          let content = ''
          if (col.imageUrl) content += `<img src="${escapeHtml(col.imageUrl)}" width="${colWidth}" height="200" alt="" style="display: block; width: ${colWidth}px; height: 200px; object-fit: cover; margin-bottom: 24px;" />`
          if (col.title) content += `<p style="margin: 0 0 12px; font-family: ${fontFamily}; font-size: 16px; font-weight: bold; color: #1f2937; line-height: 1.3;">${escapeHtml(col.title)}</p>`
          if (col.subtext) {
            const isHtml = /<[a-z][\s\S]*>/i.test(col.subtext)
            content += isHtml
              ? `<div style="font-family: ${fontFamily}; font-size: ${resolvedFontSize}; color: #4b5563; line-height: 1.6;">${processInlineImages(col.subtext, colWidth)}</div>`
              : `<p style="margin: 0; font-family: ${fontFamily}; font-size: ${resolvedFontSize}; color: #4b5563; line-height: 1.6;">${escapeHtml(col.subtext).replace(/\n/g, '<br>')}</p>`
          }
          return `<td valign="top" width="${colWidth}" style="padding: 24px ${paddingRight}px 24px ${paddingLeft}px; width: ${colWidth}px; ${bgStyle}">${content || '&nbsp;'}</td>`
        }).join('')
        const rowBorder = titleRow ? '' : sectionBorder
        out += titleRow
        out += `<tr><td style="${rowBorder} padding: 0; ${bgStyle}"><table width="${maxWidthNum}" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: ${maxWidthNum}px;"><tr>${cells}</tr></table></td></tr>\n`
      }

      topBorder = ''
    }
    return out
  }

  const renderFooter = (topBorder: string): string => {
    const fc = footerConfig
    if (!fc.enabled) return ''
    const border = topBorder || `border-top: ${divider};`

    const hasLogo = !!fc.logo.imageUrl
    const hasBrandText = !!fc.brandText.text.trim()
    const activeLinks = fc.socialIcons.links.filter((l) => l.enabled && l.url.trim())
    const hasIcons = activeLinks.length > 0
    const hasContent = hasLogo || hasBrandText || hasIcons

    if (!hasContent && isPreview) return placeholderRow('Footer', border)
    if (!hasContent) return ''

    let innerRows = ''

    // Logo
    if (hasLogo) {
      const logoAlign = fc.logo.alignment
      const logoMargin =
        logoAlign === 'center' ? 'margin: 0 auto;' :
        logoAlign === 'right' ? 'margin: 0 0 0 auto;' : 'margin: 0;'
      innerRows += `<tr><td align="${logoAlign}" style="padding-bottom: 16px;">` +
        `<img src="${escapeHtml(fc.logo.imageUrl)}" height="40" alt="" style="display: block; height: 40px; ${logoMargin}" />` +
        `</td></tr>\n`
    }

    // Brand text
    if (hasBrandText) {
      const bt = fc.brandText
      const btFontSize = bt.fontSize === 'small' ? '11px' : bt.fontSize === 'medium' ? '13px' : '15px'
      const btSpacing = bt.letterSpacing === 'normal' ? '0' : bt.letterSpacing === 'wide' ? '0.08em' : '0.16em'
      innerRows += `<tr><td align="${bt.alignment}" style="padding-bottom: 16px;">` +
        `<p style="margin: 0; font-family: Arial, sans-serif; font-size: ${btFontSize}; color: ${escapeHtml(bt.color)}; letter-spacing: ${btSpacing}; text-transform: uppercase; font-weight: 600; text-align: ${bt.alignment};">${escapeHtml(bt.text)}</p>` +
        `</td></tr>\n`
    }

    // Social icons
    if (hasIcons) {
      const si = fc.socialIcons
      const iconSizePx = si.size === 'small' ? 18 : si.size === 'large' ? 30 : 24
      const iconGapPx = si.spacing === 'tight' ? 6 : si.spacing === 'loose' ? 20 : 12
      const iconCells = activeLinks.map((link) => {
        const path = SOCIAL_ICON_PATHS[link.platform]
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSizePx}" height="${iconSizePx}" viewBox="0 0 24 24" fill="${escapeHtml(si.color)}"><path d="${path}"/></svg>`
        return `<td style="padding: 0 ${iconGapPx / 2}px;">` +
          `<a href="${escapeHtml(link.url)}" style="display: inline-block; text-decoration: none;" target="_blank">${svg}</a>` +
          `</td>`
      }).join('')
      innerRows += `<tr><td align="${si.alignment}">` +
        `<table cellpadding="0" cellspacing="0" border="0" style="display: inline-table;"><tr>${iconCells}</tr></table>` +
        `</td></tr>\n`
    }

    return `<tr><td style="background-color: ${escapeHtml(fc.backgroundColor)}; padding: 42px 24px; ${border}">` +
      `<table width="100%" cellpadding="0" cellspacing="0" border="0">${innerRows}</table>` +
      `</td></tr>\n`
  }

  const sectionIds = ['header', 'body', 'footer']
  const renderers = [renderHeader, renderBody, renderFooter]
  let rows = ''
  let firstVisible = true
  for (let i = 0; i < renderers.length; i++) {
    const topBorder = firstVisible ? '' : `border-top: ${divider};`
    const html = renderers[i](topBorder)
    if (html) {
      if (isPreview) rows += `<tr><td id="preview-${sectionIds[i]}" style="padding:0;font-size:0;line-height:0;height:0;"></td></tr>\n`
      rows += html
      firstVisible = false
    }
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
      <td align="center" style="padding: 30px 0;">
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
