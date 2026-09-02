'use client'

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5174/api').replace(/\/$/, '')
const storageKey = 'eo-auth'

export type AdminSession = {
  accessToken: string
  expiresAtUtc: string
  userId: string
  fullName: string
  email: string
  role: string
}

const parseError = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => null)

  return body?.detail ?? body?.message ?? body?.title ?? fallback
}

export function getStoredSession(): AdminSession | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(storageKey)

  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AdminSession

    if (!session.accessToken || !session.userId || !session.role) return null

    return session
  } catch {
    return null
  }
}

export function saveSession(session: AdminSession) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(storageKey, JSON.stringify(session))
}

export function clearSession() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(storageKey)
}

const isAccessTokenUsable = (session: AdminSession) => {
  const expiresAt = Date.parse(session.expiresAtUtc)

  return Number.isFinite(expiresAt) && expiresAt - Date.now() > 60_000
}

export async function login(email: string, password: string): Promise<AdminSession> {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'Email atau password salah.'))
  }

  const session = (await response.json()) as AdminSession

  saveSession(session)

  return session
}

let refreshPromise: Promise<AdminSession | null> | null = null

export async function refreshSession(): Promise<AdminSession | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        clearSession()
        return null
      }

      const session = (await response.json()) as AdminSession

      saveSession(session)
      return session
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function restoreSession(): Promise<AdminSession | null> {
  const session = getStoredSession()

  if (session && isAccessTokenUsable(session)) return session

  return refreshSession()
}

const buildHeaders = (headers: HeadersInit | undefined, accessToken: string) => {
  const result = new Headers(headers)

  result.set('Authorization', `Bearer ${accessToken}`)

  return result
}

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let session = await restoreSession()

  if (!session) throw new Error('Your session has expired. Please login again.')

  const request = () =>
    fetch(`${apiUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: buildHeaders(init.headers, session!.accessToken)
    })

  let response = await request()

  if (response.status !== 401) return response

  session = await refreshSession()

  if (!session) throw new Error('Your session has expired. Please login again.')

  response = await request()

  if (response.status === 401) {
    clearSession()
    throw new Error('Your session has expired. Please login again.')
  }

  return response
}

export async function logout() {
  try {
    await fetch(`${apiUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })
  } finally {
    clearSession()
  }
}
