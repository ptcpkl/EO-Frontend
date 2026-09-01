'use client'

import { use } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

type Props = {
  params: Promise<{
    slug: string
  }>
}

const PaymentPendingPage = ({ params }: Props) => {
  const { slug } = use(params)
  const searchParams = useSearchParams()
  const bookingCode = searchParams.get('bookingCode')
  const registrationId = searchParams.get('registrationId')

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
        bgcolor: 'background.default'
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 560,
          border: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
                mb: 3
              }}
            >
              <i className='tabler-clock-hour-4 text-4xl' />
            </Box>

            <Typography variant='h4' fontWeight={700}>
              Pembayaran Menunggu Penyelesaian
            </Typography>

            <Typography color='text.secondary' sx={{ mt: 1.5, maxWidth: 440 }}>
              Registrasi sudah dibuat, tetapi pembayaran masih berstatus pending. Selesaikan pembayaran sesuai instruksi Midtrans.
            </Typography>

            {bookingCode && (
              <Box
                sx={{
                  mt: 3,
                  width: '100%',
                  p: 2.5,
                  bgcolor: 'action.hover',
                  borderRadius: 2
                }}
              >
                <Typography variant='body2' color='text.secondary'>
                  Booking Code
                </Typography>
                <Typography sx={{ mt: 0.5, fontWeight: 800, letterSpacing: 1 }}>
                  {bookingCode}
                </Typography>
                {registrationId && (
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                    Registration ID: {registrationId}
                  </Typography>
                )}
              </Box>
            )}

            <Alert severity='warning' sx={{ mt: 4, width: '100%', textAlign: 'left' }}>
              Status final tidak ditentukan oleh halaman ini. Backend akan memperbarui registrasi setelah menerima webhook dari Midtrans. Jika transaksi gagal, dibatalkan, atau kedaluwarsa, slot dapat dilepas kembali oleh server.
            </Alert>

            <Button
              component={Link}
              href={`/events/${encodeURIComponent(slug)}`}
              variant='contained'
              fullWidth
              sx={{ mt: 4, minHeight: 48 }}
            >
              Back to Event
            </Button>

            <Button component={Link} href='/home' variant='text' sx={{ mt: 1 }}>
              Back to Home
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PaymentPendingPage
