export type EventPackage = {
  id: string
  eventId: string
  name: string
  benefits: string | null
  capacity: number
  registeredCount: number
  remainingQuota: number
  price: number
  sortOrder: number
  isActive: boolean
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5174/api'

type StoredSession = {
  accessToken?: string
}

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null

  const rawSession = window.localStorage.getItem('eo-auth')

  if (!rawSession) return null

  try {
    return (JSON.parse(rawSession) as StoredSession).accessToken ?? null
  } catch {
    return null
  }
}

const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken()

  return token ? { Authorization: `Bearer ${token}` } : {}
}

const getString = (record: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) return value
  }

  return ''
}

const getNullableString = (record: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string') return value
    if (value === null) return null
  }

  return null
}

const getEventIdBySlug = async (eventSlug: string): Promise<string> => {
  const response = await fetch(`${apiUrl}/events/${encodeURIComponent(eventSlug)}`, {
    method: 'GET',
    cache: 'no-store'
  })

  if (!response.ok) throw new Error('Event not found.')

  const record = (await response.json()) as Record<string, unknown>
  const eventId = getString(record, 'id', 'Id')

  if (!eventId) throw new Error('Event response does not contain an event id.')

  return eventId
}

type ApiEventPackage = {
  id?: string
  Id?: string

  eventId?: string
  EventId?: string

  name?: string
  Name?: string

  benefits?: string | null
  Benefits?: string | null

  capacity?: number
  Capacity?: number

  registeredCount?: number
  RegisteredCount?: number

  remainingQuota?: number
  RemainingQuota?: number

  price?: number
  Price?: number

  sortOrder?: number
  SortOrder?: number

  isActive?: boolean
  IsActive?: boolean
}

const normalizeEventPackage = (value: ApiEventPackage): EventPackage => {
  const record = value as unknown as Record<string, unknown>

  return {
    id: getString(record, 'id', 'Id'),

    eventId: getString(record, 'eventId', 'EventId'),

    name: getString(record, 'name', 'Name'),

    benefits: getNullableString(record, 'benefits', 'Benefits'),

    capacity:
      typeof record.capacity === 'number' ? record.capacity : typeof record.Capacity === 'number' ? record.Capacity : 0,

    registeredCount:
      typeof record.registeredCount === 'number'
        ? record.registeredCount
        : typeof record.RegisteredCount === 'number'
          ? record.RegisteredCount
          : 0,

    remainingQuota:
      typeof record.remainingQuota === 'number'
        ? record.remainingQuota
        : typeof record.RemainingQuota === 'number'
          ? record.RemainingQuota
          : 0,

    price: typeof record.price === 'number' ? record.price : typeof record.Price === 'number' ? record.Price : 0,

    sortOrder:
      typeof record.sortOrder === 'number'
        ? record.sortOrder
        : typeof record.SortOrder === 'number'
          ? record.SortOrder
          : 0,

    isActive:
      typeof record.isActive === 'boolean'
        ? record.isActive
        : typeof record.IsActive === 'boolean'
          ? record.IsActive
          : false
  }
}

export async function getEventPackages(eventSlug: string): Promise<EventPackage[]> {
  const eventId = await getEventIdBySlug(eventSlug)

  const response = await fetch(`${apiUrl}/admin/events/${eventId}/packages`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders()
    },
    cache: 'no-store'
  })

  if (response.status === 401) {
    throw new Error('Your session has expired. Please login again.')
  }

  if (response.status === 403) {
    throw new Error('You are not authorized to view event packages.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(body?.detail ?? 'Unable to load event packages.')
  }

  const payload = (await response.json()) as unknown

  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map(item => normalizeEventPackage(item as ApiEventPackage))
}

export async function importInternalRegistrations(eventSlug: string, file: File, eventPackageId: string) {
  const eventId = await getEventIdBySlug(eventSlug)

  const formData = new FormData()

  formData.append('file', file)

  /*
   * Backend perlu menerima package yang dipilih
   * oleh admin.
   *
   * Untuk sementara kita kirim sebagai form field.
   */
  formData.append('eventPackageId', eventPackageId)

  const response = await fetch(`${apiUrl}/admin/events/${eventId}/registrations/import-internal`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    body: formData,
    cache: 'no-store'
  })

  if (response.status === 401) {
    throw new Error('Your session has expired. Please login again.')
  }

  if (response.status === 403) {
    throw new Error('You are not authorized to import registrations.')
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = body?.detail ?? body?.title ?? 'Unable to import Excel file.'

    if (response.status === 409) {
      throw new Error(`Import ditolak (409): ${detail}`)
    }

    throw new Error(detail)
  }

  return body
}
