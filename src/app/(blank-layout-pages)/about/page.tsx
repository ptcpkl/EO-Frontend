import Link from 'next/link'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

const categories = [
  { label: 'Running', icon: 'tabler-run', href: '/events/category/running' },
  { label: 'Seminar', icon: 'tabler-microphone', href: '/events/category/seminar' },
  { label: 'Workshop', icon: 'tabler-tool', href: '/events/category/workshop' },
  { label: 'Other', icon: 'tabler-calendar-event', href: '/events/category/other' }
]

const AboutPage = () => (
  <Box sx={{ px: 3, py: { xs: 7, md: 10 } }}>
    <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
      <Box sx={{ maxWidth: 760 }}>
        <Chip label='About' color='primary' variant='tonal' size='small' />
        <Typography variant='h2' fontWeight={800} sx={{ mt: 2, lineHeight: 1.08 }}>
          Pertamina Event
        </Typography>
        <Typography variant='h6' color='text.secondary' fontWeight={400} sx={{ mt: 2, lineHeight: 1.75 }}>
          A single place to discover Pertamina events, explore event information, choose registration packages, and complete registration securely.
        </Typography>
      </Box>

      <Box sx={{ mt: { xs: 6, md: 8 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {[
          ['tabler-calendar-event', 'Discover Events', 'Browse published activities based on the event category that interests you.'],
          ['tabler-ticket', 'Register Easily', 'Choose an available package and complete registration using the event-specific form.'],
          ['tabler-shield-check', 'Secure Flow', 'Paid packages continue through secure payment, while free packages register without a payment gateway.']
        ].map(([icon, title, description]) => (
          <Card key={title} variant='outlined'>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: 'action.hover', color: 'primary.main' }}>
                <i className={`${icon} text-2xl`} />
              </Box>
              <Typography variant='h6' fontWeight={700} sx={{ mt: 3 }}>{title}</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1, lineHeight: 1.75 }}>{description}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ mt: { xs: 8, md: 10 } }}>
        <Typography variant='h4' fontWeight={700}>Explore event categories</Typography>
        <Typography color='text.secondary' sx={{ mt: 1 }}>Published events are organized by category so they are easier to find.</Typography>
        <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
          {categories.map(category => (
            <Card key={category.href} variant='outlined'>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: 'action.hover', color: 'primary.main' }}><i className={category.icon} /></Box>
                  <Typography fontWeight={700}>{category.label}</Typography>
                </Box>
                <Button component={Link} href={category.href} variant='text' endIcon={<i className='tabler-arrow-right' />} sx={{ mt: 2, px: 0 }}>
                  View Events
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
)

export default AboutPage
