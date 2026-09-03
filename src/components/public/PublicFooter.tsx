'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import { getPublicEventBySlug } from '@/lib/api'
import {
  getPublicRegistrationStatus,
  resolveRegistrationAccessToken
} from '@/registrations/services/registration-public.service'

type Props = {
  eventLogoUrl?: string | null
  eventName?: string | null
}

type EventBrand = {
  logoUrl?: string | null
  name?: string | null
}

const SocialMark = ({ icon, label }: { icon: string; label: string }) => (
  <Box
    aria-label={label}
    title={label}
    sx={{
      width: { xs: 36, md: 40 },
      height: { xs: 36, md: 40 },
      display: 'grid',
      placeItems: 'center',
      borderRadius: '50%',
      bgcolor: 'rgba(5, 79, 132, .94)',
      color: '#fff',
      boxShadow: '0 8px 18px rgba(3,61,105,.18)'
    }}
  >
    <i className={`${icon} text-xl`} />
  </Box>
)

const PublicFooter = ({ eventLogoUrl, eventName }: Props) => {
  const pathname = usePathname()
  const [routeBrand, setRouteBrand] = useState<EventBrand>({})

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

    if (eventLogoUrl !== undefined || eventName !== undefined) {
      setRouteBrand({})
      return () => {
        active = false
      }
    }

    const loadBrand = async () => {
      if (eventSlug) {
        try {
          const event = await getPublicEventBySlug(eventSlug)
          if (active) setRouteBrand({ logoUrl: event.logoUrl, name: event.name })
        } catch {
          if (active) setRouteBrand({})
        }
        return
      }

      if (bookingCode) {
        const accessToken = resolveRegistrationAccessToken(bookingCode)

        if (!accessToken) {
          if (active) setRouteBrand({})
          return
        }

        try {
          const registration = await getPublicRegistrationStatus(bookingCode, accessToken)
          if (active) setRouteBrand({ logoUrl: registration.eventLogoUrl, name: registration.eventName })
        } catch {
          if (active) setRouteBrand({})
        }
        return
      }

      setRouteBrand({})
    }

    void loadBrand()

    return () => {
      active = false
    }
  }, [bookingCode, eventLogoUrl, eventName, eventSlug])

  const resolvedLogoUrl = eventLogoUrl ?? routeBrand.logoUrl
  const resolvedEventName = eventName ?? routeBrand.name

  return (
    <Box
      component='footer'
      sx={{
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        color: '#073d69',
        bgcolor: '#d8f1ff',
        minHeight: {
          xs: 760,
          sm: 680,
          md: 610,
          lg: 'clamp(540px, 33.3vw, 690px)'
        },
        backgroundImage: 'url(/footer.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: {
          xs: 'auto 100%',
          sm: 'auto 100%',
          md: 'cover',
          lg: '100% 100%'
        }
      }}
    >
      <Box
        aria-hidden='true'
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: {
            xs: 'linear-gradient(180deg, rgba(225,247,255,.9) 0%, rgba(225,247,255,.58) 38%, rgba(225,247,255,.06) 68%, rgba(225,247,255,0) 100%)',
            md: 'radial-gradient(ellipse at 50% 22%, rgba(229,248,255,.74) 0%, rgba(229,248,255,.48) 34%, rgba(229,248,255,.06) 61%, rgba(229,248,255,0) 74%)'
          }
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          mx: 'auto',
          width: '100%',
          maxWidth: 760,
          px: { xs: 3, sm: 4 },
          pt: { xs: 5, sm: 5.5, md: 6 },
          textAlign: 'center'
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: { xs: 1.75, sm: 2.25 },
            px: { xs: 2.5, sm: 3 },
            py: { xs: 1.75, sm: 2 },
            borderRadius: 4,
            bgcolor: 'rgba(230,248,255,.48)',
            backdropFilter: 'blur(2px)'
          }}
        >
          <Box
            component='img'
            src='/EO%20Navbar.png'
            alt='Pertamina Event'
            sx={{
              width: 'auto',
              height: { xs: 46, md: 56 },
              maxWidth: 220,
              objectFit: 'contain'
            }}
          />

          {resolvedLogoUrl && (
            <>
              <Divider
                orientation='vertical'
                flexItem
                sx={{
                  borderColor: 'rgba(7,61,105,.28)',
                  minHeight: 54,
                  display: { xs: 'none', sm: 'block' }
                }}
              />
              <Box
                component='img'
                src={resolvedLogoUrl}
                alt={`${resolvedEventName || 'Event'} logo`}
                sx={{
                  width: 'auto',
                  maxWidth: { xs: 155, sm: 185 },
                  maxHeight: { xs: 54, sm: 64 },
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 8px rgba(6,61,105,.08))'
                }}
              />
            </>
          )}
        </Box>

        <Typography
          sx={{
            mt: 2.5,
            mx: 'auto',
            maxWidth: 600,
            color: '#0b456f',
            lineHeight: 1.7,
            fontSize: { xs: 14.5, sm: 15.5 },
            fontWeight: 600,
            textShadow: '0 1px 0 rgba(255,255,255,.7)'
          }}
        >
          Energizing every event, inspiring every moment. Together, we create experiences that connect people, ideas, and communities.
        </Typography>

        <Box sx={{ mt: 2.4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.1 }}>
          <SocialMark icon='tabler-brand-instagram' label='Instagram' />
          <SocialMark icon='tabler-brand-youtube' label='YouTube' />
          <SocialMark icon='tabler-brand-tiktok' label='TikTok' />
          <SocialMark icon='tabler-brand-discord' label='Community' />
        </Box>

        <Typography sx={{ mt: 1.1, color: '#073d69', fontWeight: 850, fontSize: 14.5 }}>
          @pertaminaevent
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          zIndex: 2,
          left: 0,
          right: 0,
          bottom: 0,
          px: { xs: 3, md: 6 },
          pb: { xs: 2.5, md: 2.8 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'center', sm: 'flex-end' },
          gap: 1.25,
          pointerEvents: 'none'
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontSize: { xs: 12.5, md: 14 },
            textShadow: '0 2px 6px rgba(0,25,70,.5)'
          }}
        >
          © 2026 PT Pertamina (Persero). All rights reserved.
        </Typography>

        <Typography
          sx={{
            color: '#fff',
            fontWeight: 950,
            fontStyle: 'italic',
            letterSpacing: '-.025em',
            fontSize: { xs: 19, md: 25 },
            textShadow: '0 3px 8px rgba(0,25,70,.45)'
          }}
        >
          ENERGIZING <Box component='span' sx={{ color: '#11c5bb' }}>YOU</Box>
        </Typography>
      </Box>
    </Box>
  )
}

export default PublicFooter
