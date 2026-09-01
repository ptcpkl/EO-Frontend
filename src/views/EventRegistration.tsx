'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { styled, useColorScheme, useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import CustomTextField from '@core/components/mui/TextField'
import { useSettings } from '@core/hooks/useSettings'
import { getEventPackages, getPublicEventBySlug, registerForEvent, type EventPackage } from '@/lib/api'

type RegistrationFormData = {
  fullName: string
  email: string
  whatsappNumber: string
  institution: string
  position: string
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
  eventPackageId: '',
  consent: false
}

const validate = (form: RegistrationFormData): RegistrationErrors => {
  const errors: RegistrationErrors = {}

  if (!form.fullName.trim()) errors.fullName = 'Full Name is required.'
  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Please enter a valid email address.'
  if (!form.whatsappNumber.trim()) errors.whatsappNumber = 'WhatsApp Number is required.'
  if (!form.institution.trim()) errors.institution = 'Institution / Company is required.'
  if (!form.eventPackageId) errors.eventPackageId = 'Please select an event package.'
  if (!form.consent) errors.consent = 'You must agree to the personal data consent.'

  return errors
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(price)

const EventRegistration = ({ slug }: Props) => {
  const theme = useTheme()
  const { setMode } = useColorScheme()
  const { updateSettings } = useSettings()
  const [form, setForm] = useState<RegistrationFormData>(initialForm)
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [formMessage, setFormMessage] = useState('')
  const [eventId, setEventId] = useState('')
  const [eventName, setEventName] = useState('Event Registration')
  const [packages, setPackages] = useState<EventPackage[]>([])

  useEffect(() => {
    let active = true

    const loadRegistrationData = async () => {
      try {
        setIsLoadingEvent(true)
        setFormMessage('')

        const event = await getPublicEventBySlug(slug)

        if (!event.id) throw new Error('Event ID is unavailable.')

        const eventPackages = await getEventPackages(event.id)

        if (!active) return

        setEventId(event.id)
        setEventName(event.name)
        setPackages(eventPackages.filter(item => item.isActive))

        if (eventPackages.length === 1) {
          setForm(current => ({ ...current, eventPackageId: eventPackages[0].id }))
        }
      } catch (error) {
        if (active) setFormMessage(error instanceof Error ? error.message : 'Unable to load registration data.')
      } finally {
        if (active) setIsLoadingEvent(false)
      }
    }

    void loadRegistrationData()

    return () => {
      active = false
    }
  }, [slug])

  const updateField = <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => {
    setForm(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
    setFormMessage('')
  }

  const handleToggleMode = () => {
    const nextMode = theme.palette.mode === 'dark' ? 'light' : 'dark'

    setMode(nextMode)
    updateSettings({ mode: nextMode })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate(form)

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !eventId) return

    try {
      setIsSubmitting(true)
      setFormMessage('Creating your payment session...')

      const payment = await registerForEvent(eventId, {
        eventPackageId: form.eventPackageId,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.whatsappNumber.trim(),
        organization: form.institution.trim(),
        department: form.position.trim() || undefined
      })

      window.location.assign(payment.redirectUrl)
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <RegistrationPage>
      <RegistrationBackground aria-hidden='true' />
      <button
        type='button'
        aria-label={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={handleToggleMode}
        className='fixed right-4 top-4 z-20 flex h-11 w-11 items-center justify-center border border-divider bg-backgroundPaper text-textPrimary sm:right-5 sm:top-5 rounded-xl transition-colors hover:bg-backgroundDefault focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-backgroundPaper'
      >
        <i className={theme.palette.mode === 'dark' ? 'tabler-sun' : 'tabler-moon'} />
      </button>

      <div className='relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6'>
        <RegistrationCard>
          <div className='mx-auto flex w-full max-w-[460px] flex-col'>
            <Button
              component={Link}
              href='/home'
              variant='text'
              startIcon={<i className='tabler-arrow-left' />}
              sx={{ alignSelf: 'flex-start', mb: 2, color: 'text.secondary', px: 0 }}
            >
              Back to home
            </Button>
            <img
              src={theme.palette.mode === 'dark' ? '/EO web2.png' : '/EO Web.png'}
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
              Register for {eventName}
            </Typography>
            <Typography sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.5 }}>
              Complete your information, choose a package, and continue to secure Midtrans payment.
            </Typography>

            <form noValidate onSubmit={handleSubmit} className='mt-6 flex flex-col gap-4'>
              <CustomTextField
                label='Full Name'
                required
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
                required
                placeholder='Enter your institution or company'
                value={form.institution}
                onChange={event => updateField('institution', event.target.value)}
                error={Boolean(errors.institution)}
                helperText={errors.institution}
                sx={fieldStyles}
              />
              <CustomTextField
                label='Position / Department'
                placeholder='Enter your position or department'
                value={form.position}
                onChange={event => updateField('position', event.target.value)}
                sx={fieldStyles}
              />
              <CustomTextField
                select
                label='Event Package'
                required
                disabled={isLoadingEvent || packages.length === 0}
                value={form.eventPackageId}
                onChange={event => updateField('eventPackageId', event.target.value)}
                error={Boolean(errors.eventPackageId)}
                helperText={
                  errors.eventPackageId ??
                  (packages.length === 0 && !isLoadingEvent ? 'No active package is available.' : undefined)
                }
                sx={fieldStyles}
              >
                {packages.map(item => (
                  <MenuItem key={item.id} value={item.id} disabled={item.remainingQuota === 0}>
                    {item.name} — {formatPrice(item.price)}
                    {item.isUnlimited ? ' — package quota unlimited' : ` — ${item.remainingQuota ?? 0} left`}
                  </MenuItem>
                ))}
              </CustomTextField>
              <div>
                <FormControlLabel
                  control={
                    <Checkbox checked={form.consent} onChange={event => updateField('consent', event.target.checked)} />
                  }
                  label='I agree to the processing of my personal data for the purposes of this event.'
                  sx={{
                    alignItems: 'flex-start',
                    color: 'text.secondary',
                    '& .MuiFormControlLabel-label': { fontSize: '0.875rem', lineHeight: 1.45, pt: 0.8 }
                  }}
                />
                {errors.consent && (
                  <Typography color='error' variant='caption'>
                    {errors.consent}
                  </Typography>
                )}
              </div>
              {formMessage && (
                <Typography color='text.secondary' variant='body2'>
                  {formMessage}
                </Typography>
              )}
              <Button
                fullWidth
                type='submit'
                variant='contained'
                disabled={isSubmitting || isLoadingEvent || packages.length === 0}
                sx={{ minHeight: 50, borderRadius: '10px', mt: 1 }}
              >
                {isSubmitting ? 'Redirecting to payment...' : 'Register & Pay'}
              </Button>
            </form>
          </div>
        </RegistrationCard>
      </div>
    </RegistrationPage>
  )
}

export default EventRegistration
