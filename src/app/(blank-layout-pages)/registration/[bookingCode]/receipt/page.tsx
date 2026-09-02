'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'

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
  getPublicRegistrationReceipt,
  getPublicRegistrationReceiptPdf,
  resolveRegistrationAccessToken,
  type PublicRegistrationReceiptResponse
} from '@/registrations/services/registration-public.service'

type Props = {
  params: Promise<{ bookingCode: string }>
}

const formatWib = (value: string) =>
  `${new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value))} WIB`

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

const RegistrationReceiptPage = ({ params }: Props) => {
  const { bookingCode } = use(params)
  const [data, setData] = useState<PublicRegistrationReceiptResponse | null>(null)
  const [error, setError] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

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

  const handleDownload = async () => {
    const token = resolveRegistrationAccessToken(bookingCode)

    if (!token) {
      setDownloadError('Secure receipt token is not available. Open this page again from the receipt link in your email.')
      return
    }

    setDownloadError('')
    setIsDownloading(true)

    try {
      const blob = await getPublicRegistrationReceiptPdf(bookingCode, token)
      downloadBlob(blob, `${bookingCode}-receipt.pdf`)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Unable to download receipt PDF.')
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
                Bukti Pembayaran
              </Typography>
              <Typography sx={{ mt: 1, opacity: 0.92 }}>{data.eventName}</Typography>
            </Box>

            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant='overline' color='text.secondary'>No. Pesanan</Typography>
                  <Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>{data.bookingCode}</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 0.8 }}>{formatWib(data.paidAtUtc)}</Typography>
                </Box>
                <Chip label='LUNAS / PAID' color='success' sx={{ fontWeight: 800 }} />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant='h6' fontWeight={800}>Informasi Pembeli</Typography>
              <Box sx={{ mt: 2, display: 'grid', gap: 1.1 }}>
                <Typography><strong>Nama:</strong> {data.fullName}</Typography>
                <Typography><strong>Email:</strong> {data.email}</Typography>
                <Typography><strong>Telepon:</strong> {data.phone}</Typography>
              </Box>

              <Box sx={{ mt: 3, p: 2.2, bgcolor: '#f4f7f9', borderRadius: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Metode Pembayaran</Typography>
                  <Typography fontWeight={800}>{data.paymentType ?? '-'}</Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant='caption' color='text.secondary'>Transaction ID</Typography>
                  <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{data.transactionId ?? '-'}</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.4, bgcolor: '#f4f7f9', display: 'grid', gridTemplateColumns: '1fr auto', gap: 2 }}>
                  <Typography variant='caption' fontWeight={800}>ITEM</Typography>
                  <Typography variant='caption' fontWeight={800}>SUBTOTAL</Typography>
                </Box>
                <Box sx={{ px: 2, py: 2, display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, alignItems: 'start' }}>
                  <Box>
                    <Typography fontWeight={700}>{data.eventPackageName ?? data.eventName}</Typography>
                    <Typography variant='caption' color='text.secondary'>Qty 1</Typography>
                  </Box>
                  <Typography fontWeight={700}>Rp{data.grossAmount.toLocaleString('id-ID')}</Typography>
                </Box>
                <Divider />
                <Box sx={{ px: 2, py: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography fontWeight={800}>Total</Typography>
                  <Typography variant='h6' fontWeight={900}>Rp{data.grossAmount.toLocaleString('id-ID')}</Typography>
                </Box>
              </Box>

              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1.5, lineHeight: 1.5 }}>
                Total mengikuti nilai transaksi yang tercatat di sistem. Tidak ada rincian biaya tambahan yang ditampilkan jika memang tidak dicatat oleh aplikasi.
              </Typography>

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
                {isDownloading ? 'Menyiapkan PDF...' : 'Download Receipt PDF'}
              </Button>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
                <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/status`} variant='text'>Back to Status</Button>
                <Button component={Link} href={`/registration/${encodeURIComponent(bookingCode)}/ticket`} variant='outlined'>Lihat Ticket</Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default RegistrationReceiptPage
