'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

const QuizReservedPage = () => {
  const params = useParams<{ eventSlug: string }>()
  const eventId = params.eventSlug
  const encodedEventId = encodeURIComponent(eventId)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Breadcrumbs>
        <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>Events</Link>
        <Link component={NextLink} href={`/admin/events/${encodedEventId}/dashboard`} color='inherit' underline='hover'>Event Dashboard</Link>
        <Typography color='text.primary'>Quiz</Typography>
      </Breadcrumbs>

      <Card variant='outlined'>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'warning.light', color: 'warning.dark', display: 'grid', placeItems: 'center', mb: 3 }}>
            <i className='tabler-help-hexagon text-3xl' />
          </Box>
          <Typography variant='h4' fontWeight={750}>Quiz is reserved</Typography>
          <Typography color='text.secondary' sx={{ mt: 1.5, maxWidth: 720, lineHeight: 1.7 }}>
            Quiz is being implemented separately. This page intentionally does not request the unfinished Quiz API, so events can be created, edited, and operated without the missing quizzes table causing HTTP 500 errors.
          </Typography>
          <Alert severity='info' sx={{ mt: 3, maxWidth: 820 }}>
            No Quiz data is created, changed, or deleted here. The existing Quiz source files remain available for the separate implementation.
          </Alert>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3 }}>
            <Button component={NextLink} href={`/admin/events/${encodedEventId}/dashboard`} variant='contained' startIcon={<i className='tabler-layout-dashboard' />}>
              Event Dashboard
            </Button>
            <Button component={NextLink} href={`/admin/events/${encodedEventId}/modules/quiz`} variant='outlined'>
              Module status
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default QuizReservedPage
