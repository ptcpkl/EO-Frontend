import type {
  Registration,
  RegistrationFilters,
  RegistrationStatsData
} from '../types'

const registrations: Registration[] = [
  {
    id: 'reg-001',
    eventId: 'event-ffws-edit',
    fullName: 'Budi Santoso',
    email: 'budi.santoso@patraniaga.com',
    phone: '081234567890',
    organization: 'Pertamina Patra Niaga',
    nip: 'PN-001245',
    participantType: 'INTERNAL',
    registrationSource: 'ADMIN_IMPORT',
    bookingCode: 'FFWS-001245',
    status: 'REGISTERED',
    registeredAt: '2026-08-24T08:15:00Z',
    checkedInAt: null
  },
  {
    id: 'reg-002',
    eventId: 'event-ffws-edit',
    fullName: 'Rina Amelia',
    email: 'rina.amelia@gmail.com',
    phone: '081298765432',
    organization: 'Independent',
    nip: null,
    participantType: 'EXTERNAL',
    registrationSource: 'PUBLIC',
    bookingCode: 'FFWS-001246',
    status: 'REGISTERED',
    registeredAt: '2026-08-24T08:24:00Z',
    checkedInAt: null
  },
  {
    id: 'reg-003',
    eventId: 'event-ffws-edit',
    fullName: 'Andi Wijaya',
    email: 'andi.wijaya@patraniaga.com',
    phone: '081355512345',
    organization: 'Pertamina Patra Niaga',
    nip: 'PN-001378',
    participantType: 'INTERNAL',
    registrationSource: 'ADMIN_IMPORT',
    bookingCode: 'FFWS-001247',
    status: 'REGISTERED',
    registeredAt: '2026-08-24T08:40:00Z',
    checkedInAt: null
  },
  {
    id: 'reg-004',
    eventId: 'event-ffws-edit',
    fullName: 'Dewi Lestari',
    email: 'dewi.lestari@pertamina.com',
    phone: '081377712345',
    organization: 'Pertamina',
    nip: 'PTM-008721',
    participantType: 'INTERNAL',
    registrationSource: 'ADMIN_IMPORT',
    bookingCode: 'FFWS-001248',
    status: 'CHECKED_IN',
    registeredAt: '2026-08-24T09:10:00Z',
    checkedInAt: '2026-08-24T10:15:00Z'
  },
  {
    id: 'reg-006',
    eventId: 'event-ffws-edit',
    fullName: 'Siti Rahma',
    email: 'siti.rahma@patraniaga.com',
    phone: '081211223344',
    organization: 'Pertamina Patra Niaga',
    nip: 'PN-001532',
    participantType: 'INTERNAL',
    registrationSource: 'ADMIN_IMPORT',
    bookingCode: 'FFWS-001250',
    status: 'REGISTERED',
    registeredAt: '2026-08-24T09:48:00Z',
    checkedInAt: null
  },
  {
    id: 'reg-007',
    eventId: 'event-ffws-edit',
    fullName: 'Yoga Pratama',
    email: 'yoga.pratama@gmail.com',
    phone: '081299887766',
    organization: 'Independent',
    nip: null,
    participantType: 'EXTERNAL',
    registrationSource: 'PUBLIC',
    bookingCode: 'FFWS-001251',
    status: 'REGISTERED',
    registeredAt: '2026-08-24T10:05:00Z',
    checkedInAt: null
  },
  {
    id: 'reg-008',
    eventId: 'event-ffws-edit',
    fullName: 'Maya Putri',
    email: 'maya.putri@patraniaga.com',
    phone: '081288776655',
    organization: 'Pertamina Patra Niaga',
    nip: 'PN-001684',
    participantType: 'INTERNAL',
    registrationSource: 'ADMIN_IMPORT',
    bookingCode: 'FFWS-001252',
    status: 'CANCELLED',
    registeredAt: '2026-08-24T10:22:00Z',
    checkedInAt: null
  },
  {
    id: 'reg-009',
    eventId: 'event-ffws-edit',
    fullName: 'Rizky Maulana',
    email: 'rizky.maulana@pertamina.com',
    phone: '081255667788',
    organization: 'Pertamina',
    nip: 'PTM-009421',
    participantType: 'INTERNAL',
    registrationSource: 'ADMIN_IMPORT',
    bookingCode: 'FFWS-001253',
    status: 'REGISTERED',
    registeredAt: '2026-08-24T10:45:00Z',
    checkedInAt: null
  },
  {
    id: 'reg-010',
    eventId: 'event-ffws-edit',
    fullName: 'Nadia Anjani',
    email: 'nadia.anjani@gmail.com',
    phone: '081233445566',
    organization: 'University Student',
    nip: null,
    participantType: 'EXTERNAL',
    registrationSource: 'PUBLIC',
    bookingCode: 'FFWS-001254',
    status: 'REGISTERED',
    registeredAt: '2026-08-24T11:02:00Z',
    checkedInAt: null
  }
]

export const getMockRegistrations = (
  eventSlug: string,
  filters?: RegistrationFilters
): Registration[] => {
  // Keep eventSlug in the service contract so this can later
  // be replaced directly with an API request.
  void eventSlug

  let result = [...registrations]

  if (filters) {
    const search = filters.search.trim().toLowerCase()

    if (search) {
      result = result.filter(item =>
        [
          item.fullName,
          item.email,
          item.phone,
          item.organization,
          item.nip,
          item.bookingCode
        ]
          .filter(Boolean)
          .some(value => value!.toLowerCase().includes(search))
      )
    }

    if (filters.participantType !== 'ALL') {
      result = result.filter(
        item => item.participantType === filters.participantType
      )
    }

    if (filters.status !== 'ALL') {
      result = result.filter(item => item.status === filters.status)
    }
  }

  return result
}

export const getMockRegistrationStats = (
  eventSlug: string
): RegistrationStatsData => {
  void eventSlug

  const activeRegistrations = registrations.filter(
    item => item.status !== 'CANCELLED'
  )

  return {
    total: activeRegistrations.length,
    internal: activeRegistrations.filter(
      item => item.participantType === 'INTERNAL'
    ).length,
    external: activeRegistrations.filter(
      item => item.participantType === 'EXTERNAL'
    ).length,
    registered: activeRegistrations.filter(
      item => item.status === 'REGISTERED'
    ).length
  }
}
