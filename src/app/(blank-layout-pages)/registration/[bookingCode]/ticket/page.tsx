'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import {
  getPublicRegistrationTicket,
  getPublicRegistrationTicketPdf,
  resolveRegistrationAccessToken,
  type PublicRegistrationTicketResponse
} from '@/registrations/services/registration-public.service'

type Props = {
  params: Promise<{ bookingCode: string }>
}

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

const RegistrationTicketPage = ({ params }: Props) => {
  const { bookingCode } = use(params)
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
    <Box sx={{ minHeight: '100dvh', bgcolor: '#eef2f5', px: 2, py: { xs: 3, md: 6 } }}>
      <Box sx={{ width: '100%', maxWidth: 760, mx: 'auto' }}>
        {!data && !error && (
          <Box sx={{ minHeight: 420, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={30} />
          </Box>
        )}

        {error && <Alert severity='error'>{error}</Alert>}

        {data && (
          <Card elevation={0} sx={{ overflow: 'hidden', border: '1px solid #dfe6ec', borderRadius: 3 }}>
            <Box sx={{ bgcolor: '#0b5cab', color: 'white', px: { xs: 3, sm: 4 }, py: 3.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.8, opacity: 0.88 }}>
                PTC EVENT ORGANIZER
              </Typography>
              <Typography variant='h4' sx={{ mt: 1, fontWeight: 800, lineHeight: 1.2 }}>
                Event Ticket
              </Typography>
              <Typography sx={{ mt: 1, opacity: 0.92 }}>{data.eventName}</Typography>
            </Box>

            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant='overline' color='text.secondary'>Ticket No.</Typography>
                  <Typography fontWeight={800}>{data.registrationId.replaceAll('-', '').slice(0, 12).toUpperCase()}</Typography>
                </Box>
                <Box>
                  <Typography variant='overline' color='text.secondary'>No. Pesanan</Typography>
                  <Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>{data.bookingCode}</Typography>
                </Box>
                <Box>
                  <Typography variant='overline' color='text.secondary'>Nama</Typography>
                  <Typography fontWeight={700}>{data.fullName}</Typography>
                </Box>
                <Box>
                  <Typography variant='overline' color='text.secondary'>Status</Typography>
                  <Typography fontWeight={700} color='success.main'>{data.status}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant='h6' fontWeight={800}>Informasi Event</Typography>
              <Box sx={{ mt: 2, display: 'grid', gap: 1.2 }}>
                <Typography><strong>Paket:</strong> {data.eventPackageName ?? '-'}</Typography>
                <Typography><strong>Jadwal:</strong> {formatSchedule(data.eventStartAtUtc, data.eventEndAtUtc)}</Typography>
                <Typography><strong>Lokasi:</strong> {data.eventLocation || 'Akan diinformasikan'}</Typography>
                <Typography><strong>Harga:</strong> Rp{data.grossAmount.toLocaleString('id-ID')}</Typography>
              </Box>

              <Alert severity='info' sx={{ mt: 3 }}>
                QR check-in tersimpan di PDF ticket. Jangan membagikan PDF, QR, atau token ticket kepada orang lain.
              </Alert>

              {downloadError && <Alert severity='error' sx={{ mt: 2 }}>{downloadError}</Alert>}

              <Button
                fullWidth
                variant='contained'
                size='large'
                onClick={handleDownload}
                disabled={isDownloading}
                startIcon={isDownloading ? <CircularProgress size={17} color='inherit' /> : <i className='tabler-download' />}
                sx={{ mt: 3, py: 1.4, fontWeight: 800 }}
              >
                {isDownloading ? 'Menyiapkan PDF...' : 'Download Ticket PDF'}
              </Button>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
                <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/status`} variant='text'>Back to Status</Button>
                <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/receipt`} variant='outlined'>Lihat Receipt</Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default RegistrationTicketPage
