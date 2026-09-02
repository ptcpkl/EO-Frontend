'use client'

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'

import { getPublicEventBySlug } from '@/lib/api'
import PublicFooter from './PublicFooter'

const categories = [
  { label: 'Running', href: '/events/category/running', icon: 'tabler-run' },
  { label: 'Seminar', href: '/events/category/seminar', icon: 'tabler-microphone' },
  { label: 'Workshop', href: '/events/category/workshop', icon: 'tabler-tool' },
  { label: 'Other', href: '/events/category/other', icon: 'tabler-calendar-event' }
]

const PublicNavbar = () => {
  const [eventsAnchor, setEventsAnchor] = useState<HTMLElement | null>(null)
  const [mobileAnchor, setMobileAnchor] = useState<HTMLElement | null>(null)

  const openEvents = (event: MouseEvent<HTMLElement>) => setEventsAnchor(event.currentTarget)
  const openMobile = (event: MouseEvent<HTMLElement>) => setMobileAnchor(event.currentTarget)

  return (
    <Box component='header' sx={{ position: 'sticky', top: { xs: 10, md: 16 }, zIndex: theme => theme.zIndex.appBar, px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}>
      <Paper
        elevation={8}
        sx={{
          maxWidth: 1180,
          mx: 'auto',
          px: { xs: 2, md: 3 },
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(16px)'
        }}
      >
        <Box component={NextLink} href='/home' sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', minWidth: 0 }}>
          <Box component='img' src='/EO%20Navbar.png' alt='Pertamina Event' sx={{ height: { xs: 32, md: 38 }, width: 'auto', objectFit: 'contain' }} />
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
          <Button component={NextLink} href='/home' color='inherit' variant='text'>Home</Button>
          <Button color='inherit' variant='text' endIcon={<i className='tabler-chevron-down' />} onClick={openEvents}>Events</Button>
          <Button component={NextLink} href='/about' color='inherit' variant='text'>About</Button>
        </Box>

        <IconButton onClick={openMobile} sx={{ display: { xs: 'inline-flex', md: 'none' } }} aria-label='Open navigation'>
          <i className='tabler-menu-2' />
        </IconButton>
      </Paper>

      <Menu anchorEl={eventsAnchor} open={Boolean(eventsAnchor)} onClose={() => setEventsAnchor(null)}>
        {categories.map(category => (
          <MenuItem key={category.href} component={NextLink} href={category.href} onClick={() => setEventsAnchor(null)} sx={{ gap: 1.5, minWidth: 190 }}>
            <i className={category.icon} /> {category.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={mobileAnchor} open={Boolean(mobileAnchor)} onClose={() => setMobileAnchor(null)}>
        <MenuItem component={NextLink} href='/home' onClick={() => setMobileAnchor(null)} sx={{ gap: 1.5 }}><i className='tabler-home' /> Home</MenuItem>
        {categories.map(category => (
          <MenuItem key={category.href} component={NextLink} href={category.href} onClick={() => setMobileAnchor(null)} sx={{ gap: 1.5 }}>
            <i className={category.icon} /> {category.label}
          </MenuItem>
        ))}
        <MenuItem component={NextLink} href='/about' onClick={() => setMobileAnchor(null)} sx={{ gap: 1.5 }}><i className='tabler-info-circle' /> About</MenuItem>
      </Menu>
    </Box>
  )
}

const PublicSiteLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  const [eventBrand, setEventBrand] = useState<{ logoUrl?: string; name?: string }>({})

  const eventSlug = useMemo(() => {
    const match = pathname.match(/^\/events\/(?!category\/)([^/]+)/)
    return match?.[1] ? decodeURIComponent(match[1]) : null
  }, [pathname])

  useEffect(() => {
    let active = true

    if (!eventSlug) {
      setEventBrand({})
      return
    }

    getPublicEventBySlug(eventSlug)
      .then(event => {
        if (active) setEventBrand({ logoUrl: event.logoUrl, name: event.name })
      })
      .catch(() => {
        if (active) setEventBrand({})
      })

    return () => { active = false }
  }, [eventSlug])

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />
      <Box component='main' sx={{ flex: 1 }}>{children}</Box>
      <PublicFooter eventLogoUrl={eventBrand.logoUrl} eventName={eventBrand.name} />
    </Box>
  )
}

export default PublicSiteLayout
