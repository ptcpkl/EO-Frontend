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
      width: { xs: 38, md: 42 },
      height: { xs: 38, md: 42 },
      display: 'grid',
      placeItems: 'center',
      borderRadius: '50%',
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,105,172,.92)' : 'rgba(5, 79, 132, .94)',
      color: '#fff',
      boxShadow: theme.palette.mode === 'dark' ? '0 9px 22px rgba(0,0,0,.28)' : '0 9px 20px rgba(3,61,105,.2)',
      transition: 'transform .2s ease, box-shadow .2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.palette.mode === 'dark' ? '0 12px 28px rgba(0,0,0,.34)' : '0 12px 24px rgba(3,61,105,.24)'
      }
    })}
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
      sx={theme => ({
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        color: theme.palette.mode === 'dark' ? '#d9eeff' : '#073d69',
        bgcolor: theme.palette.mode === 'dark' ? '#020b20' : '#d8f1ff',
        minHeight: {
          xs: 760,
          sm: 690,
          md: 630,
          lg: 'clamp(570px, 33.3vw, 700px)'
        },
        backgroundImage: `url('${theme.palette.mode === 'dark' ? '/footer%20sark.png' : '/footer.png'}')`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: {
          xs: 'auto 100%',
          sm: 'auto 100%',
          md: 'cover',
          lg: '100% 100%'
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
            ? {
                xs: 'linear-gradient(180deg, rgba(2,11,32,.72) 0%, rgba(2,11,32,.42) 42%, rgba(2,11,32,.05) 74%, rgba(2,11,32,0) 100%)',
                md: 'radial-gradient(ellipse at 50% 34%, rgba(5,25,58,.62) 0%, rgba(3,16,40,.34) 38%, rgba(2,11,32,.04) 65%, rgba(2,11,32,0) 78%)'
              }
            : {
                xs: 'linear-gradient(180deg, rgba(225,247,255,.82) 0%, rgba(225,247,255,.5) 40%, rgba(225,247,255,.04) 70%, rgba(225,247,255,0) 100%)',
                md: 'radial-gradient(ellipse at 50% 34%, rgba(229,248,255,.66) 0%, rgba(229,248,255,.38) 35%, rgba(229,248,255,.04) 62%, rgba(229,248,255,0) 76%)'
              }
        })}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          mx: 'auto',
          width: '100%',
          maxWidth: 780,
          px: { xs: 3, sm: 4 },
          pt: { xs: 11, sm: 12, md: 13, lg: 14 },
          textAlign: 'center'
        }}
      >
        <Box
          sx={theme => ({
            mx: 'auto',
            maxWidth: 700,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 2.5, sm: 3 },
            px: { xs: 2.5, sm: 4.5 },
            py: { xs: 2.75, sm: 3.5 },
            borderRadius: 5,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(2,14,38,.44)' : 'rgba(230,248,255,.34)',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(118,190,255,.12)' : '1px solid transparent',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            boxShadow: theme.palette.mode === 'dark' ? '0 18px 48px rgba(0,0,0,.16)' : '0 16px 44px rgba(7,61,105,.06)'
          })}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: { xs: 1.75, sm: 2.5 }
            }}
          >
            <Box
              component='img'
              src='/EO%20Navbar.png'
              alt='Pertamina Event'
              sx={{
                width: 'auto',
                height: { xs: 48, md: 58 },
                maxWidth: 225,
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
                    minHeight: 56,
                    display: { xs: 'none', sm: 'block' }
                  })}
                />
                <Box
                  component='img'
                  src={resolvedLogoUrl}
                  alt={`${resolvedEventName || 'Event'} logo`}
                  sx={{
                    width: 'auto',
                    maxWidth: { xs: 160, sm: 190 },
                    maxHeight: { xs: 56, sm: 66 },
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
              maxWidth: 590,
              color: theme.palette.mode === 'dark' ? '#d8edff' : '#0b456f',
              lineHeight: 1.75,
              fontSize: { xs: 14.5, sm: 15.75 },
              fontWeight: 600,
              textShadow: theme.palette.mode === 'dark' ? '0 1px 8px rgba(0,0,0,.5)' : '0 1px 0 rgba(255,255,255,.7)'
            })}
          >
            Energizing every event, inspiring every moment. Together, we create experiences that connect people, ideas, and communities.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: { xs: 1.1, sm: 1.35 } }}>
            <SocialMark icon='tabler-brand-instagram' label='Instagram' />
            <SocialMark icon='tabler-brand-youtube' label='YouTube' />
            <SocialMark icon='tabler-brand-tiktok' label='TikTok' />
            <SocialMark icon='tabler-brand-discord' label='Community' />
          </Box>

          <Typography sx={theme => ({ color: theme.palette.mode === 'dark' ? '#d8edff' : '#073d69', fontWeight: 850, fontSize: 14.5 })}>
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
