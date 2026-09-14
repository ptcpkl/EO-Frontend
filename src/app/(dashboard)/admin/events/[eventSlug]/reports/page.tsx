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
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import { getAdminEvent, type AdminEvent } from '@/lib/admin-events'
import { getRegistrations } from '../registrations/services/registration.service'
import type { Registration } from '../registrations/types'

const EventReportsPage = () => {
  const params = useParams<{ eventSlug: string }>()
  const eventId = params.eventSlug

  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [loadedEvent, loadedRegistrations] = await Promise.all([
        getAdminEvent(eventId),
        getRegistrations(eventId)
      ])
      setEvent(loadedEvent)
      setRegistrations(loadedRegistrations)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load event report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const report = useMemo(() => {
    const active = registrations.filter(item => item.status !== 'CANCELLED')
    const registered = active.filter(item => item.status === 'REGISTERED').length
    const checkedIn = active.filter(item => item.status === 'CHECKED_IN').length
    const pending = active.filter(item => item.status === 'PENDING').length
    const internal = active.filter(item => item.participantType === 'INTERNAL').length
    const external = active.filter(item => item.participantType === 'EXTERNAL').length

    const packages = new Map<string, number>()
    for (const registration of active) {
      const label = registration.eventPackageName || 'No package'
      packages.set(label, (packages.get(label) ?? 0) + 1)
    }

    return {
      active,
      registered,
      checkedIn,
      pending,
      internal,
      external,
      packages: [...packages.entries()].sort((a, b) => b[1] - a[1])
    }
  }, [registrations])

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={32} /></Box>
  }

  if (!event) {
    return <Alert severity='error'>{error ?? 'Event report is unavailable.'}</Alert>
  }

  const capacityPercent = event.capacity > 0 ? Math.min(100, (report.active.length / event.capacity) * 100) : 0
  const attendanceBase = report.registered + report.checkedIn
  const attendancePercent = attendanceBase > 0 ? (report.checkedIn / attendanceBase) * 100 : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Breadcrumbs>
        <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>Events</Link>
        <Link component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/dashboard`} color='inherit' underline='hover'>{event.name}</Link>
        <Typography color='text.primary'>Reports</Typography>
      </Breadcrumbs>

      {error && <Alert severity='error' action={<Button onClick={() => void load()}>Retry</Button>}>{error}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2, alignItems: { md: 'center' } }}>
        <Box>
          <Typography variant='h4' fontWeight={750}>Event Reports</Typography>
          <Typography color='text.secondary' sx={{ mt: 1 }}>Live operational summary for {event.name}.</Typography>
        </Box>
        <Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/registrations`} variant='outlined' startIcon={<i className='tabler-users' />}>
          Open Participants
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        {[
          ['Active registrations', report.active.length, 'tabler-users'],
          ['Registered', report.registered, 'tabler-user-check'],
          ['Checked in', report.checkedIn, 'tabler-scan'],
          ['Pending', report.pending, 'tabler-clock']
        ].map(([label, value, icon]) => (
          <Card variant='outlined' key={String(label)}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                  <Typography variant='body2' color='text.secondary'>{label}</Typography>
                  <Typography variant='h4' fontWeight={750} sx={{ mt: 1 }}>{Number(value).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center' }}><i className={`${icon} text-xl`} /></Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <Card variant='outlined'>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant='h6' fontWeight={700}>Capacity utilization</Typography>
            <Typography variant='h4' fontWeight={750} sx={{ mt: 2 }}>{Math.round(capacityPercent)}%</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>{report.active.length.toLocaleString()} of {event.capacity.toLocaleString()} event seats</Typography>
            <LinearProgress variant='determinate' value={capacityPercent} sx={{ mt: 2.5, height: 8, borderRadius: 10 }} />
          </CardContent>
        </Card>

        <Card variant='outlined'>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant='h6' fontWeight={700}>Attendance</Typography>
            <Typography variant='h4' fontWeight={750} sx={{ mt: 2 }}>{Math.round(attendancePercent)}%</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>{report.checkedIn.toLocaleString()} checked in from {attendanceBase.toLocaleString()} confirmed participants</Typography>
            <LinearProgress variant='determinate' value={attendancePercent} sx={{ mt: 2.5, height: 8, borderRadius: 10 }} />
          </CardContent>
        </Card>
      </Box>

      <Card variant='outlined'>
        <CardContent sx={{ p: 3.5 }}>
          <Typography variant='h6' fontWeight={700}>Participant composition</Typography>
          <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip label={`External ${report.external.toLocaleString()}`} color='primary' variant='tonal' />
            <Chip label={`Internal ${report.internal.toLocaleString()}`} variant='outlined' />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant='subtitle1' fontWeight={700}>Package distribution</Typography>
          {report.packages.length === 0 ? (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>No registration package data yet.</Typography>
          ) : (
            <Box sx={{ mt: 2, display: 'grid', gap: 1.5 }}>
              {report.packages.map(([packageName, count]) => (
                <Box key={packageName} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
                  <Typography>{packageName}</Typography>
                  <Typography fontWeight={700}>{count.toLocaleString()}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default EventReportsPage
