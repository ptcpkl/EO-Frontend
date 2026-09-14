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
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { getAdminEvent, type AdminEvent } from '@/lib/admin-events'
import {
  EVENT_MODULE_DEFINITIONS,
  EVENT_MODULE_FIELDS,
  createEventModuleRecord,
  deleteEventModuleRecord,
  getAdminEventExperience,
  listEventModuleRecords,
  updateEventModuleRecord,
  type EventExperienceConfig,
  type EventModuleFieldDefinition,
  type EventModuleKey,
  type EventModuleRecord,
  type EventModuleRecordInput
} from '@/lib/event-experience'

type RecordForm = {
  title: string
  status: string
  sortOrder: string
  data: Record<string, string>
}

const emptyForm = (fields: EventModuleFieldDefinition[]): RecordForm => ({
  title: '',
  status: 'Active',
  sortOrder: '0',
  data: Object.fromEntries(fields.map(field => [field.key, '']))
})

const prettyValue = (value: string | null | undefined) => value?.trim() || '—'

const ModuleWorkspacePage = () => {
  const params = useParams<{ eventSlug: string; moduleKey: string }>()
  const eventId = params.eventSlug
  const moduleKey = decodeURIComponent(params.moduleKey) as EventModuleKey

  const module = useMemo(
    () => EVENT_MODULE_DEFINITIONS.find(item => item.key === moduleKey) ?? null,
    [moduleKey]
  )
  const fields = useMemo(() => EVENT_MODULE_FIELDS[moduleKey] ?? [], [moduleKey])

  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [experience, setExperience] = useState<EventExperienceConfig | null>(null)
  const [records, setRecords] = useState<EventModuleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EventModuleRecord | null>(null)
  const [form, setForm] = useState<RecordForm>(() => emptyForm(fields))

  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const [loadedEvent, loadedExperience] = await Promise.all([
        getAdminEvent(eventId),
        getAdminEventExperience(eventId)
      ])

      setEvent(loadedEvent)
      setExperience(loadedExperience)

      if (
        module &&
        module.key !== 'quiz' &&
        fields.length > 0 &&
        loadedExperience.enabledModules.includes(module.key)
      ) {
        setRecords(await listEventModuleRecords(eventId, module.key))
      } else {
        setRecords([])
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load module workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, moduleKey])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm(fields))
    setError(null)
    setDialogOpen(true)
  }

  const openEdit = (record: EventModuleRecord) => {
    setEditing(record)
    setForm({
      title: record.title,
      status: record.status || 'Active',
      sortOrder: String(record.sortOrder ?? 0),
      data: Object.fromEntries(fields.map(field => [field.key, record.data[field.key] ?? '']))
    })
    setError(null)
    setDialogOpen(true)
  }

  const updateData = (key: string, value: string) => {
    setForm(current => ({ ...current, data: { ...current.data, [key]: value } }))
  }

  const save = async () => {
    if (!event || !module || module.key === 'quiz') return

    const title = form.title.trim()
    if (!title) {
      setError('Title is required.')
      return
    }

    for (const field of fields) {
      if (field.required && !form.data[field.key]?.trim()) {
        setError(`${field.label} is required.`)
        return
      }
    }

    const input: EventModuleRecordInput = {
      title,
      status: form.status.trim() || 'Active',
      sortOrder: Number.isFinite(Number(form.sortOrder)) ? Number(form.sortOrder) : 0,
      data: Object.fromEntries(
        fields.map(field => [field.key, form.data[field.key]?.trim() || null])
      )
    }

    try {
      setSaving(true)
      setError(null)

      if (editing) {
        const updated = await updateEventModuleRecord(event.id, module.key, editing.id, input)
        setRecords(current => current.map(item => item.id === updated.id ? updated : item))
      } else {
        const created = await createEventModuleRecord(event.id, module.key, input)
        setRecords(current => [...current, created])
      }

      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm(fields))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save module record.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (record: EventModuleRecord) => {
    if (!event || !module || module.key === 'quiz') return
    if (!window.confirm(`Delete “${record.title}”?`)) return

    try {
      setDeletingId(record.id)
      setError(null)
      await deleteEventModuleRecord(event.id, module.key, record.id)
      setRecords(current => current.filter(item => item.id !== record.id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete module record.')
    } finally {
      setDeletingId(null)
    }
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

  if (module.key === 'quiz') {
    return (
      <Box sx={{ display: 'grid', gap: 3 }}>
        <Breadcrumbs>
          <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>Events</Link>
          <Link component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/dashboard`} color='inherit' underline='hover'>{event.name}</Link>
          <Typography color='text.primary'>Quiz</Typography>
        </Breadcrumbs>
        <Alert severity='info'>Quiz is intentionally reserved and not implemented in this release.</Alert>
      </Box>
    )
  }

  if (fields.length === 0) {
    return (
      <Alert severity='info' action={<Button component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/dashboard`}>Back to dashboard</Button>}>
        This module uses a dedicated existing workflow instead of the generic workspace.
      </Alert>
    )
  }

  const readOnly = event.status === 'Archived'
  const sortedRecords = [...records].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Breadcrumbs>
        <Link component={NextLink} href='/admin/events' color='inherit' underline='hover'>Events</Link>
        <Link component={NextLink} href={`/admin/events/${encodeURIComponent(event.id)}/dashboard`} color='inherit' underline='hover'>{event.name}</Link>
        <Typography color='text.primary'>{module.label}</Typography>
      </Breadcrumbs>

      {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}
      {readOnly && <Alert severity='warning'>Archived events are read-only. Unarchive this event before editing operational data.</Alert>}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 3, alignItems: { md: 'center' } }}>
        <Box>
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
              <i className={`${module.icon} text-2xl`} />
            </Box>
            <Typography variant='h4' fontWeight={750}>{module.label}</Typography>
            <Chip label={experience.kind} color='primary' variant='tonal' size='small' />
            <Chip label={`${records.length} record${records.length === 1 ? '' : 's'}`} variant='outlined' size='small' />
          </Box>
          <Typography color='text.secondary' sx={{ mt: 1.5, maxWidth: 760, lineHeight: 1.7 }}>
            {module.description}
          </Typography>
        </Box>

        <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          disabled={readOnly}
          onClick={openCreate}
        >
          Add {module.label.replace(/s$/, '')}
        </Button>
      </Box>

      {sortedRecords.length === 0 ? (
        <Card variant='outlined'>
          <CardContent sx={{ py: 7, textAlign: 'center' }}>
            <Box sx={{ width: 56, height: 56, mx: 'auto', borderRadius: '50%', bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
              <i className={`${module.icon} text-2xl`} />
            </Box>
            <Typography variant='h6' fontWeight={700} sx={{ mt: 2 }}>No {module.label.toLowerCase()} yet</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75 }}>Create the first record for this event.</Typography>
            {!readOnly && <Button onClick={openCreate} variant='outlined' sx={{ mt: 3 }}>Create first record</Button>}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
          {sortedRecords.map(record => (
            <Card key={record.id} variant='outlined'>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant='h6' fontWeight={700}>{record.title}</Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={record.status} size='small' color={record.status.toLowerCase() === 'active' ? 'success' : 'default'} variant='tonal' />
                      <Chip label={`Order ${record.sortOrder}`} size='small' variant='outlined' />
                    </Box>
                  </Box>
                  {!readOnly && (
                    <Box sx={{ display: 'flex' }}>
                      <IconButton aria-label={`Edit ${record.title}`} onClick={() => openEdit(record)}><i className='tabler-pencil' /></IconButton>
                      <IconButton color='error' aria-label={`Delete ${record.title}`} disabled={deletingId === record.id} onClick={() => void remove(record)}><i className='tabler-trash' /></IconButton>
                    </Box>
                  )}
                </Box>

                <Divider />

                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {fields.map(field => (
                    <Box key={field.key} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '150px minmax(0, 1fr)' }, gap: 1 }}>
                      <Typography variant='body2' color='text.secondary' fontWeight={600}>{field.label}</Typography>
                      <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{prettyValue(record.data[field.key])}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth='md'>
        <DialogTitle>{editing ? `Edit ${module.label}` : `Add ${module.label}`}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2.5, pt: 0.5 }}>
            <TextField label='Title / name' value={form.title} required onChange={e => setForm(current => ({ ...current, title: e.target.value }))} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 180px' }, gap: 2 }}>
              <TextField select label='Status' value={form.status} onChange={e => setForm(current => ({ ...current, status: e.target.value }))}>
                {['Draft', 'Active', 'Completed', 'Inactive'].map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
              <TextField label='Sort order' type='number' value={form.sortOrder} onChange={e => setForm(current => ({ ...current, sortOrder: e.target.value }))} />
            </Box>

            <Divider />

            {fields.map(field => {
              const common = {
                key: field.key,
                label: field.label,
                value: form.data[field.key] ?? '',
                required: field.required,
                helperText: field.helperText,
                fullWidth: true,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateData(field.key, e.target.value)
              }

              if (field.type === 'select') {
                return (
                  <TextField {...common} select>
                    {(field.options ?? []).map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
                )
              }

              return (
                <TextField
                  {...common}
                  type={field.type === 'textarea' ? 'text' : field.type}
                  multiline={field.type === 'textarea'}
                  minRows={field.type === 'textarea' ? 3 : undefined}
                  InputLabelProps={['date', 'time', 'datetime-local'].includes(field.type) ? { shrink: true } : undefined}
                />
              )
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button disabled={saving} variant='contained' onClick={() => void save()}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ModuleWorkspacePage
