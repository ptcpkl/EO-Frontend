'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { getPublicEvents, type PublicEvent } from '@/lib/api'

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

const EventListPage = () => {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      const rawSession = window.localStorage.getItem('eo-auth')
      const session = rawSession ? (JSON.parse(rawSession) as StoredSession) : null

      if (!session?.accessToken) {
        throw new Error('Your session has expired. Please login again.')
      }

      setEvents(await getPublicEvents(session.accessToken))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load events.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return events

    return events.filter(event => {
      return [event.name, event.type, event.venue, event.location, event.city]
        .filter(Boolean)
        .some(value => value?.toLowerCase().includes(keyword))
    })
  }, [events, search])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
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
          <Typography variant='h4' fontWeight={700}>
            Event Management
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
            View event details, availability, and registration readiness in one place.
          </Typography>
        </Box>

        <Button
          component={Link}
          href='/admin/events/'
          variant='contained'
          startIcon={<i className='tabler-calendar-plus' />}
          sx={{ alignSelf: { xs: 'flex-start', md: 'auto' }, borderRadius: 0 }}
        >
          Create Event
        </Button>
      </Box>

      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
              gap: 3
            }}
          >
            <Box>
              <Typography variant='h6' fontWeight={600}>
                All events
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                {loading
                  ? 'Loading events…'
                  : `${filteredEvents.length} event${filteredEvents.length === 1 ? '' : 's'} found`}
              </Typography>
            </Box>

            <TextField
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search events'
              size='small'
              sx={{ width: { xs: '100%', sm: 320 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='tabler-search' />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>
        </CardContent>

        <Divider />

        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 10 }}>
            <CircularProgress size={32} />
            <Typography variant='body2' color='text.secondary'>
              Loading events…
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Alert
              severity='error'
              action={
                <Button color='inherit' size='small' onClick={loadEvents}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 2,
              py: 10,
              px: 3
            }}
          >
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
              <Typography variant='h6' fontWeight={600}>
                {events.length === 0 ? 'No events yet' : 'No matching events'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                {events.length === 0
                  ? 'Create your first event to begin managing registrations.'
                  : 'Try a different search term.'}
              </Typography>
            </Box>
            {events.length === 0 && (
              <Button component={Link} href='/admin/events/create' variant='outlined' sx={{ borderRadius: 0 }}>
                Create Event
              </Button>
            )}
          </Box>
        )}

        {!loading && !error && filteredEvents.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
              gap: 3,
              p: { xs: 3, sm: 4 }
            }}
          >
            {filteredEvents.map(event => (
              <Card key={event.id ?? event.slug} variant='outlined' sx={{ display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                    <Box>
                      <Typography variant='h6' fontWeight={600}>
                        {event.name}
                      </Typography>
                      {event.type && (
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                          {event.type}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={event.published === false ? 'Unpublished' : event.published ? 'Published' : 'Draft'}
                      color={event.published ? 'success' : 'default'}
                      size='small'
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                    >
                      <i className='tabler-map-pin' /> {getLocation(event)}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                    >
                      <i className='tabler-calendar' /> {formatDateRange(event.startDate, event.endDate)}
                    </Typography>
                    {event.capacity !== undefined && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        <i className='tabler-users' /> Capacity {event.capacity.toLocaleString()}
                        {event.remainingQuota !== undefined
                          ? ` · ${event.remainingQuota.toLocaleString()} remaining`
                          : ''}
                      </Typography>
                    )}
                  </Box>

                  {event.registrationStatus && (
                    <Chip
                      label={event.registrationStatus}
                      color='primary'
                      variant='outlined'
                      size='small'
                      sx={{ mt: 3 }}
                    />
                  )}
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    component={Link}
                    href={event.id ? `/admin/events/${encodeURIComponent(event.id)}` : '#'}
                    disabled={!event.id}
                    endIcon={<i className='tabler-arrow-right' />}
                  >
                    Manage
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Card>
    </Box>
  )
}

export default EventListPage
