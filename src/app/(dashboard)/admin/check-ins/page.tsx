'use client'

import { useEffect, useRef, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { checkInParticipant, type CheckInResponse } from '@/lib/check-ins'

type BarcodeResult = { rawValue?: string }
type BarcodeDetectorInstance = { detect: (source: CanvasImageSource) => Promise<BarcodeResult[]> }
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(value))

export default function Page() {
  const [token, setToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [cameraMessage, setCameraMessage] = useState('')
  const [result, setResult] = useState<CheckInResponse | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopScanner = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setScanning(false)
  }

  useEffect(() => stopScanner, [])

  const submitToken = async (value = token) => {
    const qrToken = value.trim()
    if (!qrToken || submitting) return

    setSubmitting(true)
    setError('')
    setResult(null)

    try {
      const response = await checkInParticipant(qrToken)
      setResult(response)
      setToken('')
      stopScanner()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to check in participant.')
    } finally {
      setSubmitting(false)
    }
  }

  const startScanner = async () => {
    setCameraMessage('')
    setError('')

    const detectorCtor = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector

    if (!detectorCtor) {
      setCameraMessage('QR camera scanning is not supported by this browser. Paste the QR token manually instead.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Camera access is not available in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      })

      streamRef.current = stream
      setScanning(true)

      const video = videoRef.current
      if (!video) return

      video.srcObject = stream
      await video.play()

      const detector = new detectorCtor({ formats: ['qr_code'] })

      timerRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return

        try {
          const codes = await detector.detect(videoRef.current)
          const value = codes.find(item => item.rawValue)?.rawValue?.trim()

          if (value) {
            setToken(value)
            await submitToken(value)
          }
        } catch {
          // Ignore transient detector frame errors and continue scanning.
        }
      }, 800)
    } catch (err) {
      setCameraMessage(err instanceof Error ? err.message : 'Unable to access the camera.')
      stopScanner()
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Chip label='Operations' color='primary' size='small' sx={{ mb: 1.5 }} />
        <Typography variant='h4' fontWeight={800}>Participant Check-ins</Typography>
        <Typography color='text.secondary' sx={{ mt: 1, maxWidth: 720 }}>
          Validate paid or internal tickets using the QR token. The backend prevents duplicate check-ins and rejects unpaid external registrations.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(320px, .8fr)' }, gap: 4 }}>
        <Card elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant='h6' fontWeight={700}>QR scanner</Typography>
                <Typography variant='body2' color='text.secondary'>Use the rear camera when your browser supports BarcodeDetector.</Typography>
              </Box>
              {scanning ? (
                <Button color='error' variant='outlined' onClick={stopScanner} startIcon={<i className='tabler-camera-off' />}>
                  Stop camera
                </Button>
              ) : (
                <Button variant='contained' onClick={() => void startScanner()} startIcon={<i className='tabler-camera' />}>
                  Start camera
                </Button>
              )}
            </Box>

            <Box
              sx={{
                mt: 3,
                aspectRatio: '16 / 9',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'action.hover',
                border: theme => `1px dashed ${theme.palette.divider}`,
                display: 'grid',
                placeItems: 'center',
                position: 'relative'
              }}
            >
              <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: scanning ? 'block' : 'none' }} />
              {!scanning && (
                <Box sx={{ textAlign: 'center', px: 3, color: 'text.secondary' }}>
                  <i className='tabler-qrcode text-5xl' />
                  <Typography sx={{ mt: 1 }}>Camera preview will appear here.</Typography>
                </Box>
              )}
              {scanning && (
                <Box sx={{ position: 'absolute', inset: '18%', border: '2px solid', borderColor: 'primary.main', borderRadius: 2, pointerEvents: 'none' }} />
              )}
            </Box>

            {cameraMessage && <Alert severity='info' sx={{ mt: 3 }}>{cameraMessage}</Alert>}

            <Divider sx={{ my: 4 }}>OR</Divider>

            <Typography variant='subtitle1' fontWeight={700}>Manual token</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: .5, mb: 2 }}>
              Paste the ticket QR token when camera scanning is unavailable.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <TextField
                fullWidth
                value={token}
                onChange={event => setToken(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') void submitToken()
                }}
                label='QR token'
                placeholder='Paste scanned QR token'
                disabled={submitting}
              />
              <Button
                variant='contained'
                size='large'
                disabled={!token.trim() || submitting}
                onClick={() => void submitToken()}
                sx={{ minWidth: 150, minHeight: 56 }}
              >
                {submitting ? <CircularProgress size={22} color='inherit' /> : 'Check in'}
              </Button>
            </Box>

            {error && <Alert severity='error' sx={{ mt: 3 }}>{error}</Alert>}
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}`, alignSelf: 'start' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant='h6' fontWeight={700}>Latest result</Typography>
            {!result ? (
              <Box sx={{ py: 7, textAlign: 'center', color: 'text.secondary' }}>
                <i className='tabler-scan text-5xl' />
                <Typography sx={{ mt: 1.5 }}>No participant checked in yet.</Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 3 }}>
                <Alert severity='success' icon={<i className='tabler-circle-check' />}>
                  Check-in successful
                </Alert>
                <Box sx={{ mt: 3, display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>Participant</Typography>
                    <Typography fontWeight={700}>{result.fullName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>Booking code</Typography>
                    <Typography>{result.bookingCode}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>Event</Typography>
                    <Typography>{result.eventName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>Checked in</Typography>
                    <Typography>{formatDateTime(result.checkedInAtUtc)} WIB</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
