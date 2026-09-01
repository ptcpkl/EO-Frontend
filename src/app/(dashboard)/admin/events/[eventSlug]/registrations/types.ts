export type ParticipantType = 'INTERNAL' | 'EXTERNAL'

export type RegistrationSource = 'ADMIN_IMPORT' | 'PUBLIC'

export type RegistrationStatus = 'PENDING' | 'REGISTERED' | 'CHECKED_IN' | 'CANCELLED'

export type Registration = {
  id: string
  eventId: string

  participantType: ParticipantType
  registrationSource: RegistrationSource

  fullName: string
  email: string
  phone: string
  nip: string | null

  organization: string | null
  employeeNumber?: string | null
  department?: string | null

  eventPackageId?: string | null
  eventPackageName?: string | null

  bookingCode: string
  status: RegistrationStatus

  registeredAt: string
  checkedInAt: string | null
}

export type RegistrationFilters = {
  search: string
  participantType: ParticipantType | 'ALL'
  status: RegistrationStatus | 'ALL'
  eventPackageId: string
}

export type RegistrationStatsData = {
  total: number
  internal: number
  external: number
  registered: number
}

export type RegistrationListResponse = {
  items: Registration[]
  page: number
  pageSize: number
  total: number
}
