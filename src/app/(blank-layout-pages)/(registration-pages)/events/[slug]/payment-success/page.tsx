'use client'

import { use } from 'react'

import Link from 'next/link'

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
          border: theme =>
            `1px solid ${theme.palette.divider}`
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 3,
              sm: 5
            }
          }}
        >
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

            <Typography
              variant='h4'
              fontWeight={700}
            >
              Pembayaran Berhasil
            </Typography>

            <Typography
              color='text.secondary'
              sx={{
                mt: 1.5,
                maxWidth: 440
              }}
            >
              Pembayaran Anda telah diterima oleh
              sistem pembayaran.
            </Typography>

            <Alert
              severity='info'
              icon={
                <CircularProgress
                  size={20}
                  color='inherit'
                />
              }
              sx={{
                mt: 4,
                width: '100%',
                textAlign: 'left'
              }}
            >
              Registrasi sedang diverifikasi.
              Setelah pembayaran dikonfirmasi oleh
              server, status peserta akan diproses
              menjadi Registered.
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
              <Typography
                variant='body2'
                color='text.secondary'
              >
                Selanjutnya
              </Typography>

              <Typography
                sx={{
                  mt: 0.75,
                  fontWeight: 600
                }}
              >
                Tiket Anda sedang diproses
              </Typography>

              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ mt: 0.75 }}
              >
                Tiket dan informasi registrasi akan
                dikirim melalui email setelah
                pembayaran terverifikasi.
              </Typography>
            </Box>

            <Button
              component={Link}
              href={`/events/${encodeURIComponent(slug)}`}
              variant='contained'
              fullWidth
              sx={{
                mt: 4,
                minHeight: 48
              }}
            >
              Back to Event
            </Button>

            <Button
              component={Link}
              href='/home'
              variant='text'
              sx={{ mt: 1 }}
            >
              Back to Home
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PaymentSuccessPage
