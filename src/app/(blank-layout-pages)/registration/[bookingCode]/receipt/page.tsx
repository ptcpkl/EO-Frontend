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
  getPublicRegistrationReceipt,
  resolveRegistrationAccessToken,
  type PublicRegistrationReceiptResponse
} from '@/registrations/services/registration-public.service'

type Props = {
  params: Promise<{ bookingCode: string }>
}

const RegistrationReceiptPage = ({ params }: Props) => {
  const { bookingCode } = use(params)
  const [data, setData] = useState<PublicRegistrationReceiptResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const token = resolveRegistrationAccessToken(bookingCode)

      if (!token) {
        setError('Registration access token is not available. Open the secure receipt link from your email or the registration status page first.')
        return
      }

      try {
        const result = await getPublicRegistrationReceipt(bookingCode, token)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load receipt.')
      }
    }

    void load()
    return () => { cancelled = true }
  }, [bookingCode])

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', px: 2, py: 6, bgcolor: 'background.default' }}>
      <Card elevation={0} sx={{ width: '100%', maxWidth: 620, border: theme => `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Typography variant='h4' fontWeight={700}>Payment Receipt</Typography>
          {!data && !error && <CircularProgress size={28} sx={{ mt: 4 }} />}
          {error && <Alert severity='error' sx={{ mt: 4 }}>{error}</Alert>}

          {data && (
            <Box sx={{ mt: 4, display: 'grid', gap: 1.25 }}>
              <Typography><strong>Name:</strong> {data.fullName}</Typography>
              <Typography><strong>Event:</strong> {data.eventName}</Typography>
              <Typography><strong>Package:</strong> {data.eventPackageName ?? '-'}</Typography>
              <Typography><strong>Booking code:</strong> {data.bookingCode}</Typography>
              <Typography><strong>Amount:</strong> Rp{data.grossAmount.toLocaleString('id-ID')}</Typography>
              <Typography><strong>Payment status:</strong> {data.paymentStatus}</Typography>
              <Typography><strong>Payment type:</strong> {data.paymentType ?? '-'}</Typography>
              <Typography><strong>Transaction ID:</strong> {data.transactionId ?? '-'}</Typography>
              <Typography><strong>Paid at:</strong> {new Date(data.paidAtUtc).toLocaleString('id-ID')}</Typography>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3 }}>
                <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/status`} variant='contained'>Back to Status</Button>
                <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/ticket`} variant='outlined'>Ticket</Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default RegistrationReceiptPage
