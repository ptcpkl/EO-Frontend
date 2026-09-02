'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { styled, useColorScheme, useTheme } from '@mui/material/styles'

import CustomTextField from '@core/components/mui/TextField'
import { useSettings } from '@core/hooks/useSettings'

import { getEventPackages, getPublicEventBySlug, type EventPackage, type PublicEvent } from '@/lib/api'
import { openMidtransSnap } from '../lib/midtrans'
import {
  createExternalRegistrationPayment,
  type RegistrationPaymentResponse
} from '../services/registration.service'

type AttendeeType = 'STUDENT' | 'PROFESSIONAL' | 'GENERAL'

type RegistrationFormData = {
  fullName: string
  email: string
  whatsappNumber: string
  institution: string
  position: string
  attendeeType: AttendeeType | ''
  eventPackageId: string
  consent: boolean
}

type RegistrationErrors = Partial<Record<keyof RegistrationFormData, string>>

type Props = {
  slug: string
}

const RegistrationPage = styled('main')({
  position: 'relative',
  minHeight: '100dvh',
  overflowX: 'hidden'
})

const RegistrationBackground = styled('div')(({ theme }) => ({
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  backgroundImage: theme.palette.mode === 'dark' ? "url('/Dark.png')" : "url('/back.png')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}))

const RegistrationCard = styled('section')(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  width: 'min(100%, 620px)',
  boxSizing: 'border-box',
  margin: '0 auto',
  padding: theme.spacing(5),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[12],
  '@media (max-width: 600px)': {
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius * 1.5
  }
}))

const fieldStyles = {
  '& .MuiInputBase-root': {
    minHeight: 50,
    borderRadius: '10px !important'
  }
}

const initialForm: RegistrationFormData = {
  fullName: '',
  email: '',
  whatsappNumber: '',
  institution: '',
  position: '',
  attendeeType: '',
  eventPackageId: '',
  consent: false
}

const validate = (form: RegistrationFormData): RegistrationErrors => {
  const errors: RegistrationErrors = {}

  if (!form.attendeeType) errors.attendeeType = 'Please select an attendee type.'
  if (!form.fullName.trim()) errors.fullName = 'Full Name is required.'

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!form.whatsappNumber.trim()) errors.whatsappNumber = 'WhatsApp Number is required.'

  if (['STUDENT', 'PROFESSIONAL'].includes(form.attendeeType) && !form.institution.trim()) {
    errors.institution = 'Institution / Company is required.'
  }

  if (form.attendeeType === 'PROFESSIONAL' && !form.position.trim()) {
    errors.position = 'Position / Role is required.'
  }

  if (!form.eventPackageId) errors.eventPackageId = 'Please select a package.'
  if (!form.consent) errors.consent = 'You must agree to the personal data consent.'

  return errors
}

const isPackageSoldOut = (eventPackage: EventPackage) =>
  !eventPackage.isUnlimited &&
  typeof eventPackage.remainingQuota === 'number' &&
  eventPackage.remainingQuota <= 0

const formatPrice = (price: number) =>
  price <= 0
    ? 'Free'
    : new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(price)

