'use client'

import { useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import { getPublicEventBySlug } from '@/lib/api'
import {
  getPublicRegistrationStatus,
  resolveRegistrationAccessToken
} from '@/registrations/services/registration-public.service'

const categories = [
  ['Running', '/events/category/running', 'tabler-run'],
  ['Seminar', '/events/category/seminar', 'tabler-microphone'],
  ['Workshop', '/events/category/workshop', 'tabler-tool'],
  ['Other', '/events/category/other', 'tabler-calendar-event']
] as const

type Props = {
  eventLogoUrl?: string | null
  eventName?: string | null
}

type EventBrand = {
  logoUrl?: string | null
  name?: string | null
}

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    component={NextLink}
    href={href}
    underline='none'
    sx={{
      color: '#073d69',
      fontSize: 15,
      fontWeight: 650,
      width: 'fit-content',
      textShadow: '0 1px 0 rgba(255,255,255,.8)',
      transition: 'color .18s ease, transform .18s ease',
      '&:hover': { color: '#00a6a6', transform: 'translateX(3px)' }
    }}
  >
    {children}
  </Link>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Box>
    <Typography sx={{ color: '#073d69', fontWeight: 900, fontSize: 17, letterSpacing: '.01em' }}>
      {children}
    </Typography>
    <Box sx={{ width: 28, height: 3, bgcolor: '#06aaa3', mt: 1.1, borderRadius: 999 }} />
  </Box>
)

