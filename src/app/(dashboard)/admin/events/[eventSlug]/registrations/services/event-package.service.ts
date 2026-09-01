import type {
  EventPackage,
  CreateEventPackageRequest,
  UpdateEventPackageRequest
} from './types/event-package'

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:5174/api'

type StoredSession = {
  accessToken?: string
}

type ApiEvent = {
  id?: string
  Id?: string
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

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSession =
    window.localStorage.getItem('eo-auth')

  if (!rawSession) {
    return null
  }

  try {
    const session =
      JSON.parse(rawSession) as StoredSession

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

const getString = (
  record: Record<string, unknown>,
  ...keys: string[]
): string => {
  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value
    }
  }

  return ''
}

const getNullableString = (
  record: Record<string, unknown>,
  ...keys: string[]
): string | null => {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string') {
      return value
    }

    if (value === null) {
      return null
    }
  }

  return null
}

const getNumber = (
  record: Record<string, unknown>,
  ...keys: string[]
): number => {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'number') {
      return value
    }
  }

  return 0
}

const getBoolean = (
  record: Record<string, unknown>,
  ...keys: string[]
): boolean => {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'boolean') {
      return value
    }
  }

  return false
}

const normalizeEventPackage = (
  value: ApiEventPackage
): EventPackage => {
  const record =
    value as unknown as Record<string, unknown>

  return {
    id: getString(record, 'id', 'Id'),

    eventId: getString(
      record,
      'eventId',
      'EventId'
    ),

    name: getString(
      record,
      'name',
      'Name'
    ),

    benefits: getNullableString(
      record,
      'benefits',
      'Benefits'
    ),

    capacity: getNumber(
      record,
      'capacity',
      'Capacity'
    ),

    registeredCount: getNumber(
      record,
      'registeredCount',
      'RegisteredCount'
    ),

    remainingQuota: getNumber(
      record,
      'remainingQuota',
      'RemainingQuota'
    ),

    price: getNumber(
      record,
      'price',
      'Price'
    ),

    sortOrder: getNumber(
      record,
      'sortOrder',
      'SortOrder'
    ),

    isActive: getBoolean(
      record,
      'isActive',
      'IsActive'
    )
  }
}

const getEventIdBySlug = async (
  eventSlug: string
): Promise<string> => {
  const response = await fetch(
    `${apiUrl}/events/${encodeURIComponent(eventSlug)}`,
    {
      method: 'GET',
      cache: 'no-store'
    }
  )

  if (!response.ok) {
    throw new Error('Event not found.')
  }

  const payload =
    (await response.json()) as ApiEvent

  const record =
    payload as unknown as Record<string, unknown>

  const eventId = getString(
    record,
    'id',
    'Id'
  )

  if (!eventId) {
    throw new Error(
      'Event response does not contain an event id.'
    )
  }

  return eventId
}

const parseError = async (
  response: Response,
  fallback: string
): Promise<Error> => {
  const body =
    await response.json().catch(() => null)

  return new Error(
    body?.detail ??
      body?.title ??
      fallback
  )
}

export async function getEventPackages(
  eventSlug: string
): Promise<EventPackage[]> {
  const eventId =
    await getEventIdBySlug(eventSlug)

  const response = await fetch(
    `${apiUrl}/admin/events/${eventId}/packages`,
    {
      method: 'GET',
      headers: {
        ...getAuthHeaders()
      },
      cache: 'no-store'
    }
  )

  if (response.status === 401) {
    throw new Error(
      'Your session has expired. Please login again.'
    )
  }

  if (response.status === 403) {
    throw new Error(
      'You are not authorized to manage packages.'
    )
  }

  if (!response.ok) {
    throw await parseError(
      response,
      'Unable to load event packages.'
    )
  }

  const payload =
    (await response.json()) as ApiEventPackage[]

  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map(normalizeEventPackage)
}

export async function createEventPackage(
  eventSlug: string,
  request: CreateEventPackageRequest
): Promise<EventPackage> {
  const eventId =
    await getEventIdBySlug(eventSlug)

  const response = await fetch(
    `${apiUrl}/admin/events/${eventId}/packages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(request)
    }
  )

  if (response.status === 401) {
    throw new Error(
      'Your session has expired. Please login again.'
    )
  }

  if (response.status === 403) {
    throw new Error(
      'You are not authorized to create packages.'
    )
  }

  if (!response.ok) {
    throw await parseError(
      response,
      'Unable to create event package.'
    )
  }

  return normalizeEventPackage(
    (await response.json()) as ApiEventPackage
  )
}

export async function updateEventPackage(
  eventSlug: string,
  packageId: string,
  request: UpdateEventPackageRequest
): Promise<EventPackage> {
  const eventId =
    await getEventIdBySlug(eventSlug)

  const response = await fetch(
    `${apiUrl}/admin/events/${eventId}/packages/${packageId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(request)
    }
  )

  if (response.status === 401) {
    throw new Error(
      'Your session has expired. Please login again.'
    )
  }

  if (response.status === 403) {
    throw new Error(
      'You are not authorized to update packages.'
    )
  }

  if (!response.ok) {
    throw await parseError(
      response,
      'Unable to update event package.'
    )
  }

  return normalizeEventPackage(
    (await response.json()) as ApiEventPackage
  )
}

export async function deactivateEventPackage(
  eventSlug: string,
  packageId: string
): Promise<void> {
  const eventId =
    await getEventIdBySlug(eventSlug)

  const response = await fetch(
    `${apiUrl}/admin/events/${eventId}/packages/${packageId}/deactivate`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      }
    }
  )

  if (response.status === 401) {
    throw new Error(
      'Your session has expired. Please login again.'
    )
  }

  if (response.status === 403) {
    throw new Error(
      'You are not authorized to deactivate packages.'
    )
  }

  if (!response.ok) {
    throw await parseError(
      response,
      'Unable to deactivate event package.'
    )
  }
}
