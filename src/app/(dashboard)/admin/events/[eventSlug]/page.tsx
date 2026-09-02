'use client'

import { use, useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'

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
import {
  archiveAdminEvent,
  getAdminEvent,
  publishAdminEvent,
  type AdminEvent
} from '@/lib/admin-events'

type Props = { params: Promise<{ eventSlug: string }> }

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date)
}

const formatPrice = (value: number) =>
  value === 0 ? 'Free / no active package' : new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(value)

const EventOverviewPage = ({ params }: Props) => {
  const { eventSlug: eventId } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEvent = async () => {
    try {
      setLoading(true)
      setError(null)
      setEvent(await getAdminEvent(eventId))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load event.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const handlePublish = async () => {
    if (!event || !window.confirm('Publish this event? It will become publicly visible and registration will follow the configured registration window.')) return
    try {
      setActionLoading(true)
      setError(null)
      setEvent(await publishAdminEvent(event.id))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to publish event.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!event || !window.confirm('Archive this event? It will disappear from public registration while its event, package, and registration history remain stored.')) return
    try {
      setActionLoading(true)
      setError(null)
      await archiveAdminEvent(event.id)
      router.push('/admin/events/archived')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to archive event.')
      setActionLoading(false)
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={32} /></Box>

  if (!event) {
    return <Alert severity='error' action={<Button onClick={loadEvent}>Retry</Button>}>{error ?? 'Event not found.'}</Alert>
  }

  const archived = event.status === 'Archived'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Box>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={NextLink} href='/admin/home' color='inherit' underline='hover'>Home</Link>
          <Link component={NextLink} href={archived ? '/admin/events/archived' : '/admin/events'} color='inherit' underline='hover'>
            {archived ? 'Archived Events' : 'Events'}
          </Link>
          <Typography color='text.primary'>{event.name}</Typography>
        </Breadcrumbs>

        {error && <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert>}
        {archived && <Alert severity='info' sx={{ mb: 3 }}>This event is archived and read-only. Its history remains available to administrators.</Alert>}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', gap: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <Typography variant='h4' fontWeight={700}>{event.name}</Typography>
              <Chip label={event.status} color={event.status === 'Published' ? 'success' : 'default'} size='small' />
              <Chip label={event.kind} variant='outlined' size='small' />
            </Box>
            <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
              {archived ? 'Review event, package, and participant history.' : 'Manage event details, packages, publishing, and registrations.'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignSelf: { xs: 'flex-start', lg: 'center' } }}>
            {!archived && (
              <Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/edit`} variant='outlined' startIcon={<i className='tabler-edit' />}>
                Edit Event
              </Button>
            )}
            {event.status === 'Draft' && (
              <Button variant='contained' disabled={actionLoading} onClick={handlePublish} startIcon={<i className='tabler-world-upload' />}>
                Publish Event
              </Button>
            )}
            <Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/registrations`} variant='outlined' startIcon={<i className='tabler-users' />}>
              {archived ? 'View Registrations' : 'Manage Registrations'}
            </Button>
            {!archived && (
              <Button color='error' variant='outlined' disabled={actionLoading} onClick={handleArchive} startIcon={<i className='tabler-archive' />}>
                Archive Event
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Card elevation={0}>
        <CardContent>
          <Typography variant='h6' fontWeight={600}>Event overview</Typography>
          <Divider sx={{ my: 4 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 4 }}>
            <Box><Typography variant='body2' color='text.secondary'>Location</Typography><Typography fontWeight={600} sx={{ mt: .75 }}>{event.location || 'Not set'}</Typography></Box>
            <Box><Typography variant='body2' color='text.secondary'>Event starts</Typography><Typography fontWeight={600} sx={{ mt: .75 }}>{formatDateTime(event.startAtUtc)}</Typography></Box>
            <Box><Typography variant='body2' color='text.secondary'>Event ends</Typography><Typography fontWeight={600} sx={{ mt: .75 }}>{formatDateTime(event.endAtUtc)}</Typography></Box>
            <Box><Typography variant='body2' color='text.secondary'>Displayed price</Typography><Typography fontWeight={600} sx={{ mt: .75 }}>{formatPrice(event.price)}</Typography></Box>
            <Box><Typography variant='body2' color='text.secondary'>Registration opens</Typography><Typography fontWeight={600} sx={{ mt: .75 }}>{formatDateTime(event.registrationOpenAtUtc)}</Typography></Box>
            <Box><Typography variant='body2' color='text.secondary'>Registration closes</Typography><Typography fontWeight={600} sx={{ mt: .75 }}>{formatDateTime(event.registrationCloseAtUtc)}</Typography></Box>
            <Box><Typography variant='body2' color='text.secondary'>Capacity</Typography><Typography fontWeight={600} sx={{ mt: .75 }}>{event.capacity.toLocaleString()}</Typography></Box>
            <Box><Typography variant='body2' color='text.secondary'>Registered / remaining</Typography><Typography fontWeight={600} sx={{ mt: .75 }}>{event.registeredCount.toLocaleString()} / {event.remainingQuota.toLocaleString()}</Typography></Box>
          </Box>

          <Divider sx={{ my: 4 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label={event.accessMode === 'InvitationCode' ? 'Invitation Code' : event.accessMode === 'EmailDomain' ? 'Email Domain' : 'Public Access'} variant='outlined' size='small' />
            {event.accessMode !== 'Public' && event.accessValue && <Chip label={event.accessValue} variant='outlined' size='small' />}
            <Chip label={`Slug: ${event.slug}`} variant='outlined' size='small' />
          </Box>

          {event.description && <Typography variant='body2' color='text.secondary' sx={{ mt: 4, whiteSpace: 'pre-line' }}>{event.description}</Typography>}
        </CardContent>
      </Card>

      <EventPackages eventId={event.id} readOnly={archived} />
    </Box>
  )
}

export default EventOverviewPage
