'use client'

import NextLink from 'next/link'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

const categories = [
  ['Running', '/events/category/running'],
  ['Seminar', '/events/category/seminar'],
  ['Workshop', '/events/category/workshop'],
  ['Other', '/events/category/other']
] as const

type Props = {
  eventLogoUrl?: string | null
  eventName?: string | null
}

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link component={NextLink} href={href} color='text.primary' underline='hover' variant='body2'>
    {children}
  </Link>
)

const PublicFooter = ({ eventLogoUrl, eventName }: Props) => (
  <Box component='footer' sx={{ mt: 'auto', bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ maxWidth: 1180, mx: 'auto', px: 3, py: { xs: 6, md: 8 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.3fr 0.7fr 0.9fr' }, gap: { xs: 5, md: 8 } }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box component='img' src='/EO%20Navbar.png' alt='Pertamina Event' sx={{ height: 44, width: 'auto', objectFit: 'contain' }} />
            {eventLogoUrl && (
              <>
                <Divider orientation='vertical' flexItem />
                <Box component='img' src={eventLogoUrl} alt={`${eventName || 'Event'} logo`} sx={{ maxHeight: 54, maxWidth: 160, width: 'auto', objectFit: 'contain' }} />
              </>
            )}
          </Box>
          <Typography color='text.secondary' sx={{ mt: 3, maxWidth: 360, lineHeight: 1.8 }}>
            Energizing every event, inspiring every moment. Discover Pertamina events, choose your experience, and register from one place.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', alignContent: 'start', gap: 1.5 }}>
          <Typography fontWeight={700}>Quick Links</Typography>
          <FooterLink href='/home'>Home</FooterLink>
          <FooterLink href='/about'>About</FooterLink>
        </Box>

        <Box sx={{ display: 'grid', alignContent: 'start', gap: 1.5 }}>
          <Typography fontWeight={700}>Event Categories</Typography>
          {categories.map(([label, href]) => <FooterLink key={href} href={href}>{label}</FooterLink>)}
        </Box>
      </Box>
    </Box>

    <Box sx={{ bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ maxWidth: 1180, mx: 'auto', px: 3, py: 2.5 }}>
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          © {new Date().getFullYear()} PT Pertamina (Persero). All rights reserved.
        </Typography>
      </Box>
    </Box>
  </Box>
)

export default PublicFooter
