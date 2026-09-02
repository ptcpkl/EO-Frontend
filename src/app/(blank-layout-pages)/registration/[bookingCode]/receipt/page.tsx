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

import PublicFooter from '@/components/public/PublicFooter'
import {
  getPublicRegistrationReceipt,
  getPublicRegistrationReceiptPdf,
  resolveRegistrationAccessToken,
  type PublicRegistrationReceiptResponse
} from '@/registrations/services/registration-public.service'

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
const formatWib = (value: string) => `${new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))} WIB`

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

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, py: 1.5 }}>
    <Typography variant='body2' color='text.secondary'>{label}</Typography>
    <Typography variant='body2' fontWeight={600} sx={{ textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</Typography>
  </Box>
)

const RegistrationReceiptPage = () => {
  const params = useParams<{ bookingCode: string }>()
  const bookingCode = params.bookingCode
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
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, px: 2, py: { xs: 4, md: 8 } }}>
        <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
          {!data && !error && <Card><CardContent sx={{ py: 10, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} /></CardContent></Card>}
          {error && <Alert severity='error'>{error}</Alert>}
          {data && (
            <Card>
              <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ width: 72, height: 72, mx: 'auto', display: 'grid', placeItems: 'center', borderRadius: '50%', bgcolor: 'action.hover', color: 'success.main' }}><i className='tabler-receipt-2 text-3xl' /></Box>
                  <Typography variant='h4' fontWeight={700} sx={{ mt: 3 }}>Payment Receipt</Typography>
                  <Typography color='text.secondary' sx={{ mt: 1 }}>{data.eventName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><Chip label='Paid' color='success' variant='tonal' icon={<i className='tabler-circle-check' />} /></Box>
                <Typography variant='h6' fontWeight={600} sx={{ mt: 5, mb: 2 }}>Transaction details</Typography>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 3, py: 1 }}>
                  <DetailRow label='Transaction ID' value={data.transactionId ?? '-'} /><Divider />
                  <DetailRow label='Booking Code' value={data.bookingCode} /><Divider />
                  <DetailRow label='Date' value={formatWib(data.paidAtUtc)} /><Divider />
                  <DetailRow label='Payment Method' value={data.paymentType ?? '-'} /><Divider />
                  <DetailRow label='Package' value={data.eventPackageName ?? '-'} /><Divider />
                  <DetailRow label='Participant' value={data.fullName} /><Divider />
                  <DetailRow label='Email' value={data.email} /><Divider />
                  <DetailRow label='Nominal' value={formatCurrency(data.grossAmount)} /><Divider />
                  <DetailRow label='Admin' value={formatCurrency(0)} />
                </Box>
                <Box sx={{ mt: 3, px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
                  <Typography variant='h6' color='inherit' fontWeight={600}>Total</Typography>
                  <Typography variant='h6' color='inherit' fontWeight={700}>{formatCurrency(data.grossAmount)}</Typography>
                </Box>
                {downloadError && <Alert severity='error' sx={{ mt: 3 }}>{downloadError}</Alert>}
                <Button fullWidth variant='contained' size='large' onClick={() => void handleDownload()} disabled={isDownloading} startIcon={isDownloading ? <CircularProgress size={17} color='inherit' /> : <i className='tabler-download' />} sx={{ mt: 4 }}>
                  {isDownloading ? 'Preparing PDF...' : 'Download Receipt PDF'}
                </Button>
                <Button component={Link} href='/home' fullWidth variant='outlined' sx={{ mt: 2 }}>Back To Home Screen</Button>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
      <PublicFooter />
    </Box>
  )
}

export default RegistrationReceiptPage
