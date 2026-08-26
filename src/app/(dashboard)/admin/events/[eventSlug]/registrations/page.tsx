'use client'

import { useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'

import RegistrationStats from './components/RegistrationStats'
import RegistrationToolbar from './components/RegistrationToolbar'
import RegistrationTable from './components/RegistrationTable'
import ImportExcelDialog from './components/ImportExcelDialog'

import {
  getMockRegistrationStats,
  getMockRegistrations
} from './services/registration.mock'

import type { RegistrationFilters } from './types'

type Props = {
  params: {
    eventSlug: string
  }
}

const EVENT_NAME = 'Seminar FFWS Edit'

const Page = ({ params }: Props) => {
  const [importOpen, setImportOpen] = useState(false)

  const [filters, setFilters] =
    useState<RegistrationFilters>({
      search: '',
      participantType: 'ALL',
      status: 'ALL'
    })

  const stats = useMemo(
    () => getMockRegistrationStats(params.eventSlug),
    [params.eventSlug]
  )

  const registrations = useMemo(
    () =>
      getMockRegistrations(
        params.eventSlug,
        filters
      ),
    [params.eventSlug, filters]
  )

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
          <Link
            href='/admin/home'
            color='inherit'
            underline='hover'
          >
            Home
          </Link>

          <Link
            href='/admin/events'
            color='inherit'
            underline='hover'
          >
            Events
          </Link>

          <Typography color='text.primary'>
            Registrations
          </Typography>
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

            <Typography
              variant='body1'
              color='text.secondary'
              sx={{ mt: 1 }}
            >
              Manage participants registered for{' '}
              <strong>{EVENT_NAME}</strong>.
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
          <Typography
            variant='h5'
            fontWeight={600}
          >
            Participants
          </Typography>

          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mt: 1 }}
          >
            View and manage all participants for this
            event.
          </Typography>
        </Box>

        <RegistrationToolbar
          filters={filters}
          onFiltersChange={setFilters}
          onImport={() => setImportOpen(true)}
        />

        <RegistrationTable
          registrations={registrations}
        />
      </Box>

      <ImportExcelDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </Box>
  )
}

export default Page
