declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void
          onPending?: (result: unknown) => void
          onError?: (result: unknown) => void
          onClose?: () => void
        }
      ) => void
    }
  }
}

let snapPromise: Promise<void> | null = null

const MIDTRANS_SNAP_URL =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'

const CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY

export const loadMidtransSnap = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return
  }

  if (window.snap) {
    return
  }

  if (!CLIENT_KEY) {
    throw new Error(
      'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is not configured.'
    )
  }

  if (snapPromise) {
    return snapPromise
  }

  snapPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${MIDTRANS_SNAP_URL}"]`
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () =>
        reject(
          new Error(
            'Failed to load Midtrans Snap.'
          )
        )
      )

      return
    }

    const script = document.createElement('script')

    script.src = MIDTRANS_SNAP_URL
    script.type = 'text/javascript'
    script.async = true

    script.setAttribute(
      'data-client-key',
      CLIENT_KEY
    )

    script.onload = () => resolve()

    script.onerror = () => {
      snapPromise = null

      reject(
        new Error(
          'Failed to load Midtrans Snap.'
        )
      )
    }

    document.body.appendChild(script)
  })

  return snapPromise
}

export const openMidtransSnap = async (
  snapToken: string,
  callbacks?: {
    onSuccess?: (result: unknown) => void
    onPending?: (result: unknown) => void
    onError?: (result: unknown) => void
    onClose?: () => void
  }
) => {
  if (!snapToken) {
    throw new Error(
      'Midtrans Snap token is missing.'
    )
  }

  await loadMidtransSnap()

  if (!window.snap) {
    throw new Error(
      'Midtrans Snap is not available.'
    )
  }

  window.snap.pay(
    snapToken,
    callbacks
  )
}
