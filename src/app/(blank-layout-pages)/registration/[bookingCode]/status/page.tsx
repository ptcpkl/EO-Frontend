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
  getPublicRegistrationStatus,
  resolveRegistrationAccessToken,
  type PublicRegistrationStatusResponse
} from '@/registrations/services/registration-public.service'

type Props = {
  params: Promise<{ bookingCode: string }>
}

const RegistrationStatusPage = ({ params }: Props) => {
  const { bookingCode } = use(params)
  const [data, setData] = useState<PublicRegistrationStatusResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      const token = resolveRegistrationAccessToken(bookingCode)

      if (!token) {
        if (!cancelled) {
          setError('Registration access token is not available in this browser. Open the secure link from your registration email or register from this browser first.')
          setLoading(false)
        }
        return
      }

      try {
        const result = await getPublicRegistrationStatus(bookingCode, token)
        if (cancelled) return

        setData(result)
        setError('')
        setLoading(false)

        if (result.status === 'PendingPayment') {
          timer = setTimeout(load, 3000)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load registration status.')
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [bookingCode])

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', px: 2, py: 6, bgcolor: 'background.default' }}>
      <Card elevation={0} sx={{ width: '100%', maxWidth: 600, border: theme => `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Typography variant='h4' fontWeight={700}>Registration Status</Typography>
          <Typography color='text.secondary' sx={{ mt: 1 }}>Booking code: {bookingCode}</Typography>

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
              <CircularProgress size={24} />
              <Typography>Checking payment status...</Typography>
            </Box>
          )}

          {error && <Alert severity='error' sx={{ mt: 4 }}>{error}</Alert>}

          {data && (
            <Box sx={{ mt: 4, display: 'grid', gap: 1.25 }}>
              <Typography><strong>Name:</strong> {data.fullName}</Typography>
              <Typography><strong>Event:</strong> {data.eventName}</Typography>
              <Typography><strong>Package:</strong> {data.eventPackageName ?? '-'}</Typography>
              <Typography><strong>Registration:</strong> {data.status}</Typography>
              <Typography><strong>Payment:</strong> {data.paymentStatus}</Typography>
              <Typography><strong>Total:</strong> Rp{data.grossAmount.toLocaleString('id-ID')}</Typography>

              {data.status === 'PendingPayment' && (
                <Alert severity='info' sx={{ mt: 2 }}>
                  Payment is still pending. This page checks the backend automatically every few seconds.
                </Alert>
              )}

              {data.status === 'Paid' && (
                <Alert severity='success' sx={{ mt: 2 }}>Payment confirmed. Your ticket and receipt are ready.</Alert>
              )}

              {['Failed', 'Expired', 'Cancelled'].includes(data.status) && (
                <Alert severity='warning' sx={{ mt: 2 }}>
                  This registration is no longer active. Any reserved quota has been released by the backend.
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
                {data.ticketAvailable && (
                  <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/ticket`} variant='contained'>View Ticket</Button>
                )}
                {data.receiptAvailable && (
                  <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/receipt`} variant='outlined'>View Receipt</Button>
                )}
                <Button component={Link} href='/home' variant='text'>Home</Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default RegistrationStatusPage
