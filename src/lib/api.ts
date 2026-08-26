const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5174/api'

export type PublicEvent = {
  id?: string
  slug: string
  name: string
  description?: string
  type?: string
  startDate?: string
  endDate?: string
  registrationStart?: string
  registrationEnd?: string
  location?: string
  venue?: string
  city?: string
  address?: string
  capacity?: number
  remainingQuota?: number
  price?: number
  accessMode?: string
  registrationStatus?: string
  published?: boolean
  imageUrl?: string
}

const mockSeminarFfws: PublicEvent = {
  id: 'seminar-ffws-ea851ec',
  slug: 'seminar-ffws-ea851ec',
  name: 'Seminar FFWS Edit',
  description:
    'Learn, play, and get the W! Join an engaging public seminar experience inspired by the FFWS Edit community.',
  type: 'Seminar',
  startDate: '2026-08-24T09:00:00Z',
  endDate: '2026-08-24T17:00:00Z',
  location: 'Jakarta',
  venue: 'Pertamina Event Hub',
  city: 'Jakarta, Indonesia',
  capacity: 500,
  remainingQuota: 500,
  price: 0,
  accessMode: 'On-site',
  registrationStatus: 'Registration open',
  published: true,
  imageUrl: '/ffws.png'
}

export type LoginResponse = {
  accessToken: string
  expiresAtUtc: string
  userId: string
  fullName: string
  email: string
  role: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(body?.detail ?? 'Email atau password salah.')
  }

  return response.json()
}

export function saveSession(session: LoginResponse) {
  window.localStorage.setItem('eo-auth', JSON.stringify(session))
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

const firstString = (record: Record<string, unknown>, ...keys: string[]) => {
  const value = keys.map(key => record[key]).find(item => typeof item === 'string')

  return typeof value === 'string' && value.trim() ? value : undefined
}

const firstNumber = (record: Record<string, unknown>, ...keys: string[]) => {
  const value = keys.map(key => record[key]).find(item => typeof item === 'number')

  return typeof value === 'number' ? value : undefined
}

const normalizeEvent = (value: unknown): PublicEvent | null => {
  const record = asRecord(value)
  const slug = record && firstString(record, 'slug', 'Slug')
  const name = record && firstString(record, 'name', 'title', 'eventName', 'Name', 'Title')

  if (!record || !slug || !name) return null

  return {
    id: firstString(record, 'id', 'eventId', 'Id', 'EventId'),
    slug,
    name,
    description: firstString(record, 'description', 'Description'),
    type: firstString(record, 'type', 'eventType', 'Type', 'EventType'),
    startDate: firstString(record, 'startDate', 'startAt', 'StartDate', 'StartAt'),
    endDate: firstString(record, 'endDate', 'endAt', 'EndDate', 'EndAt'),
    registrationStart: firstString(record, 'registrationStart', 'registrationStartDate', 'RegistrationStart'),
    registrationEnd: firstString(record, 'registrationEnd', 'registrationEndDate', 'RegistrationEnd'),
    location: firstString(record, 'location', 'Location'),
    venue: firstString(record, 'venue', 'Venue'),
    city: firstString(record, 'city', 'City'),
    address: firstString(record, 'address', 'Address'),
    capacity: firstNumber(record, 'capacity', 'Capacity'),
    remainingQuota: firstNumber(record, 'remainingQuota', 'remaining', 'RemainingQuota'),
    price: firstNumber(record, 'price', 'Price'),
    accessMode: firstString(record, 'accessMode', 'mode', 'AccessMode'),
    registrationStatus: firstString(record, 'registrationStatus', 'status', 'RegistrationStatus', 'Status'),
    published: typeof record.published === 'boolean' ? record.published : undefined,
    imageUrl: firstString(record, 'imageUrl', 'coverImageUrl', 'ImageUrl', 'CoverImageUrl')
  }
}

const extractEvents = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload

  const record = asRecord(payload)

  if (!record) return []

  for (const key of ['items', 'data', 'events', 'Items', 'Data', 'Events']) {
    if (Array.isArray(record[key])) return record[key]
  }

  return [payload]
}

export async function getPublicEvents(): Promise<PublicEvent[]> {
  const response = await fetch(`${apiUrl}/events`, { cache: 'no-store' })

  if (!response.ok) throw new Error('Unable to load events.')

  const payload: unknown = await response.json()

  return extractEvents(payload)
    .map(normalizeEvent)
    .filter((event): event is PublicEvent => event !== null)
}

export async function getPublicEventBySlug(slug: string): Promise<PublicEvent> {
  try {
    const response = await fetch(`${apiUrl}/events/${encodeURIComponent(slug)}`, { cache: 'no-store' })

    if (!response.ok) throw new Error('Event unavailable.')

    const event = normalizeEvent(await response.json())

    if (event) return event
  } catch {
    if (slug === mockSeminarFfws.slug) return mockSeminarFfws
  }

  throw new Error('Event unavailable.')
}
