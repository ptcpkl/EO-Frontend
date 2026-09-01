'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import {
  getPublicRegistrationTicket,
  resolveRegistrationAccessToken,
  type PublicRegistrationTicketResponse
} from '@/registrations/services/registration-public.service'

type Props = {
  params: Promise<{ bookingCode: string }>
}

const RegistrationTicketPage = ({ params }: Props) => {
  const { bookingCode } = use(params)
  const [data, setData] = useState<PublicRegistrationTicketResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const token = resolveRegistrationAccessToken(bookingCode)

      if (!token) {
        setError('Registration access token is not available. Open the secure ticket link from your email or the registration status page first.')
        return
      }

      try {
        const result = await getPublicRegistrationTicket(bookingCode, token)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load ticket.')
      }
    }

    void load()
    return () => { cancelled = true }
  }, [bookingCode])

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', px: 2, py: 6, bgcolor: 'background.default' }}>
      <Card elevation={0} sx={{ width: '100%', maxWidth: 620, border: theme => `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Typography variant='h4' fontWeight={700}>Event Ticket</Typography>
          {!data && !error && <CircularProgress size={28} sx={{ mt: 4 }} />}
          {error && <Alert severity='error' sx={{ mt: 4 }}>{error}</Alert>}

          {data && (
            <Box sx={{ mt: 4, display: 'grid', gap: 1.25 }}>
              <Typography><strong>Name:</strong> {data.fullName}</Typography>
              <Typography><strong>Event:</strong> {data.eventName}</Typography>
              <Typography><strong>Package:</strong> {data.eventPackageName ?? '-'}</Typography>
              <Typography><strong>Booking code:</strong> {data.bookingCode}</Typography>
              <Typography><strong>Status:</strong> {data.status}</Typography>

              <Alert severity='info' sx={{ mt: 2 }}>
                This secure ticket token is what the backend validates at check-in. The visual QR renderer can use this token as its payload.
              </Alert>

              <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover', overflowWrap: 'anywhere' }}>
                <Typography variant='caption' color='text.secondary'>QR token payload</Typography>
                <Typography component='code' sx={{ display: 'block', mt: 1, fontFamily: 'monospace', fontSize: 13 }}>
                  {data.qrToken}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3 }}>
                <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/status`} variant='contained'>Back to Status</Button>
                <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/receipt`} variant='outlined'>Receipt</Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default RegistrationTicketPage
