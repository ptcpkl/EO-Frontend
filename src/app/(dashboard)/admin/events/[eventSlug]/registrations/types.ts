export type ParticipantType = 'INTERNAL' | 'EXTERNAL'

export type RegistrationSource = 'ADMIN_IMPORT' | 'PUBLIC'

export type RegistrationStatus =
  | 'PENDING'
  | 'REGISTERED'
  | 'CHECKED_IN'
  | 'CANCELLED'

export type Registration = {
  id: string
  eventId: string
  fullName: string
  email: string
  phone: string
  organization: string | null
  nip: string | null
  participantType: ParticipantType
  registrationSource: RegistrationSource
  bookingCode: string
  status: RegistrationStatus
  registeredAt: string
  checkedInAt: string | null
}

export type RegistrationFilters = {
  search: string
  participantType: ParticipantType | 'ALL'
  status: RegistrationStatus | 'ALL'
}

export type RegistrationStatsData = {
  total: number
  internal: number
  external: number
  registered: number
}
