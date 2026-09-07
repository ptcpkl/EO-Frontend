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
    sx={theme => ({
      width: { xs: 34, md: 38 },
      height: { xs: 34, md: 38 },
      display: 'grid',
      placeItems: 'center',
      borderRadius: '50%',
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,105,172,.92)' : 'rgba(5,79,132,.94)',
      color: '#fff',
      boxShadow: theme.palette.mode === 'dark' ? '0 8px 18px rgba(0,0,0,.24)' : '0 8px 18px rgba(3,61,105,.18)',
      transition: 'transform .2s ease, box-shadow .2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.palette.mode === 'dark' ? '0 10px 24px rgba(0,0,0,.32)' : '0 10px 22px rgba(3,61,105,.22)'
      }
    })}
  >
    <i className={`${icon} text-lg`} />
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
      sx={theme => ({
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        color: theme.palette.mode === 'dark' ? '#d9eeff' : '#073d69',
        bgcolor: theme.palette.mode === 'dark' ? '#020b20' : '#d8f1ff',
        minHeight: {
          xs: 520,
          sm: 490,
          md: 450,
          lg: 'clamp(420px, 24vw, 500px)'
        },
        backgroundImage: `url('${theme.palette.mode === 'dark' ? '/footer dark.png' : '/footer.png'}')`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center bottom',
        backgroundSize: {
          xs: 'auto 100%',
          sm: 'cover',
          md: 'cover'
        },
        transition: theme.transitions.create(['background-color', 'color'], {
          duration: theme.transitions.duration.shorter
        })
      })}
    >
      <Box
        aria-hidden='true'
        sx={theme => ({
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(ellipse at 50% 34%, rgba(5,25,58,.46) 0%, rgba(3,16,40,.22) 42%, rgba(2,11,32,0) 72%)'
            : 'radial-gradient(ellipse at 50% 34%, rgba(229,248,255,.5) 0%, rgba(229,248,255,.24) 40%, rgba(229,248,255,0) 72%)'
        })}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          mx: 'auto',
          width: '100%',
          maxWidth: 740,
          px: { xs: 2.5, sm: 3.5 },
          pt: { xs: 5, sm: 5, md: 5.5, lg: 6 },
          textAlign: 'center'
        }}
      >
        <Box
          sx={theme => ({
            mx: 'auto',
            maxWidth: 660,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 2, sm: 2.25 },
            px: { xs: 2.25, sm: 3.5 },
            py: { xs: 2.25, sm: 2.75 },
            borderRadius: 4,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(2,14,38,.38)' : 'rgba(230,248,255,.28)',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(118,190,255,.1)' : '1px solid transparent',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            boxShadow: theme.palette.mode === 'dark' ? '0 14px 36px rgba(0,0,0,.14)' : '0 14px 34px rgba(7,61,105,.05)'
          })}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: { xs: 1.5, sm: 2 }
            }}
          >
            <Box
              component='img'
              src='/EO%20Navbar.png'
              alt='Pertamina Event'
              sx={{
                width: 'auto',
                height: { xs: 40, md: 46 },
                maxWidth: 190,
                objectFit: 'contain'
              }}
            />

            {resolvedLogoUrl && (
              <>
                <Divider
                  orientation='vertical'
                  flexItem
                  sx={theme => ({
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(196,229,255,.3)' : 'rgba(7,61,105,.28)',
                    minHeight: 44,
                    display: { xs: 'none', sm: 'block' }
                  })}
                />
                <Box
                  component='img'
                  src={resolvedLogoUrl}
                  alt={`${resolvedEventName || 'Event'} logo`}
                  sx={{
                    width: 'auto',
                    maxWidth: { xs: 130, sm: 160 },
                    maxHeight: { xs: 44, sm: 52 },
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 8px rgba(6,61,105,.08))'
                  }}
                />
              </>
            )}
          </Box>

          <Typography
            sx={theme => ({
              mx: 'auto',
              maxWidth: 570,
              color: theme.palette.mode === 'dark' ? '#d8edff' : '#0b456f',
              lineHeight: { xs: 1.65, sm: 1.7 },
              fontSize: { xs: 13.75, sm: 14.75 },
              fontWeight: 600,
              textShadow: theme.palette.mode === 'dark' ? '0 1px 8px rgba(0,0,0,.5)' : '0 1px 0 rgba(255,255,255,.7)'
            })}
          >
            Energizing every event, inspiring every moment. Together, we create experiences that connect people, ideas, and communities.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: { xs: 0.9, sm: 1.1 } }}>
            <SocialMark icon='tabler-brand-instagram' label='Instagram' />
            <SocialMark icon='tabler-brand-youtube' label='YouTube' />
            <SocialMark icon='tabler-brand-tiktok' label='TikTok' />
            <SocialMark icon='tabler-brand-discord' label='Community' />
          </Box>

          <Typography sx={theme => ({ color: theme.palette.mode === 'dark' ? '#d8edff' : '#073d69', fontWeight: 850, fontSize: 13.5 })}>
            @pertaminaevent
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          zIndex: 2,
          left: 0,
          right: 0,
          bottom: 0,
          px: { xs: 2.5, md: 4 },
          pb: { xs: 1.5, md: 1.75 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'center', sm: 'flex-end' },
          gap: 0.75,
          pointerEvents: 'none'
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontSize: { xs: 11.5, md: 12.5 },
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
            fontSize: { xs: 16, md: 20 },
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
