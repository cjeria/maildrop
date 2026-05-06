import type { Section, PersonCard, ColumnSection, PeopleBodySection, ContentSection, HeaderConfig, HeaderSectionId, FooterConfig } from '../store/campaignStore'
import { SOCIAL_ICON_PATHS, getCachedIconUrl } from './socialIconUploader'

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

// Stamp inline styles onto every <p> and <li> tag so font size, color, and
// spacing survive when Outlook's Word engine converts the HTML on paste.
// contextStyles carries the per-site overrides (font-size, color, font-family)
// that would otherwise only exist on a parent <div> or <td> that Word ignores.
function inlineParagraphStyles(html: string, contextStyles = ''): string {
  const pBase = 'margin: 0; padding: 0; line-height: 1.6; mso-margin-top-alt: 0; mso-margin-bottom-alt: 0;'
  const pFull = contextStyles ? `${pBase} ${contextStyles}` : pBase
  const liFull = contextStyles ? `line-height: 1.6; ${contextStyles}` : ''

  const stamp = (tag: string, styles: string) =>
    (_match: string, attrs: string | undefined = ''): string => {
      if (/style\s*=/i.test(attrs)) {
        return `<${tag}${attrs.replace(/(style\s*=\s*["'])([^"']*)(["'])/i,
          (_s: string, open: string, existing: string, close: string) =>
            `${open}${styles} ${existing}${close}`)}>`
      }
      return `<${tag}${attrs} style="${styles}">`
    }

  let result = html.replace(/<p(\s[^>]*)?>/gi, stamp('p', pFull))
  if (liFull) result = result.replace(/<li(\s[^>]*)?>/gi, stamp('li', liFull))
  return result
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

function renderPersonCard(
  card: PersonCard,
  fontFamily: string,
  cardLayout: 'side-by-side' | 'stacked',
  linkColor: string,
  cardWidth: number,
): string {
  const nameEsc = escapeHtml(card.name)
  const p = (style: string, content: string) =>
    `<p style="margin: 0; line-height: 1.4; word-break: break-word; overflow-wrap: break-word; ${style}">${content}</p>`

  const textBlock = [
    card.name ? p(`font-weight: bold; color: #1a3a4a; font-family: ${fontFamily}; font-size: 14px;`, nameEsc) : '',
    card.title ? p(`font-family: ${fontFamily}; font-size: 13px; color: #374151;`, escapeHtml(card.title)) : '',
    card.location ? p(`font-family: ${fontFamily}; font-size: 13px; color: #374151;`, escapeHtml(card.location)) : '',
    card.phone ? p(`font-family: ${fontFamily}; font-size: 13px; color: #374151;`, escapeHtml(card.phone)) : '',
    card.email ? p(`font-size: 13px;`, `<a href="mailto:${escapeHtml(card.email)}" style="color: ${linkColor}; text-decoration: none; font-family: ${fontFamily};">${escapeHtml(card.email)}</a>`) : '',
    card.bioHref ? p(`font-size: 13px;`, `<a href="${escapeHtml(card.bioHref)}" style="color: ${linkColor}; text-decoration: none; font-family: ${fontFamily};">Full bio</a>`) : '',
  ].filter(Boolean).join('\n')

  if (cardLayout === 'stacked') {
    const photoSize = Math.min(100, Math.floor(cardWidth * 0.4))
    const photo = card.imageUrl
      ? card.bioHref
        ? `<a href="${escapeHtml(card.bioHref)}" style="display: inline-block;"><img src="${card.imageUrl}" width="${photoSize}" height="${photoSize}" alt="${nameEsc}" style="display: block; object-fit: cover; width: ${photoSize}px; height: ${photoSize}px;" /></a>`
        : `<img src="${card.imageUrl}" width="${photoSize}" height="${photoSize}" alt="${nameEsc}" style="display: block; object-fit: cover; width: ${photoSize}px; height: ${photoSize}px;" />`
      : ''
    return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout: fixed; width: 100%;">
      ${photo ? `<tr><td style="padding-bottom: 10px;">${photo}</td></tr>` : ''}
      <tr><td style="word-break: break-word; overflow-wrap: break-word;">${textBlock}</td></tr>
    </table>`
  }

  // side-by-side
  const photoSize = Math.min(80, Math.floor(cardWidth * 0.25))
  const photoTdWidth = photoSize + 16
  const photo = card.imageUrl
    ? card.bioHref
      ? `<a href="${escapeHtml(card.bioHref)}" style="display: block;"><img src="${card.imageUrl}" width="${photoSize}" height="${photoSize}" alt="${nameEsc}" style="display: block; object-fit: cover; width: ${photoSize}px; height: ${photoSize}px;" /></a>`
      : `<img src="${card.imageUrl}" width="${photoSize}" height="${photoSize}" alt="${nameEsc}" style="display: block; object-fit: cover; width: ${photoSize}px; height: ${photoSize}px;" />`
    : ''
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout: fixed; width: 100%;">
    <tr>
      ${photo ? `<td valign="top" width="${photoTdWidth}" style="padding-right: 16px; width: ${photoTdWidth}px;">${photo}</td>` : ''}
      <td valign="top" style="word-break: break-word; overflow-wrap: break-word;">${textBlock}</td>
    </tr>
  </table>`
}

function renderPeopleCards(
  cards: PersonCard[],
  fontFamily: string,
  cardLayout: 'side-by-side' | 'stacked',
  groupLayout: 'side-by-side' | 'stacked',
  linkColor: string,
  maxWidth: number,
  contentWidth: number,
  bgStyle: string,
  firstBorder = '',
): string {
  if (groupLayout === 'stacked' || cards.length === 1) {
    return cards.map((card, i) => {
      const border = i === 0 ? firstBorder : ''
      const content = renderPersonCard(card, fontFamily, cardLayout, linkColor, contentWidth)
      return `<tr><td style="padding: 18px 24px; ${border} ${bgStyle}">${content}</td></tr>`
    }).join('\n')
  }

  // Side-by-side: all cards in one row with N equal columns
  const colCount = cards.length
  const gap = 16
  const colWidth = Math.floor((contentWidth - gap * (colCount - 1)) / colCount)
  const cells = cards.map((card, i) => {
    const pl = i === 0 ? 24 : gap / 2
    const pr = i === colCount - 1 ? 24 : gap / 2
    const content = renderPersonCard(card, fontFamily, cardLayout, linkColor, colWidth)
    return `<td width="${colWidth}" valign="top" style="padding: 18px ${pr}px 18px ${pl}px; width: ${colWidth}px; ${bgStyle}">${content}</td>`
  }).join('')
  return `<tr><td style="padding: 0; ${firstBorder} ${bgStyle}"><table width="${maxWidth}" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: ${maxWidth}px;"><tr>${cells}</tr></table></td></tr>`
}

function placeholderRow(label: string, borderStyle = 'border-top: 1px solid #e5e7eb;'): string {
  return `<tr><td style="${borderStyle} padding: 24px 24px;"><div style="border: 2px dashed #d1d5db; border-radius: 6px; padding: 24px; text-align: center; color: #9ca3af; font-family: Arial, sans-serif; font-size: 12px;">${label}</div></td></tr>\n`
}

export function generateEmailHtml(state: StoreState, options: { isPreview?: boolean } = {}): string {
  const { isPreview = false } = options
  const { recipientName, link, selectedAddress, headerImage, headerSectionOrder, headerConfig, bodySections, footerConfig, template, font, fontSize, cornerRadius, backgroundColor, cardColor, borderEnabled, borderColor, linkColor } = state

  const fontSizePx: Record<string, string> = { small: '10px', normal: '14px', large: '18px', huge: '32px' }
  const resolvedFontSize = fontSizePx[fontSize] ?? '14px'

  const maxWidthNum = templateWidths[template] ?? 600
  const fontFamily = `${font}, Arial, sans-serif`
  const contentWidth = maxWidthNum - 48
  const borderStyle = borderEnabled ? `border: 1px solid ${borderColor};` : ''
  const radiusStyle = cornerRadius > 0 ? `border-radius: ${cornerRadius}px;` : ''
  const divider = `1px solid ${borderColor}`

  const resolve = (html: string) => resolveVars(html, recipientName, link, selectedAddress)

  // Returns true if an HTML string (possibly from TipTap) has visible text content
  const hasVisibleContent = (html: string): boolean =>
    html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0

  // Applies the same rendering pipeline used for body content to any TipTap HTML
  const processTiptapHtml = (html: string, width: number, contextStyles = ''): string => {
    const inlined = inlineParagraphStyles(processInlineImages(resolve(html), width), contextStyles)
    return preserveSpaces(inlined.replace(/<p([^>]*)><\/p>/gi, '<p$1>&nbsp;</p>'))
  }

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
      const fieldAttrInner = isPreview ? ` data-field-id="header-${sectionId}"` : ''
      if (sectionId === 'logo') {
        const lh = logoPx[hc.logo.size ?? 'medium']
        inner += `<tr><td${fieldAttrInner} align="${align}" style="padding-bottom:${pb};"><img src="${escapeHtml(hc.logo.imageUrl)}" height="${lh.replace('px', '')}" alt="" style="display: block; height: ${lh}; ${logoMargin}" /></td></tr>\n`
      } else if (sectionId === 'title') {
        inner += `<tr><td${fieldAttrInner} align="${align}" style="padding-bottom:${pb};"><p style="margin:0;font-family:${escapeHtml(hc.title.fontFamily)},serif;font-size:${titlePx[hc.title.fontSize] ?? '64px'};color:${hc.title.color};line-height:1.1;font-weight:${hc.title.fontWeight ?? '700'};text-align:${align};">${escapeHtml(hc.title.text)}</p></td></tr>\n`
      } else if (sectionId === 'subtitle') {
        inner += `<tr><td${fieldAttrInner} align="${align}" style="padding-bottom:${pb};"><p style="margin:0;font-family:Arial,sans-serif;font-size:${subtitlePx[hc.subtitle.fontSize] ?? '15px'};color:${hc.subtitle.color};line-height:1.5;font-weight:300;text-align:${align};">${escapeHtml(hc.subtitle.text)}</p></td></tr>\n`
      } else if (sectionId === 'datePill') {
        const pillCss = hc.datePill.style === 'filled'
          ? `display:inline-block;background-color:${hc.datePill.color};border-radius:20px;padding:3px 13px;font-family:Arial,sans-serif;font-size:11px;color:#ffffff;letter-spacing:0.06em;font-weight:600;`
          : `display:inline-block;border:1.5px solid ${hc.datePill.color};border-radius:20px;padding:3px 13px;font-family:Arial,sans-serif;font-size:11px;color:${hc.datePill.color};letter-spacing:0.06em;font-weight:600;`
        inner += `<tr><td${fieldAttrInner} align="${align}" style="padding-bottom:${pb};"><span style="${pillCss}">${escapeHtml(hc.datePill.text)}</span></td></tr>\n`
      }
    }
    return `<tr><td${isPreview ? ' data-section-id="header"' : ''} style="background-color:${hc.backgroundColor};padding:42px 24px;${topBorder}"><table width="100%" cellpadding="0" cellspacing="0" border="0">${inner}</table></td></tr>\n`
  }

  const renderBody = (topBorder: string): string => {
    let out = ''

    for (const section of bodySections) {
      const bg = section.backgroundColor ?? '#ffffff'
      const bgStyle = `background-color: ${bg};`
      const sectionBorder = topBorder || `border-top: ${divider};`

      // Buffer this section's rows so we can optionally wrap in <tbody data-section-id> for preview
      let sectionRows = ''

      const richContextStyles = `font-family: ${fontFamily}; font-size: ${resolvedFontSize}; color: #1f2937;`
      const richStyle = `padding: 24px; ${bgStyle} font-family: ${fontFamily}; font-size: ${resolvedFontSize}; line-height: 1.6; color: #1f2937;`

      if (section.type === 'people') {
        const ps = section as PeopleBodySection

        // Section rich text (intro/description above people cards)
        if (ps.richText && hasVisibleContent(ps.richText)) {
          const richHtml = processTiptapHtml(ps.richText, contentWidth, richContextStyles)
          sectionRows += `<tr><td${isPreview ? ` data-field-id="body-${section.id}-rich"` : ''} style="${sectionBorder} ${richStyle}">${richHtml}</td></tr>\n`
        }

        const cardsBorder = sectionRows ? '' : sectionBorder
        if (ps.cards.length === 0 && isPreview) {
          const dummy: PersonCard = { id: '__placeholder__', name: 'Jane Smith', title: 'Senior Account Executive', location: 'New York, NY', phone: '+1 (212) 555-0182', email: 'jane.smith@example.com', bioHref: 'https://example.com/bio/jane-smith', imageUrl: 'https://placehold.co/120x120/e5e7eb/9ca3af?text=Photo' }
          const dummyContent = renderPersonCard(dummy, fontFamily, 'side-by-side', linkColor, contentWidth)
          sectionRows += `<tr><td style="padding: 18px 24px; ${cardsBorder} ${bgStyle}">${dummyContent}</td></tr>\n`
        } else if (ps.cards.length > 0) {
          sectionRows += renderPeopleCards(ps.cards, fontFamily, ps.cardLayout, ps.groupLayout, linkColor, maxWidthNum, contentWidth, bgStyle, cardsBorder)
        }
      } else {
        const cs = section as ColumnSection

        if (cs.layout === '1col') {
          // 1-column: render section richText
          if (cs.richText && hasVisibleContent(cs.richText)) {
            const richHtml = processTiptapHtml(cs.richText, contentWidth, richContextStyles)
            sectionRows += `<tr><td${isPreview ? ` data-field-id="body-${section.id}-rich"` : ''} style="${sectionBorder} ${richStyle}">${richHtml}</td></tr>\n`
          } else if (isPreview) {
            sectionRows += `<tr><td style="${sectionBorder} padding: 24px; ${bgStyle} color: #d1d5db; font-style: italic; font-size: 13px; font-family: ${fontFamily};">Empty section</td></tr>\n`
          }
        } else {
          // 2/3-column: render per-column richText side by side
          const colCount = cs.columns.length
          const gap = 16
          const colWidth = Math.floor((contentWidth - gap * (colCount - 1)) / colCount)
          const cells = cs.columns.map((col, i) => {
            const paddingLeft = i === 0 ? 24 : gap / 2
            const paddingRight = i === colCount - 1 ? 24 : gap / 2
            const content = col.richText && hasVisibleContent(col.richText)
              ? `<div${isPreview ? ` data-field-id="col-${col.id}-rich"` : ''} style="font-family: ${fontFamily}; font-size: ${resolvedFontSize}; color: #1f2937; line-height: 1.6;">${processTiptapHtml(col.richText, colWidth, richContextStyles)}</div>`
              : '&nbsp;'
            return `<td valign="top" width="${colWidth}" style="padding: 24px ${paddingRight}px 24px ${paddingLeft}px; width: ${colWidth}px; ${bgStyle}">${content}</td>`
          }).join('')
          sectionRows += `<tr><td style="${sectionBorder} padding: 0; ${bgStyle}"><table width="${maxWidthNum}" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; width: ${maxWidthNum}px;"><tr>${cells}</tr></table></td></tr>\n`
        }
      }

      if (sectionRows) {
        if (isPreview) {
          out += `<tbody data-section-id="body-${section.id}">`
          out += `<tr><td id="preview-body-${section.id}" style="padding:0;font-size:0;line-height:0;height:0;"></td></tr>\n`
          out += sectionRows
          out += `</tbody>\n`
        } else {
          out += sectionRows
        }
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
      innerRows += `<tr><td${isPreview ? ' data-field-id="footer-brand"' : ''} align="${bt.alignment}" style="padding-bottom: 16px;">` +
        `<p style="margin: 0; font-family: Arial, sans-serif; font-size: ${btFontSize}; color: ${escapeHtml(bt.color)}; letter-spacing: ${btSpacing}; text-transform: uppercase; font-weight: 600; text-align: ${bt.alignment};">${escapeHtml(bt.text)}</p>` +
        `</td></tr>\n`
    }

    // Social icons
    if (hasIcons) {
      const si = fc.socialIcons
      const iconSizePx = si.size === 'small' ? 18 : si.size === 'large' ? 30 : 24
      const iconGapPx = si.spacing === 'tight' ? 6 : si.spacing === 'loose' ? 20 : 12
      const iconCells = activeLinks.map((link) => {
        const cachedUrl = getCachedIconUrl(link.platform, si.color, iconSizePx)
        const iconHtml = cachedUrl
          ? `<img src="${escapeHtml(cachedUrl)}" width="${iconSizePx}" height="${iconSizePx}" alt="${link.platform}" style="display: block; border: 0;" />`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSizePx}" height="${iconSizePx}" viewBox="0 0 24 24" fill="${escapeHtml(si.color)}"><path d="${SOCIAL_ICON_PATHS[link.platform]}"/></svg>`
        return `<td style="padding: 0 ${iconGapPx / 2}px;">` +
          `<a href="${escapeHtml(link.url)}" style="display: inline-block; text-decoration: none;" target="_blank">${iconHtml}</a>` +
          `</td>`
      }).join('')
      innerRows += `<tr><td align="${si.alignment}">` +
        `<table cellpadding="0" cellspacing="0" border="0" style="display: inline-table;"><tr>${iconCells}</tr></table>` +
        `</td></tr>\n`
    }

    return `<tr><td${isPreview ? ' data-section-id="footer"' : ''} style="background-color: ${escapeHtml(fc.backgroundColor)}; padding: 42px 24px; ${border}">` +
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
  <!--[if mso]><style>p { margin: 0 !important; mso-margin-top-alt: 0; mso-margin-bottom-alt: 0; }</style><![endif]-->
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
  const { recipientName, link, selectedAddress, body } = state
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
    (state.footerConfig.enabled && !!state.footerConfig.logo.imageUrl)
  const bodyText = plainText.replace(/\s/g, '')
  if (hasImages && bodyText.length < 60) {
    signals.push('Image-heavy with little text. High image-to-text ratio increases spam likelihood.')
  }

  return { score: signals.length, signals }
}
