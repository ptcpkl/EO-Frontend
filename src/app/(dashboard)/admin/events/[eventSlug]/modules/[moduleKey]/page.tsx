'use client'

import { useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { getAdminEvent, type AdminEvent } from '@/lib/admin-events'
import {
  EVENT_MODULE_DEFINITIONS,
  getAdminEventExperience,
  updateAdminEventExperience,
  type EventExperienceConfig,
  type EventModuleKey,
  type EventWorkspaceItem
} from '@/lib/event-experience'

type WorkspaceField = {
  key: string
  label: string
  type?: 'text' | 'number' | 'datetime-local' | 'url'
  multiline?: boolean
  placeholder?: string
}

type WorkspaceSchema = {
  titleLabel: string
  addLabel: string
  fields: WorkspaceField[]
}

const workspaceSchemas: Partial<Record<EventModuleKey, WorkspaceSchema>> = {
  'race-categories': {
    titleLabel: 'Category name',
    addLabel: 'Add Race Category',
    fields: [
      { key: 'distance', label: 'Distance', placeholder: 'e.g. 5K, 10K, Half Marathon' },
      { key: 'quota', label: 'Quota', type: 'number' },
      { key: 'price', label: 'Category price (IDR)', type: 'number' },
      { key: 'startTime', label: 'Start time', type: 'datetime-local' },
      { key: 'notes', label: 'Notes', multiline: true }
    ]
  },
  'race-pack': {
    titleLabel: 'Race pack / pickup batch',
    addLabel: 'Add Race Pack Schedule',
    fields: [
      { key: 'pickupLocation', label: 'Pickup location' },
      { key: 'pickupStart', label: 'Pickup starts', type: 'datetime-local' },
      { key: 'pickupEnd', label: 'Pickup ends', type: 'datetime-local' },
      { key: 'contents', label: 'Pack contents', multiline: true, placeholder: 'Jersey, bib, timing chip, sponsor items…' },
      { key: 'notes', label: 'Collection notes', multiline: true }
    ]
  },
  doorprize: {
    titleLabel: 'Prize name',
    addLabel: 'Add Doorprize',
    fields: [
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'sponsor', label: 'Sponsor' },
      { key: 'drawAt', label: 'Draw time', type: 'datetime-local' },
      { key: 'claimNotes', label: 'Winner / claim notes', multiline: true }
    ]
  },
  booths: {
    titleLabel: 'Booth name',
    addLabel: 'Add Booth',
    fields: [
      { key: 'zone', label: 'Zone / location' },
      { key: 'sponsor', label: 'Brand / sponsor' },
      { key: 'description', label: 'Activity / description', multiline: true }
    ]
  },
  speakers: {
    titleLabel: 'Speaker name',
    addLabel: 'Add Speaker',
    fields: [
      { key: 'role', label: 'Role / title' },
      { key: 'organization', label: 'Organization' },
      { key: 'photoUrl', label: 'Photo URL', type: 'url' },
      { key: 'bio', label: 'Speaker bio', multiline: true }
    ]
  },
  sessions: {
    titleLabel: 'Session title',
    addLabel: 'Add Session',
    fields: [
      { key: 'speaker', label: 'Speaker' },
      { key: 'room', label: 'Room / stage' },
      { key: 'startAt', label: 'Starts', type: 'datetime-local' },
      { key: 'endAt', label: 'Ends', type: 'datetime-local' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'description', label: 'Session description', multiline: true }
    ]
  },
  agenda: {
    titleLabel: 'Agenda item',
    addLabel: 'Add Agenda Item',
    fields: [
      { key: 'startAt', label: 'Starts', type: 'datetime-local' },
      { key: 'endAt', label: 'Ends', type: 'datetime-local' },
      { key: 'location', label: 'Location / stage' },
      { key: 'description', label: 'Description', multiline: true }
    ]
  },
  certificates: {
    titleLabel: 'Certificate name',
    addLabel: 'Add Certificate Template',
    fields: [
      { key: 'issuer', label: 'Issuer' },
      { key: 'signer', label: 'Signer / approver' },
      { key: 'eligibility', label: 'Eligibility', multiline: true, placeholder: 'e.g. Checked-in participants who completed the event' },
      { key: 'notes', label: 'Distribution notes', multiline: true }
    ]
  }
}

