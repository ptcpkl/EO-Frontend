'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import { rememberAdminPath, restoreSession } from '@/lib/auth'

type Props = {
  children: ReactNode
}

const AdminSessionGuard = ({ children }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    let active = true

    const validateSession = async () => {
      const session = await restoreSession()

      if (!active) return

      if (!session) {
        const returnTo = pathname?.startsWith('/admin') ? pathname : '/admin/home'

        router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}&authCheck=1`)
        return
      }

      if (session.role?.toLowerCase() !== 'admin') {
        router.replace('/home')
        return
      }

      rememberAdminPath(pathname || '/admin/home')
      setIsAuthorized(true)
    }

    setIsAuthorized(false)
    validateSession()

    return () => {
      active = false
    }
  }, [pathname, router])

  return isAuthorized ? children : null
}

export default AdminSessionGuard
