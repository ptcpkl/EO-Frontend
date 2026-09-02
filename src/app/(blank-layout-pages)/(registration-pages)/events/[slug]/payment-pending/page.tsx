'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

const PaymentPendingPage = () => {
  const params = useParams<{ slug: string }>()
  const query = useSearchParams()
  const router = useRouter()
  const bookingCode = query.get('bookingCode')

  useEffect(() => {
    if (bookingCode) {
      router.replace(`/registration/${encodeURIComponent(bookingCode)}/status`)
    }
  }, [bookingCode, router])

  if (!bookingCode) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', px: 2, bgcolor: 'background.default' }}>
        <Box sx={{ width: '100%', maxWidth: 560 }}>
          <Alert severity='warning'>Booking code is missing, so registration status cannot be loaded.</Alert>
          <Button component={Link} href={`/events/${encodeURIComponent(params.slug)}`} variant='outlined' sx={{ mt: 2 }}>
            Back to Event
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
      <CircularProgress />
    </Box>
  )
}

export default PaymentPendingPage
