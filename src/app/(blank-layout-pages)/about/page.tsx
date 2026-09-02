'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { alpha, useColorScheme } from '@mui/material/styles'

import { getStoredSession } from '@/lib/auth'

type Panel = 'purpose' | 'platform' | 'flow'

const panels: Record<Panel, { title: string; description: string; items: Array<[string, string, string]> }> = {
  purpose: {
    title: 'Built for event operations, not just event listings.',
    description: 'PTC Event Organizer connects planning, participant registration, payment, ticketing, and attendance in one operational flow.',
    items: [
      ['tabler-sparkles', 'Simple experience', 'Participants get a focused registration and payment journey without needing an admin account.'],
      ['tabler-shield-check', 'Controlled operations', 'Admin and Staff permissions keep event management and check-in responsibilities separated.'],
      ['tabler-chart-dots-3', 'Traceable lifecycle', 'Registration, payment status, ticket access, imports, and check-ins are represented as explicit system states.']
    ]
  },
  platform: {
    title: 'A workspace aligned with the backend capabilities.',
    description: 'The interface exposes the operational features already available in the API and keeps unsupported capabilities clearly separated.',
    items: [
      ['tabler-calendar-event', 'Events & packages', 'Create, edit, publish, archive, upload event assets, and manage package pricing and quotas.'],
      ['tabler-users-group', 'Registrations', 'Review participants per event, import internal registrations, filter records, and cancel registrations when allowed.'],
      ['tabler-qrcode', 'Check-ins', 'Validate ticket QR tokens against the backend, including paid-state validation for external participants.']
    ]
  },
  flow: {
    title: 'One lifecycle from registration to attendance.',
    description: 'Each stage is connected so the participant and operations team see the same source of truth.',
    items: [
      ['tabler-user-plus', '1. Register', 'Participant selects an active package and submits identity/contact information.'],
      ['tabler-credit-card-pay', '2. Pay', 'Midtrans payment state is reconciled by webhook, polling, and background reconciliation.'],
      ['tabler-ticket', '3. Receive ticket', 'Paid registrations unlock the secure ticket and receipt documents.'],
      ['tabler-scan', '4. Check in', 'Admin or Staff scans the QR token and the backend prevents invalid or duplicate attendance.']
    ]
  }
}

const highlights = [
  ['tabler-lock', 'Secure access', 'Protected admin routes, JWT sessions, secure participant access tokens, and signed payment notifications.'],
  ['tabler-file-type-pdf', 'Ticket & receipt', 'Server-generated documents become available only after the payment state is authoritative.'],
  ['tabler-file-spreadsheet', 'Internal imports', 'Operational teams can import internal participants through the backend Excel workflow.'],
  ['tabler-packages', 'Package-first pricing', 'Displayed event price follows active package pricing rather than a manually duplicated event price.']
]

