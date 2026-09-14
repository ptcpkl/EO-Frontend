export type EventBenefitItem = {
  id: string
  title: string
  description: string
  icon: string
}

export type EventContentSection = {
  id: string
  title: string
  contentHtml: string
}

const DEFAULT_BENEFIT_ICON = 'tabler-sparkles'
const BENEFIT_FORMAT = 'eo-benefits-v1'
const CONTENT_FORMAT = 'eo-content-v1'

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null

const asString = (value: unknown) => typeof value === 'string' ? value : ''

const splitLegacyLines = (value: string) =>
  value.split(/\r?\n/).map(item => item.trim().replace(/^[-•]\s*/, '')).filter(Boolean)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const sanitizeRichHtml = (html: string) => {
  const allowedTags = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote'])

  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<(\/?)([a-z0-9-]+)(?:\s[^>]*)?>/gi, (_match, closing: string, rawTag: string) => {
      const tag = rawTag.toLowerCase()
      if (!allowedTags.has(tag)) return ''
      if (tag === 'br') return '<br>'
      return `<${closing ? '/' : ''}${tag}>`
    })
}

export const parseEventBenefits = (value?: string | null): EventBenefitItem[] => {
  const raw = value?.trim() ?? ''
  if (!raw) return []

  try {
    const parsed = asRecord(JSON.parse(raw))
    const items = parsed?.format === BENEFIT_FORMAT && Array.isArray(parsed.items) ? parsed.items : null

    if (items) {
      return items
        .map(item => asRecord(item))
        .filter((item): item is Record<string, unknown> => item !== null)
        .map(item => ({
          id: asString(item.id) || makeId(),
          title: asString(item.title),
          description: asString(item.description),
          icon: /^tabler-[a-z0-9-]+$/i.test(asString(item.icon)) ? asString(item.icon) : DEFAULT_BENEFIT_ICON
        }))
    }
  } catch {
    // Legacy plain text is intentionally supported below.
  }

  return splitLegacyLines(raw).map(title => ({
    id: makeId(),
    title,
    description: '',
    icon: DEFAULT_BENEFIT_ICON
  }))
}

export const serializeEventBenefits = (items: EventBenefitItem[]) => {
  const normalized = items.map(item => ({
    id: item.id || makeId(),
    title: item.title.slice(0, 120),
    description: item.description.slice(0, 280),
    icon: /^tabler-[a-z0-9-]+$/i.test(item.icon) ? item.icon : DEFAULT_BENEFIT_ICON
  }))

  return normalized.length ? JSON.stringify({ format: BENEFIT_FORMAT, items: normalized }) : ''
}

export const parseEventContentSections = (value?: string | null): EventContentSection[] => {
  const raw = value?.trim() ?? ''
  if (!raw) return []

  try {
    const parsed = asRecord(JSON.parse(raw))
    const sections = parsed?.format === CONTENT_FORMAT && Array.isArray(parsed.sections) ? parsed.sections : null

    if (sections) {
      return sections
        .map(section => asRecord(section))
        .filter((section): section is Record<string, unknown> => section !== null)
        .map(section => ({
          id: asString(section.id) || makeId(),
          title: asString(section.title),
          contentHtml: sanitizeRichHtml(asString(section.contentHtml))
        }))
    }
  } catch {
    // Legacy plain text is intentionally supported below.
  }

  return [{
    id: makeId(),
    title: 'Additional Information',
    contentHtml: `<p>${escapeHtml(raw).replace(/\r?\n/g, '<br>')}</p>`
  }]
}

export const serializeEventContentSections = (sections: EventContentSection[]) => {
  const normalized = sections.map(section => ({
    id: section.id || makeId(),
    title: section.title.slice(0, 160),
    contentHtml: sanitizeRichHtml(section.contentHtml)
  }))

  return normalized.length ? JSON.stringify({ format: CONTENT_FORMAT, sections: normalized }) : ''
}

export const createBenefitItem = (): EventBenefitItem => ({
  id: makeId(),
  title: '',
  description: '',
  icon: DEFAULT_BENEFIT_ICON
})

export const createContentSection = (): EventContentSection => ({
  id: makeId(),
  title: '',
  contentHtml: '<p><br></p>'
})
