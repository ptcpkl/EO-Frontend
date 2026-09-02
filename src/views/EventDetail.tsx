'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

import { getEventPackages, type EventPackage, type PublicEvent } from '@/lib/api'

type Props = {
  event: PublicEvent
}

const canRegister = (event: PublicEvent) => {
  const status = event.registrationStatus?.toLowerCase()

  return !status?.includes('closed') && !status?.includes('sold')
}

const formatDateTime = (value?: string) => {
  if (!value) return 'To be announced'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatPrice = (value: number) => {
  if (value <= 0) return 'Free'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

const splitLines = (value?: string) =>
  (value ?? '')
    .split(/\r?\n/)
    .map(item => item.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean)

const PackageCard = ({ event, eventPackage }: { event: PublicEvent; eventPackage: EventPackage }) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>{eventPackage.name}</Typography>
          <Typography variant='h4' color='primary.main' fontWeight={700} sx={{ mt: 1.5 }}>{formatPrice(eventPackage.price)}</Typography>
        </Box>
        {eventPackage.price <= 0 && <Chip label='Free' color='success' variant='tonal' size='small' />}
      </Box>

      {eventPackage.benefits && (
        <Box sx={{ mt: 3, display: 'grid', gap: 1.25 }}>
          {splitLines(eventPackage.benefits).map(benefit => (
            <Box key={benefit} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <i className='tabler-circle-check text-success' />
              <Typography variant='body2' color='text.secondary'>{benefit}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant='body2' color='text.secondary'>
          {eventPackage.isUnlimited
            ? 'Package quota: Unlimited'
            : `${Math.max(0, eventPackage.remainingQuota ?? 0).toLocaleString('id-ID')} package seats remaining`}
        </Typography>
      </Box>

      <Button component={Link} href={`/events/${encodeURIComponent(event.slug)}/register`} variant='outlined' sx={{ mt: 'auto' }}>
        Choose Package
      </Button>
    </CardContent>
  </Card>
)

const EventDetail = ({ event }: Props) => {
  const [packages, setPackages] = useState<EventPackage[]>([])
  const [packageError, setPackageError] = useState('')
  const [loadingPackages, setLoadingPackages] = useState(true)
  const registerEnabled = canRegister(event)

  const legacyFfws = event.name.toLowerCase().includes('ffws')
  const heroUrl = event.heroImageUrl ?? (legacyFfws ? '/ffws.png' : '/back.png')
  const logoUrl = event.logoUrl ?? (legacyFfws ? '/logoo.png' : undefined)
  const benefits = useMemo(() => splitLines(event.benefits), [event.benefits])
  const mapEmbeddable = Boolean(event.mapsUrl && (event.mapsUrl.includes('/maps/embed') || event.mapsUrl.includes('output=embed')))

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoadingPackages(true)
        setPackageError('')
        const result = await getEventPackages(event.id)
        if (active) setPackages(result.filter(item => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder))
      } catch (loadError) {
        if (active) setPackageError(loadError instanceof Error ? loadError.message : 'Unable to load event packages.')
      } finally {
        if (active) setLoadingPackages(false)
      }
    }

    void load()
    return () => { active = false }
  }, [event.id])

  return (
    <Box>
      <Box
        component='section'
        sx={{
          position: 'relative',
          minHeight: { xs: 560, md: 690 },
          display: 'flex',
          alignItems: 'flex-end',
          overflow: 'hidden',
          bgcolor: 'background.paper'
        }}
      >
        <Box component='img' src={heroUrl} alt={event.name} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <Box
          sx={theme => ({
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.08)} 20%, ${alpha(theme.palette.common.black, 0.78)} 100%)`
          })}
        />

        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1180, mx: 'auto', px: 3, pb: { xs: 6, md: 8 }, color: 'common.white' }}>
          {logoUrl && <Box component='img' src={logoUrl} alt={`${event.name} logo`} sx={{ maxWidth: { xs: 180, md: 260 }, maxHeight: 120, objectFit: 'contain', objectPosition: 'left center', mb: 3 }} />}
          <Chip label={event.type ?? 'Event'} color='primary' variant='filled' size='small' />
          <Typography component='h1' sx={{ mt: 2, fontWeight: 800, fontSize: { xs: '2.5rem', md: '4rem' }, lineHeight: 1.05, maxWidth: 850, color: 'inherit' }}>
            {event.name}
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 720, color: 'inherit', opacity: 0.9, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.7 }}>
            {event.description || event.about || 'Discover the event details and secure your registration.'}
          </Typography>

          <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: { xs: 2, md: 4 }, color: 'inherit' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><i className='tabler-calendar-event' /><Typography color='inherit'>{formatDateTime(event.startDate)}</Typography></Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><i className='tabler-map-pin' /><Typography color='inherit'>{event.location || 'Location to be announced'}</Typography></Box>
          </Box>

          <Button
            component={Link}
            href={`/events/${encodeURIComponent(event.slug)}/register`}
            variant='contained'
            size='large'
            disabled={!registerEnabled}
            endIcon={<i className='tabler-arrow-up-right' />}
            sx={{ mt: 4 }}
          >
            {registerEnabled ? 'Register Now' : 'Registration Unavailable'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: { xs: 8, md: 12 } }}>
        <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto', display: 'grid', gap: { xs: 8, md: 12 } }}>
          <Box component='section' sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.8fr 1.2fr' }, gap: { xs: 3, md: 8 }, alignItems: 'start' }}>
            <Box>
              <Chip label='About' color='primary' variant='tonal' size='small' />
              <Typography variant='h3' fontWeight={700} sx={{ mt: 2 }}>About the event</Typography>
            </Box>
            <Typography variant='body1' color='text.secondary' sx={{ whiteSpace: 'pre-line', lineHeight: 1.9, fontSize: '1.05rem' }}>
              {event.about || event.description || 'More information about this event will be available soon.'}
            </Typography>
          </Box>

          {benefits.length > 0 && (
            <Box component='section'>
              <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Chip label='Benefits' color='primary' variant='tonal' size='small' />
                <Typography variant='h3' fontWeight={700} sx={{ mt: 2 }}>What you&apos;ll get</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
                {benefits.map((benefit, index) => (
                  <Card key={`${benefit}-${index}`} variant='outlined'>
                    <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center', flexShrink: 0 }}><i className='tabler-sparkles' /></Box>
                      <Typography fontWeight={600} sx={{ pt: 1 }}>{benefit}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          <Box component='section'>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Chip label='Packages' color='primary' variant='tonal' size='small' />
              <Typography variant='h3' fontWeight={700} sx={{ mt: 2 }}>Choose your experience</Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mt: 1.5 }}>Paid and free packages use the same event quota rules. Free packages skip payment automatically.</Typography>
            </Box>

            {loadingPackages && <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}><CircularProgress size={32} /></Box>}
            {packageError && <Alert severity='error'>{packageError}</Alert>}
            {!loadingPackages && !packageError && packages.length === 0 && <Alert severity='info'>No active registration packages are currently available.</Alert>}
            {!loadingPackages && packages.length > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
                {packages.map(eventPackage => <PackageCard key={eventPackage.id} event={event} eventPackage={eventPackage} />)}
              </Box>
            )}
          </Box>

          {(event.registrationImageUrl || legacyFfws) && (
            <Box component='section'>
              <Box sx={{ mb: 4 }}>
                <Chip label='Event Guide' color='primary' variant='tonal' size='small' />
                <Typography variant='h3' fontWeight={700} sx={{ mt: 2 }}>{event.registrationImageTitle || (legacyFfws ? 'Seminar Arena Map' : 'Event Guide')}</Typography>
              </Box>
              <Card sx={{ overflow: 'hidden' }}>
                <Box component='img' src={event.registrationImageUrl ?? '/denahh.png'} alt={event.registrationImageTitle || 'Event guide'} sx={{ width: '100%', maxHeight: 720, display: 'block', objectFit: 'contain', bgcolor: 'background.paper' }} />
              </Card>
            </Box>
          )}

          {(event.location || event.venueAddress || event.mapsUrl) && (
            <Box component='section' sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: event.mapsUrl ? '0.8fr 1.2fr' : '1fr' }, gap: 4, alignItems: 'stretch' }}>
              <Card>
                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                  <Chip label='Location' color='primary' variant='tonal' size='small' />
                  <Typography variant='h3' fontWeight={700} sx={{ mt: 2 }}>{event.location || 'Event venue'}</Typography>
                  {event.venueAddress && <Typography variant='body1' color='text.secondary' sx={{ mt: 2, lineHeight: 1.8 }}>{event.venueAddress}</Typography>}
                  {event.mapsUrl && (
                    <Button component='a' href={event.mapsUrl} target='_blank' rel='noreferrer' variant='contained' startIcon={<i className='tabler-map-pin' />} sx={{ mt: 4 }}>
                      Open Exact Location
                    </Button>
                  )}
                </CardContent>
              </Card>

              {event.mapsUrl && (
                <Card sx={{ minHeight: 320, overflow: 'hidden' }}>
                  {mapEmbeddable ? (
                    <Box component='iframe' src={event.mapsUrl} title={`${event.name} map`} loading='lazy' referrerPolicy='no-referrer-when-downgrade' sx={{ width: '100%', height: '100%', minHeight: 360, border: 0 }} />
                  ) : (
                    <Box sx={{ minHeight: 360, height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', px: 4, bgcolor: 'action.hover' }}>
                      <Box>
                        <Box sx={{ width: 64, height: 64, mx: 'auto', borderRadius: '50%', bgcolor: 'background.paper', display: 'grid', placeItems: 'center', color: 'primary.main' }}><i className='tabler-map-2 text-3xl' /></Box>
                        <Typography variant='h6' fontWeight={600} sx={{ mt: 2 }}>Exact location available on Google Maps</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>Use the location button to open the organizer&apos;s exact map pin.</Typography>
                      </Box>
                    </Box>
                  )}
                </Card>
              )}
            </Box>
          )}

          {event.additionalInformation && (
            <Box component='section'>
              <Card>
                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                  <Chip label='Additional Information' color='primary' variant='tonal' size='small' />
                  <Typography variant='h3' fontWeight={700} sx={{ mt: 2 }}>Before you join</Typography>
                  <Divider sx={{ my: 4 }} />
                  <Typography variant='body1' color='text.secondary' sx={{ whiteSpace: 'pre-line', lineHeight: 1.9 }}>{event.additionalInformation}</Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          <Box component='section' sx={{ textAlign: 'center', py: { xs: 4, md: 7 } }}>
            <Typography variant='h3' fontWeight={700}>Ready to join {event.name}?</Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mt: 1.5 }}>Choose your package and complete the registration form.</Typography>
            <Button component={Link} href={`/events/${encodeURIComponent(event.slug)}/register`} disabled={!registerEnabled} variant='contained' size='large' endIcon={<i className='tabler-arrow-up-right' />} sx={{ mt: 4 }}>
              Register Now
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default EventDetail
