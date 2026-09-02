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

import EventForm, { type EventFormSubmission } from '../../components/EventForm'
import {
  getAdminEvent,
  updateAdminEvent,
  uploadAdminEventAsset,
  type AdminEvent
} from '@/lib/admin-events'

const EditEventPage = () => {
  const params = useParams<{ eventSlug: string }>()
  const eventSlug = params.eventSlug
  const router = useRouter()
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEvent = async () => {
    try {
      setLoading(true)
      setError(null)
      setEvent(await getAdminEvent(eventSlug))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load event.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug])

  const handleSubmit = async ({ request, assets }: EventFormSubmission) => {
    if (!event) return

    try {
      setSubmitting(true)
      setError(null)

      await updateAdminEvent(event.id, request)

      if (assets.logo) await uploadAdminEventAsset(event.id, 'logo', assets.logo)
      if (assets.hero) await uploadAdminEventAsset(event.id, 'hero', assets.hero)
      if (assets.registration) await uploadAdminEventAsset(event.id, 'registration', assets.registration)

      router.push(`/admin/events/${encodeURIComponent(event.id)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to update event.')

      try {
        setEvent(await getAdminEvent(event.id))
      } catch {
        // Keep the already loaded event so the edit form remains usable.
      }
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

  const mediaComplete = Boolean(event.logoUrl && event.heroImageUrl && event.registrationImageUrl && event.registrationImageTitle)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>Events</Link>
          <Link component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}`} color='inherit' underline='hover'>
            {event.name}
          </Link>
          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>

        <Typography variant='h4' fontWeight={700}>Edit Event</Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
          Update event information, public landing content, and event-specific visual assets.
        </Typography>

        {!mediaComplete && (
          <Alert severity='warning' sx={{ mt: 3 }}>
            Complete the event logo, hero image, registration visual, and visual title before publishing this Draft event.
          </Alert>
        )}
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
