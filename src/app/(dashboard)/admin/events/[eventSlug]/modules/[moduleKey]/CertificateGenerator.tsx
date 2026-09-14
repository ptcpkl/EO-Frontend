'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { EventWorkspaceItem } from '@/lib/event-experience'
import { getAllRegistrations } from '../../registrations/services/registration.service'
import type { Registration } from '../../registrations/types'

type Props = {
  eventId: string
  eventName: string
  templates: EventWorkspaceItem[]
  disabled?: boolean
}

type RecipientMode = 'eligible' | 'registration' | 'manual'

type CertificateRecipient = {
  fullName: string
  bookingCode?: string
  eventPackageName?: string | null
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const isCheckedIn = (registration: Registration) => Boolean(registration.checkedInAt) || registration.status === 'CHECKED_IN'

const eligibleForTemplate = (registrations: Registration[], template: EventWorkspaceItem | undefined) => {
  const eligibility = String(template?.eligibility ?? '').toLowerCase()
  const active = registrations.filter(item => item.status !== 'CANCELLED')

  if (eligibility.includes('all registered') || eligibility.includes('all participant')) return active
  return active.filter(isCheckedIn)
}

export default function CertificateGenerator({ eventId, eventName, templates, disabled = false }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [templateId, setTemplateId] = useState('')
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('eligible')
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('')
  const [manualName, setManualName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getAllRegistrations(eventId)
        if (mounted) setRegistrations(result)
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load certificate recipients.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [eventId])

  useEffect(() => {
    if (!templateId && templates.length) setTemplateId(templates[0].id)
    if (templateId && !templates.some(template => template.id === templateId)) setTemplateId(templates[0]?.id ?? '')
  }, [templateId, templates])

  const template = templates.find(item => item.id === templateId)
  const activeRegistrations = useMemo(
    () => registrations.filter(item => item.status !== 'CANCELLED'),
    [registrations]
  )
  const eligibleRecipients = useMemo(
    () => eligibleForTemplate(registrations, template),
    [registrations, template]
  )

  const recipients = useMemo<CertificateRecipient[]>(() => {
    if (recipientMode === 'eligible') return eligibleRecipients

    if (recipientMode === 'registration') {
      const selected = activeRegistrations.find(item => item.id === selectedRegistrationId)
      return selected ? [selected] : []
    }

    const name = manualName.trim()
    return name ? [{ fullName: name }] : []
  }, [activeRegistrations, eligibleRecipients, manualName, recipientMode, selectedRegistrationId])

  const generate = () => {
    if (!template || recipients.length === 0) return

    setError(null)
    const popup = window.open('', '_blank')
    if (!popup) {
      setError('Certificate preview was blocked by the browser. Allow pop-ups for this site and try again.')
      return
    }

    try {
      popup.opener = null
    } catch {
      // Some browsers disallow changing opener; certificate rendering can continue safely.
    }

    const issuer = escapeHtml(template.issuer || 'Event Organizer')
    const signer = escapeHtml(template.signer || '')
    const signerTitle = escapeHtml(template.signerTitle || '')
    const certificateTitle = escapeHtml(template.title || 'Certificate of Participation')
    const bodyText = escapeHtml(template.bodyText || 'has successfully participated in')
    const safeEventName = escapeHtml(eventName)

    const certificates = recipients.map(recipient => {
      const metadata = recipient.bookingCode
        ? `Booking Code: ${escapeHtml(recipient.bookingCode)}${recipient.eventPackageName ? ` · ${escapeHtml(recipient.eventPackageName)}` : ''}`
        : ''

      return `
        <section class="certificate">
          <div class="eyebrow">${issuer}</div>
          <h1>${certificateTitle}</h1>
          <div class="rule"></div>
          <p class="intro">This certificate is proudly presented to</p>
          <h2>${escapeHtml(recipient.fullName)}</h2>
          <p class="body">${bodyText}</p>
          <h3>${safeEventName}</h3>
          ${metadata ? `<p class="meta">${metadata}</p>` : ''}
          ${signer ? `<div class="signature"><div class="signature-line"></div><strong>${signer}</strong>${signerTitle ? `<span>${signerTitle}</span>` : ''}</div>` : ''}
        </section>
      `
    }).join('')

    popup.document.open()
    popup.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${certificateTitle} - ${safeEventName}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Inter, Arial, sans-serif; background: #eef1f6; color: #172033; }
            .toolbar { position: sticky; top: 0; z-index: 3; padding: 12px 18px; background: #172033; color: white; display: flex; justify-content: space-between; align-items: center; }
            .toolbar button { border: 0; border-radius: 8px; padding: 9px 16px; font-weight: 700; cursor: pointer; }
            .certificate { width: 297mm; min-height: 210mm; margin: 18px auto; padding: 28mm 30mm; background: white; border: 12px solid #172033; outline: 3px solid #d8a84e; outline-offset: -22px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-after: always; }
            .eyebrow { font-size: 14px; letter-spacing: .18em; text-transform: uppercase; font-weight: 700; }
            h1 { margin: 18px 0 6px; font-family: Georgia, serif; font-size: 44px; }
            .rule { width: 120px; height: 3px; background: #d8a84e; margin: 12px 0 28px; }
            .intro, .body { margin: 8px 0; font-size: 18px; color: #556070; }
            h2 { margin: 14px 0; font-family: Georgia, serif; font-size: 38px; color: #172033; }
            h3 { margin: 12px 0; font-size: 26px; }
            .meta { margin-top: 18px; font-size: 14px; color: #6b7280; }
            .signature { margin-top: 38px; display: grid; gap: 5px; min-width: 220px; }
            .signature-line { border-top: 1px solid #172033; margin-bottom: 5px; }
            .signature span { font-size: 13px; color: #6b7280; }
            @media print {
              @page { size: A4 landscape; margin: 0; }
              body { background: white; }
              .toolbar { display: none; }
              .certificate { margin: 0; width: 297mm; height: 210mm; min-height: 210mm; }
            }
          </style>
        </head>
        <body>
          <div class="toolbar"><strong>${recipients.length} certificate(s) generated</strong><button onclick="window.print()">Print / Save PDF</button></div>
          ${certificates}
        </body>
      </html>`)
    popup.document.close()
  }

  return (
    <Card variant='outlined'>
      <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant='h5' fontWeight={750}>Certificate Generator</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: .75, maxWidth: 760 }}>
              Generate certificates in batch for eligible participants, select one registrant, or type a recipient name manually for an ad-hoc certificate.
            </Typography>
          </Box>
          <Chip label={`${recipients.length} selected`} color='success' variant='tonal' />
        </Box>

        {error && <Alert severity='error'>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
        ) : templates.length === 0 ? (
          <Alert severity='info'>Create a certificate template above first. After that you can generate from participant data or enter a name manually.</Alert>
        ) : (
          <>
            <TextField
              select
              label='Certificate template'
              value={templateId}
              onChange={event => setTemplateId(event.target.value)}
              disabled={disabled}
              sx={{ maxWidth: 520 }}
            >
              {templates.map(item => <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>)}
            </TextField>

            <TextField
              select
              label='Recipient source'
              value={recipientMode}
              onChange={event => setRecipientMode(event.target.value as RecipientMode)}
              disabled={disabled}
              sx={{ maxWidth: 520 }}
              helperText='Choose automatic batch, one existing registrant, or a manually entered name.'
            >
              <MenuItem value='eligible'>All eligible participants ({eligibleRecipients.length})</MenuItem>
              <MenuItem value='registration'>Choose from registrations</MenuItem>
              <MenuItem value='manual'>Type name manually</MenuItem>
            </TextField>

            {recipientMode === 'registration' && (
              <TextField
                select
                required
                label='Registrant name'
                value={selectedRegistrationId}
                onChange={event => setSelectedRegistrationId(event.target.value)}
                disabled={disabled}
                sx={{ maxWidth: 640 }}
                helperText={`${activeRegistrations.length} active registration(s) available.`}
              >
                <MenuItem value=''><em>Select registrant</em></MenuItem>
                {activeRegistrations.map(registration => (
                  <MenuItem key={registration.id} value={registration.id}>
                    {registration.fullName} — {registration.bookingCode}{registration.eventPackageName ? ` · ${registration.eventPackageName}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {recipientMode === 'manual' && (
              <TextField
                required
                label='Recipient name'
                value={manualName}
                onChange={event => setManualName(event.target.value)}
                disabled={disabled}
                placeholder='Type the name exactly as it should appear on the certificate'
                sx={{ maxWidth: 640 }}
                helperText='Manual names are used only for this generated certificate and do not create a registration record.'
              />
            )}

            {template && (
              <Box sx={{ p: 3, borderRadius: 3, border: theme => `1px solid ${theme.palette.divider}`, textAlign: 'center', bgcolor: 'action.hover' }}>
                <Typography variant='overline'>{String(template.issuer || 'Event Organizer')}</Typography>
                <Typography variant='h5' fontWeight={800} sx={{ mt: 1 }}>{template.title}</Typography>
                <Typography color='text.secondary' sx={{ mt: 1 }}>{String(template.bodyText || 'has successfully participated in')}</Typography>
                <Typography variant='h6' sx={{ mt: 1 }}>{eventName}</Typography>
                {recipients.length === 1 && <Typography variant='h5' fontWeight={800} sx={{ mt: 2 }}>{recipients[0].fullName}</Typography>}
                {template.signer && <Typography variant='body2' sx={{ mt: 2 }}>Signed by {String(template.signer)}</Typography>}
              </Box>
            )}

            <Button
              variant='contained'
              size='large'
              disabled={disabled || !template || recipients.length === 0}
              onClick={generate}
              startIcon={<i className='tabler-certificate' />}
              sx={{ justifySelf: 'start' }}
            >
              Generate {recipients.length === 1 ? 'Certificate' : `${recipients.length} Certificates`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
