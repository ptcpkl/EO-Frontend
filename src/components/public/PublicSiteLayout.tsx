'use client'

import { useState, type MouseEvent, type ReactNode } from 'react'
import NextLink from 'next/link'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

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
    <Box component='header' sx={{ position: 'sticky', top: { xs: 20, md: 16 }, zIndex: theme => theme.zIndex.appBar, px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}>
      <Paper
        elevation={8}
        sx={{
          maxWidth: 1180,
          mx: 'auto',
          px: { xs: 5, md: 8 },
          py: 3.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 7,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(16px)'
        }}
      >
        <Box component={NextLink} href='/home' sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'text.primary', minWidth: 0 }}>
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
            <i className={category.icon} />
            {category.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={mobileAnchor} open={Boolean(mobileAnchor)} onClose={() => setMobileAnchor(null)}>
        <MenuItem component={NextLink} href='/home' onClick={() => setMobileAnchor(null)} sx={{ gap: 1.5 }}>
          <i className='tabler-home' /> Home
        </MenuItem>
        {categories.map(category => (
          <MenuItem key={category.href} component={NextLink} href={category.href} onClick={() => setMobileAnchor(null)} sx={{ gap: 1.5 }}>
            <i className={category.icon} /> {category.label}
          </MenuItem>
        ))}
        <MenuItem component={NextLink} href='/about' onClick={() => setMobileAnchor(null)} sx={{ gap: 1.5 }}>
          <i className='tabler-info-circle' /> About
        </MenuItem>
      </Menu>
    </Box>
  )
}

const PublicSiteLayout = ({ children }: { children: ReactNode }) => (
  <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
    <PublicNavbar />
    <Box component='main'>{children}</Box>
    <Box component='footer' sx={{ px: 3, py: 5 }}>
      <Box sx={{ maxWidth: 1180, mx: 'auto', pt: 4, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant='body2' color='text.secondary'>Pertamina Event</Typography>
        <Typography variant='body2' color='text.secondary'>Event registration & information platform</Typography>
      </Box>
    </Box>
  </Box>
)

export default PublicSiteLayout
