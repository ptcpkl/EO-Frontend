'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { useRouter } from 'next/navigation'

type Props = {
  children: ReactNode
}

type StoredSession = {
  role?: string
}

const AdminSessionGuard = ({ children }: Props) => {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const storedSession = window.localStorage.getItem('eo-auth')

    if (!storedSession) {
      router.replace('/login')

      return
    }

    try {
      const session = JSON.parse(storedSession) as StoredSession

      if (session.role?.toLowerCase() !== 'admin') {
        router.replace('/home')

        return
      }

      setIsAuthorized(true)
    } catch {
      window.localStorage.removeItem('eo-auth')
      router.replace('/login')
    }
  }, [router])

  return isAuthorized ? children : null
}

export default AdminSessionGuard
