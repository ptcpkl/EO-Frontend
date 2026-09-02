'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import { restoreSession } from '@/lib/auth'

type Props = {
  children: ReactNode
}

const AdminSessionGuard = ({ children }: Props) => {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    let active = true

    const validateSession = async () => {
      const session = await restoreSession()

      if (!active) return

      if (!session) {
        router.replace('/login')
        return
      }

      if (session.role?.toLowerCase() !== 'admin') {
        router.replace('/home')
        return
      }

      setIsAuthorized(true)
    }

    validateSession()

    return () => {
      active = false
    }
  }, [router])

  return isAuthorized ? children : null
}

export default AdminSessionGuard
