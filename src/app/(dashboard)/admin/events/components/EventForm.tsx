'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
  EVENT_ACCESS_MODES,
  EVENT_KINDS,
  type AdminEvent,
  type EventAccessMode,
  type EventKind,
  type EventUpsertRequest
} from '@/lib/admin-events'

type Props = {
  event?: AdminEvent | null
  submitLabel: string
  submitting?: boolean
  error?: string | null
  onSubmit: (request: EventUpsertRequest) => Promise<void> | void
  onCancel: () => void
}

type FormState = {
  name: string
  description: string
  location: string
  kind: EventKind
  startAt: string
  endAt: string
  registrationOpenAt: string
  registrationCloseAt: string
  capacity: string
  accessMode: EventAccessMode
  accessValue: string
}

const toLocalDateTime = (value?: string | null) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)

  return shifted.toISOString().slice(0, 16)
}

const createState = (event?: AdminEvent | null): FormState => ({
  name: event?.name ?? '',
  description: event?.description ?? '',
  location: event?.location ?? '',
  kind: event?.kind ?? 'Seminar',
  startAt: toLocalDateTime(event?.startAtUtc),
  endAt: toLocalDateTime(event?.endAtUtc),
  registrationOpenAt: toLocalDateTime(event?.registrationOpenAtUtc),
  registrationCloseAt: toLocalDateTime(event?.registrationCloseAtUtc),
  capacity: event?.capacity ? String(event.capacity) : '',
  accessMode: event?.accessMode ?? 'Public',
  accessValue: event?.accessValue ?? ''
})

const EventForm = ({ event, submitLabel, submitting = false, error, onSubmit, onCancel }: Props) => {
  const [form, setForm] = useState<FormState>(() => createState(event))
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    setForm(createState(event))
  }, [event])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(previous => ({ ...previous, [key]: value }))
  }

  const handleSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setValidationError(null)

    const name = form.name.trim()
    const capacity = Number(form.capacity)
    const startAt = new Date(form.startAt)
    const endAt = new Date(form.endAt)
    const registrationOpenAt = new Date(form.registrationOpenAt)
    const registrationCloseAt = new Date(form.registrationCloseAt)

    if (!name) return setValidationError('Event name is required.')
    if (!Number.isInteger(capacity) || capacity <= 0) return setValidationError('Capacity must be greater than zero.')
    if ([startAt, endAt, registrationOpenAt, registrationCloseAt].some(date => Number.isNaN(date.getTime()))) {
      return setValidationError('Please complete all event and registration dates.')
    }
    if (endAt <= startAt) return setValidationError('Event end time must be after the start time.')
    if (registrationCloseAt <= registrationOpenAt) {
      return setValidationError('Registration close time must be after the open time.')
    }
    if (registrationCloseAt > startAt) {
      return setValidationError('Registration must close no later than the event start time.')
    }
    if (form.accessMode !== 'Public' && !form.accessValue.trim()) {
      return setValidationError(
        form.accessMode === 'EmailDomain' ? 'Email domain is required.' : 'Invitation code is required.'
      )
    }

    await onSubmit({
      name,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      kind: form.kind,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      registrationOpenAt: registrationOpenAt.toISOString(),
      registrationCloseAt: registrationCloseAt.toISOString(),
      capacity,
      accessMode: form.accessMode,
      accessValue: form.accessMode === 'Public' ? null : form.accessValue.trim()
    })
  }

  return (
    <Card elevation={0}>
      <CardContent sx={{ p: { xs: 3, md: 5 } }}>
        {(error || validationError) && (
          <Alert severity='error' sx={{ mb: 4 }}>
            {validationError ?? error}
          </Alert>
        )}

        <Box component='form' onSubmit={handleSubmit} sx={{ display: 'grid', gap: 4 }}>
          <Box>
            <Typography variant='h6' fontWeight={700}>
              Event information
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
              Event price is calculated from active packages, so pricing is managed separately in Event Packages.
            </Typography>
          </Box>

          <TextField
            label='Event name'
            value={form.name}
            onChange={e => update('name', e.target.value)}
            required
            fullWidth
            inputProps={{ maxLength: 200 }}
          />

          <TextField
            label='Description'
            value={form.description}
            onChange={e => update('description', e.target.value)}
            multiline
            minRows={4}
            fullWidth
            inputProps={{ maxLength: 4000 }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel id='event-kind-label'>Event category</InputLabel>
              <Select
                labelId='event-kind-label'
                label='Event category'
                value={form.kind}
                onChange={e => update('kind', e.target.value as EventKind)}
              >
                {EVENT_KINDS.map(kind => (
                  <MenuItem value={kind} key={kind}>
                    {kind}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label='Location'
              value={form.location}
              onChange={e => update('location', e.target.value)}
              fullWidth
              inputProps={{ maxLength: 300 }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <TextField
              label='Event starts'
              type='datetime-local'
              value={form.startAt}
              onChange={e => update('startAt', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label='Event ends'
              type='datetime-local'
              value={form.endAt}
              onChange={e => update('endAt', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <TextField
              label='Registration opens'
              type='datetime-local'
              value={form.registrationOpenAt}
              onChange={e => update('registrationOpenAt', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label='Registration closes'
              type='datetime-local'
              value={form.registrationCloseAt}
              onChange={e => update('registrationCloseAt', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>

          <TextField
            label='Event capacity'
            type='number'
            value={form.capacity}
            onChange={e => update('capacity', e.target.value)}
            inputProps={{ min: 1, max: 1_000_000, step: 1 }}
            fullWidth
            required
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel id='access-mode-label'>Access mode</InputLabel>
              <Select
                labelId='access-mode-label'
                label='Access mode'
                value={form.accessMode}
                onChange={e => {
                  const value = e.target.value as EventAccessMode
                  update('accessMode', value)
                  if (value === 'Public') update('accessValue', '')
                }}
              >
                {EVENT_ACCESS_MODES.map(mode => (
                  <MenuItem value={mode} key={mode}>
                    {mode === 'InvitationCode' ? 'Invitation Code' : mode === 'EmailDomain' ? 'Email Domain' : 'Public'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {form.accessMode !== 'Public' && (
              <TextField
                label={form.accessMode === 'EmailDomain' ? 'Allowed email domain' : 'Invitation code'}
                placeholder={form.accessMode === 'EmailDomain' ? 'example.com' : 'EVENT-2026'}
                value={form.accessValue}
                onChange={e => update('accessValue', e.target.value)}
                inputProps={{ maxLength: 200 }}
                required
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
            <Button type='button' variant='outlined' onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type='submit' variant='contained' disabled={submitting}>
              {submitting ? 'Saving...' : submitLabel}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default EventForm
