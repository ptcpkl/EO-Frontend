'use client'

import { useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

type Panel = 'purpose' | 'platform' | 'flow'

type Props = {
  publicPage?: boolean
}

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
    description: 'The interface exposes operational features from one connected event workflow.',
    items: [
      ['tabler-calendar-event', 'Events & packages', 'Create, edit, publish, archive, upload event assets, and manage package pricing and quotas.'],
      ['tabler-users-group', 'Participants', 'Review event participants, import internal registrations, filter records, and manage registration states.'],
      ['tabler-qrcode', 'Check-ins', 'Validate ticket QR tokens against the backend and prevent invalid or duplicate attendance.']
    ]
  },
  flow: {
    title: 'One lifecycle from registration to attendance.',
    description: 'Each stage is connected so participants and the operations team see the same source of truth.',
    items: [
      ['tabler-user-plus', '1. Register', 'Participant selects an active package and submits identity and contact information.'],
      ['tabler-credit-card-pay', '2. Pay', 'Paid packages continue through Midtrans while free packages are confirmed immediately.'],
      ['tabler-ticket', '3. Receive ticket', 'Confirmed registrations unlock secure ticket access and payment receipts when applicable.'],
      ['tabler-scan', '4. Check in', 'Admin or Staff validates the ticket QR and records attendance.']
    ]
  }
}

const highlights = [
  ['tabler-lock', 'Secure access', 'Protected admin routes, JWT sessions, secure participant access tokens, and signed payment notifications.'],
  ['tabler-file-type-pdf', 'Ticket & receipt', 'Server-generated documents are tied to authoritative registration and payment state.'],
  ['tabler-file-spreadsheet', 'Internal imports', 'Operational teams can import internal participants through the Excel workflow.'],
  ['tabler-packages', 'Package-first pricing', 'Displayed event pricing follows active package pricing instead of duplicated manual values.']
]

const AboutContent = ({ publicPage = false }: Props) => {
  const [panel, setPanel] = useState<Panel>('purpose')
  const active = panels[panel]

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1180,
        mx: 'auto',
        px: publicPage ? 3 : 0,
        pt: publicPage ? { xs: 14, md: 16 } : 0,
        pb: publicPage ? { xs: 7, md: 10 } : 0
      }}
    >
      <Box
        sx={theme => ({
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          p: { xs: 4, sm: 6, md: 7 },
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
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
          <Chip label='PTC Event Organizer' color='primary' sx={{ mb: 3 }} />
          <Typography component='h1' sx={{ fontWeight: 900, letterSpacing: '-.035em', fontSize: { xs: '2.35rem', sm: '3.25rem', md: '4rem' }, lineHeight: 1.04 }}>
            Event operations that stay connected from registration to check-in.
          </Typography>
          <Typography color='text.secondary' sx={{ mt: 3, fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.8, maxWidth: 720 }}>
            A practical event management platform for creating events, organizing packages, managing participants, coordinating ticketing, and validating attendance.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 6 }}>
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
            <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.min(active.items.length, 4)}, minmax(0, 1fr))` }, gap: 2.5 }}>
              {active.items.map(([icon, title, description]) => (
                <Box key={title} sx={{ p: 3, borderRadius: 2.5, bgcolor: 'action.hover' }}>
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

      <Box sx={{ mt: 6 }}>
        <Typography variant='h4' fontWeight={800}>Core capabilities</Typography>
        <Typography color='text.secondary' sx={{ mt: 1 }}>The interface is built around the capabilities exposed by the event platform.</Typography>
        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
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
    </Box>
  )
}

export default AboutContent
