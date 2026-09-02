'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

const PaymentPendingPage = () => {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [bookingCode, setBookingCode] = useState<string | null>(null)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('bookingCode')

    setBookingCode(code)
    setResolved(true)

    if (code) {
      router.replace(`/registration/${encodeURIComponent(code)}/status`)
    }
  }, [router])

  if (!resolved || bookingCode) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    )
  }

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

export default PaymentPendingPage
