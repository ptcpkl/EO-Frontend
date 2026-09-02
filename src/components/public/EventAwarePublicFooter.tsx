'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

import { getPublicEventBySlug } from '@/lib/api'
import {
  getPublicRegistrationStatus,
  resolveRegistrationAccessToken
} from '@/registrations/services/registration-public.service'

import PublicFooter from './PublicFooter'

type EventBrand = {
  logoUrl?: string | null
  name?: string | null
}

const EventAwarePublicFooter = () => {
  const pathname = usePathname()
  const [brand, setBrand] = useState<EventBrand>({})

  const eventSlug = useMemo(() => {
    const match = pathname.match(/^\/events\/(?!category\/)([^/]+)/)
    return match?.[1] ? decodeURIComponent(match[1]) : null
  }, [pathname])

  const bookingCode = useMemo(() => {
    const match = pathname.match(/^\/registration\/([^/]+)/)
    return match?.[1] ? decodeURIComponent(match[1]) : null
  }, [pathname])

  useEffect(() => {
    let active = true

    const load = async () => {
      if (eventSlug) {
        try {
          const event = await getPublicEventBySlug(eventSlug)
          if (active) setBrand({ logoUrl: event.logoUrl, name: event.name })
        } catch {
          if (active) setBrand({})
        }
        return
      }

      if (bookingCode) {
        const accessToken = resolveRegistrationAccessToken(bookingCode)

        if (!accessToken) {
          if (active) setBrand({})
          return
        }

        try {
          const registration = await getPublicRegistrationStatus(bookingCode, accessToken)
          if (active) setBrand({ logoUrl: registration.eventLogoUrl, name: registration.eventName })
        } catch {
          if (active) setBrand({})
        }
        return
      }

      setBrand({})
    }

    void load()

    return () => {
      active = false
    }
  }, [bookingCode, eventSlug])

  return <PublicFooter eventLogoUrl={brand.logoUrl} eventName={brand.name} />
}

export default EventAwarePublicFooter
