'use client'

import { useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import { getAdminEvent, type AdminEvent } from '@/lib/admin-events'
import {
  EVENT_MODULE_DEFINITIONS,
  getAdminEventExperience,
  type EventExperienceConfig,
  type EventModuleKey
} from '@/lib/event-experience'

const moduleOperations: Partial<Record<EventModuleKey, string[]>> = {
  'race-categories': ['Configure race distances/categories', 'Define participant grouping', 'Connect categories with race packages'],
  'race-pack': ['Prepare pickup schedule and location', 'Track participant collection', 'Record distribution status'],
  quiz: ['Prepare quiz questions', 'Run participant attempts', 'Review scores and winners'],
  doorprize: ['Prepare prize inventory', 'Draw eligible participants', 'Track winner claim status'],
  booths: ['Configure booth/activity points', 'Define booth location and activity', 'Track event engagement'],
  speakers: ['Maintain speaker profiles', 'Connect speakers with sessions', 'Publish speaker lineup'],
  sessions: ['Configure session schedule', 'Set room and capacity', 'Track session attendance'],
  agenda: ['Build event rundown', 'Order activities by time', 'Publish operational agenda'],
  certificates: ['Configure certificate readiness', 'Track eligible participants', 'Prepare certificate distribution'],
  reports: ['Participant and registration reporting', 'Package and quota reporting', 'Operational event summary']
}

const ModuleWorkspacePage = () => {
  const params = useParams<{ eventSlug: string; moduleKey: string }>()
  const eventId = params.eventSlug
  const moduleKey = decodeURIComponent(params.moduleKey) as EventModuleKey

  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [experience, setExperience] = useState<EventExperienceConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const module = useMemo(
    () => EVENT_MODULE_DEFINITIONS.find(item => item.key === moduleKey) ?? null,
    [moduleKey]
  )

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [loadedEvent, loadedExperience] = await Promise.all([
          getAdminEvent(eventId),
          getAdminEventExperience(eventId)
        ])
        if (!mounted) return
        setEvent(loadedEvent)
        setExperience(loadedExperience)
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load module workspace.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => { mounted = false }
  }, [eventId])

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={32} /></Box>
  }

  if (!event || !experience) {
    return <Alert severity='error'>{error ?? 'Event module is unavailable.'}</Alert>
  }

  if (!module) {
    return (
      <Alert severity='error' action={<Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/dashboard`}>Back to dashboard</Button>}>
        Unknown event module.
      </Alert>
    )
  }

  if (!experience.enabledModules.includes(module.key)) {
    return (
      <Alert severity='warning' action={<Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/edit`}>Configure event</Button>}>
        {module.label} is not enabled for this event.
      </Alert>
    )
  }

  const operations = moduleOperations[module.key] ?? []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Breadcrumbs>
        <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>Events</Link>
        <Link component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/dashboard`} color='inherit' underline='hover'>{event.name}</Link>
        <Typography color='text.primary'>{module.label}</Typography>
      </Breadcrumbs>

      {error && <Alert severity='error'>{error}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 3, alignItems: { md: 'center' } }}>
        <Box>
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
              <i className={`${module.icon} text-2xl`} />
            </Box>
            <Typography variant='h4' fontWeight={750}>{module.label}</Typography>
            <Chip label={experience.kind} color='primary' variant='tonal' size='small' />
            <Chip label='Enabled' color='success' variant='tonal' size='small' />
          </Box>
          <Typography color='text.secondary' sx={{ mt: 1.5, maxWidth: 760, lineHeight: 1.7 }}>
            {module.description}
          </Typography>
        </Box>

        {event.status !== 'Archived' && event.kind !== 'Workshop' && event.kind !== 'Other' && (
          <Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/edit`} variant='outlined' startIcon={<i className='tabler-adjustments' />}>
            Configure modules
          </Button>
        )}
      </Box>

      <Card variant='outlined'>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant='h6' fontWeight={700}>Module scope</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75, lineHeight: 1.7 }}>
            The event configuration already controls whether this workspace exists. Specialized operational records for this module are intentionally separated from the core registration/payment tables, so future module data can evolve without breaking ticketing or check-in.
          </Typography>

          {operations.length > 0 && (
            <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {operations.map((operation, index) => (
                <Box key={operation} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
                  <Typography variant='caption' color='primary.main' fontWeight={700}>STEP {index + 1}</Typography>
                  <Typography fontWeight={650} sx={{ mt: 0.75 }}>{operation}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Alert severity='info'>
        This module is enabled and routed correctly. Its specialized CRUD/participant actions are the next implementation layer; no fake operational data is written from this screen.
      </Alert>
    </Box>
  )
}

export default ModuleWorkspacePage
