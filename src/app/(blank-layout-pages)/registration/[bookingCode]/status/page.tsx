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
import { openMidtransSnap } from '@/registrations/lib/midtrans'
import {
  getPublicRegistrationReceipt,
  getPublicRegistrationStatus,
  resolveRegistrationAccessToken,
  type PublicRegistrationReceiptResponse,
  type PublicRegistrationStatusResponse
} from '@/registrations/services/registration-public.service'

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, py: 1.5 }}>
    <Typography variant='body2' color='text.secondary'>{label}</Typography>
    <Typography variant='body2' fontWeight={600} sx={{ textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</Typography>
  </Box>
)

const SuccessIcon = () => (
  <Box sx={{ width: 88, height: 88, mx: 'auto', display: 'grid', placeItems: 'center', borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.main' }}>
    <Box sx={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: '50%', bgcolor: 'success.main', color: 'success.contrastText' }}>
      <i className='tabler-check text-3xl' />
    </Box>
  </Box>
)

const RegistrationStatusPage = () => {
  const params = useParams<{ bookingCode: string }>()
  const bookingCode = params.bookingCode
  const [data, setData] = useState<PublicRegistrationStatusResponse | null>(null)
  const [receipt, setReceipt] = useState<PublicRegistrationReceiptResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [openingPayment, setOpeningPayment] = useState(false)

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

        if (result.paymentStatus.toLowerCase() === 'paid' && result.receiptAvailable) {
          try {
            const receiptResult = await getPublicRegistrationReceipt(bookingCode, token)
            if (!cancelled) setReceipt(receiptResult)
          } catch {
            if (!cancelled) setReceipt(null)
          }
        }

        if (result.status === 'PendingPayment') timer = setTimeout(load, 3000)
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

  const paymentStatus = data?.paymentStatus.toLowerCase()
  const paymentConfirmed = paymentStatus === 'paid'
  const paymentNotRequired = paymentStatus === 'notrequired' || paymentStatus === 'not_required' || paymentStatus === 'not required'
  const registrationActive = Boolean(data && ['Registered', 'CheckedIn'].includes(data.status))
  const successfulPaid = registrationActive && paymentConfirmed
  const successfulFree = registrationActive && paymentNotRequired

  const handleContinuePayment = async () => {
    if (!data?.snapToken || data.status !== 'PendingPayment') return
    setOpeningPayment(true)
    setError('')

    try {
      await openMidtransSnap(data.snapToken, {
        onSuccess: () => window.location.reload(),
        onPending: () => window.location.reload(),
        onError: () => setError('Payment could not be completed. You can try again while the payment is still active.'),
        onClose: () => setOpeningPayment(false)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open secure payment.')
    } finally {
      setOpeningPayment(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, px: 2, py: { xs: 4, md: 8 } }}>
        <Box sx={{ width: '100%', maxWidth: 560, mx: 'auto' }}>
          {loading && <Card><CardContent sx={{ py: 10, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} /></CardContent></Card>}
          {error && !data && <Alert severity='error'>{error}</Alert>}

          {data && (
            <Card>
              <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                {successfulPaid ? (
                  <>
                    <Box sx={{ textAlign: 'center' }}>
                      <SuccessIcon />
                      <Typography variant='h4' fontWeight={700} sx={{ mt: 3 }}>Payment successful</Typography>
                      <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>Successfully paid {formatCurrency(data.grossAmount)}</Typography>
                    </Box>

                    <Typography variant='h6' fontWeight={600} sx={{ mt: 6, mb: 2 }}>Payment details</Typography>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 3, py: 1 }}>
                      <DetailRow label='Transaction ID' value={receipt?.transactionId ?? data.registrationId} />
                      <Divider /><DetailRow label='Date' value={formatDate(receipt?.paidAtUtc ?? data.paidAtUtc ?? data.registeredAtUtc)} />
                      <Divider /><DetailRow label='Type of Transaction' value={receipt?.paymentType ?? data.paymentStatus} />
                      <Divider /><DetailRow label='Package' value={data.eventPackageName ?? '-'} />
                      <Divider /><DetailRow label='Nominal' value={formatCurrency(data.grossAmount)} />
                      <Divider /><DetailRow label='Admin' value={formatCurrency(0)} />
                      <Divider /><DetailRow label='Status' value={<Chip label='Success' color='success' variant='tonal' size='small' icon={<i className='tabler-circle-check' />} />} />
                    </Box>
                    <Box sx={{ mt: 3, px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
                      <Typography variant='h6' color='inherit' fontWeight={600}>Total</Typography>
                      <Typography variant='h6' color='inherit' fontWeight={700}>{formatCurrency(data.grossAmount)}</Typography>
                    </Box>
                    <Button component={Link} href='/home' fullWidth variant='contained' size='large' sx={{ mt: 4 }}>Back To Home Screen</Button>
                  </>
                ) : successfulFree ? (
                  <>
                    <Box sx={{ textAlign: 'center' }}>
                      <SuccessIcon />
                      <Typography variant='h4' fontWeight={700} sx={{ mt: 3 }}>Registration successful</Typography>
                      <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>Your place has been confirmed. No payment is required for this package.</Typography>
                    </Box>

                    <Typography variant='h6' fontWeight={600} sx={{ mt: 6, mb: 2 }}>Registration details</Typography>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 3, py: 1 }}>
                      <DetailRow label='Booking Code' value={bookingCode} />
                      <Divider /><DetailRow label='Event' value={data.eventName} />
                      <Divider /><DetailRow label='Package' value={data.eventPackageName ?? '-'} />
                      <Divider /><DetailRow label='Registration Fee' value={<Chip label='Free' color='success' variant='tonal' size='small' />} />
                      <Divider /><DetailRow label='Registered At' value={formatDate(data.registeredAtUtc)} />
                      <Divider /><DetailRow label='Status' value={<Chip label='Registered' color='success' variant='tonal' size='small' icon={<i className='tabler-circle-check' />} />} />
                    </Box>
                    <Alert severity='success' sx={{ mt: 3 }}>Your ticket is ready and is also sent to the registered email address.</Alert>
                    <Button component={Link} href='/home' fullWidth variant='contained' size='large' sx={{ mt: 4 }}>Back To Home Screen</Button>
                  </>
                ) : (
                  <>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <Box sx={{ width: 72, height: 72, mx: 'auto', display: 'grid', placeItems: 'center', borderRadius: '50%', bgcolor: data.status === 'PendingPayment' ? 'warning.lighter' : 'action.hover', color: data.status === 'PendingPayment' ? 'warning.main' : 'text.secondary' }}>
                        <i className={`${data.status === 'PendingPayment' ? 'tabler-clock' : 'tabler-alert-circle'} text-3xl`} />
                      </Box>
                      <Typography variant='h4' fontWeight={700} sx={{ mt: 3 }}>{data.status === 'PendingPayment' ? 'Payment pending' : 'Registration status'}</Typography>
                      <Typography color='text.secondary' sx={{ mt: 1 }}>{data.eventName}</Typography>
                    </Box>
                    {error && <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert>}
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 3, py: 1 }}>
                      <DetailRow label='Booking Code' value={bookingCode} />
                      <Divider /><DetailRow label='Package' value={data.eventPackageName ?? '-'} />
                      <Divider /><DetailRow label='Payment' value={data.paymentStatus} />
                      <Divider /><DetailRow label='Total' value={formatCurrency(data.grossAmount)} />
                    </Box>
                    {data.status === 'PendingPayment' && data.snapToken && <Button fullWidth variant='contained' size='large' sx={{ mt: 4 }} disabled={openingPayment} onClick={() => void handleContinuePayment()}>{openingPayment ? 'Opening Payment...' : 'Continue Payment'}</Button>}
                    {['Failed', 'Expired', 'Cancelled'].includes(data.status) && <Alert severity='warning' sx={{ mt: 3 }}>This registration is no longer active. Any reserved quota has been released by the backend.</Alert>}
                    <Button component={Link} href='/home' fullWidth variant='outlined' sx={{ mt: 2 }}>Back To Home Screen</Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
      <PublicFooter />
    </Box>
  )
}

export default RegistrationStatusPage
