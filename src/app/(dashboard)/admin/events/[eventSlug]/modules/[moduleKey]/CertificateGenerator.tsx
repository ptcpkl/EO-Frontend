'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
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

const issuerInitials = (issuer: unknown) =>
  String(issuer || 'Event Organizer')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'EO'

const certificateDate = () =>
  new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

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

  const previewRecipient = recipients[0] ?? { fullName: 'Participant Name' }
  const previewIssuer = String(template?.issuer || 'Event Organizer')
  const previewSigner = String(template?.signer || 'Authorized Signatory')
  const previewSignerTitle = String(template?.signerTitle || 'Event Organizer')
  const previewTitle = String(template?.title || 'Certificate of Participation')
  const previewBody = String(template?.bodyText || 'has successfully participated in')

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
    const seal = escapeHtml(issuerInitials(template.issuer))
    const issuedOn = escapeHtml(certificateDate())
    const eventCode = eventId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'EVENT'

    const certificates = recipients.map((recipient, index) => {
      const certificateId = escapeHtml(recipient.bookingCode ? `CERT-${recipient.bookingCode}` : `CERT-${eventCode}-${String(index + 1).padStart(3, '0')}`)
      const packageName = recipient.eventPackageName ? escapeHtml(recipient.eventPackageName) : ''

      return `
        <section class="certificate">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
          <div class="inner-frame"></div>

          <header class="certificate-header">
            <div class="brand-mark">${seal}</div>
            <div class="brand-copy">
              <div class="issuer">${issuer}</div>
              <div class="document-label">Official Event Certificate</div>
            </div>
            <div class="certificate-number">${certificateId}</div>
          </header>

          <main class="certificate-content">
            <div class="kicker">CERTIFICATE</div>
            <h1>${certificateTitle}</h1>
            <div class="ornament"><span></span><i></i><span></span></div>

            <p class="intro">This certificate is proudly presented to</p>
            <h2>${escapeHtml(recipient.fullName)}</h2>
            <div class="name-rule"></div>

            <p class="body-copy">${bodyText}</p>
            <h3>${safeEventName}</h3>
            ${packageName ? `<div class="package-badge">${packageName}</div>` : ''}
          </main>

          <footer class="certificate-footer">
            <div class="issued-block">
              <div class="footer-label">Issued on</div>
              <strong>${issuedOn}</strong>
              ${recipient.bookingCode ? `<span>Booking ${escapeHtml(recipient.bookingCode)}</span>` : '<span>Official event record</span>'}
            </div>

            <div class="seal-block">
              <div class="seal-ring"><div class="seal-inner">${seal}</div></div>
              <span>VERIFIED</span>
            </div>

            <div class="signature-block">
              <div class="signature-space"></div>
              <div class="signature-line"></div>
              <strong>${signer || issuer}</strong>
              <span>${signerTitle || 'Authorized Signatory'}</span>
            </div>
          </footer>
        </section>
      `
    }).join('')

    popup.document.open()
    popup.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${certificateTitle} - ${safeEventName}</title>
          <style>
            :root {
              --navy: #0d1b2a;
              --navy-soft: #18324d;
              --gold: #c99a3d;
              --gold-light: #e8cc8b;
              --paper: #fffdf8;
              --muted: #667085;
            }
            * { box-sizing: border-box; }
            html, body { margin: 0; min-height: 100%; }
            body { font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; background: #e8edf3; color: var(--navy); }
            .toolbar { position: sticky; top: 0; z-index: 20; padding: 14px 22px; background: rgba(13,27,42,.97); color: white; display: flex; justify-content: space-between; align-items: center; gap: 16px; box-shadow: 0 8px 24px rgba(13,27,42,.18); }
            .toolbar-copy { display: grid; gap: 2px; }
            .toolbar-copy strong { font-size: 14px; }
            .toolbar-copy span { font-size: 12px; color: rgba(255,255,255,.68); }
            .toolbar button { border: 1px solid rgba(255,255,255,.18); background: linear-gradient(135deg, #fff, #f4e7c3); color: var(--navy); border-radius: 10px; padding: 10px 17px; font-weight: 800; cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,.18); }
            .certificate {
              position: relative;
              width: 297mm;
              height: 210mm;
              margin: 22px auto;
              overflow: hidden;
              background:
                radial-gradient(circle at 18% 12%, rgba(201,154,61,.08), transparent 24%),
                radial-gradient(circle at 88% 88%, rgba(24,50,77,.06), transparent 28%),
                linear-gradient(135deg, #ffffff 0%, var(--paper) 100%);
              box-shadow: 0 18px 55px rgba(13,27,42,.16);
              page-break-after: always;
              padding: 14mm 18mm;
            }
            .certificate::before { content: ""; position: absolute; inset: 7mm; border: 1px solid rgba(201,154,61,.72); pointer-events: none; }
            .certificate::after { content: ""; position: absolute; inset: 9mm; border: 1px solid rgba(13,27,42,.16); pointer-events: none; }
            .inner-frame { position: absolute; inset: 11mm; border: 1px solid rgba(201,154,61,.25); pointer-events: none; }
            .corner { position: absolute; width: 43mm; height: 43mm; pointer-events: none; z-index: 0; }
            .corner::before, .corner::after { content: ""; position: absolute; background: var(--navy); opacity: .96; }
            .corner::before { width: 43mm; height: 7mm; }
            .corner::after { width: 7mm; height: 43mm; }
            .corner-tl { top: 0; left: 0; }
            .corner-tr { top: 0; right: 0; transform: rotate(90deg); }
            .corner-br { bottom: 0; right: 0; transform: rotate(180deg); }
            .corner-bl { bottom: 0; left: 0; transform: rotate(270deg); }
            .corner > * { pointer-events: none; }
            .certificate-header, .certificate-content, .certificate-footer { position: relative; z-index: 2; }
            .certificate-header { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding: 2mm 4mm 0; }
            .brand-mark { width: 16mm; height: 16mm; display: grid; place-items: center; border-radius: 50%; border: 1.4px solid var(--gold); outline: 1px solid rgba(201,154,61,.28); outline-offset: 3px; background: var(--navy); color: #fff; font-family: Georgia, "Times New Roman", serif; font-size: 17px; font-weight: 800; letter-spacing: .08em; }
            .brand-copy { display: grid; gap: 2px; }
            .issuer { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
            .document-label { font-size: 9px; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; }
            .certificate-number { font-size: 9px; color: var(--muted); letter-spacing: .06em; text-transform: uppercase; }
            .certificate-content { height: 128mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 4mm 20mm 0; }
            .kicker { font-size: 11px; font-weight: 900; letter-spacing: .42em; color: var(--gold); margin-left: .42em; }
            h1 { margin: 4mm 0 1.8mm; font-family: Georgia, "Times New Roman", serif; font-size: 33px; line-height: 1.08; letter-spacing: -.025em; font-weight: 700; color: var(--navy); }
            .ornament { display: flex; align-items: center; gap: 9px; margin: 2mm 0 5mm; }
            .ornament span { display: block; width: 31mm; height: 1px; background: linear-gradient(90deg, transparent, var(--gold)); }
            .ornament span:last-child { transform: scaleX(-1); }
            .ornament i { width: 7px; height: 7px; border: 1.5px solid var(--gold); transform: rotate(45deg); }
            .intro { margin: 0 0 3mm; color: var(--muted); font-size: 13px; letter-spacing: .035em; }
            h2 { margin: 0; max-width: 230mm; font-family: Georgia, "Times New Roman", serif; font-size: 35px; line-height: 1.05; color: #102a43; font-weight: 700; letter-spacing: -.025em; }
            .name-rule { width: min(125mm, 70%); height: 1px; margin: 3mm auto 4mm; background: linear-gradient(90deg, transparent, rgba(201,154,61,.9), transparent); }
            .body-copy { margin: 0; color: #536273; font-size: 13px; line-height: 1.55; }
            h3 { margin: 2.2mm 0 0; font-size: 22px; line-height: 1.18; color: var(--navy); font-weight: 800; letter-spacing: -.01em; }
            .package-badge { margin-top: 3.2mm; display: inline-flex; align-items: center; justify-content: center; min-height: 7mm; padding: 1.2mm 4mm; border-radius: 999px; border: 1px solid rgba(201,154,61,.45); background: rgba(201,154,61,.08); color: #77591f; font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
            .certificate-footer { display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 14mm; min-height: 34mm; padding: 0 7mm 3mm; }
            .issued-block, .signature-block { display: grid; gap: 2px; font-size: 10px; color: var(--muted); }
            .issued-block strong, .signature-block strong { color: var(--navy); font-size: 11px; }
            .footer-label { font-size: 8px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); }
            .seal-block { display: grid; place-items: center; gap: 2px; transform: translateY(2mm); }
            .seal-ring { width: 22mm; height: 22mm; display: grid; place-items: center; border-radius: 50%; border: 1.5px solid var(--gold); box-shadow: inset 0 0 0 2px var(--paper), inset 0 0 0 3px rgba(201,154,61,.4); }
            .seal-inner { width: 15mm; height: 15mm; display: grid; place-items: center; border-radius: 50%; background: var(--navy); color: #fff; font-family: Georgia, serif; font-size: 11px; font-weight: 800; letter-spacing: .08em; }
            .seal-block > span { font-size: 7px; color: var(--gold); font-weight: 900; letter-spacing: .18em; }
            .signature-block { min-width: 54mm; text-align: center; justify-self: end; }
            .signature-space { height: 9mm; }
            .signature-line { border-top: 1px solid rgba(13,27,42,.5); margin-bottom: 1.5mm; }
            .signature-block span { font-size: 9px; }
            @media (max-width: 1100px) {
              .certificate { transform-origin: top center; transform: scale(.72); margin-bottom: -52mm; }
            }
            @media print {
              @page { size: A4 landscape; margin: 0; }
              html, body { width: 297mm; background: white; }
              .toolbar { display: none !important; }
              .certificate { margin: 0; box-shadow: none; transform: none; width: 297mm; height: 210mm; }
              .certificate:last-child { page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <div class="toolbar-copy"><strong>${recipients.length} certificate${recipients.length === 1 ? '' : 's'} ready</strong><span>A4 landscape · premium print layout</span></div>
            <button onclick="window.print()">Print / Save PDF</button>
          </div>
          ${certificates}
        </body>
      </html>`)
    popup.document.close()
  }

  return (
    <Card variant='outlined'>
      <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 3.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
              <Typography variant='h5' fontWeight={800}>Certificate Studio</Typography>
              <Chip label='Premium layout' color='warning' variant='tonal' size='small' />
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mt: .8, maxWidth: 760, lineHeight: 1.7 }}>
              Generate polished A4 landscape certificates for all eligible participants, one registrant, or an ad-hoc manual recipient.
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, .8fr) minmax(0, 1.2fr)' }, gap: 3, alignItems: 'start' }}>
              <Card variant='outlined' sx={{ borderRadius: 3 }}>
                <CardContent sx={{ display: 'grid', gap: 2.5, p: 3 }}>
                  <Box>
                    <Typography variant='subtitle1' fontWeight={800}>Certificate setup</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: .5 }}>Choose the template and recipient source before generating.</Typography>
                  </Box>

                  <TextField
                    select
                    label='Certificate template'
                    value={templateId}
                    onChange={event => setTemplateId(event.target.value)}
                    disabled={disabled}
                    fullWidth
                  >
                    {templates.map(item => <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>)}
                  </TextField>

                  <TextField
                    select
                    label='Recipient source'
                    value={recipientMode}
                    onChange={event => setRecipientMode(event.target.value as RecipientMode)}
                    disabled={disabled}
                    fullWidth
                    helperText='Batch eligible participants, pick one registration, or type a name manually.'
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
                      fullWidth
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
                      placeholder='Type the name exactly as it should appear'
                      fullWidth
                      helperText='Manual names are used only for this certificate and never create a registration record.'
                    />
                  )}

                  <Divider />
                  <Box sx={{ display: 'grid', gap: 1.25 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant='body2' color='text.secondary'>Issuer</Typography>
                      <Typography variant='body2' fontWeight={700} textAlign='right'>{previewIssuer}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant='body2' color='text.secondary'>Signer</Typography>
                      <Typography variant='body2' fontWeight={700} textAlign='right'>{previewSigner}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant='body2' color='text.secondary'>Eligibility</Typography>
                      <Typography variant='body2' fontWeight={700} textAlign='right'>{String(template?.eligibility || 'Checked-in participants')}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {template && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 1.5, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant='subtitle1' fontWeight={800}>Live preview</Typography>
                      <Typography variant='caption' color='text.secondary'>Preview uses the first selected recipient. Final output is A4 landscape.</Typography>
                    </Box>
                    <Chip size='small' label='A4 landscape' variant='outlined' />
                  </Box>

                  <Box
                    sx={{
                      position: 'relative',
                      aspectRatio: '1.414 / 1',
                      minHeight: { xs: 330, md: 390 },
                      overflow: 'hidden',
                      borderRadius: 3,
                      border: theme => `1px solid ${theme.palette.divider}`,
                      background: 'radial-gradient(circle at 16% 12%, rgba(201,154,61,.14), transparent 25%), radial-gradient(circle at 88% 88%, rgba(24,50,77,.08), transparent 28%), linear-gradient(135deg,#fff 0%,#fffdf8 100%)',
                      boxShadow: theme => `0 18px 50px ${theme.palette.action.hover}`,
                      p: { xs: 3, md: 4 },
                      '&::before': { content: '""', position: 'absolute', inset: 12, border: '1px solid rgba(201,154,61,.72)', pointerEvents: 'none' },
                      '&::after': { content: '""', position: 'absolute', inset: 18, border: '1px solid rgba(13,27,42,.15)', pointerEvents: 'none' }
                    }}
                  >
                    <Box sx={{ position: 'absolute', left: 0, top: 0, width: 92, height: 14, bgcolor: '#0d1b2a' }} />
                    <Box sx={{ position: 'absolute', left: 0, top: 0, width: 14, height: 92, bgcolor: '#0d1b2a' }} />
                    <Box sx={{ position: 'absolute', right: 0, bottom: 0, width: 92, height: 14, bgcolor: '#0d1b2a' }} />
                    <Box sx={{ position: 'absolute', right: 0, bottom: 0, width: 14, height: 92, bgcolor: '#0d1b2a' }} />

                    <Box sx={{ position: 'relative', zIndex: 2, height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', px: { xs: 1, md: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 42, height: 42, borderRadius: '50%', bgcolor: '#0d1b2a', color: '#fff', border: '1px solid #c99a3d', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontWeight: 800, letterSpacing: '.06em' }}>
                            {issuerInitials(template.issuer)}
                          </Box>
                          <Box>
                            <Typography variant='caption' fontWeight={800} sx={{ letterSpacing: '.12em', textTransform: 'uppercase', color: '#0d1b2a' }}>{previewIssuer}</Typography>
                            <Typography variant='caption' display='block' sx={{ color: '#7a8492', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>Official Event Certificate</Typography>
                          </Box>
                        </Box>
                        <Typography variant='caption' sx={{ color: '#7a8492', fontSize: 10 }}>CERTIFICATE PREVIEW</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: { xs: 2, md: 6 } }}>
                        <Typography variant='caption' fontWeight={900} sx={{ letterSpacing: '.34em', color: '#c99a3d', ml: '.34em' }}>CERTIFICATE</Typography>
                        <Typography sx={{ mt: 1.2, fontFamily: 'Georgia, serif', fontSize: { xs: 24, md: 31 }, lineHeight: 1.1, fontWeight: 700, color: '#0d1b2a' }}>{previewTitle}</Typography>
                        <Box sx={{ width: 100, height: 1, bgcolor: '#c99a3d', my: 2 }} />
                        <Typography variant='body2' sx={{ color: '#7a8492' }}>This certificate is proudly presented to</Typography>
                        <Typography sx={{ mt: 1.1, fontFamily: 'Georgia, serif', fontSize: { xs: 26, md: 34 }, lineHeight: 1.08, fontWeight: 700, color: '#102a43' }}>{previewRecipient.fullName}</Typography>
                        <Box sx={{ width: '58%', height: 1, background: 'linear-gradient(90deg,transparent,#c99a3d,transparent)', my: 1.5 }} />
                        <Typography variant='body2' sx={{ color: '#657283' }}>{previewBody}</Typography>
                        <Typography variant='h6' fontWeight={800} sx={{ mt: .7, color: '#0d1b2a' }}>{eventName}</Typography>
                        {previewRecipient.eventPackageName && <Chip size='small' label={previewRecipient.eventPackageName} variant='outlined' sx={{ mt: 1.25, borderColor: 'rgba(201,154,61,.5)', color: '#77591f', bgcolor: 'rgba(201,154,61,.07)' }} />}
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', gap: 2 }}>
                        <Box>
                          <Typography variant='caption' sx={{ color: '#c99a3d', fontWeight: 800, letterSpacing: '.1em' }}>ISSUED ON</Typography>
                          <Typography variant='caption' display='block' fontWeight={700} sx={{ color: '#0d1b2a' }}>{certificateDate()}</Typography>
                        </Box>
                        <Box sx={{ width: 54, height: 54, borderRadius: '50%', border: '1px solid #c99a3d', display: 'grid', placeItems: 'center' }}>
                          <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: '#0d1b2a', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontSize: 12, fontWeight: 800 }}>{issuerInitials(template.issuer)}</Box>
                        </Box>
                        <Box sx={{ textAlign: 'center', justifySelf: 'end', minWidth: 130 }}>
                          <Box sx={{ height: 20, borderBottom: '1px solid rgba(13,27,42,.45)', mb: .6 }} />
                          <Typography variant='caption' display='block' fontWeight={800} sx={{ color: '#0d1b2a' }}>{previewSigner}</Typography>
                          <Typography variant='caption' display='block' sx={{ color: '#7a8492', fontSize: 10 }}>{previewSignerTitle}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant='contained'
                size='large'
                disabled={disabled || !template || recipients.length === 0}
                onClick={generate}
                startIcon={<i className='tabler-certificate' />}
              >
                Generate {recipients.length === 1 ? 'Certificate' : `${recipients.length} Certificates`}
              </Button>
              <Typography variant='caption' color='text.secondary'>Opens a print-ready A4 landscape preview for PDF export.</Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}
