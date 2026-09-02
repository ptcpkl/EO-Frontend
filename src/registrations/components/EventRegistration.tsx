'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { styled, useColorScheme, useTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import CustomTextField from '@core/components/mui/TextField'
import { useSettings } from '@core/hooks/useSettings'

import { getEventPackages, getPublicEventBySlug, type EventPackage, type PublicEvent } from '@/lib/api'
import { openMidtransSnap } from '../lib/midtrans'
import { createExternalRegistrationPayment, type RegistrationPaymentResponse } from '../services/registration.service'

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

type Props = { slug: string }

const RegistrationPage = styled('main')({
  position: 'relative',
  minHeight: '100dvh',
  overflowX: 'hidden',
  overflowY: 'auto'
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
  padding: theme.spacing(4),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[12],
  '@media (max-width: 600px)': { padding: theme.spacing(2.5) }
}))

const fieldStyles = {
  '& .MuiInputBase-root': { minHeight: 50 },
  '& .MuiInputBase-input': {
    '&:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 1000px transparent inset',
      WebkitTextFillColor: 'var(--mui-palette-text-primary)'
    }
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
  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Please enter a valid email address.'
  if (!form.whatsappNumber.trim()) errors.whatsappNumber = 'WhatsApp Number is required.'
  if (['STUDENT', 'PROFESSIONAL'].includes(form.attendeeType) && !form.institution.trim()) errors.institution = 'Institution / Company is required.'
  if (form.attendeeType === 'PROFESSIONAL' && !form.position.trim()) errors.position = 'Position / Role is required.'
  if (!form.eventPackageId) errors.eventPackageId = 'Please select a package.'
  if (!form.consent) errors.consent = 'You must agree to the personal data consent.'

  return errors
}

const isPackageSoldOut = (eventPackage: EventPackage) =>
  !eventPackage.isUnlimited && typeof eventPackage.remainingQuota === 'number' && eventPackage.remainingQuota <= 0

