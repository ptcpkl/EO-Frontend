'use client'

import Link from 'next/link'

import Button from '@mui/material/Button'

import type { PublicEvent } from '@/lib/api'

type Props = {
  event: PublicEvent
}

const canRegister = (event: PublicEvent) => {
  const status = event.registrationStatus?.toLowerCase()

  return !status?.includes('closed') && !status?.includes('sold')
}

const EventDetail = ({ event }: Props) => {
  const registerEnabled = canRegister(event)

  return (
    <main className='relative -m-6 h-[calc(100dvh+48px)] min-h-[520px] overflow-hidden bg-[#143b50]'>
      <section
        className='absolute inset-0 bg-cover bg-center'
        style={{ backgroundImage: "url('/ffws.png')" }}
        aria-label={event.name}
      />

      <Link
        href='/home'
        className='absolute left-5 top-4 z-10 inline-flex items-center gap-2 text-sm font-semibold text-white drop-shadow-md sm:left-7 sm:top-5'
      >
        <i className='tabler-arrow-left' /> Back to events
      </Link>

      <div className='absolute inset-x-0 bottom-8 z-10 flex justify-center sm:bottom-10'>
        <Button
          component={Link}
          href={`/events/${encodeURIComponent(event.slug)}/register`}
          variant='contained'
          size='large'
          disabled={!registerEnabled}
          endIcon={<i className='tabler-arrow-up-right' />}
          sx={{ borderRadius: 1, px: 4, py: 1.5, fontWeight: 800 }}
        >
          Register Now
        </Button>
      </div>
    </main>
  )
}

export default EventDetail
