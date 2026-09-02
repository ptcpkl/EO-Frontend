'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import {
  getPublicRegistrationTicket,
  getPublicRegistrationTicketPdf,
  resolveRegistrationAccessToken,
  type PublicRegistrationTicketResponse
} from '@/registrations/services/registration-public.service'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)

const formatSchedule = (startUtc: string, endUtc: string) => {
  const start = new Date(startUtc)
  const end = new Date(endUtc)
  const date = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(start)
  const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  return `${date}, ${timeFormatter.format(start)} - ${timeFormatter.format(end)} WIB`
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const RegistrationTicketPage = () => {
  const params = useParams<{ bookingCode: string }>()
  const bookingCode = params.bookingCode
  const [data, setData] = useState<PublicRegistrationTicketResponse | null>(null)
  const [error, setError] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

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

  const handleDownload = async () => {
    const token = resolveRegistrationAccessToken(bookingCode)

    if (!token) {
      setDownloadError('Secure ticket token is not available. Open this page again from the ticket link in your email.')
      return
    }

    setDownloadError('')
    setIsDownloading(true)

    try {
      const blob = await getPublicRegistrationTicketPdf(bookingCode, token)
      downloadBlob(blob, `${bookingCode}-ticket.pdf`)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Unable to download ticket PDF.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: 2, py: { xs: 4, md: 8 } }}>
      <Box sx={{ width: '100%', maxWidth: 660, mx: 'auto' }}>
        {!data && !error && (
          <Card>
            <CardContent sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={32} />
            </CardContent>
          </Card>
        )}

        {error && <Alert severity='error'>{error}</Alert>}

        {data && (
          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Chip label='Event Ticket' color='primary' variant='tonal' size='small' />
                  <Typography variant='h4' fontWeight={700} sx={{ mt: 2 }}>{data.eventName}</Typography>
                  <Typography color='text.secondary' sx={{ mt: 1 }}>{data.eventPackageName ?? 'Event access'}</Typography>
                </Box>
                <Chip label={data.status} color='success' variant='tonal' icon={<i className='tabler-circle-check' />} />
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Ticket No.</Typography>
                  <Typography fontWeight={700} sx={{ mt: .5 }}>
                    {data.registrationId.replaceAll('-', '').slice(0, 12).toUpperCase()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Booking Code</Typography>
                  <Typography fontWeight={700} sx={{ mt: .5, overflowWrap: 'anywhere' }}>{data.bookingCode}</Typography>
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Participant</Typography>
                  <Typography fontWeight={700} sx={{ mt: .5 }}>{data.fullName}</Typography>
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Price</Typography>
                  <Typography fontWeight={700} sx={{ mt: .5 }}>{formatCurrency(data.grossAmount)}</Typography>
                </Box>
              </Box>

              <Card variant='outlined' sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant='h6' fontWeight={600}>Event information</Typography>
                  <Box sx={{ display: 'grid', gap: 2.25, mt: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <i className='tabler-calendar-event' />
                      <Typography variant='body2'>{formatSchedule(data.eventStartAtUtc, data.eventEndAtUtc)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <i className='tabler-map-pin' />
                      <Typography variant='body2'>{data.eventLocation || 'Location to be announced'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <i className='tabler-package' />
                      <Typography variant='body2'>{data.eventPackageName ?? '-'}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Alert severity='info' sx={{ mt: 3 }}>
                Your secure QR check-in is included in the PDF ticket sent by the backend. Keep the ticket and QR private.
              </Alert>

              {downloadError && <Alert severity='error' sx={{ mt: 3 }}>{downloadError}</Alert>}

              <Button
                fullWidth
                variant='contained'
                size='large'
                onClick={() => void handleDownload()}
                disabled={isDownloading}
                startIcon={isDownloading ? <CircularProgress size={17} color='inherit' /> : <i className='tabler-download' />}
                sx={{ mt: 4 }}
              >
                {isDownloading ? 'Preparing PDF...' : 'Download Ticket PDF'}
              </Button>

              <Button component={Link} href='/home' fullWidth variant='outlined' sx={{ mt: 2 }}>
                Back To Home Screen
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default RegistrationTicketPage
