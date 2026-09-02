'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { listAdminEvents, type AdminEvent } from '@/lib/admin-events'

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(value))

export default function Page() {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const result = await listAdminEvents()
        if (active) setEvents(result)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load events.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return events

    return events.filter(event =>
      [event.name, event.location ?? '', event.status].some(value => value.toLowerCase().includes(query))
    )
  }, [events, search])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: { xs: 'stretch', md: 'flex-end' }, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box>
          <Chip label='Participants' color='primary' size='small' sx={{ mb: 1.5 }} />
          <Typography variant='h4' fontWeight={800}>Registration Management</Typography>
          <Typography color='text.secondary' sx={{ mt: 1, maxWidth: 760 }}>
            Select an event to manage participants, registration status, packages, Excel imports, and cancellations using the existing backend workflow.
          </Typography>
        </Box>
        <TextField
          size='small'
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder='Search event...'
          InputProps={{ startAdornment: <i className='tabler-search mr-2' /> }}
          sx={{ minWidth: { md: 280 } }}
        />
      </Box>

      {error && <Alert severity='error'>{error}</Alert>}

      {loading ? (
        <Box sx={{ py: 10, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Card elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <i className='tabler-calendar-off text-5xl' />
            <Typography variant='h6' sx={{ mt: 2 }}>No events found</Typography>
            <Typography color='text.secondary' sx={{ mt: 1 }}>Create an event first, then participant management becomes available here.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, 1fr)' }, gap: 3 }}>
          {filtered.map(event => {
            const progress = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0

            return (
              <Card key={event.id} elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant='h6' fontWeight={700} noWrap>{event.name}</Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ mt: .5 }}>
                        {formatDate(event.startAtUtc)} · {event.location || 'Location TBD'}
                      </Typography>
                    </Box>
                    <Chip
                      size='small'
                      label={event.status}
                      color={event.status === 'Published' ? 'success' : event.status === 'Archived' ? 'default' : 'warning'}
                      variant='outlined'
                    />
                  </Box>

                  <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>Registered</Typography>
                      <Typography variant='h6' fontWeight={700}>{event.registeredCount}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>Capacity</Typography>
                      <Typography variant='h6' fontWeight={700}>{event.capacity}</Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>Remaining</Typography>
                      <Typography variant='h6' fontWeight={700}>{event.remainingQuota}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2.5, height: 8, bgcolor: 'action.hover', borderRadius: 999, overflow: 'hidden' }}>
                    <Box sx={{ width: `${progress}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 999, transition: 'width .3s ease' }} />
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                      component={Link}
                      href={`/admin/events/${encodeURIComponent(event.slug)}/registrations`}
                      variant='contained'
                      startIcon={<i className='tabler-users' />}
                    >
                      Manage participants
                    </Button>
                    <Button component={Link} href={`/admin/events/${encodeURIComponent(event.slug)}`} variant='outlined'>
                      Event details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
