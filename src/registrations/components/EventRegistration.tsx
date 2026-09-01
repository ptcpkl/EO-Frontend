'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { styled, useColorScheme, useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import CustomTextField from '@core/components/mui/TextField'
import { useSettings } from '@core/hooks/useSettings'

import {
  getEventPackages,
  getPublicEventBySlug,
  type EventPackage,
  type PublicEvent
} from '@/lib/api'
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
  width: 'min(100%, 560px)',
  boxSizing: 'border-box',
  margin: '0 auto',
  padding: theme.spacing(4),
  border: theme.palette.mode === 'dark' ? '1px solid rgba(219, 232, 240, 0.16)' : '1px solid rgba(27, 45, 58, 0.14)',
  borderRadius: 0,
  backgroundColor: theme.palette.mode === 'dark' ? '#17232d' : '#ffffff',
  boxShadow: theme.palette.mode === 'dark' ? '0 20px 60px rgba(0, 0, 0, 0.55)' : '0 20px 60px rgba(0, 0, 0, 0.16)',
  '@media (max-width: 600px)': {
    padding: theme.spacing(2.5)
  }
}))

const fieldStyles = {
  '& .MuiInputBase-root': {
    minHeight: 50,
    borderRadius: '10px !important'
  },
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

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!form.whatsappNumber.trim()) errors.whatsappNumber = 'WhatsApp Number is required.'

  if (form.attendeeType === 'STUDENT' && !form.institution.trim()) {
    errors.institution = 'Institution / Company is required.'
  }

  if (form.attendeeType === 'PROFESSIONAL' && !form.institution.trim()) {
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

  const redirectToPaymentResult = (
    status: 'success' | 'pending',
    session: RegistrationPaymentResponse
  ) => {
    const query = new URLSearchParams({
      registrationId: session.registrationId,
      bookingCode: session.bookingCode
    })

    router.push(`/events/${encodeURIComponent(slug)}/payment-${status}?${query.toString()}`)
  }

  const openPayment = async (session: RegistrationPaymentResponse) => {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

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

    const selectedPackage = packages.find(item => item.id === form.eventPackageId)

    if (!selectedPackage) {
      setFormMessage('The selected package is no longer available. Please refresh the page.')
      return
    }

    if (isPackageSoldOut(selectedPackage)) {
      setErrors(current => ({ ...current, eventPackageId: 'This package is sold out.' }))
      setFormMessage('The selected package is sold out. Please choose another package.')
      return
    }

    setIsSubmitting(true)
    setFormMessage('Creating your registration and payment session...')

    try {
      const result = await createExternalRegistrationPayment(eventData.id, {
        eventPackageId: form.eventPackageId,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.whatsappNumber.trim(),
        organization: form.institution.trim() || null,
        department: form.position.trim() || null
      })

      setPaymentSession(result)
      await openPayment(result)
    } catch (error) {
      console.error('Registration/payment failed:', error)
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

  return (
    <RegistrationPage>
      <RegistrationBackground aria-hidden='true' />

      <button
        type='button'
        aria-label={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={handleToggleMode}
        className='fixed right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl border border-divider bg-backgroundPaper text-textPrimary transition-colors hover:bg-backgroundDefault focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-backgroundPaper sm:right-5 sm:top-5'
      >
        <i className={theme.palette.mode === 'dark' ? 'tabler-sun' : 'tabler-moon'} />
      </button>

      <div className='relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6'>
        <RegistrationCard>
          <div className='mx-auto flex w-full max-w-[460px] flex-col'>
            <Button
              component={Link}
              href={`/events/${encodeURIComponent(slug)}`}
              variant='text'
              startIcon={<i className='tabler-arrow-left' />}
              sx={{ alignSelf: 'flex-start', mb: 2, color: 'text.secondary', px: 0 }}
            >
              Back to event
            </Button>

            <img
              src='/logoo.png'
              alt='Pertamina Event'
              className='mx-auto mb-5 block h-auto w-[190px] object-contain sm:w-[210px]'
            />

            <Typography
              variant='h4'
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                lineHeight: 1.2,
                fontSize: { xs: '1.45rem', sm: '1.7rem' }
              }}
            >
              Register for {eventData?.name ?? 'Event'}
            </Typography>

            <Typography sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.5 }}>
              {eventData?.description ?? 'Complete your information, choose a package, and continue to secure payment.'}
            </Typography>

            {paymentSession && (
              <div className='mt-5 rounded-xl border border-divider p-4'>
                <Typography variant='body2' sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Registration created
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5, color: 'text.secondary' }}>
                  Booking code: {paymentSession.bookingCode}. Your form is locked to prevent duplicate registrations.
                </Typography>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className='mt-6 flex flex-col gap-4'>
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

              <CustomTextField
                label='Full Name'
                required
                disabled={paymentLocked}
                placeholder='Enter your full name'
                value={form.fullName}
                onChange={event => updateField('fullName', event.target.value)}
                error={Boolean(errors.fullName)}
                helperText={errors.fullName}
                sx={fieldStyles}
              />

              <CustomTextField
                label='Email'
                required
                disabled={paymentLocked}
                type='email'
                placeholder='Enter your email address'
                value={form.email}
                onChange={event => updateField('email', event.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                sx={fieldStyles}
              />

              <CustomTextField
                label='WhatsApp Number'
                required
                disabled={paymentLocked}
                type='tel'
                placeholder='08xxxxxxxxxx'
                value={form.whatsappNumber}
                onChange={event => updateField('whatsappNumber', event.target.value)}
                error={Boolean(errors.whatsappNumber)}
                helperText={errors.whatsappNumber}
                sx={fieldStyles}
              />

              <CustomTextField
                label='Institution / Company'
                required={isProfessional || isStudent}
                disabled={paymentLocked}
                placeholder='Enter your institution or company'
                value={form.institution}
                onChange={event => updateField('institution', event.target.value)}
                error={Boolean(errors.institution)}
                helperText={
                  errors.institution ||
                  (form.attendeeType === 'GENERAL' ? 'Optional for General.' : undefined)
                }
                sx={fieldStyles}
              />

              <CustomTextField
                label='Position / Role'
                required={isProfessional}
                disabled={isStudent || paymentLocked}
                placeholder={isStudent ? 'Not applicable for Student' : 'Enter your position or role'}
                value={form.position}
                onChange={event => updateField('position', event.target.value)}
                error={Boolean(errors.position)}
                helperText={
                  errors.position ||
                  (isStudent
                    ? 'Not required for Student.'
                    : form.attendeeType === 'GENERAL'
                      ? 'Optional for General.'
                      : undefined)
                }
                sx={fieldStyles}
              />

              <div className='flex flex-col gap-2'>
                <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>
                  Choose Your Package
                  <span style={{ color: theme.palette.error.main, marginLeft: 4 }}>*</span>
                </Typography>

                <Typography variant='body2' sx={{ color: 'text.secondary', mb: 1 }}>
                  Select the package that suits you best.
                </Typography>

                {isLoadingPackages ? (
                  <div className='rounded-xl border border-divider p-5 text-center'>
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                      Loading available packages...
                    </Typography>
                  </div>
                ) : packages.length === 0 ? (
                  <div className='rounded-xl border border-divider p-5 text-center'>
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                      No package is currently available.
                    </Typography>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    {packages.map(item => {
                      const isSelected = form.eventPackageId === item.id
                      const soldOut = isPackageSoldOut(item)

                      return (
                        <button
                          key={item.id}
                          type='button'
                          disabled={soldOut || paymentLocked}
                          onClick={() => updateField('eventPackageId', item.id)}
                          className='text-left disabled:cursor-not-allowed disabled:opacity-50'
                          aria-pressed={isSelected}
                        >
                          <div
                            className='relative h-full rounded-xl border p-5 transition-all duration-200'
                            style={{
                              borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
                              boxShadow: isSelected ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
                              transform: isSelected ? 'translateY(-2px)' : 'none'
                            }}
                          >
                            {isSelected && !soldOut && (
                              <div
                                className='absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full'
                                style={{
                                  backgroundColor: theme.palette.primary.main,
                                  color: theme.palette.primary.contrastText
                                }}
                              >
                                <i className='tabler-check text-base' />
                              </div>
                            )}

                            {soldOut && (
                              <div
                                className='absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold'
                                style={{
                                  backgroundColor: theme.palette.error.main,
                                  color: theme.palette.error.contrastText
                                }}
                              >
                                Sold Out
                              </div>
                            )}

                            <Typography
                              variant='h6'
                              sx={{ color: 'text.primary', fontWeight: 700, pr: isSelected || soldOut ? 5 : 0 }}
                            >
                              {item.name}
                            </Typography>

                            <Typography
                              sx={{ mt: 1, color: 'primary.main', fontWeight: 700, fontSize: '1.05rem' }}
                            >
                              Rp {item.price.toLocaleString('id-ID')}
                            </Typography>

                            <div className='mt-4'>
                              <Typography
                                variant='body2'
                                sx={{ color: 'text.primary', fontWeight: 600, mb: 0.75 }}
                              >
                                Benefits
                              </Typography>
                              <Typography variant='body2' sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                {item.benefits?.trim() || 'Package benefits will be announced.'}
                              </Typography>
                            </div>

                            <Typography
                              variant='caption'
                              sx={{ display: 'block', mt: 2, color: 'text.secondary' }}
                            >
                              {item.isUnlimited
                                ? 'Package quota unlimited'
                                : soldOut
                                  ? 'Package sold out'
                                  : `${item.remainingQuota ?? 0} slot(s) remaining`}
                            </Typography>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {errors.eventPackageId && (
                  <Typography variant='caption' color='error' sx={{ mt: 0.25 }}>
                    {errors.eventPackageId}
                  </Typography>
                )}
              </div>

              <Typography sx={{ px: 2, pt: 2, fontWeight: 600, color: 'text.primary' }}>
                Seminar Area Map
              </Typography>

              <button
                type='button'
                onClick={() => window.open('/denahh.png', '_blank', 'noopener,noreferrer')}
                className='block w-full cursor-zoom-in'
                aria-label='Open seminar package map'
              >
                <img
                  src='/denahh.png'
                  alt='Seminar package area map'
                  className='block h-auto w-full object-contain transition-transform duration-200 hover:scale-[1.01]'
                />
              </button>

              <div>
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={paymentLocked}
                      checked={form.consent}
                      onChange={event => updateField('consent', event.target.checked)}
                    />
                  }
                  label='I agree to the processing of my personal data for the purposes of this event.'
                  sx={{
                    alignItems: 'flex-start',
                    color: 'text.secondary',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.875rem',
                      lineHeight: 1.45,
                      pt: 0.8
                    }
                  }}
                />

                {errors.consent && (
                  <Typography color='error' variant='caption'>
                    {errors.consent}
                  </Typography>
                )}
              </div>

              {formMessage && (
                <Typography color={messageIsError ? 'error' : 'text.secondary'} variant='body2'>
                  {formMessage}
                </Typography>
              )}

              <Button
                fullWidth
                type='submit'
                variant='contained'
                disabled={
                  isSubmitting ||
                  isLoadingPackages ||
                  !eventData ||
                  (!paymentSession && (!form.eventPackageId || !hasAvailablePackage))
                }
                sx={{ minHeight: 50, borderRadius: '10px', mt: 1 }}
              >
                {isSubmitting
                  ? 'Opening Payment...'
                  : paymentSession
                    ? 'Continue Payment'
                    : 'Register & Pay'}
              </Button>
            </form>
          </div>
        </RegistrationCard>
      </div>
    </RegistrationPage>
  )
}

export default EventRegistration
