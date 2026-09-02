'use client'

import { useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'
import NextLink from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import EventForm from '../../components/EventForm'
import { getAdminEvent, updateAdminEvent, type AdminEvent, type EventUpsertRequest } from '@/lib/admin-events'

const EditEventPage = () => {
  const params = useParams<{ eventSlug: string }>()
  const eventSlug = params.eventSlug
  const router = useRouter()
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const loaded = await getAdminEvent(eventSlug)
        if (active) setEvent(loaded)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load event.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [eventSlug])

  const handleSubmit = async (request: EventUpsertRequest) => {
    if (!event) return

    try {
      setSubmitting(true)
      setError(null)
      await updateAdminEvent(event.id, request)
      router.push(`/admin/events/${encodeURIComponent(event.id)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to update event.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (error && !event) {
    return (
      <Alert severity='error' action={<Button onClick={() => router.push('/admin/events')}>Back to events</Button>}>
        {error}
      </Alert>
    )
  }

  if (!event) return null

  if (event.status === 'Archived') {
    return (
      <Alert severity='warning'>
        Archived events are read-only. Return to the archived event page to review its history.
      </Alert>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>
            Events
          </Link>
          <Link
            component={NextLink}
            href={`/admin/events/${encodeURIComponent(event.id)}`}
            color='inherit'
            underline='hover'
          >
            {event.name}
          </Link>
          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>

        <Typography variant='h4' fontWeight={700}>
          Edit Event
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
          Update event information. Publishing status is managed separately from event details.
        </Typography>
      </Box>

      <EventForm
        event={event}
        submitLabel='Save Changes'
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/admin/events/${encodeURIComponent(event.id)}`)}
      />
    </Box>
  )
}

export default EditEventPage
