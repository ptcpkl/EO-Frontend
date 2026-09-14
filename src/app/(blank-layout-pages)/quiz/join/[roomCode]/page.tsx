'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
  getPublicQuizRoom,
  joinPublicQuizRoom,
  quizParticipantStorageKey,
  type JoinQuizRoomResponse,
  type PublicQuizRoomResponse
} from '@/lib/quiz-rooms'

const QuizJoinPage = () => {
  const params = useParams<{ roomCode: string }>()
  const roomCode = decodeURIComponent(params.roomCode).trim().toUpperCase()

  const [room, setRoom] = useState<PublicQuizRoomResponse | null>(null)
  const [participant, setParticipant] = useState<JoinQuizRoomResponse | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRoom = async () => {
    try {
      setError(null)
      const loaded = await getPublicQuizRoom(roomCode)
      setRoom(loaded)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Quiz room.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(quizParticipantStorageKey(roomCode))
      if (raw) setParticipant(JSON.parse(raw) as JoinQuizRoomResponse)
    } catch {
      window.sessionStorage.removeItem(quizParticipantStorageKey(roomCode))
    }

    void loadRoom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode])

  useEffect(() => {
    if (!participant) return
    const interval = window.setInterval(() => void loadRoom(), 5000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant, roomCode])

  const statusMessage = useMemo(() => {
    if (!room) return ''
    switch (room.status) {
      case 'Draft': return 'The host is preparing this room. Entry will open shortly.'
      case 'Open': return 'The room is open. Enter your display name to join.'
      case 'Countdown': return 'The Quiz is about to start.'
      case 'Active': return 'The Quiz has already started.'
      case 'Leaderboard': return 'This room is showing the leaderboard.'
      case 'Finished': return 'This Quiz session has finished.'
      case 'Cancelled': return 'This Quiz session was cancelled.'
      default: return ''
    }
  }, [room])

  const join = async () => {
    const name = displayName.trim()
    if (name.length < 2) return setError('Enter a display name with at least 2 characters.')

    try {
      setJoining(true)
      setError(null)
      const joined = await joinPublicQuizRoom(roomCode, name)
      window.sessionStorage.setItem(quizParticipantStorageKey(roomCode), JSON.stringify(joined))
      setParticipant(joined)
      await loadRoom()
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Unable to join Quiz room.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={34} />
      </Box>
    )
  }

  if (!room) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 3, bgcolor: 'background.default' }}>
        <Alert severity='error' sx={{ maxWidth: 560 }}>{error ?? 'Quiz room was not found.'}</Alert>
      </Box>
    )
  }

  const roomOpen = room.status === 'Open' && room.remainingCapacity > 0

  return (
    <Box
      sx={theme => ({
        minHeight: '100dvh',
        p: { xs: 2.5, sm: 4 },
        display: 'grid',
        placeItems: 'center',
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(circle at 20% 10%, rgba(0,174,239,.18), transparent 35%), radial-gradient(circle at 90% 80%, rgba(237,28,36,.14), transparent 36%), #07111f'
          : 'radial-gradient(circle at 20% 10%, rgba(0,174,239,.16), transparent 35%), radial-gradient(circle at 90% 80%, rgba(237,28,36,.10), transparent 36%), #eef8ff'
      })}
    >
      <Box sx={{ width: '100%', maxWidth: 620 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box component='img' src='/EO Navbar.png' alt='Pertamina Event' sx={{ maxWidth: 190, maxHeight: 58, objectFit: 'contain' }} />
        </Box>

        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: { xs: 3, sm: 4 }, pt: { xs: 3.5, sm: 4.5 }, pb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
              <Box>
                <Typography variant='overline' sx={{ opacity: 0.8 }}>LIVE QUIZ ROOM</Typography>
                <Typography variant='h4' fontWeight={800} sx={{ mt: 0.5 }}>{room.quizName}</Typography>
                <Typography sx={{ mt: 0.75, opacity: 0.9 }}>{room.eventName}</Typography>
              </Box>
              <Chip label={room.status} variant='filled' sx={{ bgcolor: 'rgba(255,255,255,.16)', color: 'inherit', fontWeight: 700 }} />
            </Box>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 }, display: 'grid', gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant='caption' color='text.secondary'>ROOM CODE</Typography>
              <Typography variant='h3' fontWeight={850} letterSpacing={5} sx={{ mt: 0.5 }}>{room.roomCode}</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>{room.sessionName}</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', textAlign: 'center' }}>
                <Typography variant='h6' fontWeight={750}>{room.participantCount}</Typography>
                <Typography variant='caption' color='text.secondary'>joined</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', textAlign: 'center' }}>
                <Typography variant='h6' fontWeight={750}>{room.remainingCapacity}</Typography>
                <Typography variant='caption' color='text.secondary'>spots left</Typography>
              </Box>
            </Box>

            <Alert severity={room.status === 'Open' ? 'success' : room.status === 'Cancelled' ? 'error' : 'info'}>
              {statusMessage}
            </Alert>

            {error && <Alert severity='error'>{error}</Alert>}

            {participant ? (
              <Box sx={{ display: 'grid', gap: 2.5, textAlign: 'center', py: 1 }}>
                <Box sx={{ width: 72, height: 72, mx: 'auto', borderRadius: '50%', bgcolor: 'success.main', color: 'success.contrastText', display: 'grid', placeItems: 'center' }}>
                  <i className='tabler-check text-4xl' />
                </Box>
                <Box>
                  <Typography variant='h5' fontWeight={750}>You&apos;re in, {participant.displayName}</Typography>
                  <Typography color='text.secondary' sx={{ mt: 1 }}>
                    Keep this page open. The host controls when the Quiz starts.
                  </Typography>
                </Box>
                <Button variant='outlined' onClick={() => void loadRoom()} startIcon={<i className='tabler-refresh' />}>
                  Refresh room status
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 2 }}>
                <TextField
                  label='Display name'
                  value={displayName}
                  disabled={!roomOpen || joining}
                  onChange={event => setDisplayName(event.target.value)}
                  inputProps={{ maxLength: 120 }}
                  placeholder='Name shown on the leaderboard'
                  autoComplete='off'
                  onKeyDown={event => {
                    if (event.key === 'Enter' && roomOpen && !joining) void join()
                  }}
                />
                <Button
                  variant='contained'
                  size='large'
                  disabled={!roomOpen || joining}
                  startIcon={<i className='tabler-device-gamepad-2' />}
                  onClick={() => void join()}
                >
                  {joining ? 'Joining...' : room.remainingCapacity <= 0 ? 'Room Full' : room.status === 'Open' ? 'Join Quiz' : 'Waiting for Host'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', textAlign: 'center', mt: 2.5 }}>
          Pertamina Event • Participant Quiz
        </Typography>
      </Box>
    </Box>
  )
}

export default QuizJoinPage
