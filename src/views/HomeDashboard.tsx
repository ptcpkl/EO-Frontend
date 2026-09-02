'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import { getPublicEvents, type PublicEvent } from '@/lib/api'

type Props = {
  publicView?: boolean
}

const formatEventDate = (value?: string) => {
  if (!value) return 'Date to be announced'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const formatPrice = (value?: number) => {
  if (typeof value !== 'number') return 'Price available on registration'
  if (value === 0) return 'Free'

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)
}

const PublicEventHome = () => {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError('')
      setEvents(await getPublicEvents())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load published events.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', py: { xs: 6, md: 10 }, px: 3 }}>
      <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
        <Box sx={{ mb: 6 }}>
          <Chip label='PTC Event' color='primary' variant='tonal' size='small' />
          <Typography variant='h3' fontWeight={700} sx={{ mt: 2 }}>
            Upcoming Events
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1, maxWidth: 680 }}>
            Browse published events and register using the available event packages.
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 12 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Alert severity='error' action={<Button color='inherit' onClick={() => void loadEvents()}>Retry</Button>}>
            {error}
          </Alert>
        )}

        {!loading && !error && events.length === 0 && (
          <Card>
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 2,
                  bgcolor: 'action.hover'
                }}
              >
                <i className='tabler-calendar-off text-3xl' />
              </Box>
              <Typography variant='h5' fontWeight={600} sx={{ mt: 3 }}>
                No published events yet
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                Published events will appear here automatically.
              </Typography>
            </CardContent>
          </Card>
        )}

        {!loading && !error && events.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
              gap: 4
            }}
          >
            {events.map(event => (
              <Card key={event.id} sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                    <Box>
                      <Typography variant='h5' fontWeight={700}>
                        {event.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75 }}>
                        {event.description || 'Event registration is available.'}
                      </Typography>
                    </Box>
                    {event.type && <Chip label={event.type} color='primary' variant='tonal' size='small' />}
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <i className='tabler-calendar-event' />
                      <Typography variant='body2'>{formatEventDate(event.startDate)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <i className='tabler-map-pin' />
                      <Typography variant='body2'>{event.location || 'Location to be announced'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <i className='tabler-ticket' />
                      <Typography variant='body2'>{formatPrice(event.price)}</Typography>
                    </Box>
                    {typeof event.remainingQuota === 'number' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <i className='tabler-users' />
                        <Typography variant='body2'>{event.remainingQuota.toLocaleString('id-ID')} seats remaining</Typography>
                      </Box>
                    )}
                  </Box>

                  <Button
                    component={Link}
                    href={`/events/${encodeURIComponent(event.slug)}/register`}
                    variant='contained'
                    startIcon={<i className='tabler-ticket' />}
                    sx={{ mt: 'auto' }}
                  >
                    Register
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

const HomeDashboard = ({ publicView = false }: Props) => {
  if (publicView) return <PublicEventHome />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box>
        <Typography variant='h4' fontWeight={700}>
          Welcome back, Admin 👋
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
          Manage your events, participants, and registrations from one place.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 4
        }}
      >
        {[
          ['tabler-calendar-event', 'Event Management', 'Create, edit, publish, and manage your events.', 'Manage Events'],
          ['tabler-users', 'Registration Management', 'View participants, registration status, and imported registrations.', 'View Registrations'],
          ['tabler-package', 'Event Packages', 'Configure package names, prices, benefits, and availability for each event.', 'Manage Packages']
        ].map(([icon, title, description, label]) => (
          <Card key={title}>
            <CardContent>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  mb: 3
                }}
              >
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
