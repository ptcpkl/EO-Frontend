'use client'

import { useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

import { getPublicEventBySlug, type PublicEvent } from '@/lib/api'

const categories = [
  { label: 'Running', href: '/events/category/running' },
  { label: 'Seminar', href: '/events/category/seminar' },
  { label: 'Workshop', href: '/events/category/workshop' },
  { label: 'Other', href: '/events/category/other' }
]

const resolveEventSlug = (pathname: string) => {
  const match = pathname.match(/^\/events\/([^/]+)/)
  const value = match?.[1]

  if (!value || value === 'category') return null

  return decodeURIComponent(value)
}

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    component={NextLink}
    href={href}
    underline='none'
    color='text.primary'
    sx={{ display: 'inline-flex', width: 'fit-content', fontWeight: 500, '&:hover': { color: 'primary.main' } }}
  >
    {children}
  </Link>
)

const PublicFooter = () => {
  const pathname = usePathname()
  const eventSlug = useMemo(() => resolveEventSlug(pathname), [pathname])
  const [event, setEvent] = useState<PublicEvent | null>(null)

  useEffect(() => {
    let active = true

    if (!eventSlug) {
      setEvent(null)
      return () => {
        active = false
      }
    }

    void getPublicEventBySlug(eventSlug)
      .then(result => {
        if (active) setEvent(result)
      })
      .catch(() => {
        if (active) setEvent(null)
      })

    return () => {
      active = false
    }
  }, [eventSlug])

  const legacyFfws = Boolean(event?.name.toLowerCase().includes('ffws'))
  const eventLogoUrl = event?.logoUrl ?? (legacyFfws ? '/logoo.png' : undefined)

  return (
    <Box
      component='footer'
      sx={theme => ({
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden',
        borderTop: '1px solid',
        borderColor: 'divider',
        background: `radial-gradient(circle at 8% 16%, ${alpha(theme.palette.info.light, 0.2)}, transparent 28%), radial-gradient(circle at 92% 20%, ${alpha(theme.palette.primary.light, 0.16)}, transparent 30%), ${theme.palette.background.paper}`
      })}
    >
      <Box aria-hidden='true' sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', color: 'primary.main', opacity: 0.12 }}>
        <i className='tabler-microphone-2' style={{ position: 'absolute', left: '3%', top: '14%', fontSize: 68, transform: 'rotate(-18deg)' }} />
        <i className='tabler-parachute' style={{ position: 'absolute', right: '10%', top: '7%', fontSize: 62 }} />
        <i className='tabler-run' style={{ position: 'absolute', left: '7%', bottom: '20%', fontSize: 72 }} />
        <i className='tabler-device-gamepad-2' style={{ position: 'absolute', right: '8%', bottom: '18%', fontSize: 68, transform: 'rotate(10deg)' }} />
      </Box>

      <Box sx={{ position: 'relative', width: '100%', maxWidth: 1180, mx: 'auto', px: 3, py: { xs: 7, md: 9 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.25fr 0.75fr 0.75fr' }, gap: { xs: 5, md: 8 }, alignItems: 'start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, minHeight: 66, flexWrap: 'wrap' }}>
              <Box component='img' src='/EO%20Navbar.png' alt='Pertamina Event' sx={{ height: { xs: 44, md: 54 }, width: 'auto', maxWidth: 230, objectFit: 'contain' }} />
              {eventLogoUrl && (
                <>
                  <Divider orientation='vertical' flexItem sx={{ minHeight: 54 }} />
                  <Box component='img' src={eventLogoUrl} alt={`${event?.name ?? 'Event'} logo`} sx={{ height: { xs: 54, md: 66 }, width: 'auto', maxWidth: 220, objectFit: 'contain' }} />
                </>
              )}
            </Box>

            <Typography variant='body1' color='text.secondary' sx={{ mt: 3, lineHeight: 1.8, maxWidth: 420 }}>
              Energizing every event and inspiring every moment. Discover experiences, communities, and activities through Pertamina Event.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.75 }}>
            <Typography variant='h6' fontWeight={700}>Quick Links</Typography>
            <Box sx={{ width: 34, height: 3, borderRadius: 3, bgcolor: 'primary.main', mb: 1 }} />
            <FooterLink href='/home'>Home</FooterLink>
            <FooterLink href='/about'>About</FooterLink>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.75 }}>
            <Typography variant='h6' fontWeight={700}>Event Category</Typography>
            <Box sx={{ width: 34, height: 3, borderRadius: 3, bgcolor: 'primary.main', mb: 1 }} />
            {categories.map(category => <FooterLink key={category.href} href={category.href}>{category.label}</FooterLink>)}
          </Box>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', bgcolor: 'primary.dark', color: 'primary.contrastText', py: 2.5, px: 3 }}>
        <Typography variant='body2' color='inherit' textAlign='center'>
          © 2026 PT Pertamina (Persero). All rights reserved.
        </Typography>
      </Box>
    </Box>
  )
}

export default PublicFooter
