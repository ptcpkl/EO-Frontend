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
    <Box sx={{ width: 30, height: 3, bgcolor: '#06aaa3', mt: 1.25, borderRadius: 999 }} />
  </Box>
)

const SocialMark = ({ icon, label }: { icon: string; label: string }) => (
  <Box
    aria-label={label}
    title={label}
    sx={{
      width: 39,
      height: 39,
      display: 'grid',
      placeItems: 'center',
      borderRadius: '50%',
      bgcolor: '#07548a',
      color: '#fff',
      boxShadow: '0 6px 14px rgba(3, 61, 105, .18)',
      transition: 'transform .18s ease, background-color .18s ease',
      '&:hover': { transform: 'translateY(-2px)', bgcolor: '#006f9d' }
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
        isolation: 'isolate',
        bgcolor: '#ccecff',
        minHeight: { xs: 760, sm: 680, lg: 620 }
      }}
    >
      <Box
        component='img'
        src='/pertamina-event-footer-final.svg'
        alt=''
        aria-hidden='true'
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center bottom',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: -3
        }}
      />

      <Box
        aria-hidden='true'
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -2,
          background: {
            xs: 'linear-gradient(180deg, rgba(222,246,255,.96) 0%, rgba(214,242,255,.9) 56%, rgba(214,242,255,.38) 72%, rgba(0,48,94,0) 88%)',
            md: 'linear-gradient(180deg, rgba(222,246,255,.86) 0%, rgba(214,242,255,.76) 51%, rgba(214,242,255,.26) 70%, rgba(0,48,94,0) 86%)'
          }
        }}
      />

      <Box
        sx={{
          position: 'relative',
          maxWidth: 1360,
          mx: 'auto',
          px: { xs: 3, sm: 4, md: 5 },
          pt: { xs: 7, md: 9 },
          pb: { xs: 28, sm: 25, md: 23 }
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
            gap: { xs: 5, sm: 5, lg: 0 },
            alignItems: 'start'
          }}
        >
          <Box sx={{ pr: { lg: 5 }, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25, minHeight: 76, flexWrap: 'wrap' }}>
              <Box
                component='img'
                src='/EO%20Navbar.png'
                alt='Pertamina Event'
                sx={{ width: 'auto', height: { xs: 48, md: 58 }, maxWidth: 230, objectFit: 'contain' }}
              />
              {resolvedLogoUrl && (
                <>
                  <Divider
                    orientation='vertical'
                    flexItem
                    sx={{ borderColor: 'rgba(7,61,105,.28)', minHeight: 58, display: { xs: 'none', sm: 'block' } }}
                  />
                  <Box
                    component='img'
                    src={resolvedLogoUrl}
                    alt={`${resolvedEventName || 'Event'} logo`}
                    sx={{
                      width: 'auto',
                      maxWidth: { xs: 170, md: 205 },
                      maxHeight: { xs: 58, md: 72 },
                      objectFit: 'contain',
                      objectPosition: 'left center',
                      filter: 'drop-shadow(0 4px 8px rgba(6,61,105,.08))'
                    }}
                  />
                </>
              )}
            </Box>

            <Typography sx={{ mt: 3, maxWidth: 350, color: '#0b456f', lineHeight: 1.75, fontSize: 16, fontWeight: 500 }}>
              Energizing every event, inspiring every moment. Together, we create experiences that connect people, ideas, and communities.
            </Typography>

            <Box sx={{ mt: 3.25, display: 'flex', alignItems: 'center', gap: 1.4 }}>
              <SocialMark icon='tabler-brand-instagram' label='Instagram' />
              <SocialMark icon='tabler-brand-youtube' label='YouTube' />
              <SocialMark icon='tabler-brand-tiktok' label='TikTok' />
              <SocialMark icon='tabler-brand-discord' label='Community' />
            </Box>
            <Typography sx={{ mt: 1.5, color: '#073d69', fontWeight: 800, fontSize: 15 }}>@pertaminaevent</Typography>
          </Box>

          <Box sx={{ pl: { lg: 4 }, pr: { lg: 3 }, borderLeft: { lg: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>QUICK LINKS</SectionTitle>
            <Box sx={{ mt: 2.5, display: 'grid', gap: 1.5 }}>
              <FooterLink href='/home'>Home</FooterLink>
              <FooterLink href='/about'>About</FooterLink>
            </Box>
          </Box>

          <Box sx={{ pl: { lg: 4 }, pr: { lg: 3 }, borderLeft: { lg: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>EVENT CATEGORY</SectionTitle>
            <Box sx={{ mt: 2.5, display: 'grid', gap: 1.5 }}>
              {categories.map(([label, href]) => (
                <FooterLink key={href} href={href}>{label}</FooterLink>
              ))}
            </Box>
          </Box>

          <Box sx={{ pl: { lg: 4 }, pr: { lg: 3 }, borderLeft: { lg: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>INFORMATION</SectionTitle>
            <Box sx={{ mt: 2.5, display: 'grid', gap: 1.5 }}>
              <FooterLink href='/login'>Admin Login</FooterLink>
              <FooterLink href='/about'>Platform Overview</FooterLink>
            </Box>
          </Box>

          <Box sx={{ pl: { lg: 4 }, borderLeft: { lg: '1px solid rgba(7,61,105,.14)' } }}>
            <SectionTitle>DISCOVER EVENTS</SectionTitle>
            <Typography sx={{ mt: 2.5, color: '#0b456f', lineHeight: 1.7, maxWidth: 280, fontSize: 15 }}>
              Choose a category and discover the latest Pertamina experiences available for registration.
            </Typography>
            <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                    bgcolor: 'rgba(255,255,255,.38)',
                    backdropFilter: 'blur(6px)',
                    '&:hover': { borderColor: '#06aaa3', bgcolor: 'rgba(255,255,255,.6)' }
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