export default function Page() {
  const { mode, setMode } = useColorScheme()
  const [panel, setPanel] = useState<Panel>('purpose')
  const [backHref, setBackHref] = useState('/home')
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const session = getStoredSession()
    setRole(session?.role ?? null)
    setBackHref(session?.role?.toLowerCase() === 'admin' ? '/admin/home' : '/home')
  }, [])

  const active = panels[panel]

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Box
        component='header'
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
          bgcolor: theme => alpha(theme.palette.background.default, .86),
          backdropFilter: 'blur(18px)'
        }}
      >
        <Box sx={{ maxWidth: 1180, mx: 'auto', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <img src='/EO Navbar.png' alt='PTC Event Organizer' style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
            {role && <Chip label={role} size='small' variant='outlined' sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ToggleButtonGroup
              exclusive
              size='small'
              value={mode ?? 'system'}
              onChange={(_, value) => value && setMode(value)}
              aria-label='Color mode'
            >
              <ToggleButton value='light' aria-label='Light mode'><i className='tabler-sun' /></ToggleButton>
              <ToggleButton value='dark' aria-label='Dark mode'><i className='tabler-moon' /></ToggleButton>
              <ToggleButton value='system' aria-label='System mode'><i className='tabler-device-desktop' /></ToggleButton>
            </ToggleButtonGroup>
            <Button component={Link} href={backHref} variant='outlined' startIcon={<i className='tabler-arrow-left' />}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>

      <Box component='main' sx={{ maxWidth: 1180, mx: 'auto', px: 3, py: { xs: 7, md: 10 } }}>
        <Box
          sx={theme => ({
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 4,
            p: { xs: 4, sm: 6, md: 8 },
            border: `1px solid ${theme.palette.divider}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, .14)}, ${alpha(theme.palette.info.main, .06)} 48%, ${alpha(theme.palette.success.main, .08)})`,
            '&::after': {
              content: '""',
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: '50%',
              right: -120,
              top: -160,
              bgcolor: alpha(theme.palette.primary.main, .12),
              filter: 'blur(10px)'
            }
          })}
        >
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 780 }}>
            <Chip label='PTC Event Organizer' color='primary' sx={{ mb: 3 }} />
            <Typography component='h1' sx={{ fontWeight: 900, letterSpacing: '-.035em', fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' }, lineHeight: 1.02 }}>
              Event operations that stay connected from registration to check-in.
            </Typography>
            <Typography color='text.secondary' sx={{ mt: 3, fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.8, maxWidth: 720 }}>
              A practical event management platform for PTC teams to create events, organize packages, manage participants, coordinate payment-backed ticketing, and validate attendance.
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <Chip icon={<i className='tabler-brand-nextjs' />} label='Next.js Frontend' variant='outlined' />
              <Chip icon={<i className='tabler-api' />} label='.NET Backend' variant='outlined' />
              <Chip icon={<i className='tabler-database' />} label='PostgreSQL' variant='outlined' />
              <Chip icon={<i className='tabler-credit-card' />} label='Midtrans' variant='outlined' />
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 7 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {([
              ['purpose', 'Purpose'],
              ['platform', 'Platform'],
              ['flow', 'Lifecycle']
            ] as Array<[Panel, string]>).map(([value, label]) => (
              <Button
                key={value}
                variant={panel === value ? 'contained' : 'outlined'}
                onClick={() => setPanel(value)}
                startIcon={<i className={value === 'purpose' ? 'tabler-bulb' : value === 'platform' ? 'tabler-layout-dashboard' : 'tabler-route'} />}
              >
                {label}
              </Button>
            ))}
          </Box>

          <Card elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Typography variant='h4' fontWeight={800}>{active.title}</Typography>
              <Typography color='text.secondary' sx={{ mt: 1.5, maxWidth: 780, lineHeight: 1.7 }}>{active.description}</Typography>

              <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.min(active.items.length, 4)}, 1fr)` }, gap: 2.5 }}>
                {active.items.map(([icon, title, description]) => (
                  <Box key={title} sx={{ p: 3, borderRadius: 2.5, bgcolor: 'action.hover', transition: 'transform .2s ease', '&:hover': { transform: 'translateY(-4px)' } }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                      <i className={`${icon} text-xl`} />
                    </Box>
                    <Typography variant='h6' fontWeight={700} sx={{ mt: 2.5 }}>{title}</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1, lineHeight: 1.7 }}>{description}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 7 }}>
          <Typography variant='h4' fontWeight={800}>Core capabilities</Typography>
          <Typography color='text.secondary' sx={{ mt: 1 }}>The admin interface is designed around capabilities that the backend already exposes.</Typography>
          <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5 }}>
            {highlights.map(([icon, title, description]) => (
              <Card key={title} elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
                <CardContent sx={{ p: 3.5, display: 'flex', gap: 2.5 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, flex: '0 0 auto', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
                    <i className={`${icon} text-2xl`} />
                  </Box>
                  <Box>
                    <Typography variant='h6' fontWeight={700}>{title}</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1, lineHeight: 1.7 }}>{description}</Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 7 }} />

        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant='h4' fontWeight={800}>Ready to operate an event?</Typography>
          <Typography color='text.secondary' sx={{ mt: 1.5 }}>Go back to your workspace and continue from the role you are signed in with.</Typography>
          <Button component={Link} href={backHref} size='large' variant='contained' sx={{ mt: 3 }} endIcon={<i className='tabler-arrow-right' />}>
            Open workspace
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