const SocialMark = ({ icon, label }: { icon: string; label: string }) => (
  <Box
    aria-label={label}
    title={label}
    sx={{
      width: 38,
      height: 38,
      display: 'grid',
      placeItems: 'center',
      borderRadius: '50%',
      bgcolor: '#07548a',
      color: '#fff',
      boxShadow: '0 7px 18px rgba(3,61,105,.18)'
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
          xs: 920,
          sm: 780,
          md: 680,
          lg: 'clamp(600px, 33.3vw, 710px)'
        },
        backgroundImage: 'url(/pertamina-event-footer-reference.webp)',
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
            xs: 'linear-gradient(180deg, rgba(221,244,255,.92) 0%, rgba(221,244,255,.72) 46%, rgba(221,244,255,.06) 72%, rgba(221,244,255,0) 100%)',
            md: 'radial-gradient(ellipse at 50% 28%, rgba(226,247,255,.72) 0%, rgba(226,247,255,.5) 38%, rgba(226,247,255,.12) 64%, rgba(226,247,255,0) 78%)'
          }
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1360,
          mx: 'auto',
          px: { xs: 3, sm: 4, md: 5, lg: 6 },
          pt: { xs: 5, md: 5.5, lg: 5 },
          pb: { xs: 28, sm: 24, md: 18, lg: 16 }
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: '1.3fr .72fr .9fr .75fr',
              lg: '1.28fr .7fr .82fr .72fr 1.02fr'
            },
            gap: { xs: 4, sm: 4.5, md: 0 },
            alignItems: 'start',
            px: { md: 2 },
            py: { md: 2.5 },
            borderRadius: { md: 4 },
            background: {
              xs: 'transparent',
              md: 'linear-gradient(90deg, rgba(225,247,255,.56), rgba(225,247,255,.28) 48%, rgba(225,247,255,.5))'
            },
            backdropFilter: { md: 'blur(1.5px)' }
          }}
        >
          <Box sx={{ pr: { md: 3.5, lg: 4.5 }, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minHeight: 64, flexWrap: 'wrap' }}>
              <Box
                component='img'
                src='/EO%20Navbar.png'
                alt='Pertamina Event'
                sx={{ width: 'auto', height: { xs: 44, md: 50, lg: 54 }, maxWidth: 210, objectFit: 'contain' }}
              />
              {resolvedLogoUrl && (
                <>
                  <Divider
                    orientation='vertical'
                    flexItem
                    sx={{ borderColor: 'rgba(7,61,105,.24)', minHeight: 52, display: { xs: 'none', sm: 'block' } }}
                  />
                  <Box
                    component='img'
                    src={resolvedLogoUrl}
                    alt={`${resolvedEventName || 'Event'} logo`}
                    sx={{
                      width: 'auto',
                      maxWidth: { xs: 150, md: 175 },
                      maxHeight: { xs: 52, md: 60 },
                      objectFit: 'contain',
                      objectPosition: 'left center',
                      filter: 'drop-shadow(0 4px 8px rgba(6,61,105,.08))'
                    }}
                  />
                </>
              )}
            </Box>

            <Typography sx={{ mt: 2.2, maxWidth: 330, color: '#0b456f', lineHeight: 1.65, fontSize: 15.25, fontWeight: 550 }}>
              Energizing every event, inspiring every moment. Together, we create experiences that connect people, ideas, and communities.
            </Typography>

            <Box sx={{ mt: 2.4, display: 'flex', alignItems: 'center', gap: 1.05 }}>
              <SocialMark icon='tabler-brand-instagram' label='Instagram' />
              <SocialMark icon='tabler-brand-youtube' label='YouTube' />
              <SocialMark icon='tabler-brand-tiktok' label='TikTok' />
              <SocialMark icon='tabler-brand-discord' label='Community' />
            </Box>
            <Typography sx={{ mt: 1.1, color: '#073d69', fontWeight: 850, fontSize: 14.5 }}>@pertaminaevent</Typography>
          </Box>

          <Box sx={{ pl: { md: 2.5, lg: 3 }, pr: { md: 2 }, borderLeft: { md: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>QUICK LINKS</SectionTitle>
            <Box sx={{ mt: 2, display: 'grid', gap: 1.15 }}>
              <FooterLink href='/home'>Home</FooterLink>
              <FooterLink href='/about'>About</FooterLink>
            </Box>
          </Box>

          <Box sx={{ pl: { md: 2.5, lg: 3 }, pr: { md: 2 }, borderLeft: { md: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>EVENT CATEGORY</SectionTitle>
            <Box sx={{ mt: 2, display: 'grid', gap: 1.15 }}>
              {categories.map(([label, href]) => (
                <FooterLink key={href} href={href}>{label}</FooterLink>
              ))}
            </Box>
          </Box>

          <Box sx={{ pl: { md: 2.5, lg: 3 }, pr: { md: 2 }, borderLeft: { md: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>INFORMATION</SectionTitle>
            <Box sx={{ mt: 2, display: 'grid', gap: 1.15 }}>
              <FooterLink href='/login'>Admin Login</FooterLink>
              <FooterLink href='/about'>Platform Overview</FooterLink>
            </Box>
          </Box>

          <Box
            sx={{
              display: { xs: 'block', md: 'none', lg: 'block' },
              pl: { lg: 3 },
              borderLeft: { lg: '1px solid rgba(7,61,105,.14)' }
            }}
          >
            <SectionTitle>DISCOVER EVENTS</SectionTitle>
            <Typography sx={{ mt: 2, color: '#0b456f', lineHeight: 1.55, maxWidth: 270, fontSize: 14.25 }}>
              Choose a category and discover the latest Pertamina experiences available for registration.
            </Typography>
            <Box sx={{ mt: 1.8, display: 'flex', flexWrap: 'wrap', gap: .8 }}>
              {categories.map(([label, href, icon]) => (
                <Button
                  key={`discover-${href}`}
                  component={NextLink}
                  href={href}
                  size='small'
                  variant='outlined'
                  startIcon={<i className={icon} />}
                  sx={{
                    color: '#073d69',
                    borderColor: 'rgba(7,61,105,.35)',
                    bgcolor: 'rgba(255,255,255,.48)',
                    backdropFilter: 'blur(4px)',
                    '&:hover': { borderColor: '#06aaa3', bgcolor: 'rgba(255,255,255,.7)' }
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Box>
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
          gap: 1.5,
          pointerEvents: 'none'
        }}
      >
        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: 12.5, md: 14 }, textShadow: '0 2px 6px rgba(0,25,70,.5)' }}>
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
