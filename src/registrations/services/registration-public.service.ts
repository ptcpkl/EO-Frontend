const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5174/api').replace(/\/$/, '')

export type PublicRegistrationStatusResponse = {
  registrationId: string
  bookingCode: string
  fullName: string
  eventName: string
  eventLogoUrl?: string | null
  eventPackageName?: string | null
  status: string
  paymentStatus: string
  grossAmount: number
  registeredAtUtc: string
  paidAtUtc?: string | null
  paymentDeadlineUtc?: string | null
  ticketAvailable: boolean
  receiptAvailable: boolean
  snapToken?: string | null
}

export type PublicRegistrationTicketResponse = {
  registrationId: string
  bookingCode: string
  fullName: string
  email: string
  phone: string
  eventName: string
  eventLocation?: string | null
  eventStartAtUtc: string
  eventEndAtUtc: string
  eventPackageName?: string | null
  grossAmount: number
  status: string
  qrToken: string
  registeredAtUtc: string
}

export type PublicRegistrationReceiptResponse = {
  registrationId: string
  bookingCode: string
  fullName: string
  email: string
  phone: string
  eventName: string
  eventPackageName?: string | null
  grossAmount: number
  paymentStatus: string
  paymentType?: string | null
  transactionId?: string | null
  paidAtUtc: string
}

const storageKey = (bookingCode: string) => `eo.registration.${bookingCode}.accessToken`

export function storeRegistrationAccessToken(bookingCode: string, accessToken: string) {
  if (typeof window === 'undefined' || !bookingCode || !accessToken) return
  window.sessionStorage.setItem(storageKey(bookingCode), accessToken)
}

export function resolveRegistrationAccessToken(bookingCode: string): string | null {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const hashToken = new URLSearchParams(hash).get('token')

  if (hashToken) {
    storeRegistrationAccessToken(bookingCode, hashToken)
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    return hashToken
  }

  return window.sessionStorage.getItem(storageKey(bookingCode))
}

async function parseError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { detail?: string; title?: string }
    return body.detail || body.title || fallback
  } catch {
    return fallback
  }
}

async function getProtected<T>(bookingCode: string, suffix: string, accessToken: string): Promise<T> {
  const response = await fetch(`${apiUrl}/registrations/${encodeURIComponent(bookingCode)}/${suffix}`, {
    method: 'GET',
    headers: {
      'X-Registration-Token': accessToken
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(await parseError(response, `Unable to load registration ${suffix} (${response.status}).`))
  }

  return (await response.json()) as T
}

async function getProtectedBlob(bookingCode: string, suffix: string, accessToken: string): Promise<Blob> {
  const response = await fetch(`${apiUrl}/registrations/${encodeURIComponent(bookingCode)}/${suffix}`, {
    method: 'GET',
    headers: {
      'X-Registration-Token': accessToken
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(await parseError(response, `Unable to download registration ${suffix} (${response.status}).`))
  }

  return response.blob()
}

export function getPublicRegistrationStatus(bookingCode: string, accessToken: string) {
  return getProtected<PublicRegistrationStatusResponse>(bookingCode, 'status', accessToken)
}

export function getPublicRegistrationTicket(bookingCode: string, accessToken: string) {
  return getProtected<PublicRegistrationTicketResponse>(bookingCode, 'ticket', accessToken)
}

export function getPublicRegistrationTicketPdf(bookingCode: string, accessToken: string) {
  return getProtectedBlob(bookingCode, 'ticket.pdf', accessToken)
}

export function getPublicRegistrationReceipt(bookingCode: string, accessToken: string) {
  return getProtected<PublicRegistrationReceiptResponse>(bookingCode, 'receipt', accessToken)
}

export function getPublicRegistrationReceiptPdf(bookingCode: string, accessToken: string) {
  return getProtectedBlob(bookingCode, 'receipt.pdf', accessToken)
}
