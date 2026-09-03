'use client'

import { useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

import { getPublicEvents, type PublicEvent } from '@/lib/api'

const categoryMap = {
  running: {
    backend: 'Running',
    title: 'Running Events',
    icon: 'tabler-run',
    background: '/runn.png',
    description: 'Find races, fun runs, and active community experiences.'
  },
  seminar: {
    backend: 'Seminar',
    title: 'Seminar Events',
    icon: 'tabler-microphone',
    background: '/seminar.png',
    description: 'Explore talks, learning sessions, and knowledge-sharing events.'
  },
  workshop: {
    backend: 'Workshop',
    title: 'Workshop Events',
    icon: 'tabler-tool',
    background: '/workshop.png',
    description: 'Join practical workshops and hands-on learning sessions.'
  },
  other: {
    backend: 'Other',
    title: 'Other Events',
    icon: 'tabler-calendar-event',
    background: '/others.png',
    description: 'Discover special programs and other Pertamina Event experiences.'
  }
} as const

type CategoryKey = keyof typeof categoryMap

const formatDate = (value?: string) => {
  if (!value) return 'Date to be announced'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

const formatPrice = (value?: number) => {
  if (typeof value !== 'number' || value === 0) return 'Free'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

const EventCard = ({ event }: { event: PublicEvent }) => (
  <Card
    sx={theme => ({
      height: '100%',
      overflow: 'hidden',
      bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.9 : 0.94),
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid',
      borderColor: alpha(theme.palette.divider, 0.8),
      boxShadow: theme.shadows[4]
    })}
  >
    {event.heroImageUrl ? (
      <Box component='img' src={event.heroImageUrl} alt={event.name} sx={{ width: '100%', height: 210, objectFit: 'cover', display: 'block' }} />
    ) : (
      <Box sx={{ height: 150, bgcolor: 'action.hover', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
        <i className='tabler-photo text-4xl' />
      </Box>
    )}

    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: event.heroImageUrl ? 'calc(100% - 210px)' : 'calc(100% - 150px)' }}>
      <Box>
        <Chip label={event.type ?? 'Event'} color='primary' variant='tonal' size='small' />
        <Typography variant='h5' fontWeight={700} sx={{ mt: 2 }}>{event.name}</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1, lineHeight: 1.7 }}>
          {event.description || event.about || 'Event information is available on the event page.'}
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}><i className='tabler-calendar-event' /><Typography variant='body2'>{formatDate(event.startDate)}</Typography></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}><i className='tabler-map-pin' /><Typography variant='body2'>{event.location || 'Location to be announced'}</Typography></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}><i className='tabler-ticket' /><Typography variant='body2'>{formatPrice(event.price)}</Typography></Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 'auto' }}>
        <Button component={NextLink} href={`/events/${encodeURIComponent(event.slug)}`} variant='contained' endIcon={<i className='tabler-arrow-right' />}>
          View Event
        </Button>
        <Button component={NextLink} href={`/events/${encodeURIComponent(event.slug)}/register`} variant='outlined'>
          Register
        </Button>
      </Box>
    </CardContent>
  </Card>
)

const EventCategoryPage = () => {
  const params = useParams<{ kind: string }>()
  const categoryKey = params.kind.toLowerCase() as CategoryKey
  const category = categoryMap[categoryKey]
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const validCategory = useMemo(() => Boolean(category), [category])

  useEffect(() => {
    if (!category) {
      setLoading(false)
      return
    }

    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const result = await getPublicEvents(category.backend)
        if (active) setEvents(result)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load events.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [category])

  if (!validCategory || !category) {
    return (
      <Box sx={{ px: 3, py: 10 }}>
        <Alert severity='warning' sx={{ maxWidth: 900, mx: 'auto' }}>Event category was not found.</Alert>
      </Box>
    )
  }

  return (
    <Box
      sx={theme => ({
        minHeight: '100dvh',
        px: 3,
        py: { xs: 7, md: 10 },
        backgroundImage: `linear-gradient(${alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.8 : 0.78)}, ${alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.94 : 0.9)}), url('${category.background}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
      })}
    >
      <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
        <Box
          sx={theme => ({
            display: 'flex',
            gap: 2.5,
            alignItems: 'center',
            mb: 6,
            width: 'fit-content',
            maxWidth: '100%',
            p: { xs: 2.25, sm: 2.75 },
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.82 : 0.88),
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.75)
          })}
        >
          <Box sx={{ width: 58, height: 58, borderRadius: 2, bgcolor: 'action.hover', display: 'grid', placeItems: 'center', color: 'primary.main', flexShrink: 0 }}>
            <i className={`${category.icon} text-3xl`} />
          </Box>
          <Box>
            <Typography variant='h3' fontWeight={700}>{category.title}</Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>{category.description}</Typography>
          </Box>
        </Box>

        {loading && <Box sx={{ py: 12, display: 'grid', placeItems: 'center' }}><CircularProgress size={34} /></Box>}

        {error && <Alert severity='error'>{error}</Alert>}

        {!loading && !error && events.length === 0 && (
          <Card sx={theme => ({ bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.9 : 0.94), backdropFilter: 'blur(10px)' })}>
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <Box sx={{ width: 60, height: 60, mx: 'auto', borderRadius: 2, bgcolor: 'action.hover', display: 'grid', placeItems: 'center' }}><i className='tabler-calendar-off text-3xl' /></Box>
              <Typography variant='h5' fontWeight={600} sx={{ mt: 3 }}>No published {category.backend.toLowerCase()} events yet</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>Published events created with this category will appear here automatically.</Typography>
            </CardContent>
          </Card>
        )}

        {!loading && !error && events.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 4 }}>
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default EventCategoryPage
