'use client'

import { use, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

type QueryValue = string | string[] | undefined

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ bookingCode?: QueryValue }>
}

const firstQueryValue = (value: QueryValue) => (Array.isArray(value) ? value[0] : value)

const PaymentSuccessPage = ({ params, searchParams }: Props) => {
  const { slug } = use(params)
  const query = use(searchParams)
  const router = useRouter()
  const bookingCode = firstQueryValue(query.bookingCode)

  useEffect(() => {
    if (bookingCode) {
      router.replace(`/registration/${encodeURIComponent(bookingCode)}/status`)
    }
  }, [bookingCode, router])

  if (!bookingCode) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', px: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 560 }}>
          <Alert severity='warning'>Booking code is missing, so registration status cannot be loaded.</Alert>
          <Button component={Link} href={`/events/${encodeURIComponent(slug)}`} sx={{ mt: 2 }}>Back to Event</Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  )
}

export default PaymentSuccessPage
