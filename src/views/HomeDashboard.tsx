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
  <Box sx={{ color: 'text.primary' }}>
    <Box
      component='section'
      sx={theme => ({
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: '100dvh', sm: '82dvh', md: '86dvh' },
        display: 'grid',
        placeItems: 'center',
        px: { xs: 2, sm: 3 },
        pt: { xs: 14, sm: 15, md: 17 },
        pb: { xs: 10, sm: 11, md: 13 },
        backgroundImage: `linear-gradient(${alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.12 : 0.06)}, ${alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.12 : 0.06)}), url('${theme.palette.mode === 'dark' ? '/home-bg-dark.webp' : '/home-bg-light.webp'}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: theme.transitions.create(['background-color', 'color'], {
          duration: theme.transitions.duration.shorter
        })
      })}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 960,
          mx: 'auto',
          textAlign: 'center'
        }}
      >
        <Chip label='Pertamina Event' color='primary' variant='tonal' />

        <Typography
          component='h1'
          sx={{
            mt: { xs: 2.5, sm: 3 },
            color: 'text.primary',
            fontWeight: 800,
            fontSize: { xs: '2.4rem', sm: '3.4rem', md: '4.45rem', lg: '4.9rem' },
            lineHeight: { xs: 1.08, sm: 1.05 },
            letterSpacing: { xs: '-0.025em', md: '-0.04em' },
            textWrap: 'balance'
          }}
        >
          Welcome to Pertamina Event!
        </Typography>

        <Typography
          color='text.secondary'
          sx={{
            mt: { xs: 2, sm: 2.5, md: 3 },
            mx: 'auto',
            maxWidth: 720,
            fontWeight: 400,
            fontSize: { xs: '0.98rem', sm: '1.075rem', md: '1.16rem' },
            lineHeight: { xs: 1.65, md: 1.75 },
            px: { xs: 1, sm: 0 },
            textWrap: 'balance'
          }}
        >
          Discover experiences, learn something new, meet communities, and take part in events created for you.
        </Typography>

        <Box sx={{ mt: { xs: 4, sm: 4.5, md: 5 }, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
          <Button
            component={Link}
            href='/events/category/seminar'
            size='large'
            variant='contained'
            endIcon={<i className='tabler-arrow-right' />}
            sx={{ minWidth: { xs: 'min(100%, 210px)', sm: 200 } }}
          >
            Explore Events
          </Button>
          <Button
            component={Link}
            href='/about'
            size='large'
            variant='outlined'
            sx={{ minWidth: { xs: 'min(100%, 210px)', sm: 220 }, bgcolor: 'background.paper' }}
          >
            About Pertamina Event
          </Button>
        </Box>

        <Box
          sx={{
            mt: { xs: 5, sm: 6, md: 7 },
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 2, sm: 3.5, md: 7 },
            flexWrap: 'wrap',
            color: 'text.secondary'
          }}
        >
          {[
            ['tabler-calendar-event', 'Curated events'],
            ['tabler-ticket', 'Easy registration'],
            ['tabler-mail-check', 'Ticket delivered by email']
          ].map(([icon, label]) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className={icon} />
              <Typography
                color='inherit'
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.93rem' }, lineHeight: 1.4 }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>

    <Box
      id='event-categories'
      component='section'
      sx={theme => ({
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 2, sm: 3 },
        py: { xs: 8, sm: 9, md: 11 },
        backgroundImage: `linear-gradient(${alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.08 : 0.04)}, ${alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.08 : 0.04)}), url('${theme.palette.mode === 'dark' ? '/category-bg-dark.webp' : '/category-bg-light.webp'}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      })}
    >
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1180, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5, md: 6 } }}>
          <Typography
            component='h2'
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.4rem', md: '2.75rem' },
              lineHeight: 1.15,
              textWrap: 'balance'
            }}
          >
            Explore by category
          </Typography>
          <Typography
            color='text.secondary'
            sx={{
              mt: 1.5,
              mx: 'auto',
              maxWidth: 720,
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.06rem' },
              lineHeight: 1.7,
              px: { xs: 1, sm: 0 }
            }}
          >
            Published events live inside the category selected by the event organizer.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
          {publicCategories.map(category => (
            <Card
              key={category.href}
              sx={theme => ({
                height: '100%',
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.9 : 0.92),
                border: '1px solid',
                borderColor: 'divider',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: theme.shadows[4],
                transition: theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
                  duration: theme.transitions.duration.shorter
                }),
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              })}
            >
              <CardContent
                sx={{
                  height: '100%',
                  p: { xs: 2.75, sm: 3.25, md: 3.5 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, md: 52 },
                    height: { xs: 48, md: 52 },
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'primary.main'
                  }}
                >
                  <i className={`${category.icon} text-2xl`} />
                </Box>

                <Typography
                  color='text.primary'
                  sx={{ mt: 2.5, fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.22rem', md: '1.28rem' } }}
                >
                  {category.label}
                </Typography>

                <Typography
                  color='text.secondary'
                  sx={{
                    mt: 1,
                    mb: 3,
                    fontSize: { xs: '0.88rem', sm: '0.91rem', md: '0.94rem' },
                    lineHeight: 1.7
                  }}
                >
                  {category.description}
                </Typography>

                <Button
                  component={Link}
                  href={category.href}
                  variant='text'
                  endIcon={<i className='tabler-arrow-right' />}
                  sx={{ mt: 'auto', px: 0 }}
                >
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
