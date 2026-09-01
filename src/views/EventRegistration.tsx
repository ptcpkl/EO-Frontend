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

type EventPackage = {
  id: string
  name: string
  benefits?: string | null
  price?: number
  isActive?: boolean
  sortOrder?: number
  remainingQuota?: number
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
  backgroundImage:
    theme.palette.mode === 'dark' ? "url('/Dark.png')" : "url('/back.png')",
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
  border:
    theme.palette.mode === 'dark'
      ? '1px solid rgba(219, 232, 240, 0.16)'
      : '1px solid rgba(27, 45, 58, 0.14)',
  borderRadius: 0,
  backgroundColor:
    theme.palette.mode === 'dark' ? '#17232d' : '#ffffff',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 20px 60px rgba(0, 0, 0, 0.55)'
      : '0 20px 60px rgba(0, 0, 0, 0.16)',
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

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:5174/api'

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

const validate = (
  form: RegistrationFormData
): RegistrationErrors => {
  const errors: RegistrationErrors = {}

  if (!form.attendeeType) {
    errors.attendeeType = 'Please select an attendee type.'
  }

  if (!form.fullName.trim()) {
    errors.fullName = 'Full Name is required.'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  ) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!form.whatsappNumber.trim()) {
    errors.whatsappNumber = 'WhatsApp Number is required.'
  }


  if (
    form.attendeeType === 'STUDENT' &&
    !form.institution.trim()
  ) {
    errors.institution = 'Institution / Company is required.'
  }

  /*
   * PROFESSIONAL:
   * Semua field utama wajib diisi.
   */
  if (
    form.attendeeType === 'PROFESSIONAL' &&
    !form.institution.trim()
  ) {
    errors.institution = 'Institution / Company is required.'
  }

  if (
    form.attendeeType === 'PROFESSIONAL' &&
    !form.position.trim()
  ) {
    errors.position = 'Position / Role is required.'
  }

  /*
   * GENERAL:
   * Hanya Full Name, Email, dan WhatsApp yang wajib.
   */

  if (!form.eventPackageId) {
    errors.eventPackageId = 'Please select a package.'
  }

  if (!eventId) {
  setFormMessage(
    'Event information is not ready. Please refresh the page.'
  )

  return
}

  if (!form.consent) {
    errors.consent =
      'You must agree to the personal data consent.'
  }

  return errors
}

