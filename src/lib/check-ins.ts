import { parseError } from '@/lib/api'
import { authFetch } from '@/lib/auth'

export type CheckInResponse = {
  registrationId: string
  bookingCode: string
  fullName: string
  eventName: string
  checkedInAtUtc: string
}

export async function checkInParticipant(qrToken: string): Promise<CheckInResponse> {
  const token = qrToken.trim()

  if (!token) throw new Error('QR token is required.')

  const response = await authFetch('/check-ins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken: token })
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'Unable to check in participant.'))
  }

  return (await response.json()) as CheckInResponse
}
