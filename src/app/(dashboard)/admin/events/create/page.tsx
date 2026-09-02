'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import NextLink from 'next/link'

import EventForm from '../components/EventForm'
import { createAdminEvent, type EventUpsertRequest } from '@/lib/admin-events'

const CreateEventPage = () => {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (request: EventUpsertRequest) => {
    try {
      setSubmitting(true)
      setError(null)

      const created = await createAdminEvent(request)

      router.push(`/admin/events/${encodeURIComponent(created.id)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create event.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={NextLink} href='/admin/home' color='inherit' underline='hover'>
            Home
          </Link>
          <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>
            Events
          </Link>
          <Typography color='text.primary'>Create Event</Typography>
        </Breadcrumbs>

        <Typography variant='h4' fontWeight={700}>
          Create Event
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
          New events are saved as Draft and stay hidden from public registration until you publish them.
        </Typography>
      </Box>

      <EventForm
        submitLabel='Create Event'
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/events')}
      />
    </Box>
  )
}

export default CreateEventPage