const EventRegistration = ({ slug }: Props) => {
  const theme = useTheme()
  const { setMode } = useColorScheme()
  const { updateSettings } = useSettings()

  const [form, setForm] =
    useState<RegistrationFormData>(initialForm)

  const [errors, setErrors] =
    useState<RegistrationErrors>({})

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [formMessage, setFormMessage] =
    useState('')

  const [packages, setPackages] =
    useState<EventPackage[]>([])

const [eventId, setEventId] = useState<string | null>(null)

  const [isLoadingPackages, setIsLoadingPackages] =
    useState(true)

  useEffect(() => {
    let mounted = true

    const loadPackages = async () => {
  try {
    setIsLoadingPackages(true)
    setFormMessage('')

    // 1. Load public event berdasarkan slug
    const eventResponse = await fetch(
      `${apiUrl}/events/${encodeURIComponent(slug)}`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    )

    if (!eventResponse.ok) {
      throw new Error(
        `Failed to load event (${eventResponse.status})`
      )
    }

    const event = await eventResponse.json()

    const loadedEventId = event?.id ?? event?.Id

if (!loadedEventId) {
  throw new Error(
    'Event response does not contain an event id.'
  )
}

if (mounted) {
  setEventId(loadedEventId)
}

    if (!eventId) {
      throw new Error(
        'Event response does not contain an event id.'
      )
    }

    // 2. Load package melalui public package endpoint
    const packagesResponse = await fetch(
      `${apiUrl}/events/${eventId}/packages`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    )

    if (!packagesResponse.ok) {
      throw new Error(
        `Failed to load event packages (${packagesResponse.status})`
      )
    }

    const eventPackages =
      await packagesResponse.json()

    if (!mounted) {
      return
    }

    // 3. Hanya tampilkan package aktif
    const activePackages = Array.isArray(eventPackages)
      ? eventPackages
          .filter(
            (item: EventPackage) =>
              item.isActive !== false
          )
          .sort(
            (a: EventPackage, b: EventPackage) =>
              (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
          )
      : []

    setPackages(activePackages)
  } catch (error) {
    console.error(
      'Failed to load event packages:',
      error
    )

    if (mounted) {
      setPackages([])
      setFormMessage(
        'Unable to load available packages. Please try again.'
      )
    }
  } finally {
    if (mounted) {
      setIsLoadingPackages(false)
    }
  }
}

    loadPackages()

    return () => {
      mounted = false
    }
  }, [slug])

  const updateField = <
    K extends keyof RegistrationFormData
  >(
    field: K,
    value: RegistrationFormData[K]
  ) => {
    setForm(current => ({
      ...current,
      [field]: value
    }))

    setErrors(current => ({
      ...current,
      [field]: undefined
    }))

    setFormMessage('')
  }

const handlePackageSelect = (packageId: string) => {
  updateField('eventPackageId', packageId)
}

  const handleAttendeeTypeChange = (
    value: AttendeeType
  ) => {
    setForm(current => ({
      ...current,
      attendeeType: value,

      /*
       * Position / Role tidak boleh membawa
       * data lama ketika user memilih Student.
       */
      position:
        value === 'STUDENT'
          ? ''
          : current.position
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
    const nextMode =
      theme.palette.mode === 'dark'
        ? 'light'
        : 'dark'

    setMode(nextMode)
    updateSettings({ mode: nextMode })
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const nextErrors = validate(form)

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    if (!form.eventPackageId) {
      return
    }

    setIsSubmitting(true)
    setFormMessage(
      'Registration is being prepared...'
    )

    try {
      /*
       * IMPORTANT:
       *
       * Attendee Type:
       * STUDENT / PROFESSIONAL / GENERAL
       *
       * Ini hanya digunakan untuk logic form.
       *
       * ParticipantType database tetap:
       * External
       *
       * Position / Role secara bisnis:
       * Department
       *
       * EventPackageId:
       * package yang dipilih user.
       */



const result =
  await createExternalRegistrationPayment(
    slug,
    {
      eventPackageId: form.eventPackageId,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.whatsappNumber.trim(),
      organization:
        form.institution.trim() || null
    }
  )

await loadMidtransSnap()

if (!window.snap) {
  throw new Error(
    'Midtrans Snap is not available.'
  )
}

window.snap.pay(
  result.snapToken,
  {
    onSuccess: () => {
      router.push(
        `/registration/payment-success?registrationId=${result.registrationId}`
      )
    },

    onPending: () => {
      router.push(
        `/registration/payment-pending?registrationId=${result.registrationId}`
      )
    },

    onError: () => {
      setFormMessage(
        'Payment failed. Please try again.'
      )
    },

    onClose: () => {
      setFormMessage(
        'Payment window was closed.'
      )
    }
  }
)

    } catch (error) {
      console.error(
        'Registration failed:',
        error
      )

      setFormMessage(
        'Registration failed. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStudent =
    form.attendeeType === 'STUDENT'

  const isProfessional =
    form.attendeeType === 'PROFESSIONAL'

  return (
    <RegistrationPage>
      <RegistrationBackground aria-hidden='true' />

      <button
        type='button'
        aria-label={
          theme.palette.mode === 'dark'
            ? 'Switch to light mode'
            : 'Switch to dark mode'
        }
        onClick={handleToggleMode}
        className='fixed right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl border border-divider bg-backgroundPaper text-textPrimary transition-colors hover:bg-backgroundDefault focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-backgroundPaper sm:right-5 sm:top-5'
      >
        <i
          className={
            theme.palette.mode === 'dark'
              ? 'tabler-sun'
              : 'tabler-moon'
          }
        />
      </button>

      <div className='relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6'>
        <RegistrationCard>
          <div className='mx-auto flex w-full max-w-[460px] flex-col'>
            <Button
              component={Link}
              href='/home'
              variant='text'
              startIcon={
                <i className='tabler-arrow-left' />
              }
              sx={{
                alignSelf: 'flex-start',
                mb: 2,
                color: 'text.secondary',
                px: 0
              }}
            >
              Back to home
            </Button>

            <img
              src={
                theme.palette.mode === 'dark'
                  ? '/logoo.png'
                  : '/logoo.png'
              }
              alt='Pertamina Event'
              className='mx-auto mb-5 block h-auto w-[190px] object-contain sm:w-[210px]'
            />

            <Typography
              variant='h4'
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                lineHeight: 1.2,
                fontSize: {
                  xs: '1.45rem',
                  sm: '1.7rem'
                }
              }}
            >
              Register for Seminar FFWS Edit
            </Typography>

            <Typography
              sx={{
                mt: 1,
                color: 'text.secondary',
                lineHeight: 1.5
              }}
            >
              Join the event and get the latest FFWS
              insights.
            </Typography>

            <form
              noValidate
              onSubmit={handleSubmit}
              className='mt-6 flex flex-col gap-4'
            >
              {/* ATTENDEE TYPE */}
              <CustomTextField
                select
                label='Attendee Type'
                required
                value={form.attendeeType}
                onChange={event =>
                  handleAttendeeTypeChange(
                    event.target.value as AttendeeType
                  )
                }
                error={Boolean(
                  errors.attendeeType
                )}
                helperText={
                  errors.attendeeType
                }
                sx={fieldStyles}
              >
                <MenuItem value='STUDENT'>
                  Student
                </MenuItem>

                <MenuItem value='PROFESSIONAL'>
                  Professional
                </MenuItem>

                <MenuItem value='GENERAL'>
                  General
                </MenuItem>
              </CustomTextField>

              {/* FULL NAME */}
              <CustomTextField
                label='Full Name'
                required
                placeholder='Enter your full name'
                value={form.fullName}
                onChange={event =>
                  updateField(
                    'fullName',
                    event.target.value
                  )
                }
                error={Boolean(
                  errors.fullName
                )}
                helperText={errors.fullName}
                sx={fieldStyles}
              />

              {/* EMAIL */}
              <CustomTextField
                label='Email'
                required
                type='email'
                placeholder='Enter your email address'
                value={form.email}
                onChange={event =>
                  updateField(
                    'email',
                    event.target.value
                  )
                }
                error={Boolean(errors.email)}
                helperText={errors.email}
                sx={fieldStyles}
              />

              {/* WHATSAPP */}
              <CustomTextField
                label='WhatsApp Number'
                required
                type='tel'
                placeholder='08xxxxxxxxxx'
                value={form.whatsappNumber}
                onChange={event =>
                  updateField(
                    'whatsappNumber',
                    event.target.value
                  )
                }
                error={Boolean(
                  errors.whatsappNumber
                )}
                helperText={
                  errors.whatsappNumber
                }
                sx={fieldStyles}
              />

              {/* INSTITUTION */}
              <CustomTextField
                label='Institution / Company'
                required={
                  isProfessional ||
                  isStudent
                }
                placeholder='Enter your institution or company'
                value={form.institution}
                onChange={event =>
                  updateField(
                    'institution',
                    event.target.value
                  )
                }
                error={Boolean(
                  errors.institution
                )}
                helperText={
                  errors.institution ||
                  (form.attendeeType ===
                    'GENERAL'
                    ? 'Optional for General.'
                    : undefined)
                }
                sx={fieldStyles}
              />

              {/* POSITION / ROLE */}
              <CustomTextField
                label='Position / Role'
                required={isProfessional}
                disabled={isStudent}
                placeholder={
                  isStudent
                    ? 'Not applicable for Student'
                    : 'Enter your position or role'
                }
                value={form.position}
                onChange={event =>
                  updateField(
                    'position',
                    event.target.value
                  )
                }
                error={Boolean(
                  errors.position
                )}
                helperText={
                  errors.position ||
                  (isStudent
                    ? 'Not required for Student.'
                    : form.attendeeType ===
                        'GENERAL'
                      ? 'Optional for General.'
                      : undefined)
                }
                sx={fieldStyles}
              />

             {/* PACKAGE */}
<div className='flex flex-col gap-2'>
  <Typography
    sx={{
      color: 'text.primary',
      fontWeight: 600
    }}
  >
    Choose Your Package
    <span
      style={{
        color: theme.palette.error.main,
        marginLeft: 4
      }}
    >
      *
    </span>
  </Typography>

  <Typography
    variant='body2'
    sx={{
      color: 'text.secondary',
      mb: 1
    }}
  >
    Select the package that suits you best.
  </Typography>

  {isLoadingPackages ? (
    <div className='rounded-xl border border-divider p-5 text-center'>
      <Typography
        variant='body2'
        sx={{ color: 'text.secondary' }}
      >
        Loading available packages...
      </Typography>
    </div>
  ) : packages.length === 0 ? (
    <div className='rounded-xl border border-divider p-5 text-center'>
      <Typography
        variant='body2'
        sx={{ color: 'text.secondary' }}
      >
        No package is currently available.
      </Typography>
    </div>
  ) : (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl'>
      {packages.map(item => {
        const isSelected =
          form.eventPackageId === item.id

        return (
          <button
            key={item.id}
            type='button'
            onClick={() =>
              handlePackageSelect(item.id)
            }
            className='text-left'
            aria-pressed={isSelected}
          >
            <div
              className='relative h-full rounded-xl border p-5 transition-all duration-200'
              style={{
                borderColor: isSelected
                  ? theme.palette.primary.main
                  : theme.palette.divider,



                boxShadow: isSelected
                  ? `0 0 0 10px ${theme.palette.primary.main}`
                  : 'none',

                transform: isSelected
                  ? 'translateY(-2px)'
                  : 'none'
              }}
            >
              {/* SELECTED INDICATOR */}
              {isSelected && (
                <div
                  className='absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full'
                  style={{
                    backgroundColor:
                      theme.palette.primary.main,
                    color:
                      theme.palette.primary.contrastText
                  }}
                >
                  <i className='tabler-check text-base' />
                </div>
              )}

              {/* PACKAGE NAME */}
              <Typography
                variant='h6'
                sx={{
                  color: 'text.primary',
                  fontWeight: 700,
                  pr: isSelected ? 5 : 0
                }}
              >
                {item.name}
              </Typography>

              {/* PRICE */}
              <Typography
                sx={{
                  mt: 1,
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '1.05rem'
                }}
              >
                {typeof item.price === 'number'
                  ? `Rp ${item.price.toLocaleString(
                      'id-ID'
                    )}`
                  : 'Price unavailable'}
              </Typography>

              {/* BENEFITS */}
              <div className='mt-4'>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 0.75
                  }}
                >
                  Benefits
                </Typography>

                <Typography
                  variant='body2'
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.6
                  }}
                >
                  {item.benefits?.trim() ||
                    'Package benefits will be announced.'}
                </Typography>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )}

  {/* PACKAGE VALIDATION */}
  {errors.eventPackageId && (
    <Typography
      variant='caption'
      color='error'
      sx={{ mt: 0.25 }}
    >
      {errors.eventPackageId}
    </Typography>
  )}
</div>

              {/* PACKAGE MAP */}

                <Typography
                  sx={{
                    px: 2,
                    pt: 2,
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  Seminar Area Map
                </Typography>


                <button
                  type='button'
                  onClick={() =>
                    window.open(
                      '/denahh.png',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className='block w-full cursor-zoom-in'
                  aria-label='Open seminar package map'
                >
                  <img
                    src='/denahh.png'
                    alt='Seminar package area map'
                    className='block h-auto w-full object-contain transition-transform duration-200 hover:scale-[1.01]'
                  />
                </button>


              {/* CONSENT */}
              <div>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.consent}
                      onChange={event =>
                        updateField(
                          'consent',
                          event.target.checked
                        )
                      }
                    />
                  }
                  label='I agree to the processing of my personal data for the purposes of this event.'
                  sx={{
                    alignItems: 'flex-start',
                    color: 'text.secondary',
                    '& .MuiFormControlLabel-label':
                      {
                        fontSize: '0.875rem',
                        lineHeight: 1.45,
                        pt: 0.8
                      }
                  }}
                />

                {errors.consent && (
                  <Typography
                    color='error'
                    variant='caption'
                  >
                    {errors.consent}
                  </Typography>
                )}
              </div>

              {/* MESSAGE */}
              {formMessage && (
                <Typography
                  color={
                    formMessage
                      .toLowerCase()
                      .includes('failed')
                      ? 'error'
                      : 'text.secondary'
                  }
                  variant='body2'
                >
                  {formMessage}
                </Typography>
              )}

              {/* SUBMIT */}
              <Button
                fullWidth
                type='submit'
                variant='contained'
                disabled={
                  isSubmitting ||
                  isLoadingPackages ||
                  !form.eventPackageId
                }
                sx={{
                  minHeight: 50,
                  borderRadius: '10px',
                  mt: 1
                }}
              >
                {isSubmitting
                  ? 'Preparing...'
                  : 'Register Now'}
              </Button>
            </form>
          </div>
        </RegistrationCard>
      </div>
    </RegistrationPage>
  )
}

export default EventRegistration
