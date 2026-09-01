'use client'

import { use, useEffect, useState } from 'react'

import NextLink from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import EventPackages from './components/EventPackages'

import { getPublicEvents, type PublicEvent } from '@/lib/api'

type Props = {
  params: Promise<{
    eventSlug: string
  }>
}

type StoredSession = {
  accessToken?: string
}

const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate) return 'Date to be announced'

  const formatDate = (value: string) => {
    const date = new Date(value)

    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).format(date)
  }

  const start = formatDate(startDate)

  return endDate && endDate !== startDate ? `${start} – ${formatDate(endDate)}` : start
}

const getLocation = (event: PublicEvent) => {
  return (
    [event.venue, event.location, event.city, event.address].filter(Boolean).join(' · ') || 'Location to be announced'
  )
}

const EventOverviewPage = ({ params }: Props) => {
  const { eventSlug } = use(params)
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEvent = async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const rawSession = window.localStorage.getItem('eo-auth')
      const session = rawSession ? (JSON.parse(rawSession) as StoredSession) : null

      if (!session?.accessToken) {
        throw new Error('Your session has expired. Please login again.')
      }

      const events = await getPublicEvents(session.accessToken)
      const matchedEvent = events.find(item => item.id === eventSlug || item.slug === eventSlug)

      if (!matchedEvent) {
        setEvent(null)
        setNotFound(true)

        return
      }

      setEvent(matchedEvent)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load event.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 12 }}>
        <CircularProgress size={32} />
        <Typography variant='body2' color='text.secondary'>
          Loading event overview…
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert
        severity='error'
        action={
          <Button color='inherit' size='small' onClick={loadEvent}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    )
  }

  if (notFound || !event) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2, py: 12 }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 48,
            height: 48,
            borderRadius: 1,
            bgcolor: 'action.hover'
          }}
        >
          <i className='tabler-calendar-off text-2xl' />
        </Box>
        <Box>
          <Typography variant='h5' fontWeight={600}>
            Event not found
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            This event may have been removed or is no longer available.
          </Typography>
        </Box>
        <Button component={NextLink} href='/admin/events' variant='outlined' sx={{ borderRadius: 0 }}>
          Back to events
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Box>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={NextLink} href='/admin/home' color='inherit' underline='hover'>
            Home
          </Link>
          <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>
            Events
          </Link>
          <Typography color='text.primary'>{event.name}</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { md: 'center' },
            justifyContent: 'space-between',
            gap: 3
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <Typography variant='h4' fontWeight={700}>
                {event.name}
              </Typography>
              <Chip
                label={event.published === false ? 'Unpublished' : event.published ? 'Published' : 'Draft'}
                color={event.published ? 'success' : 'default'}
                size='small'
              />
            </Box>
            <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
              Manage event details, registrations, and package availability.
            </Typography>
          </Box>

          <Button
            component={NextLink}
            href={`/admin/events/${encodeURIComponent(event.slug)}/registrations`}
            variant='contained'
            startIcon={<i className='tabler-users' />}
            sx={{ alignSelf: { xs: 'flex-start', md: 'auto' }, borderRadius: 0 }}
          >
            Manage Registrations
          </Button>
        </Box>
      </Box>

      <Card elevation={0}>
        <CardContent>
          <Typography variant='h6' fontWeight={600}>
            Event overview
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            Core event information from the current event record.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 3
            }}
          >
            <Box>
              <Typography variant='body2' color='text.secondary'>
                Event date
              </Typography>
              <Typography variant='body1' fontWeight={600} sx={{ mt: 0.75 }}>
                {formatDateRange(event.startDate, event.endDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant='body2' color='text.secondary'>
                Location
              </Typography>
              <Typography variant='body1' fontWeight={600} sx={{ mt: 0.75 }}>
                {getLocation(event)}
              </Typography>
            </Box>
            <Box>
              <Typography variant='body2' color='text.secondary'>
                Event capacity
              </Typography>
              <Typography variant='body1' fontWeight={600} sx={{ mt: 0.75 }}>
                {event.capacity?.toLocaleString() ?? 'Not set'}
              </Typography>
            </Box>
            <Box>
              <Typography variant='body2' color='text.secondary'>
                Remaining quota
              </Typography>
              <Typography variant='body1' fontWeight={600} sx={{ mt: 0.75 }}>
                {event.remainingQuota?.toLocaleString() ?? 'Not available'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 4 }}>
            {event.type && <Chip label={event.type} size='small' variant='outlined' />}
            {event.registrationStatus && (
              <Chip label={event.registrationStatus} color='primary' size='small' variant='outlined' />
            )}
            {event.accessMode && <Chip label={event.accessMode} size='small' variant='outlined' />}
          </Box>
        </CardContent>
      </Card>

      <EventPackages eventSlug={event.slug} />
    </Box>
  )
}

export default EventOverviewPage
