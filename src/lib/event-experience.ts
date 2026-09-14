import { parseError } from '@/lib/api'
import { authFetch } from '@/lib/auth'

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5174/api').replace(/\/$/, '')

export type ModularEventKind = 'Seminar' | 'Running' | 'Workshop' | 'Other'

export type EventModuleKey =
  | 'registration'
  | 'participants'
  | 'packages'
  | 'checkins'
  | 'reports'
  | 'race-categories'
  | 'race-pack'
  | 'quiz'
  | 'doorprize'
  | 'booths'
  | 'speakers'
  | 'sessions'
  | 'agenda'
  | 'certificates'

export type RegistrationFieldType = 'text' | 'textarea' | 'select' | 'date' | 'number'

export type RegistrationFieldDefinition = {
  key: string
  label: string
  type: RegistrationFieldType
  required: boolean
  options: string[]
}

export type BenefitItemDefinition = {
  id?: string | null
  title: string
  description?: string | null
  icon?: string | null
}

export type ContentSectionDefinition = {
  id?: string | null
  title: string
  icon?: string | null
  markdown: string
}

export type EventExperienceConfig = {
  eventId?: string
  kind: ModularEventKind
  enabledModules: EventModuleKey[]
  registrationFields: RegistrationFieldDefinition[]
  benefits: BenefitItemDefinition[]
  contentSections: ContentSectionDefinition[]
}

export type EventModuleDefinition = {
  key: EventModuleKey
  label: string
  description: string
  icon: string
  core?: boolean
  recommendedFor?: ModularEventKind[]
  comingSoon?: boolean
}

export type EventModuleFieldDefinition = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'time' | 'datetime-local' | 'select' | 'url'
  required?: boolean
  options?: string[]
  helperText?: string
}

export type EventModuleRecord = {
  id: string
  moduleKey: EventModuleKey
  title: string
  status: string
  sortOrder: number
  data: Record<string, string | null>
  createdAtUtc: string
  updatedAtUtc: string
}

export type EventModuleRecordInput = {
  title: string
  status?: string | null
  sortOrder: number
  data: Record<string, string | null>
}

export const EVENT_MODULE_DEFINITIONS: EventModuleDefinition[] = [
  { key: 'registration', label: 'Registration', description: 'Public participant registration and registration status.', icon: 'tabler-forms', core: true },
  { key: 'participants', label: 'Participants', description: 'Participant list, status, and participant operations.', icon: 'tabler-users', core: true },
  { key: 'packages', label: 'Packages', description: 'Free or paid packages, quota, benefits, and Midtrans flow.', icon: 'tabler-package', core: true },
  { key: 'checkins', label: 'Check-ins', description: 'QR gate check-in while the event is running.', icon: 'tabler-scan', core: true },
  { key: 'reports', label: 'Reports', description: 'Operational and participant reporting.', icon: 'tabler-chart-bar', core: true },
  { key: 'race-categories', label: 'Race Categories', description: 'Running distance/category setup such as 5K, 10K, or Half Marathon.', icon: 'tabler-run', recommendedFor: ['Running'] },
  { key: 'race-pack', label: 'Race Pack', description: 'Race pack pickup schedule, distribution instructions, and collection operations.', icon: 'tabler-shopping-bag', recommendedFor: ['Running'] },
  { key: 'speakers', label: 'Speakers', description: 'Speaker profiles, roles, organizations, and session assignment.', icon: 'tabler-microphone-2', recommendedFor: ['Seminar'] },
  { key: 'sessions', label: 'Sessions', description: 'Seminar sessions, rooms, capacity, speakers, and schedule.', icon: 'tabler-presentation', recommendedFor: ['Seminar'] },
  { key: 'agenda', label: 'Agenda', description: 'Event rundown and scheduled activities.', icon: 'tabler-calendar-time', recommendedFor: ['Seminar'] },
  { key: 'doorprize', label: 'Doorprize', description: 'Prize inventory, winner information, and claim status.', icon: 'tabler-gift', recommendedFor: ['Running', 'Seminar'] },
  { key: 'booths', label: 'Booths', description: 'Booth/activity points, locations, owners, and operating details.', icon: 'tabler-building-store', recommendedFor: ['Running', 'Seminar'] },
  { key: 'certificates', label: 'Certificates', description: 'Certificate setup, eligibility rule, signer, and distribution link.', icon: 'tabler-certificate', recommendedFor: ['Seminar'] },
  { key: 'quiz', label: 'Quiz', description: 'Reserved for the future quiz implementation.', icon: 'tabler-help-hexagon', comingSoon: true }
]