const legacyFfws = (slug: string) => slug.toLowerCase().includes('ffws')

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

  const paymentLocked = paymentSession?.paymentRequired === true
  const selectedPackage = useMemo(() => packages.find(item => item.id === form.eventPackageId) ?? null, [packages, form.eventPackageId])
  const isFreePackage = selectedPackage?.price === 0

  useEffect(() => {
    let mounted = true

    const loadRegistrationData = async () => {
      try {
        setIsLoadingPackages(true)
        setFormMessage('')

        const loadedEvent = await getPublicEventBySlug(slug)
        const loadedPackages = await getEventPackages(loadedEvent.id)
        if (!mounted) return

        const activePackages = loadedPackages.filter(item => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
        setEventData(loadedEvent)
        setPackages(activePackages)

        const availablePackages = activePackages.filter(item => !isPackageSoldOut(item))
        if (availablePackages.length === 1) setForm(current => ({ ...current, eventPackageId: availablePackages[0].id }))
      } catch (error) {
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
    return () => { mounted = false }
  }, [slug])

  const updateField = <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => {
    if (paymentLocked) return
    setForm(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
    setFormMessage('')
  }

  const handleAttendeeTypeChange = (value: AttendeeType) => {
    if (paymentLocked) return
    setForm(current => ({ ...current, attendeeType: value, position: value === 'STUDENT' ? '' : current.position }))
    setErrors(current => ({ ...current, attendeeType: undefined, position: undefined, institution: undefined }))
    setFormMessage('')
  }

  const handleToggleMode = () => {
    const nextMode = theme.palette.mode === 'dark' ? 'light' : 'dark'
    setMode(nextMode)
    updateSettings({ mode: nextMode })
  }

  const redirectToStatus = (session: RegistrationPaymentResponse) => {
    router.push(`/registration/${encodeURIComponent(session.bookingCode)}/status`)
  }

  const redirectToPaymentResult = (status: 'success' | 'pending', session: RegistrationPaymentResponse) => {
    const query = new URLSearchParams({ registrationId: session.registrationId, bookingCode: session.bookingCode })
    router.push(`/events/${encodeURIComponent(slug)}/payment-${status}?${query.toString()}`)
  }

  const openPayment = async (session: RegistrationPaymentResponse) => {
    if (!session.paymentRequired || !session.snapToken) {
      redirectToStatus(session)
      return
    }

    setIsSubmitting(true)
    setFormMessage('Opening secure payment...')

    try {
      await openMidtransSnap(session.snapToken, {
        onSuccess: () => redirectToPaymentResult('success', session),
        onPending: () => redirectToPaymentResult('pending', session),
        onError: () => setFormMessage('Payment failed. Your registration is still available to retry from this page.'),
        onClose: () => setFormMessage('Payment window was closed. Click Continue Payment to reopen the same payment session.')
      })
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Unable to open payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()

    if (paymentSession?.paymentRequired) {
      await openPayment(paymentSession)
      return
    }

    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (!eventData || !selectedPackage) {
      setFormMessage('Event or package information is no longer available. Please refresh the page.')
      return
    }

    if (isPackageSoldOut(selectedPackage)) {
      setErrors(current => ({ ...current, eventPackageId: 'This package is sold out.' }))
      return
    }

    setIsSubmitting(true)
    setFormMessage(isFreePackage ? 'Confirming your free registration...' : 'Creating your registration and secure payment session...')

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
        redirectToStatus(result)
        return
      }

      setPaymentSession(result)
      await openPayment(result)
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStudent = form.attendeeType === 'STUDENT'
  const isProfessional = form.attendeeType === 'PROFESSIONAL'
  const hasAvailablePackage = packages.some(item => !isPackageSoldOut(item))
  const messageLower = formMessage.toLowerCase()
  const messageIsError = ['failed', 'error', 'invalid', 'sold out', 'unavailable', 'unable'].some(word => messageLower.includes(word))

  const logoUrl = eventData?.logoUrl || (legacyFfws(slug) ? '/logoo.png' : '/EO%20Navbar.png')
  const registrationImageUrl = eventData?.registrationImageUrl || (legacyFfws(slug) ? '/denahh.png' : undefined)
  const registrationImageTitle = eventData?.registrationImageTitle || (legacyFfws(slug) ? 'Seminar Area Map' : undefined)

  return (
    <RegistrationPage>
      <RegistrationBackground aria-hidden='true' />

      <Button
        aria-label={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={handleToggleMode}
        variant='contained'
        sx={{ position: 'fixed', right: 20, top: 20, zIndex: 20, minWidth: 44, width: 44, height: 44, p: 0, borderRadius: 2 }}
      >
        <i className={theme.palette.mode === 'dark' ? 'tabler-sun' : 'tabler-moon'} />
      </Button>

      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2, sm: 3 }, py: 5 }}>
        <RegistrationCard>
          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <Button component={Link} href={`/events/${encodeURIComponent(slug)}`} variant='text' startIcon={<i className='tabler-arrow-left' />} sx={{ mb: 2, px: 0, color: 'text.secondary' }}>
              Back to event
            </Button>

            <Box component='img' src={logoUrl} alt={`${eventData?.name ?? 'Event'} logo`} sx={{ display: 'block', maxWidth: 230, maxHeight: 150, width: 'auto', height: 'auto', objectFit: 'contain', mx: 'auto', mb: 4 }} />

            <Typography variant='h4' sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: { xs: '1.5rem', sm: '1.8rem' } }}>
              Register for {eventData?.name ?? 'Event'}
            </Typography>
            <Typography color='text.secondary' sx={{ mt: 1, lineHeight: 1.6 }}>
              {eventData?.description ?? 'Complete your information and choose an available package.'}
            </Typography>

            {paymentSession?.paymentRequired && (
              <Alert severity='info' sx={{ mt: 4 }}>
                Registration {paymentSession.bookingCode} has been created. Continue the same payment session to avoid duplicate reservations.
              </Alert>
            )}

            <Box component='form' noValidate onSubmit={handleSubmit} sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <CustomTextField select label='Attendee Type' required disabled={paymentLocked} value={form.attendeeType} onChange={event => handleAttendeeTypeChange(event.target.value as AttendeeType)} error={Boolean(errors.attendeeType)} helperText={errors.attendeeType} sx={fieldStyles}>
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
                <Typography fontWeight={600}>Choose Your Package *</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, mb: 2 }}>Free packages register immediately. Paid packages continue to secure Midtrans payment.</Typography>

                {isLoadingPackages ? (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center' }}><Typography color='text.secondary'>Loading available packages...</Typography></Box>
                ) : packages.length === 0 ? (
                  <Alert severity='warning'>No package is currently available.</Alert>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {packages.map(item => {
                      const selected = form.eventPackageId === item.id
                      const soldOut = isPackageSoldOut(item)
                      return (
                        <Button key={item.id} type='button' disabled={soldOut || paymentLocked} onClick={() => updateField('eventPackageId', item.id)} variant={selected ? 'contained' : 'outlined'} color={item.price === 0 ? 'success' : 'primary'} sx={{ p: 2.5, justifyContent: 'flex-start', textAlign: 'left', alignItems: 'stretch', flexDirection: 'column', minHeight: 170 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, width: '100%' }}>
                            <Typography color='inherit' fontWeight={700}>{item.name}</Typography>
                            {item.price === 0 && <Chip label='Free' size='small' color='success' variant='tonal' />}
                          </Box>
                          <Typography color='inherit' fontWeight={700} sx={{ mt: 1 }}>{item.price === 0 ? 'Free' : `Rp ${item.price.toLocaleString('id-ID')}`}</Typography>
                          <Typography variant='body2' color='inherit' sx={{ mt: 2, opacity: 0.85, whiteSpace: 'normal' }}>{item.benefits?.trim() || 'Package benefits will be announced.'}</Typography>
                          <Typography variant='caption' color='inherit' sx={{ mt: 'auto', pt: 2, opacity: 0.75 }}>{item.isUnlimited ? 'Unlimited quota' : soldOut ? 'Sold out' : `${item.remainingQuota ?? 0} slot(s) remaining`}</Typography>
                        </Button>
                      )
                    })}
                  </Box>
                )}
                {errors.eventPackageId && <Typography variant='caption' color='error'>{errors.eventPackageId}</Typography>}
              </Box>

              {registrationImageUrl && (
                <Box sx={{ mt: 1 }}>
                  {registrationImageTitle && <Typography fontWeight={600} sx={{ mb: 1.5 }}>{registrationImageTitle}</Typography>}
                  <Box component='a' href={registrationImageUrl} target='_blank' rel='noreferrer' sx={{ display: 'block', overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box component='img' src={registrationImageUrl} alt={registrationImageTitle || `${eventData?.name ?? 'Event'} registration guide`} sx={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
                  </Box>
                </Box>
              )}

              <Box>
                <FormControlLabel control={<Checkbox disabled={paymentLocked} checked={form.consent} onChange={event => updateField('consent', event.target.checked)} />} label='I agree to the processing of my personal data for the purposes of this event.' sx={{ alignItems: 'flex-start', color: 'text.secondary' }} />
                {errors.consent && <Typography color='error' variant='caption'>{errors.consent}</Typography>}
              </Box>

              {formMessage && <Alert severity={messageIsError ? 'error' : 'info'}>{formMessage}</Alert>}

              <Button fullWidth type='submit' variant='contained' size='large' color={isFreePackage && !paymentSession ? 'success' : 'primary'} disabled={isSubmitting || isLoadingPackages || !eventData || (!paymentSession && (!form.eventPackageId || !hasAvailablePackage))}>
                {isSubmitting ? (isFreePackage ? 'Confirming Registration...' : 'Opening Payment...') : paymentSession?.paymentRequired ? 'Continue Payment' : isFreePackage ? 'Register Free' : 'Register & Pay'}
              </Button>
            </Box>
          </Box>
        </RegistrationCard>
      </Box>
    </RegistrationPage>
  )
}

export default EventRegistration
