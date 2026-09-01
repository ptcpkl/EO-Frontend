'use client'

import Link from 'next/link'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

type Props = {
  publicView?: boolean
}

const HomeDashboard = ({ publicView = false }: Props) => {
  if (publicView) {
    return (
      <main className='flex min-h-screen items-center justify-center'>
        <Typography variant='h4'>
          Welcome to Pertamina Event
        </Typography>
      </main>
    )
  }

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
        <Typography
          variant='h4'
          fontWeight={700}
        >
          Welcome back, Admin 👋
        </Typography>

        <Typography
          variant='body1'
          color='text.secondary'
          sx={{ mt: 1 }}
        >
          Manage your events, participants, and registrations
          from one place.
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          },
          gap: 4
        }}
      >
        <Card elevation={0}>
          <CardContent>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'action.hover',
                mb: 3
              }}
            >
              <i className='tabler-calendar-event text-2xl' />
            </Box>

            <Typography
              variant='h6'
              fontWeight={600}
            >
              Event Management
            </Typography>

            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ mt: 1, minHeight: 42 }}
            >
              Create, edit, publish, and manage your events.
            </Typography>

            <Button
              component={Link}
              href='/admin/events'
              variant='outlined'
              sx={{
                mt: 3,
                borderRadius: 0
              }}
            >
              Manage Events
            </Button>
          </CardContent>
        </Card>

        <Card elevation={0}>
          <CardContent>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'action.hover',
                mb: 3
              }}
            >
              <i className='tabler-users text-2xl' />
            </Box>

            <Typography
              variant='h6'
              fontWeight={600}
            >
              Registration Management
            </Typography>

            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ mt: 1, minHeight: 42 }}
            >
              View participants, registration status, and
              imported registrations.
            </Typography>

            <Button
              component={Link}
              href='/admin/events'
              variant='outlined'
              sx={{
                mt: 3,
                borderRadius: 0
              }}
            >
              View Registrations
            </Button>
          </CardContent>
        </Card>

        <Card elevation={0}>
          <CardContent>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'action.hover',
                mb: 3
              }}
            >
              <i className='tabler-package text-2xl' />
            </Box>

            <Typography
              variant='h6'
              fontWeight={600}
            >
              Event Packages
            </Typography>

            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ mt: 1, minHeight: 42 }}
            >
              Configure package names, prices, benefits,
              and availability for each event.
            </Typography>

            <Button
              component={Link}
              href='/admin/events'
              variant='outlined'
              sx={{
                mt: 3,
                borderRadius: 0
              }}
            >
              Manage Packages
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Getting Started */}
      <Card elevation={0}>
        <CardContent>
          <Typography
            variant='h6'
            fontWeight={600}
          >
            Event Operations
          </Typography>

          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mt: 1 }}
          >
            Start by creating an event, configure its
            registration packages, and then manage participants.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Button
              component={Link}
              href='/admin/events'
              variant='contained'
              startIcon={
                <i className='tabler-calendar-plus' />
              }
              sx={{
                borderRadius: 0
              }}
            >
              Create Event
            </Button>

            <Button
              component={Link}
              href='/about'
              variant='outlined'
              startIcon={
                <i className='tabler-info-circle' />
              }
              sx={{
                borderRadius: 0
              }}
            >
              About
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default HomeDashboard
