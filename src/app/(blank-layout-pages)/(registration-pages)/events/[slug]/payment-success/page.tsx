'use client'

import { use } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

type Props = {
  params: Promise<{
    slug: string
  }>
}

const PaymentSuccessPage = ({ params }: Props) => {
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
                bgcolor: 'success.main',
                color: 'success.contrastText',
                mb: 3
              }}
            >
              <i className='tabler-check text-4xl' />
            </Box>

            <Typography variant='h4' fontWeight={700}>
              Pembayaran Berhasil
            </Typography>

            <Typography color='text.secondary' sx={{ mt: 1.5, maxWidth: 440 }}>
              Midtrans telah melaporkan pembayaran berhasil. Backend tetap menjadi sumber status final melalui webhook.
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

            <Alert
              severity='info'
              icon={<CircularProgress size={20} color='inherit' />}
              sx={{ mt: 4, width: '100%', textAlign: 'left' }}
            >
              Registrasi sedang menunggu konfirmasi server. Setelah webhook pembayaran diproses, status peserta akan diperbarui menjadi Registered.
            </Alert>

            <Box
              sx={{
                mt: 4,
                width: '100%',
                p: 3,
                bgcolor: 'action.hover',
                borderRadius: 2
              }}
            >
              <Typography variant='body2' color='text.secondary'>
                Selanjutnya
              </Typography>
              <Typography sx={{ mt: 0.75, fontWeight: 600 }}>
                Tiket dan bukti registrasi sedang diproses
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75 }}>
                Informasi registrasi, tiket, dan receipt dapat dikirim setelah backend menerima konfirmasi pembayaran final.
              </Typography>
            </Box>

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

export default PaymentSuccessPage
