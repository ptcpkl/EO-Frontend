const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:5174/api'

export type CreateExternalRegistrationPaymentRequest = {
  eventPackageId: string
  fullName: string
  email: string
  phone: string
  organization?: string | null
}

export type RegistrationPaymentResponse = {
  registrationId: string
  eventId: string
  eventPackageId: string
  eventPackageName: string
  amount: number
  bookingCode: string
  snapToken: string
}

export async function createExternalRegistrationPayment(
  slug: string,
  payload: CreateExternalRegistrationPaymentRequest
): Promise<RegistrationPaymentResponse> {
  const eventResponse = await fetch(
    `${apiUrl}/events/${encodeURIComponent(slug)}`,
    {
      method: 'GET',
      cache: 'no-store'
    }
  )

  if (!eventResponse.ok) {
    throw new Error(
      `Failed to load event (${eventResponse.status})`
    )
  }

  const event = await eventResponse.json()

  const eventId = event?.id ?? event?.Id

  if (!eventId) {
    throw new Error(
      'Event response does not contain an event id.'
    )
  }

  const response = await fetch(
    `${apiUrl}/events/${eventId}/registrations/payment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  )

  if (!response.ok) {
    const errorText = await response.text()

    throw new Error(
      errorText ||
        `Registration failed (${response.status})`
    )
  }

  return response.json()
}
