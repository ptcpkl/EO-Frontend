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

import GoogleMapPreview from '@/components/public/GoogleMapPreview'
import { getEventPackages, type EventPackage, type PublicEvent } from '@/lib/api'

type Props = { event: PublicEvent }

const canRegister = (event: PublicEvent) => {
  const status = event.registrationStatus?.toLowerCase()
  return !status?.includes('closed') && !status?.includes('sold')
}

const formatDateTime = (value?: string) => {
  if (!value) return 'To be announced'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

const formatPrice = (value: number) => value <= 0
  ? 'Free'
  : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

const splitLines = (value?: string) => (value ?? '').split(/\r?\n/).map(item => item.trim().replace(/^[-•]\s*/, '')).filter(Boolean)

const LocationDetailRow = ({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr)', gap: 1.5, alignItems: 'start' }}>
    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
      <i className={icon} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant='caption' color='text.secondary' fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '.045em' }}>{label}</Typography>
      <Typography variant='body2' sx={{ mt: .45, lineHeight: 1.7, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Box>
  </Box>
)

const PackageCard = ({ event, eventPackage }: { event: PublicEvent; eventPackage: EventPackage }) => (
  <Card variant='outlined' sx={{ height: '100%', borderRadius: 3 }}>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='h6' fontWeight={700}>{eventPackage.name}</Typography>
          <Typography variant='h5' color='primary.main' fontWeight={700} sx={{ mt: 1 }}>{formatPrice(eventPackage.price)}</Typography>
        </Box>
        {eventPackage.price <= 0 && <Chip label='Free' color='success' variant='tonal' size='small' />}
      </Box>

      {eventPackage.benefits && (
        <Box sx={{ mt: 2.5, display: 'grid', gap: 1 }}>
          {splitLines(eventPackage.benefits).map(benefit => (
            <Box key={benefit} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <i className='tabler-circle-check text-success' />
              <Typography variant='body2' color='text.secondary'>{benefit}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Typography variant='body2' color='text.secondary' sx={{ mt: 2.5, mb: 3 }}>
        {eventPackage.isUnlimited ? 'Package quota: Unlimited' : `${Math.max(0, eventPackage.remainingQuota ?? 0).toLocaleString('id-ID')} package seats remaining`}
      </Typography>

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
      <Box component='section' sx={{ position: 'relative', minHeight: { xs: 560, md: 680 }, display: 'flex', alignItems: 'flex-end', overflow: 'hidden', bgcolor: 'background.paper' }}>
        <Box component='img' src={heroUrl} alt={event.name} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <Box sx={theme => ({ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.08)} 15%, ${alpha(theme.palette.common.black, 0.86)} 100%)` })} />

        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1180, mx: 'auto', px: 3, pt: { xs: 14, md: 16 }, pb: { xs: 6, md: 8 }, color: 'common.white' }}>
          {logoUrl && <Box component='img' src={logoUrl} alt={`${event.name} logo`} sx={{ display: 'block', maxWidth: { xs: 180, md: 250 }, maxHeight: 120, width: 'auto', height: 'auto', objectFit: 'contain', objectPosition: 'left center', mb: 2.5 }} />}
          <Box sx={{ display: 'block' }}><Chip label={event.type ?? 'Event'} color='primary' variant='filled' size='small' /></Box>
          <Typography component='h1' sx={{ mt: 2, fontWeight: 800, fontSize: { xs: '2.25rem', sm: '3rem', md: '3.65rem' }, lineHeight: 1.08, letterSpacing: '-0.025em', maxWidth: 880, color: 'inherit' }}>
            {event.name}
          </Typography>
          <Typography sx={{ mt: 1.75, maxWidth: 720, color: 'inherit', opacity: 0.92, fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.65 }}>
            {event.description || event.about || 'Discover the event details and secure your registration.'}
          </Typography>

          <Box sx={{ mt: 3.5, display: 'flex', flexWrap: 'wrap', gap: { xs: 2, md: 3.5 }, color: 'inherit' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><i className='tabler-calendar-event' /><Typography color='inherit'>{formatDateTime(event.startDate)}</Typography></Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><i className='tabler-map-pin' /><Typography color='inherit'>{event.location || 'Location to be announced'}</Typography></Box>
          </Box>

          <Button component={Link} href={`/events/${encodeURIComponent(event.slug)}/register`} variant='contained' size='large' disabled={!registerEnabled} endIcon={<i className='tabler-arrow-up-right' />} sx={{ mt: 3.5 }}>
            {registerEnabled ? 'Register Now' : 'Registration Unavailable'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: { xs: 6, md: 8 } }}>
        <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto', display: 'grid', gap: { xs: 6, md: 8 } }}>
          <Box component='section' sx={{ maxWidth: 900 }}>
            <Chip label='About' color='primary' variant='tonal' size='small' />
            <Typography variant='h4' fontWeight={700} sx={{ mt: 1.5 }}>About the event</Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mt: 2, whiteSpace: 'pre-line', lineHeight: 1.85, fontSize: '1rem', maxWidth: 820 }}>
              {event.about || event.description || 'More information about this event will be available soon.'}
            </Typography>
          </Box>

          {benefits.length > 0 && (
            <Box component='section'>
              <Box sx={{ mb: 3 }}>
                <Chip label='Benefits' color='primary' variant='tonal' size='small' />
                <Typography variant='h4' fontWeight={700} sx={{ mt: 1.5 }}>What you&apos;ll get</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2.5 }}>
                {benefits.map((benefit, index) => (
                  <Card key={`${benefit}-${index}`} variant='outlined' sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center', flexShrink: 0 }}><i className='tabler-sparkles' /></Box>
                      <Typography fontWeight={600} sx={{ pt: 1 }}>{benefit}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          <Box component='section'>
            <Box sx={{ mb: 3 }}>
              <Chip label='Packages' color='primary' variant='tonal' size='small' />
              <Typography variant='h4' fontWeight={700} sx={{ mt: 1.5 }}>Choose your experience</Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>Choose a package below. Free packages register immediately without payment.</Typography>
            </Box>
            {loadingPackages && <Box sx={{ py: 5, display: 'grid', placeItems: 'center' }}><CircularProgress size={32} /></Box>}
            {packageError && <Alert severity='error'>{packageError}</Alert>}
            {!loadingPackages && !packageError && packages.length === 0 && <Alert severity='info'>No active registration packages are currently available.</Alert>}
            {!loadingPackages && packages.length > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2.5 }}>
                {packages.map(eventPackage => <PackageCard key={eventPackage.id} event={event} eventPackage={eventPackage} />)}
              </Box>
            )}
          </Box>

          {(event.registrationImageUrl || legacyFfws) && (
            <Box component='section'>
              <Box sx={{ mb: 3 }}>
                <Chip label='Event Guide' color='primary' variant='tonal' size='small' />
                <Typography variant='h4' fontWeight={700} sx={{ mt: 1.5 }}>{event.registrationImageTitle || (legacyFfws ? 'Seminar Arena Map' : 'Event Guide')}</Typography>
              </Box>
              <Card variant='outlined' sx={{ overflow: 'hidden', borderRadius: 3 }}>
                <Box component='img' src={event.registrationImageUrl ?? '/denahh.png'} alt={event.registrationImageTitle || 'Event guide'} sx={{ width: '100%', maxHeight: 680, display: 'block', objectFit: 'contain', bgcolor: 'background.paper' }} />
              </Card>
            </Box>
          )}

          {(event.location || event.venueAddress || event.mapsUrl) && (
            <Box component='section'>
              <Box sx={{ mb: 3 }}>
                <Chip label='Location' color='primary' variant='tonal' size='small' />
                <Typography variant='h4' fontWeight={700} sx={{ mt: 1.5 }}>Event venue</Typography>
                <Typography variant='body1' color='text.secondary' sx={{ mt: 1, maxWidth: 760 }}>
                  The map follows the exact Google Maps pin provided by the organizer. Venue details are shown alongside it so participants can verify the destination before travelling.
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.35fr) minmax(320px, .65fr)' }, gap: 3, alignItems: 'stretch' }}>
                <Card variant='outlined' sx={{ minHeight: 460, overflow: 'hidden', borderRadius: 3, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', zIndex: 2, top: 16, left: 16, pointerEvents: 'none' }}>
                    <Chip
                      label={event.mapsUrl ? 'Exact organizer pin' : 'Address-based preview'}
                      color={event.mapsUrl ? 'success' : 'default'}
                      variant='filled'
                      size='small'
                      icon={<i className={event.mapsUrl ? 'tabler-map-pin-check' : 'tabler-map-pin'} />}
                      sx={{ boxShadow: 2 }}
                    />
                  </Box>
                  <GoogleMapPreview
                    mapsUrl={event.mapsUrl}
                    fallbackQuery={event.mapsUrl ? null : (event.venueAddress || event.location)}
                    title={`${event.name} exact venue map`}
                  />
                </Card>

                <Card variant='outlined' sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 2.5, bgcolor: 'primary.main', color: 'primary.contrastText', flexShrink: 0 }}>
                        <i className='tabler-building-community text-2xl' />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant='overline' color='primary.main' fontWeight={800}>Venue details</Typography>
                        <Typography variant='h5' fontWeight={700} sx={{ mt: -.25 }}>{event.location || 'Event venue'}</Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: 'grid', gap: 2.5 }}>
                      <LocationDetailRow
                        icon='tabler-map-pin'
                        label='Venue name'
                        value={event.location || 'Venue name has not been specified yet.'}
                      />
                      <LocationDetailRow
                        icon='tabler-map-search'
                        label='Full address'
                        value={event.venueAddress || event.location || 'Full street address has not been provided by the organizer yet.'}
                      />
                      <LocationDetailRow
                        icon='tabler-calendar-clock'
                        label='Event time'
                        value={formatDateTime(event.startDate)}
                      />
                      <LocationDetailRow
                        icon={event.mapsUrl ? 'tabler-map-pin-check' : 'tabler-info-circle'}
                        label='Map source'
                        value={event.mapsUrl ? 'Exact Google Maps URL saved by the organizer.' : 'No Google Maps URL supplied; preview uses the venue address above.'}
                      />
                    </Box>

                    {event.mapsUrl ? (
                      <>
                        <Alert severity='success' sx={{ mt: 3 }}>
                          The embedded map does not replace this pin with another address search. If Google cannot resolve the exact pin safely, the preview is hidden instead.
                        </Alert>
                        <Button component='a' href={event.mapsUrl} target='_blank' rel='noreferrer' variant='contained' size='large' startIcon={<i className='tabler-external-link' />} sx={{ mt: 'auto', pt: 1.25, pb: 1.25 }}>
                          Open Exact Location
                        </Button>
                      </>
                    ) : (
                      <Alert severity='info' sx={{ mt: 3 }}>Add a Google Maps URL in the event settings to lock this preview to an exact organizer pin.</Alert>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}

          {event.additionalInformation && (
            <Box component='section'>
              <Card variant='outlined' sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Chip label='Additional Information' color='primary' variant='tonal' size='small' />
                  <Typography variant='h4' fontWeight={700} sx={{ mt: 1.5 }}>Before you join</Typography>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant='body1' color='text.secondary' sx={{ whiteSpace: 'pre-line', lineHeight: 1.85, maxWidth: 860 }}>{event.additionalInformation}</Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          <Box component='section' sx={{ textAlign: 'center', py: { xs: 3, md: 5 } }}>
            <Typography variant='h4' fontWeight={700}>Ready to join {event.name}?</Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mt: 1.25 }}>Choose your package and complete the registration form.</Typography>
            <Button component={Link} href={`/events/${encodeURIComponent(event.slug)}/register`} disabled={!registerEnabled} variant='contained' size='large' endIcon={<i className='tabler-arrow-up-right' />} sx={{ mt: 3 }}>Register Now</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default EventDetail
