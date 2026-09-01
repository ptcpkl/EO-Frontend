'use client'

import { use, useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import RegistrationStats from './components/RegistrationStats'
import RegistrationToolbar from './components/RegistrationToolbar'
import RegistrationTable from './components/RegistrationTable'
import ImportExcelDialog from './components/ImportExcelDialog'

import { cancelRegistration, getRegistrationStats, getRegistrations } from './services/registration.service'
import { getPublicEvents } from '@/lib/api'
import { getEventPackages } from './services/event-package.service'
import type { EventPackage } from './services/types/event-package'

import type { Registration, RegistrationFilters, RegistrationStatsData } from './types'

type Props = {
  params: Promise<{
    eventSlug: string
  }>
}

const EVENT_NAME = 'Seminar FFWS Edit'

const Page = ({ params }: Props) => {
  const { eventSlug } = use(params)
  const [importOpen, setImportOpen] = useState(false)

  const [filters, setFilters] = useState<RegistrationFilters>({
    search: '',
    participantType: 'ALL',
    status: 'ALL',
    eventPackageId: ''
  })

  const [eventPackages, setEventPackages] = useState<EventPackage[]>([])

  const [stats, setStats] = useState<RegistrationStatsData>({
    total: 0,
    internal: 0,
    external: 0,
    registered: 0
  })

  const [registrations, setRegistrations] = useState<Registration[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [eventQuota, setEventQuota] = useState<{
    capacity?: number
    registeredCount?: number
    remainingQuota?: number
  } | null>(null)

  const loadRegistrations = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsData, registrationData, packageData] = await Promise.all([
        getRegistrationStats(eventSlug),
        getRegistrations(eventSlug, filters),
        getEventPackages(eventSlug)
      ])

      setStats(statsData)
      setRegistrations(
        filters.status === 'ALL' ? registrationData : registrationData.filter(item => item.status === filters.status)
      )
      setEventPackages(packageData)

      const rawSession = window.localStorage.getItem('eo-auth')
      const accessToken = rawSession ? (JSON.parse(rawSession) as { accessToken?: string }).accessToken : undefined

      if (accessToken) {
        const eventData = (await getPublicEvents(accessToken)).find(
          item => item.slug === eventSlug || item.id === eventSlug
        )

        if (eventData) {
          setEventQuota(eventData)
        }
      }
    } catch (error) {
      console.error(error)

      setError(error instanceof Error ? error.message : 'Unable to load registrations.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRegistration = async (registrationId: string) => {
    try {
      setError(null)
      await cancelRegistration(registrationId)
      await loadRegistrations()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to cancel registration.')
    }
  }

  useEffect(() => {
    loadRegistrations()
  }, [eventSlug, filters.search, filters.participantType, filters.status, filters.eventPackageId])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}
    >
      {/* Header */}
      <Box>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href='/admin/home' color='inherit' underline='hover'>
            Home
          </Link>

          <Link href='/admin/events' color='inherit' underline='hover'>
            Events
          </Link>

          <Typography color='text.primary'>Registrations</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'flex',
            flexDirection: {
              xs: 'column',
              md: 'row'
            },
            alignItems: {
              md: 'center'
            },
            justifyContent: 'space-between',
            gap: 4
          }}
        >
          <Box>
            <Typography variant='h4' fontWeight={700}>
              Registration Management
            </Typography>

            <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
              Manage participants registered for <strong>{EVENT_NAME}</strong>.
            </Typography>
          </Box>

          <Button
            variant='outlined'
            startIcon={<i className='tabler-arrow-left' />}
            href='/admin/home'
            sx={{
              borderRadius: 0,
              alignSelf: {
                xs: 'flex-start',
                md: 'auto'
              }
            }}
          >
            Back to dashboard
          </Button>
        </Box>
      </Box>

      {error && <Alert severity='error'>{error}</Alert>}

      {eventQuota && (eventQuota.capacity !== undefined || eventQuota.registeredCount !== undefined) && (
        <Card elevation={0}>
          <CardContent>
            <Typography variant='h6' fontWeight={600}>
              Event quota
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
              Quota is shared across all packages for this event.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, mt: 3 }}>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Event capacity
                </Typography>
                <Typography variant='h6' fontWeight={700} sx={{ mt: 0.5 }}>
                  {eventQuota.capacity?.toLocaleString() ?? 'Not set'}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Registered count
                </Typography>
                <Typography variant='h6' fontWeight={700} sx={{ mt: 0.5 }}>
                  {eventQuota.registeredCount?.toLocaleString() ?? 'Not available'}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Remaining quota
                </Typography>
                <Typography variant='h6' fontWeight={700} sx={{ mt: 0.5 }}>
                  {eventQuota.remainingQuota?.toLocaleString() ??
                    (eventQuota.capacity !== undefined && eventQuota.registeredCount !== undefined
                      ? Math.max(0, eventQuota.capacity - eventQuota.registeredCount).toLocaleString()
                      : 'Not available')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <RegistrationStats stats={stats} />

      {/* Registration table section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}
      >
        <Box>
          <Typography variant='h5' fontWeight={600}>
            Participants
          </Typography>

          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            View and manage all participants for this event.
          </Typography>
        </Box>

        <RegistrationToolbar
          filters={filters}
          packages={eventPackages}
          onFiltersChange={setFilters}
          onImport={() => setImportOpen(true)}
        />

        <RegistrationTable registrations={registrations} loading={loading} onCancel={handleCancelRegistration} />
      </Box>

      <ImportExcelDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        eventSlug={eventSlug}
        onImported={loadRegistrations}
      />
    </Box>
  )
}

export default Page