export const CORE_EVENT_MODULES: EventModuleKey[] = EVENT_MODULE_DEFINITIONS
  .filter(module => module.core)
  .map(module => module.key)

export const EVENT_MODULE_FIELDS: Partial<Record<EventModuleKey, EventModuleFieldDefinition[]>> = {
  'race-categories': [
    { key: 'distanceKm', label: 'Distance (KM)', type: 'number', required: true },
    { key: 'startTime', label: 'Race start', type: 'datetime-local' },
    { key: 'capacity', label: 'Category capacity', type: 'number' },
    { key: 'routeLabel', label: 'Route / course label', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ],
  'race-pack': [
    { key: 'pickupDate', label: 'Pickup date', type: 'date', required: true },
    { key: 'startTime', label: 'Start time', type: 'time' },
    { key: 'endTime', label: 'End time', type: 'time' },
    { key: 'location', label: 'Pickup location', type: 'text', required: true },
    { key: 'items', label: 'Race pack contents', type: 'textarea' },
    { key: 'instructions', label: 'Pickup instructions', type: 'textarea' }
  ],
  doorprize: [
    { key: 'quantity', label: 'Quantity', type: 'number', required: true },
    { key: 'sponsor', label: 'Sponsor', type: 'text' },
    { key: 'eligibility', label: 'Eligibility rule', type: 'textarea' },
    { key: 'winner', label: 'Winner / booking code', type: 'text' },
    { key: 'claimStatus', label: 'Claim status', type: 'select', options: ['Not Drawn', 'Pending Claim', 'Claimed'] }
  ],
  booths: [
    { key: 'location', label: 'Booth location', type: 'text', required: true },
    { key: 'activity', label: 'Activity', type: 'textarea' },
    { key: 'owner', label: 'PIC / owner', type: 'text' },
    { key: 'operatingHours', label: 'Operating hours', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ],
  speakers: [
    { key: 'role', label: 'Role / topic', type: 'text' },
    { key: 'organization', label: 'Organization', type: 'text' },
    { key: 'bio', label: 'Short bio', type: 'textarea' },
    { key: 'photoUrl', label: 'Photo URL', type: 'url' },
    { key: 'session', label: 'Session', type: 'text' }
  ],
  sessions: [
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'startTime', label: 'Start time', type: 'time', required: true },
    { key: 'endTime', label: 'End time', type: 'time' },
    { key: 'room', label: 'Room / venue', type: 'text' },
    { key: 'capacity', label: 'Capacity', type: 'number' },
    { key: 'speaker', label: 'Speaker(s)', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' }
  ],
  agenda: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'startTime', label: 'Start time', type: 'time', required: true },
    { key: 'endTime', label: 'End time', type: 'time' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' }
  ],
  certificates: [
    { key: 'eligibilityRule', label: 'Eligibility rule', type: 'textarea' },
    { key: 'signer', label: 'Signer', type: 'text' },
    { key: 'issueDate', label: 'Issue date', type: 'date' },
    { key: 'downloadUrl', label: 'Certificate / template URL', type: 'url' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ]
}

export const defaultRegistrationFields = (kind: ModularEventKind): RegistrationFieldDefinition[] => {
  if (kind === 'Running') {
    return [
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, options: [] },
      { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
      { key: 'jerseySize', label: 'Jersey Size', type: 'select', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { key: 'emergencyContact', label: 'Emergency Contact', type: 'text', required: true, options: [] },
      { key: 'runningCommunity', label: 'Running Community', type: 'text', required: false, options: [] }
    ]
  }

  if (kind === 'Seminar') {
    return [
      { key: 'attendeeType', label: 'Attendee Type', type: 'select', required: true, options: ['Student', 'Professional', 'General'] },
      { key: 'institution', label: 'Institution / Company', type: 'text', required: false, options: [] },
      { key: 'position', label: 'Position / Role', type: 'text', required: false, options: [] }
    ]
  }

  return []
}

export const defaultEventModules = (kind: ModularEventKind): EventModuleKey[] => {
  const recommended = EVENT_MODULE_DEFINITIONS
    .filter(module => !module.comingSoon && module.recommendedFor?.includes(kind))
    .map(module => module.key)

  return [...CORE_EVENT_MODULES, ...recommended]
}

export const createDefaultExperienceConfig = (kind: ModularEventKind): EventExperienceConfig => ({
  kind,
  enabledModules: defaultEventModules(kind),
  registrationFields: defaultRegistrationFields(kind),
  benefits: [],
  contentSections: []
})

const normalizeConfig = (payload: EventExperienceConfig): EventExperienceConfig => ({
  ...payload,
  benefits: Array.isArray(payload.benefits) ? payload.benefits : [],
  contentSections: Array.isArray(payload.contentSections) ? payload.contentSections : []
})

const ensureOk = async (response: Response, fallback: string) => {
  if (response.status === 403) throw new Error('You are not authorized to configure this event.')
  if (!response.ok) throw new Error(await parseError(response, fallback))
}

export async function getAdminEventExperience(eventId: string): Promise<EventExperienceConfig> {
  const response = await authFetch(`/admin/events/${encodeURIComponent(eventId)}/experience`, { cache: 'no-store' })
  await ensureOk(response, 'Unable to load event modules.')
  return normalizeConfig((await response.json()) as EventExperienceConfig)
}

export async function updateAdminEventExperience(
  eventId: string,
  config: Pick<EventExperienceConfig, 'enabledModules' | 'registrationFields' | 'benefits' | 'contentSections'>
): Promise<EventExperienceConfig> {
  const response = await authFetch(`/admin/events/${encodeURIComponent(eventId)}/experience`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })

  await ensureOk(response, 'Unable to save event configuration.')
  return normalizeConfig((await response.json()) as EventExperienceConfig)
}

export async function getPublicEventExperience(eventId: string): Promise<EventExperienceConfig> {
  const response = await fetch(`${apiUrl}/events/${encodeURIComponent(eventId)}/experience`, { cache: 'no-store' })
  if (!response.ok) throw new Error(await parseError(response, 'Unable to load event registration configuration.'))
  return normalizeConfig((await response.json()) as EventExperienceConfig)
}

export async function listEventModuleRecords(eventId: string, moduleKey: EventModuleKey): Promise<EventModuleRecord[]> {
  const response = await authFetch(
    `/admin/events/${encodeURIComponent(eventId)}/modules/${encodeURIComponent(moduleKey)}/records`,
    { cache: 'no-store' }
  )
  await ensureOk(response, 'Unable to load module records.')
  const payload = await response.json()
  return Array.isArray(payload) ? payload as EventModuleRecord[] : []
}

export async function createEventModuleRecord(
  eventId: string,
  moduleKey: EventModuleKey,
  input: EventModuleRecordInput
): Promise<EventModuleRecord> {
  const response = await authFetch(
    `/admin/events/${encodeURIComponent(eventId)}/modules/${encodeURIComponent(moduleKey)}/records`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    }
  )
  await ensureOk(response, 'Unable to create module record.')
  return await response.json() as EventModuleRecord
}

export async function updateEventModuleRecord(
  eventId: string,
  moduleKey: EventModuleKey,
  recordId: string,
  input: EventModuleRecordInput
): Promise<EventModuleRecord> {
  const response = await authFetch(
    `/admin/events/${encodeURIComponent(eventId)}/modules/${encodeURIComponent(moduleKey)}/records/${encodeURIComponent(recordId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    }
  )
  await ensureOk(response, 'Unable to update module record.')
  return await response.json() as EventModuleRecord
}

export async function deleteEventModuleRecord(
  eventId: string,
  moduleKey: EventModuleKey,
  recordId: string
): Promise<void> {
  const response = await authFetch(
    `/admin/events/${encodeURIComponent(eventId)}/modules/${encodeURIComponent(moduleKey)}/records/${encodeURIComponent(recordId)}`,
    { method: 'DELETE' }
  )
  await ensureOk(response, 'Unable to delete module record.')
}
