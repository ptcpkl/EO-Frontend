import type { Registration, RegistrationFilters, RegistrationStatsData } from '../types'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5174/api'

type StoredSession = {
  accessToken?: string
}

type ApiEvent = {
  id?: string
  Id?: string
  slug?: string
  Slug?: string
  name?: string
  Name?: string
}

type ApiPagedResult<T> = {
  items?: T[]
  Items?: T[]
  page?: number
  Page?: number
  pageSize?: number
  PageSize?: number
  total?: number
  Total?: number
}

type ApiRegistration = {
  id?: string
  Id?: string

  eventId?: string
  EventId?: string

  participantType?: string
  ParticipantType?: string

  registrationSource?: string
  RegistrationSource?: string

  fullName?: string
  FullName?: string

  email?: string
  Email?: string

  phone?: string
  Phone?: string

  nip?: string | null
  NIP?: string | null

  organization?: string | null
  Organization?: string | null

  employeeNumber?: string | null
  EmployeeNumber?: string | null

  department?: string | null
  Department?: string | null

  eventPackageId?: string | null
  EventPackageId?: string | null

  eventPackageName?: string | null
  EventPackageName?: string | null

  bookingCode?: string
  BookingCode?: string

  status?: string
  Status?: string

  registeredAtUtc?: string
  RegisteredAtUtc?: string

  checkedInAtUtc?: string | null
  CheckedInAtUtc?: string | null
}

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSession = window.localStorage.getItem('eo-auth')

  if (!rawSession) {
    return null
  }

  try {
    const session = JSON.parse(rawSession) as StoredSession

    return session.accessToken ?? null
  } catch {
    return null
  }
}

const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken()

  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {}
}

const getString = (value: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    const result = value[key]

    if (typeof result === 'string' && result.trim()) {
      return result
    }
  }

  return ''
}

const getNullableString = (value: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const result = value[key]

    if (typeof result === 'string' && result.trim()) {
      return result
    }

    if (result === null) {
      return null
    }
  }

  return null
}

const normalizeParticipantType = (value: string): Registration['participantType'] => {
  return value.toUpperCase() === 'INTERNAL' ? 'INTERNAL' : 'EXTERNAL'
}

const normalizeStatus = (value: string): Registration['status'] => {
  const status = value.replace(/[_\s-]/g, '').toUpperCase()

  if (status === 'CHECKEDIN') {
    return 'CHECKED_IN'
  }

  if (status === 'CANCELLED' || status === 'CANCELED' || status === 'FAILED' || status === 'EXPIRED') {
    return 'CANCELLED'
  }

  if (status === 'PENDING' || status === 'PENDINGPAYMENT') {
    return 'PENDING'
  }

  if (status === 'REGISTERED' || status === 'PAID') {
    return 'REGISTERED'
  }

  return 'PENDING'
}

const normalizeRegistration = (value: ApiRegistration): Registration => {
  const record = value as unknown as Record<string, unknown>

  return {
    id: getString(record, 'id', 'Id'),

    eventId: getString(record, 'eventId', 'EventId'),

    fullName: getString(record, 'fullName', 'FullName'),

    email: getString(record, 'email', 'Email'),

    phone: getString(record, 'phone', 'Phone'),

    nip: getNullableString(record, 'nip', 'NIP', 'employeeNumber', 'EmployeeNumber'),

    organization: getNullableString(record, 'organization', 'Organization'),

    employeeNumber: getNullableString(record, 'employeeNumber', 'EmployeeNumber'),

    department: getNullableString(record, 'department', 'Department'),

    eventPackageId: getNullableString(record, 'eventPackageId', 'EventPackageId'),

    eventPackageName: getNullableString(record, 'eventPackageName', 'EventPackageName'),

    participantType: normalizeParticipantType(getString(record, 'participantType', 'ParticipantType')),

    registrationSource:
      getString(record, 'registrationSource', 'RegistrationSource') === 'PUBLIC' ? 'PUBLIC' : 'ADMIN_IMPORT',

    bookingCode: getString(record, 'bookingCode', 'BookingCode'),

    status: normalizeStatus(getString(record, 'status', 'Status')),

    registeredAt: getString(record, 'registeredAtUtc', 'RegisteredAtUtc'),

    checkedInAt: getNullableString(record, 'checkedInAtUtc', 'CheckedInAtUtc')
  }
}

const getEventIdBySlug = async (eventSlug: string): Promise<string> => {
  const response = await fetch(`${apiUrl}/events/${encodeURIComponent(eventSlug)}`, {
    method: 'GET',
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error('Event not found.')
  }

  const payload = (await response.json()) as ApiEvent

  const record = payload as unknown as Record<string, unknown>

  const eventId = getString(record, 'id', 'Id')

  if (!eventId) {
    throw new Error('Event response does not contain an event id.')
  }

  return eventId
}

const getRegistrationItems = (payload: unknown): ApiRegistration[] => {
  if (Array.isArray(payload)) {
    return payload as ApiRegistration[]
  }

  if (typeof payload !== 'object' || payload === null) {
    return []
  }

  const record = payload as Record<string, unknown>

  const items = record.items ?? record.Items

  return Array.isArray(items) ? (items as ApiRegistration[]) : []
}

export async function getRegistrations(eventSlug: string, filters?: RegistrationFilters): Promise<Registration[]> {
  const eventId = await getEventIdBySlug(eventSlug)

  const params = new URLSearchParams()

  params.set('page', '1')
  params.set('pageSize', '100')

  if (filters?.search.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters?.participantType && filters.participantType !== 'ALL') {
    params.set('participantType', filters.participantType)
  }

  if (filters?.eventPackageId) {
    params.set('eventPackageId', filters.eventPackageId)
  }

  const response = await fetch(`${apiUrl}/admin/events/${eventId}/registrations?${params.toString()}`, {
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
    throw new Error('You are not authorized to view registrations.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(body?.detail ?? 'Unable to load registrations.')
  }

  const payload = (await response.json()) as ApiPagedResult<ApiRegistration>

  return getRegistrationItems(payload).map(normalizeRegistration)
}

export async function getRegistrationStats(eventSlug: string): Promise<RegistrationStatsData> {
  const registrations = await getRegistrations(eventSlug)

  const active = registrations.filter(item => item.status !== 'CANCELLED')

  return {
    total: active.length,

    internal: active.filter(item => item.participantType === 'INTERNAL').length,

    external: active.filter(item => item.participantType === 'EXTERNAL').length,

    registered: active.filter(item => item.status === 'REGISTERED').length
  }
}

export async function cancelRegistration(registrationId: string): Promise<void> {
  const response = await fetch(`${apiUrl}/admin/registrations/${encodeURIComponent(registrationId)}/cancel`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    cache: 'no-store'
  })

  if (response.status === 401) throw new Error('Your session has expired. Please login again.')
  if (response.status === 403) throw new Error('You are not authorized to cancel registrations.')

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(body?.detail ?? 'Unable to cancel registration.')
  }
}
