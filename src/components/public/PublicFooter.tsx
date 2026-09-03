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
      fontWeight: 600,
      width: 'fit-content',
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
    <Box sx={{ width: 28, height: 3, bgcolor: '#06aaa3', mt: 1.25, borderRadius: 999 }} />
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
      boxShadow: '0 6px 14px rgba(3, 61, 105, .16)'
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
        minHeight: { xs: 920, sm: 760, lg: 'clamp(560px, 38vw, 700px)' },
        backgroundImage: 'url(/pertamina-event-footer-final.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center bottom',
        backgroundSize: { xs: 'auto 100%', sm: 'auto 100%', lg: '100% auto' }
      }}
    >
      <Box
        aria-hidden='true'
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: {
            xs: 'linear-gradient(180deg, rgba(225,247,255,.94) 0%, rgba(220,244,255,.9) 54%, rgba(216,241,255,.36) 70%, rgba(216,241,255,0) 83%)',
            lg: 'linear-gradient(180deg, rgba(225,247,255,.94) 0%, rgba(220,244,255,.82) 39%, rgba(216,241,255,.22) 59%, rgba(216,241,255,0) 72%)'
          }
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 3, sm: 4, md: 5 },
          pt: { xs: 6, md: 7 },
          pb: { xs: 34, sm: 30, lg: 28 }
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: '1.25fr .72fr .9fr .75fr 1.05fr'
            },
            gap: { xs: 4.5, sm: 5, lg: 0 },
            alignItems: 'start'
          }}
        >
          <Box sx={{ pr: { lg: 5 }, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25, minHeight: 66, flexWrap: 'wrap' }}>
              <Box
                component='img'
                src='/EO%20Navbar.png'
                alt='Pertamina Event'
                sx={{ width: 'auto', height: { xs: 46, md: 55 }, maxWidth: 220, objectFit: 'contain' }}
              />
              {resolvedLogoUrl && (
                <>
                  <Divider
                    orientation='vertical'
                    flexItem
                    sx={{ borderColor: 'rgba(7,61,105,.28)', minHeight: 54, display: { xs: 'none', sm: 'block' } }}
                  />
                  <Box
                    component='img'
                    src={resolvedLogoUrl}
                    alt={`${resolvedEventName || 'Event'} logo`}
                    sx={{
                      width: 'auto',
                      maxWidth: { xs: 165, md: 195 },
                      maxHeight: { xs: 54, md: 66 },
                      objectFit: 'contain',
                      objectPosition: 'left center',
                      filter: 'drop-shadow(0 4px 8px rgba(6,61,105,.08))'
                    }}
                  />
                </>
              )}
            </Box>

            <Typography sx={{ mt: 2.5, maxWidth: 345, color: '#0b456f', lineHeight: 1.7, fontSize: 15.5, fontWeight: 500 }}>
              Energizing every event, inspiring every moment. Together, we create experiences that connect people, ideas, and communities.
            </Typography>

            <Box sx={{ mt: 2.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <SocialMark icon='tabler-brand-instagram' label='Instagram' />
              <SocialMark icon='tabler-brand-youtube' label='YouTube' />
              <SocialMark icon='tabler-brand-tiktok' label='TikTok' />
              <SocialMark icon='tabler-brand-discord' label='Community' />
            </Box>
            <Typography sx={{ mt: 1.25, color: '#073d69', fontWeight: 800, fontSize: 14.5 }}>@pertaminaevent</Typography>
          </Box>

          <Box sx={{ pl: { lg: 3 }, pr: { lg: 3 }, borderLeft: { lg: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>QUICK LINKS</SectionTitle>
            <Box sx={{ mt: 2.25, display: 'grid', gap: 1.35 }}>
              <FooterLink href='/home'>Home</FooterLink>
              <FooterLink href='/about'>About</FooterLink>
            </Box>
          </Box>

          <Box sx={{ pl: { lg: 3 }, pr: { lg: 3 }, borderLeft: { lg: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>EVENT CATEGORY</SectionTitle>
            <Box sx={{ mt: 2.25, display: 'grid', gap: 1.35 }}>
              {categories.map(([label, href]) => (
                <FooterLink key={href} href={href}>{label}</FooterLink>
              ))}
            </Box>
          </Box>

          <Box sx={{ pl: { lg: 3 }, pr: { lg: 3 }, borderLeft: { lg: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>INFORMATION</SectionTitle>
            <Box sx={{ mt: 2.25, display: 'grid', gap: 1.35 }}>
              <FooterLink href='/login'>Admin Login</FooterLink>
              <FooterLink href='/about'>Platform Overview</FooterLink>
            </Box>
          </Box>

          <Box sx={{ pl: { lg: 3 }, borderLeft: { lg: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>DISCOVER EVENTS</SectionTitle>
            <Typography sx={{ mt: 2.25, color: '#0b456f', lineHeight: 1.65, maxWidth: 280, fontSize: 14.5 }}>
              Choose a category and discover the latest Pertamina experiences available for registration.
            </Typography>
            <Box sx={{ mt: 2.25, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                    bgcolor: 'rgba(255,255,255,.36)',
                    backdropFilter: 'blur(5px)',
                    '&:hover': { borderColor: '#06aaa3', bgcolor: 'rgba(255,255,255,.62)' }
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default PublicFooter
