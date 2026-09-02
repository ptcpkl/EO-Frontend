import type {
  EventPackage,
  CreateEventPackageRequest,
  UpdateEventPackageRequest
} from './types/event-package'

import { authFetch } from '@/lib/auth'

type ApiEventPackage = {
  id?: string
  Id?: string
  eventId?: string
  EventId?: string
  name?: string
  Name?: string
  benefits?: string | null
  Benefits?: string | null
  capacity?: number | null
  Capacity?: number | null
  registeredCount?: number
  RegisteredCount?: number
  remainingQuota?: number | null
  RemainingQuota?: number | null
  isUnlimited?: boolean
  IsUnlimited?: boolean
  price?: number
  Price?: number
  sortOrder?: number
  SortOrder?: number
  isActive?: boolean
  IsActive?: boolean
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

const getNumber = (record: Record<string, unknown>, ...keys: string[]): number => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number') return value
  }
  return 0
}

const getNullableNumber = (record: Record<string, unknown>, ...keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number') return value
    if (value === null) return null
  }
  return null
}

const getBoolean = (record: Record<string, unknown>, ...keys: string[]): boolean => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'boolean') return value
  }
  return false
}

const normalizeEventPackage = (value: ApiEventPackage): EventPackage => {
  const record = value as unknown as Record<string, unknown>
  const capacity = getNullableNumber(record, 'capacity', 'Capacity')

  return {
    id: getString(record, 'id', 'Id'),
    eventId: getString(record, 'eventId', 'EventId'),
    name: getString(record, 'name', 'Name'),
    benefits: getNullableString(record, 'benefits', 'Benefits'),
    capacity,
    registeredCount: getNumber(record, 'registeredCount', 'RegisteredCount'),
    remainingQuota: getNullableNumber(record, 'remainingQuota', 'RemainingQuota'),
    isUnlimited: getBoolean(record, 'isUnlimited', 'IsUnlimited') || capacity === null,
    price: getNumber(record, 'price', 'Price'),
    sortOrder: getNumber(record, 'sortOrder', 'SortOrder'),
    isActive: getBoolean(record, 'isActive', 'IsActive')
  }
}

const parseError = async (response: Response, fallback: string): Promise<Error> => {
  const body = await response.json().catch(() => null)
  return new Error(body?.detail ?? body?.title ?? fallback)
}

const ensureAuthorized = async (response: Response, fallback: string) => {
  if (response.status === 403) throw new Error('You are not authorized to manage packages.')
  if (!response.ok) throw await parseError(response, fallback)
}

export async function getEventPackages(eventId: string): Promise<EventPackage[]> {
  const response = await authFetch(`/admin/events/${encodeURIComponent(eventId)}/packages`, {
    method: 'GET',
    cache: 'no-store'
  })

  await ensureAuthorized(response, 'Unable to load event packages.')

  const payload = (await response.json()) as ApiEventPackage[]
  return Array.isArray(payload) ? payload.map(normalizeEventPackage) : []
}

export async function createEventPackage(
  eventId: string,
  request: CreateEventPackageRequest
): Promise<EventPackage> {
  const response = await authFetch(`/admin/events/${encodeURIComponent(eventId)}/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })

  await ensureAuthorized(response, 'Unable to create event package.')
  return normalizeEventPackage((await response.json()) as ApiEventPackage)
}

export async function updateEventPackage(
  eventId: string,
  packageId: string,
  request: UpdateEventPackageRequest
): Promise<EventPackage> {
  const response = await authFetch(`/admin/events/${encodeURIComponent(eventId)}/packages/${encodeURIComponent(packageId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })

  await ensureAuthorized(response, 'Unable to update event package.')
  return normalizeEventPackage((await response.json()) as ApiEventPackage)
}

export async function deactivateEventPackage(eventId: string, packageId: string): Promise<void> {
  const response = await authFetch(
    `/admin/events/${encodeURIComponent(eventId)}/packages/${encodeURIComponent(packageId)}/deactivate`,
    { method: 'POST' }
  )

  await ensureAuthorized(response, 'Unable to deactivate event package.')
}
