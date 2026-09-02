'use client'

import Link from 'next/link'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

type Props = {
  publicView?: boolean
}

const publicCategories = [
  {
    label: 'Running',
    description: 'Race, fun run, and active community events.',
    icon: 'tabler-run',
    href: '/events/category/running'
  },
  {
    label: 'Seminar',
    description: 'Talks, learning sessions, and knowledge-sharing events.',
    icon: 'tabler-microphone',
    href: '/events/category/seminar'
  },
  {
    label: 'Workshop',
    description: 'Hands-on sessions designed for practical learning.',
    icon: 'tabler-tool',
    href: '/events/category/workshop'
  },
  {
    label: 'Other',
    description: 'Discover other Pertamina events and special programs.',
    icon: 'tabler-calendar-event',
    href: '/events/category/other'
  }
]

const PublicEventHome = () => (
  <Box>
    <Box
      sx={theme => ({
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: '72dvh', md: '78dvh' },
        display: 'grid',
        placeItems: 'center',
        px: 3,
        py: { xs: 10, md: 14 },
        '&::before': {
          content: '""',
          position: 'absolute',
          width: { xs: 260, md: 460 },
          height: { xs: 260, md: 460 },
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          insetInlineStart: { xs: -150, md: -180 },
          insetBlockStart: { xs: 20, md: 30 },
          filter: 'blur(8px)'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: { xs: 220, md: 380 },
          height: { xs: 220, md: 380 },
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.info.main, 0.08),
          insetInlineEnd: { xs: -130, md: -120 },
          insetBlockEnd: { xs: 20, md: 40 },
          filter: 'blur(10px)'
        }
      })}
    >
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 900, mx: 'auto', textAlign: 'center' }}>
        <Chip label='Pertamina Event' color='primary' variant='tonal' />
        <Typography
          component='h1'
          sx={{
            mt: 3,
            fontWeight: 800,
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
            lineHeight: 1.05,
            letterSpacing: '-0.04em'
          }}
        >
          Welcome to Pertamina Event!
        </Typography>
        <Typography variant='h6' color='text.secondary' sx={{ mt: 3, mx: 'auto', maxWidth: 700, fontWeight: 400, lineHeight: 1.7 }}>
          Discover experiences, learn something new, meet communities, and take part in events created for you.
        </Typography>

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Button component={Link} href='/events/category/seminar' size='large' variant='contained' endIcon={<i className='tabler-arrow-right' />}>
            Explore Events
          </Button>
          <Button component={Link} href='/about' size='large' variant='outlined'>
            About Pertamina Event
          </Button>
        </Box>

        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: { xs: 3, md: 7 }, flexWrap: 'wrap', color: 'text.secondary' }}>
          {[
            ['tabler-calendar-event', 'Curated events'],
            ['tabler-ticket', 'Easy registration'],
            ['tabler-mail-check', 'Ticket delivered by email']
          ].map(([icon, label]) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className={icon} />
              <Typography variant='body2' color='inherit'>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>

    <Box sx={{ px: 3, pb: { xs: 8, md: 12 } }}>
      <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant='h3' fontWeight={700}>Explore by category</Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1.5 }}>
            Published events live inside the category selected by the event organizer.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
          {publicCategories.map(category => (
            <Card key={category.href} sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: 'action.hover', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
                  <i className={`${category.icon} text-2xl`} />
                </Box>
                <Typography variant='h5' fontWeight={700} sx={{ mt: 3 }}>{category.label}</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1, mb: 3, lineHeight: 1.7 }}>{category.description}</Typography>
                <Button component={Link} href={category.href} variant='text' endIcon={<i className='tabler-arrow-right' />} sx={{ mt: 'auto', px: 0 }}>
                  View {category.label}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
)

const HomeDashboard = ({ publicView = false }: Props) => {
  if (publicView) return <PublicEventHome />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box>
        <Typography variant='h4' fontWeight={700}>Welcome back, Admin 👋</Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
          Manage your events, participants, and registrations from one place.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 4 }}>
        {[
          ['tabler-calendar-event', 'Event Management', 'Create, edit, publish, and manage your events.', 'Manage Events'],
          ['tabler-users', 'Registration Management', 'View participants, registration status, and imported registrations.', 'View Registrations'],
          ['tabler-package', 'Event Packages', 'Configure package names, prices, benefits, and availability for each event.', 'Manage Packages']
        ].map(([icon, title, description, label]) => (
          <Card key={title}>
            <CardContent>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', mb: 3 }}>
                <i className={`${icon} text-2xl`} />
              </Box>
              <Typography variant='h6' fontWeight={600}>{title}</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1, minHeight: 42 }}>{description}</Typography>
              <Button component={Link} href='/admin/events' variant='outlined' sx={{ mt: 3 }}>{label}</Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent>
          <Typography variant='h6' fontWeight={600}>Event Operations</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            Start by creating an event, configure its registration packages, and then manage participants.
          </Typography>
          <Divider sx={{ my: 4 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button component={Link} href='/admin/events/create' variant='contained' startIcon={<i className='tabler-calendar-plus' />}>
              Create Event
            </Button>
            <Button component={Link} href='/about' variant='outlined' startIcon={<i className='tabler-info-circle' />}>
              About
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default HomeDashboard
