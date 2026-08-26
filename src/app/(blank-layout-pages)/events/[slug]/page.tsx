import Link from 'next/link'

import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import EventDetail from '@views/EventDetail'
import { getPublicEventBySlug } from '@/lib/api'

type Props = {
  params: Promise<{ slug: string }>
}

const EventPage = async ({ params }: Props) => {
  const { slug } = await params

  try {
    const event = await getPublicEventBySlug(slug)

    return <EventDetail event={event} />
  } catch {
    return (
      <main className='flex min-h-screen items-center justify-center bg-[#f4f6f2] px-6'>
        <div className='max-w-md text-center'>
          <Typography variant='h4' sx={{ color: '#173b36', fontWeight: 800 }}>
            Event unavailable
          </Typography>
          <Typography sx={{ mt: 1.5, color: '#647872' }}>We couldn&apos;t load this event right now.</Typography>
          <Button component={Link} href='/home' variant='contained' sx={{ mt: 3, borderRadius: 1 }}>
            Back to events
          </Button>
        </div>
      </main>
    )
  }
}

export default EventPage