const emptyDraft = () => ({ title: '' } as Record<string, string>)

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const ModuleWorkspacePage = () => {
  const params = useParams<{ eventSlug: string; moduleKey: string }>()
  const eventId = params.eventSlug
  const moduleKey = decodeURIComponent(params.moduleKey) as EventModuleKey

  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [experience, setExperience] = useState<EventExperienceConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)

  const module = useMemo(
    () => EVENT_MODULE_DEFINITIONS.find(item => item.key === moduleKey) ?? null,
    [moduleKey]
  )
  const schema = workspaceSchemas[moduleKey]
  const items = experience?.moduleData?.[moduleKey] ?? []

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [loadedEvent, loadedExperience] = await Promise.all([
          getAdminEvent(eventId),
          getAdminEventExperience(eventId)
        ])
        if (!mounted) return
        setEvent(loadedEvent)
        setExperience(loadedExperience)
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load module workspace.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => { mounted = false }
  }, [eventId])

  const persistItems = async (nextItems: EventWorkspaceItem[]) => {
    if (!experience) return
    setSaving(true)
    setError(null)

    try {
      const updated = await updateAdminEventExperience(eventId, {
        enabledModules: experience.enabledModules,
        registrationFields: experience.registrationFields,
        moduleData: { ...experience.moduleData, [moduleKey]: nextItems }
      })
      setExperience(updated)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save workspace data.')
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  const resetDraft = () => {
    setDraft(emptyDraft())
    setEditingId(null)
  }

  const saveDraft = async () => {
    const title = draft.title?.trim()
    if (!title) {
      setError(`${schema?.titleLabel ?? 'Title'} is required.`)
      return
    }

    const nextItem: EventWorkspaceItem = {
      id: editingId ?? createId(),
      title,
      active: true
    }

    for (const field of schema?.fields ?? []) {
      const value = draft[field.key]?.trim() ?? ''
      if (value) nextItem[field.key] = value
    }

    const nextItems = editingId
      ? items.map(item => item.id === editingId ? nextItem : item)
      : [...items, nextItem]

    await persistItems(nextItems)
    resetDraft()
  }

  const startEdit = (item: EventWorkspaceItem) => {
    const nextDraft: Record<string, string> = { title: item.title }
    for (const field of schema?.fields ?? []) {
      const value = item[field.key]
      nextDraft[field.key] = value === null || value === undefined ? '' : String(value)
    }
    setDraft(nextDraft)
    setEditingId(item.id)
  }

  const removeItem = async (id: string) => {
    await persistItems(items.filter(item => item.id !== id))
    if (editingId === id) resetDraft()
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={32} /></Box>
  }

  if (!event || !experience) {
    return <Alert severity='error'>{error ?? 'Event module is unavailable.'}</Alert>
  }

  if (!module) {
    return (
      <Alert severity='error' action={<Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/dashboard`}>Back to dashboard</Button>}>
        Unknown event module.
      </Alert>
    )
  }

  if (!experience.enabledModules.includes(module.key)) {
    return (
      <Alert severity='warning' action={<Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/edit`}>Configure event</Button>}>
        {module.label} is not enabled for this event.
      </Alert>
    )
  }

  const archived = event.status === 'Archived'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Breadcrumbs>
        <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>Events</Link>
        <Link component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/dashboard`} color='inherit' underline='hover'>{event.name}</Link>
        <Typography color='text.primary'>{module.label}</Typography>
      </Breadcrumbs>

      {error && <Alert severity='error'>{error}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 3, alignItems: { md: 'center' } }}>
        <Box>
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
              <i className={`${module.icon} text-2xl`} />
            </Box>
            <Typography variant='h4' fontWeight={750}>{module.label}</Typography>
            <Chip label={experience.kind} color='primary' variant='tonal' size='small' />
            <Chip label={archived ? 'Read only' : 'Live workspace'} color={archived ? 'default' : 'success'} variant='tonal' size='small' />
          </Box>
          <Typography color='text.secondary' sx={{ mt: 1.5, maxWidth: 760, lineHeight: 1.7 }}>{module.description}</Typography>
        </Box>
        <Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/edit`} variant='outlined' startIcon={<i className='tabler-adjustments' />}>
          Configure modules
        </Button>
      </Box>

      {moduleKey === 'quiz' && (
        <Alert severity='info' icon={<i className='tabler-help-hexagon' />}>
          Quiz is intentionally reserved and has not been implemented in this scope. Existing quiz configuration is preserved so it can be added separately later without losing event data.
        </Alert>
      )}

      {moduleKey === 'reports' && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
            <Card variant='outlined'><CardContent><Typography color='text.secondary' variant='body2'>Registered</Typography><Typography variant='h4' fontWeight={750} sx={{ mt: 1 }}>{event.registeredCount.toLocaleString()}</Typography></CardContent></Card>
            <Card variant='outlined'><CardContent><Typography color='text.secondary' variant='body2'>Capacity</Typography><Typography variant='h4' fontWeight={750} sx={{ mt: 1 }}>{event.capacity.toLocaleString()}</Typography></CardContent></Card>
            <Card variant='outlined'><CardContent><Typography color='text.secondary' variant='body2'>Remaining quota</Typography><Typography variant='h4' fontWeight={750} sx={{ mt: 1 }}>{event.remainingQuota.toLocaleString()}</Typography></CardContent></Card>
          </Box>
          <Card variant='outlined'>
            <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box><Typography variant='h6' fontWeight={700}>Operational reports</Typography><Typography color='text.secondary' variant='body2' sx={{ mt: .5 }}>Use the live registration and package data as the source of truth.</Typography></Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/registrations`} variant='contained'>Participants</Button>
                <Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/packages`} variant='outlined'>Packages</Button>
                <Button component={NextLink} href={`/admin/check-in?eventId=${encodeURIComponent(event.id)}`} variant='outlined'>Check-ins</Button>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {schema && moduleKey !== 'quiz' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(320px, .75fr) minmax(0, 1.25fr)' }, gap: 3, alignItems: 'start' }}>
          <Card variant='outlined'>
            <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 2.5 }}>
              <Box>
                <Typography variant='h6' fontWeight={700}>{editingId ? `Edit ${module.label}` : schema.addLabel}</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: .75 }}>Saved directly to this event&apos;s workspace configuration.</Typography>
              </Box>
              <TextField label={schema.titleLabel} value={draft.title ?? ''} onChange={input => setDraft(current => ({ ...current, title: input.target.value }))} disabled={archived || saving} required />
              {schema.fields.map(field => (
                <TextField
                  key={field.key}
                  label={field.label}
                  type={field.type ?? 'text'}
                  value={draft[field.key] ?? ''}
                  onChange={input => setDraft(current => ({ ...current, [field.key]: input.target.value }))}
                  multiline={field.multiline}
                  minRows={field.multiline ? 3 : undefined}
                  placeholder={field.placeholder}
                  InputLabelProps={field.type === 'datetime-local' ? { shrink: true } : undefined}
                  disabled={archived || saving}
                  fullWidth
                />
              ))}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button type='button' variant='contained' onClick={saveDraft} disabled={archived || saving} startIcon={<i className='tabler-device-floppy' />}>
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : schema.addLabel}
                </Button>
                {editingId && <Button type='button' variant='text' onClick={resetDraft} disabled={saving}>Cancel</Button>}
              </Box>
            </CardContent>
          </Card>

          <Card variant='outlined'>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                <Box><Typography variant='h6' fontWeight={700}>Saved items</Typography><Typography variant='body2' color='text.secondary' sx={{ mt: .5 }}>{items.length} item{items.length === 1 ? '' : 's'} configured</Typography></Box>
                <Chip label={`${items.length} total`} variant='tonal' />
              </Box>

              {items.length === 0 && <Alert severity='info'>No data has been added to this module yet. Use the form to create the first item.</Alert>}

              <Box sx={{ display: 'grid', gap: 2 }}>
                {items.map((item, index) => (
                  <Box key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant='caption' color='primary.main' fontWeight={800}>#{index + 1}</Typography>
                        <Typography variant='h6' fontWeight={700} sx={{ mt: .25 }}>{item.title}</Typography>
                      </Box>
                      {!archived && (
                        <Box sx={{ display: 'flex', gap: .5 }}>
                          <IconButton size='small' onClick={() => startEdit(item)} disabled={saving} aria-label={`Edit ${item.title}`}><i className='tabler-edit' /></IconButton>
                          <IconButton size='small' color='error' onClick={() => void removeItem(item.id)} disabled={saving} aria-label={`Delete ${item.title}`}><i className='tabler-trash' /></IconButton>
                        </Box>
                      )}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                      {schema.fields.map(field => {
                        const value = item[field.key]
                        if (value === undefined || value === null || String(value).trim() === '') return null
                        return (
                          <Box key={field.key}>
                            <Typography variant='caption' color='text.secondary' fontWeight={700}>{field.label}</Typography>
                            <Typography variant='body2' sx={{ mt: .25, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{String(value)}</Typography>
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  )
}

export default ModuleWorkspacePage