const EventRegistration = ({ slug }: Props) => {
  const theme = useTheme()
  const { setMode } = useColorScheme()
  const { updateSettings } = useSettings()
  const router = useRouter()

  const [form, setForm] = useState<RegistrationFormData>(initialForm)
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPackages, setIsLoadingPackages] = useState(true)
  const [formMessage, setFormMessage] = useState('')
  const [eventData, setEventData] = useState<PublicEvent | null>(null)
  const [packages, setPackages] = useState<EventPackage[]>([])
  const [paymentSession, setPaymentSession] = useState<RegistrationPaymentResponse | null>(null)

  const paymentLocked = paymentSession !== null
  const selectedPackage = useMemo(
    () => packages.find(item => item.id === form.eventPackageId) ?? null,
    [form.eventPackageId, packages]
  )

  const legacyFfws = Boolean(eventData?.name.toLowerCase().includes('ffws'))
  const eventLogoUrl = eventData?.logoUrl ?? (legacyFfws ? '/logoo.png' : '/EO%20Navbar.png')
  const guideImageUrl = eventData?.registrationImageUrl ?? (legacyFfws ? '/denahh.png' : undefined)
  const guideTitle = eventData?.registrationImageTitle ?? (legacyFfws ? 'Seminar Area Map' : undefined)

  useEffect(() => {
    let mounted = true

    const loadRegistrationData = async () => {
      try {
        setIsLoadingPackages(true)
        setFormMessage('')

        const loadedEvent = await getPublicEventBySlug(slug)
        const loadedPackages = await getEventPackages(loadedEvent.id)

        if (!mounted) return

        const activePackages = loadedPackages
          .filter(item => item.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)

        setEventData(loadedEvent)
        setPackages(activePackages)

        const availablePackages = activePackages.filter(item => !isPackageSoldOut(item))

        if (availablePackages.length === 1) {
          setForm(current => ({ ...current, eventPackageId: availablePackages[0].id }))
        }
      } catch (error) {
        console.error('Failed to load registration data:', error)

        if (mounted) {
          setEventData(null)
          setPackages([])
          setFormMessage(error instanceof Error ? error.message : 'Unable to load registration data.')
        }
      } finally {
        if (mounted) setIsLoadingPackages(false)
      }
    }

    void loadRegistrationData()

    return () => {
      mounted = false
    }
  }, [slug])

  const updateField = <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => {
    if (paymentLocked) return

    setForm(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
    setFormMessage('')
  }

  const handleAttendeeTypeChange = (value: AttendeeType) => {
    if (paymentLocked) return

    setForm(current => ({
      ...current,
      attendeeType: value,
      position: value === 'STUDENT' ? '' : current.position
    }))

    setErrors(current => ({
      ...current,
      attendeeType: undefined,
      position: undefined,
      institution: undefined
    }))
    setFormMessage('')
  }

  const handleToggleMode = () => {
    const nextMode = theme.palette.mode === 'dark' ? 'light' : 'dark'

    setMode(nextMode)
    updateSettings({ mode: nextMode })
  }

  const redirectToPaymentResult = (status: 'success' | 'pending', session: RegistrationPaymentResponse) => {
    const query = new URLSearchParams({
      registrationId: session.registrationId,
      bookingCode: session.bookingCode
    })

    router.push(`/events/${encodeURIComponent(slug)}/payment-${status}?${query.toString()}`)
  }

  const redirectToRegistrationSuccess = (session: RegistrationPaymentResponse) => {
    router.push(`/registration/${encodeURIComponent(session.bookingCode)}/status`)
  }

  const openPayment = async (session: RegistrationPaymentResponse) => {
    if (!session.paymentRequired || !session.snapToken) {
      redirectToRegistrationSuccess(session)
      return
    }

    setIsSubmitting(true)
    setFormMessage('Opening secure payment...')

    try {
      await openMidtransSnap(session.snapToken, {
        onSuccess: () => redirectToPaymentResult('success', session),
        onPending: () => redirectToPaymentResult('pending', session),
        onError: error => {
          console.error('Midtrans payment error:', error)
          setFormMessage('Payment failed. Your registration is still available to retry from this page.')
        },
        onClose: () => {
          setFormMessage('Payment window was closed. Click Continue Payment to reopen the same payment session.')
        }
      })
    } catch (error) {
      console.error('Failed to open Midtrans Snap:', error)
      setFormMessage(error instanceof Error ? error.message : 'Unable to open payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()

    if (paymentSession) {
      await openPayment(paymentSession)
      return
    }

    const nextErrors = validate(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    if (!eventData) {
      setFormMessage('Event information is not ready. Please refresh the page.')
      return
    }

    const packageToRegister = packages.find(item => item.id === form.eventPackageId)

    if (!packageToRegister) {
      setFormMessage('The selected package is no longer available. Please refresh the page.')
      return
    }

    if (isPackageSoldOut(packageToRegister)) {
      setErrors(current => ({ ...current, eventPackageId: 'This package is sold out.' }))
      setFormMessage('The selected package is sold out. Please choose another package.')
      return
    }

    setIsSubmitting(true)
    setFormMessage(packageToRegister.price <= 0 ? 'Completing your registration...' : 'Creating your secure payment session...')

    try {
      const result = await createExternalRegistrationPayment(eventData.id, {
        eventPackageId: form.eventPackageId,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.whatsappNumber.trim(),
        organization: form.institution.trim() || null,
        department: form.position.trim() || null
      })

      if (!result.paymentRequired) {
        redirectToRegistrationSuccess(result)
        return
      }

      setPaymentSession(result)
      await openPayment(result)
    } catch (error) {
      console.error('Registration failed:', error)
      setFormMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStudent = form.attendeeType === 'STUDENT'
  const isProfessional = form.attendeeType === 'PROFESSIONAL'
  const hasAvailablePackage = packages.some(item => !isPackageSoldOut(item))
  const messageLower = formMessage.toLowerCase()
  const messageIsError = ['failed', 'error', 'invalid', 'sold out', 'unavailable', 'unable'].some(word =>
    messageLower.includes(word)
  )

  const submitLabel = isSubmitting
    ? selectedPackage?.price === 0
      ? 'Completing Registration...'
      : 'Opening Payment...'
    : paymentSession
      ? 'Continue Payment'
      : selectedPackage?.price === 0
        ? 'Register for Free'
        : 'Register & Pay'

  return (
    <RegistrationPage>
      <RegistrationBackground aria-hidden='true' />

      <Button
        variant='outlined'
        aria-label={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={handleToggleMode}
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 20 },
          top: { xs: 16, sm: 20 },
          zIndex: 20,
          minWidth: 44,
          width: 44,
          height: 44,
          p: 0,
          bgcolor: 'background.paper'
        }}
      >
        <i className={theme.palette.mode === 'dark' ? 'tabler-sun' : 'tabler-moon'} />
      </Button>

      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', px: { xs: 2, sm: 3 }, py: { xs: 4, md: 7 } }}>
        <RegistrationCard>
          <Box sx={{ mx: 'auto', width: '100%', maxWidth: 500 }}>
            <Button
              component={Link}
              href={`/events/${encodeURIComponent(slug)}`}
              variant='text'
              startIcon={<i className='tabler-arrow-left' />}
              sx={{ mb: 3, color: 'text.secondary', px: 0 }}
            >
              Back to event
            </Button>

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                component='img'
                src={eventLogoUrl}
                alt={eventData ? `${eventData.name} logo` : 'Pertamina Event'}
                sx={{ maxWidth: { xs: 190, sm: 230 }, maxHeight: 120, width: 'auto', height: 'auto', objectFit: 'contain' }}
              />
            </Box>

            <Typography
              variant='h3'
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                lineHeight: 1.18,
                fontSize: { xs: '1.75rem', sm: '2rem' }
              }}
            >
              Register for {eventData?.name ?? 'Event'}
            </Typography>

            <Typography sx={{ mt: 1.25, color: 'text.secondary', lineHeight: 1.65 }}>
              {eventData?.description ?? 'Complete your information and choose the registration package that suits you.'}
            </Typography>

            {paymentSession && (
              <Card variant='outlined' sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant='body2' fontWeight={700}>Registration created</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                    Booking code: {paymentSession.bookingCode}. Your form is locked to prevent duplicate registrations.
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Box component='form' noValidate onSubmit={handleSubmit} sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <CustomTextField
                select
                label='Attendee Type'
                required
                disabled={paymentLocked}
                value={form.attendeeType}
                onChange={event => handleAttendeeTypeChange(event.target.value as AttendeeType)}
                error={Boolean(errors.attendeeType)}
                helperText={errors.attendeeType}
                sx={fieldStyles}
              >
                <MenuItem value='STUDENT'>Student</MenuItem>
                <MenuItem value='PROFESSIONAL'>Professional</MenuItem>
                <MenuItem value='GENERAL'>General</MenuItem>
              </CustomTextField>

              <CustomTextField label='Full Name' required disabled={paymentLocked} placeholder='Enter your full name' value={form.fullName} onChange={event => updateField('fullName', event.target.value)} error={Boolean(errors.fullName)} helperText={errors.fullName} sx={fieldStyles} />
              <CustomTextField label='Email' required disabled={paymentLocked} type='email' placeholder='Enter your email address' value={form.email} onChange={event => updateField('email', event.target.value)} error={Boolean(errors.email)} helperText={errors.email} sx={fieldStyles} />
              <CustomTextField label='WhatsApp Number' required disabled={paymentLocked} type='tel' placeholder='08xxxxxxxxxx' value={form.whatsappNumber} onChange={event => updateField('whatsappNumber', event.target.value)} error={Boolean(errors.whatsappNumber)} helperText={errors.whatsappNumber} sx={fieldStyles} />
              <CustomTextField label='Institution / Company' required={isProfessional || isStudent} disabled={paymentLocked} placeholder='Enter your institution or company' value={form.institution} onChange={event => updateField('institution', event.target.value)} error={Boolean(errors.institution)} helperText={errors.institution || (form.attendeeType === 'GENERAL' ? 'Optional for General.' : undefined)} sx={fieldStyles} />
              <CustomTextField label='Position / Role' required={isProfessional} disabled={isStudent || paymentLocked} placeholder={isStudent ? 'Not applicable for Student' : 'Enter your position or role'} value={form.position} onChange={event => updateField('position', event.target.value)} error={Boolean(errors.position)} helperText={errors.position || (isStudent ? 'Not required for Student.' : form.attendeeType === 'GENERAL' ? 'Optional for General.' : undefined)} sx={fieldStyles} />

              <Box>
                <Typography fontWeight={600}>
                  Choose Your Package <Box component='span' color='error.main'>*</Box>
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75, mb: 2 }}>
                  Free packages complete registration immediately. Paid packages continue through the secure payment gateway.
                </Typography>

                {isLoadingPackages ? (
                  <Card variant='outlined'><CardContent><Typography variant='body2' color='text.secondary' textAlign='center'>Loading available packages...</Typography></CardContent></Card>
                ) : packages.length === 0 ? (
                  <Card variant='outlined'><CardContent><Typography variant='body2' color='text.secondary' textAlign='center'>No package is currently available.</Typography></CardContent></Card>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {packages.map(item => {
                      const isSelected = form.eventPackageId === item.id
                      const soldOut = isPackageSoldOut(item)

                      return (
                        <Card
                          key={item.id}
                          variant='outlined'
                          sx={{
                            height: '100%',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            boxShadow: isSelected ? theme.shadows[4] : 'none'
                          }}
                        >
                          <CardActionArea disabled={soldOut || paymentLocked} onClick={() => updateField('eventPackageId', item.id)} sx={{ height: '100%' }}>
                            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start' }}>
                                <Typography variant='h6' fontWeight={700}>{item.name}</Typography>
                                {soldOut ? <Chip label='Sold Out' color='error' size='small' /> : item.price <= 0 ? <Chip label='Free' color='success' variant='tonal' size='small' /> : isSelected ? <Chip label='Selected' color='primary' variant='tonal' size='small' /> : null}
                              </Box>
                              <Typography color={item.price <= 0 ? 'success.main' : 'primary.main'} fontWeight={700} fontSize='1.05rem'>
                                {formatPrice(item.price)}
                              </Typography>
                              {item.benefits?.trim() && <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{item.benefits}</Typography>}
                              <Typography variant='caption' color='text.secondary' sx={{ mt: 'auto', pt: 1 }}>
                                {item.isUnlimited ? 'Package quota unlimited' : soldOut ? 'Package sold out' : `${item.remainingQuota ?? 0} slot(s) remaining`}
                              </Typography>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      )
                    })}
                  </Box>
                )}

                {errors.eventPackageId && <Typography variant='caption' color='error' sx={{ mt: 1, display: 'block' }}>{errors.eventPackageId}</Typography>}
              </Box>

              {guideImageUrl && (
                <Box>
                  <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>
                    {guideTitle || 'Event Guide'}
                  </Typography>
                  <Card variant='outlined' sx={{ overflow: 'hidden' }}>
                    <CardActionArea onClick={() => window.open(guideImageUrl, '_blank', 'noopener,noreferrer')}>
                      <Box component='img' src={guideImageUrl} alt={guideTitle || `${eventData?.name ?? 'Event'} guide`} sx={{ display: 'block', width: '100%', maxHeight: 560, objectFit: 'contain', bgcolor: 'background.default' }} />
                    </CardActionArea>
                  </Card>
                  <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                    Click the image to open the full-size guide.
                  </Typography>
                </Box>
              )}

              <Box>
                <FormControlLabel
                  control={<Checkbox disabled={paymentLocked} checked={form.consent} onChange={event => updateField('consent', event.target.checked)} />}
                  label='I agree to the processing of my personal data for the purposes of this event.'
                  sx={{ alignItems: 'flex-start', color: 'text.secondary', '& .MuiFormControlLabel-label': { fontSize: '0.875rem', lineHeight: 1.45, pt: 0.8 } }}
                />
                {errors.consent && <Typography color='error' variant='caption'>{errors.consent}</Typography>}
              </Box>

              {formMessage && <Typography color={messageIsError ? 'error' : 'text.secondary'} variant='body2'>{formMessage}</Typography>}

              <Button
                fullWidth
                type='submit'
                variant='contained'
                size='large'
                disabled={isSubmitting || isLoadingPackages || !eventData || (!paymentSession && (!form.eventPackageId || !hasAvailablePackage))}
                sx={{ minHeight: 50, mt: 1 }}
              >
                {submitLabel}
              </Button>
            </Box>
          </Box>
        </RegistrationCard>
      </Box>
    </RegistrationPage>
  )
}

export default EventRegistration
