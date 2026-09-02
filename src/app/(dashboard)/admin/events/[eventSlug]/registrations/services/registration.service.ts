import type { Registration, RegistrationFilters, RegistrationStatsData } from '../types'
import { authFetch } from '@/lib/auth'

type ApiPagedResult<T> = {
  items?: T[]
  Items?: T[]
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

const getString = (value: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    const result = value[key]
    if (typeof result === 'string' && result.trim()) return result
  }
  return ''
}

const getNullableString = (value: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const result = value[key]
    if (typeof result === 'string' && result.trim()) return result
    if (result === null) return null
  }
  return null
}

const normalizeParticipantType = (value: string): Registration['participantType'] =>
  value.toUpperCase() === 'INTERNAL' ? 'INTERNAL' : 'EXTERNAL'

const normalizeStatus = (value: string): Registration['status'] => {
  const status = value.replace(/[_\s-]/g, '').toUpperCase()
  if (status === 'CHECKEDIN') return 'CHECKED_IN'
  if (['CANCELLED', 'CANCELED', 'FAILED', 'EXPIRED'].includes(status)) return 'CANCELLED'
  if (['REGISTERED', 'PAID'].includes(status)) return 'REGISTERED'
  return 'PENDING'
}

const normalizeRegistration = (value: ApiRegistration): Registration => {
  const record = value as unknown as Record<string, unknown>
  const registrationSource = getString(record, 'registrationSource', 'RegistrationSource')

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
    registrationSource: registrationSource.toUpperCase() === 'PUBLIC' ? 'PUBLIC' : 'ADMIN_IMPORT',
    bookingCode: getString(record, 'bookingCode', 'BookingCode'),
    status: normalizeStatus(getString(record, 'status', 'Status')),
    registeredAt: getString(record, 'registeredAtUtc', 'RegisteredAtUtc'),
    checkedInAt: getNullableString(record, 'checkedInAtUtc', 'CheckedInAtUtc')
  }
}

const getRegistrationItems = (payload: unknown): ApiRegistration[] => {
  if (Array.isArray(payload)) return payload as ApiRegistration[]
  if (typeof payload !== 'object' || payload === null) return []
  const record = payload as Record<string, unknown>
  const items = record.items ?? record.Items
  return Array.isArray(items) ? (items as ApiRegistration[]) : []
}

const ensureOk = async (response: Response, fallback: string) => {
  if (response.status === 403) throw new Error('You are not authorized to manage registrations.')
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail ?? body?.title ?? fallback)
  }
}

export async function getRegistrations(eventId: string, filters?: RegistrationFilters): Promise<Registration[]> {
  const params = new URLSearchParams({ page: '1', pageSize: '100' })

  if (filters?.search.trim()) params.set('search', filters.search.trim())
  if (filters?.participantType && filters.participantType !== 'ALL') params.set('participantType', filters.participantType)
  if (filters?.eventPackageId) params.set('eventPackageId', filters.eventPackageId)

  const response = await authFetch(
    `/admin/events/${encodeURIComponent(eventId)}/registrations?${params.toString()}`,
    { method: 'GET', cache: 'no-store' }
  )

  await ensureOk(response, 'Unable to load registrations.')
  const payload = (await response.json()) as ApiPagedResult<ApiRegistration>
  return getRegistrationItems(payload).map(normalizeRegistration)
}

export async function getRegistrationStats(eventId: string): Promise<RegistrationStatsData> {
  const registrations = await getRegistrations(eventId)
  const active = registrations.filter(item => item.status !== 'CANCELLED')

  return {
    total: active.length,
    internal: active.filter(item => item.participantType === 'INTERNAL').length,
    external: active.filter(item => item.participantType === 'EXTERNAL').length,
    registered: active.filter(item => item.status === 'REGISTERED').length
  }
}

export async function cancelRegistration(registrationId: string): Promise<void> {
  const response = await authFetch(`/admin/registrations/${encodeURIComponent(registrationId)}/cancel`, {
    method: 'POST',
    cache: 'no-store'
  })

  await ensureOk(response, 'Unable to cancel registration.')
}
