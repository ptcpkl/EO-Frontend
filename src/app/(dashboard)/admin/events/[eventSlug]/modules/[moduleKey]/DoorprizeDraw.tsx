'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import type { EventWorkspaceItem } from '@/lib/event-experience'
import { getAllRegistrations } from '../../registrations/services/registration.service'
import type { Registration } from '../../registrations/types'

type PrizeType = 'regular' | 'doorprize'
type DrawMode = 'random' | 'manual'
type CandidateSource = 'registration' | 'manual'

type DoorprizeWinner = {
  registrationId: string
  fullName: string
  bookingCode: string
  eventPackageName: string | null
  drawnAtUtc: string
  source?: CandidateSource
  selectionMode?: DrawMode
}

type ManualEntrant = {
  id: string
  fullName: string
  createdAtUtc: string
}

type DrawCandidate = {
  id: string
  fullName: string
  bookingCode: string
  eventPackageName: string | null
  source: CandidateSource
}

type Props = {
  eventId: string
  prizes: EventWorkspaceItem[]
  disabled?: boolean
  onUpdatePrize: (id: string, patch: Record<string, unknown>) => Promise<void>
}

const ITEM_HEIGHT = 68
const VISIBLE_ITEMS = 5
const CENTER_SLOT = Math.floor(VISIBLE_ITEMS / 2)
const REEL_DURATION_MS = 4200

const parseWinners = (value: unknown): DoorprizeWinner[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is DoorprizeWinner => {
    if (!item || typeof item !== 'object') return false
    const record = item as Record<string, unknown>
    return typeof record.registrationId === 'string' && typeof record.fullName === 'string'
  })
}

const parseManualEntrants = (value: unknown): ManualEntrant[] => {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const id = typeof record.id === 'string' ? record.id : ''
    const fullName = typeof record.fullName === 'string' ? record.fullName.trim() : ''
    if (!id || !fullName) return []
    return [{
      id,
      fullName,
      createdAtUtc: typeof record.createdAtUtc === 'string' ? record.createdAtUtc : ''
    }]
  })
}

const getQuantity = (prize: EventWorkspaceItem | undefined) => {
  const parsed = Number(prize?.quantity ?? 1)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

const getPrizeType = (prize: EventWorkspaceItem | undefined): PrizeType => {
  const value = String(prize?.prizeType ?? '').toLowerCase()
  if (value === 'regular') return 'regular'
  return 'doorprize'
}

const randomName = (pool: DrawCandidate[]) => {
  if (!pool.length) return '—'
  return pool[Math.floor(Math.random() * pool.length)].fullName
}

const buildReel = (pool: DrawCandidate[], winner: DrawCandidate) => {
  const names: string[] = []
  let previous = ''

  for (let index = 0; index < 48; index += 1) {
    let next = randomName(pool)
    if (pool.length > 1) {
      let guard = 0
      while (next === previous && guard < 5) {
        next = randomName(pool)
        guard += 1
      }
    }
    names.push(next)
    previous = next
  }

  const winnerIndex = names.length
  names.push(winner.fullName)
  names.push(randomName(pool), randomName(pool))
  return { names, winnerIndex }
}

const createManualId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `manual-${crypto.randomUUID()}`
  return `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const wait = (milliseconds: number) => new Promise(resolve => window.setTimeout(resolve, milliseconds))

export default function DoorprizeDraw({ eventId, prizes, disabled = false, onUpdatePrize }: Props) {
  const presentationRef = useRef<HTMLDivElement | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedPrizeId, setSelectedPrizeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [savingPrizeType, setSavingPrizeType] = useState(false)
  const [savingManualEntrant, setSavingManualEntrant] = useState(false)
  const [drawMode, setDrawMode] = useState<DrawMode>('random')
  const [manualName, setManualName] = useState('')
  const [manualWinnerId, setManualWinnerId] = useState('')
  const [reelItems, setReelItems] = useState<string[]>([])
  const [reelOffset, setReelOffset] = useState(0)
  const [revealedWinner, setRevealedWinner] = useState<DoorprizeWinner | null>(null)
  const [presentationFullscreen, setPresentationFullscreen] = useState(false)
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
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load checked-in participants.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [eventId])

  useEffect(() => {
    const onFullscreenChange = () => setPresentationFullscreen(document.fullscreenElement === presentationRef.current)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    if (!selectedPrizeId && prizes.length) setSelectedPrizeId(prizes[0].id)
    if (selectedPrizeId && !prizes.some(prize => prize.id === selectedPrizeId)) {
      setSelectedPrizeId(prizes[0]?.id ?? '')
    }
  }, [prizes, selectedPrizeId])

  useEffect(() => {
    setReelItems([])
    setReelOffset(0)
    setRevealedWinner(null)
    setManualWinnerId('')
    setManualName('')
  }, [selectedPrizeId, drawMode])

  const eligibleRegistrations = useMemo(
    () => registrations.filter(item => Boolean(item.checkedInAt) || item.status === 'CHECKED_IN'),
    [registrations]
  )

  const selectedPrize = prizes.find(prize => prize.id === selectedPrizeId)
  const selectedPrizeType = getPrizeType(selectedPrize)
  const selectedWinners = parseWinners(selectedPrize?.winners)
  const manualEntrants = parseManualEntrants(selectedPrize?.manualEntrants)

  const allWinnerIds = useMemo(
    () => new Set(prizes.flatMap(prize => parseWinners(prize.winners).map(winner => winner.registrationId))),
    [prizes]
  )

  const doorprizeWinnerIds = useMemo(
    () => new Set(
      prizes
        .filter(prize => getPrizeType(prize) === 'doorprize')
        .flatMap(prize => parseWinners(prize.winners).map(winner => winner.registrationId))
    ),
    [prizes]
  )

  const selectedWinnerIds = useMemo(
    () => new Set(selectedWinners.map(winner => winner.registrationId)),
    [selectedWinners]
  )

  const candidatePool = useMemo<DrawCandidate[]>(() => [
    ...eligibleRegistrations.map(item => ({
      id: item.id,
      fullName: item.fullName,
      bookingCode: item.bookingCode,
      eventPackageName: item.eventPackageName ?? null,
      source: 'registration' as const
    })),
    ...manualEntrants.map(item => ({
      id: item.id,
      fullName: item.fullName,
      bookingCode: 'MANUAL',
      eventPackageName: null,
      source: 'manual' as const
    }))
  ], [eligibleRegistrations, manualEntrants])

  const available = useMemo(() => {
    if (selectedPrizeType === 'doorprize') {
      return candidatePool.filter(item => !doorprizeWinnerIds.has(item.id) && !selectedWinnerIds.has(item.id))
    }
    return candidatePool.filter(item => !allWinnerIds.has(item.id) && !selectedWinnerIds.has(item.id))
  }, [candidatePool, selectedPrizeType, doorprizeWinnerIds, allWinnerIds, selectedWinnerIds])

  const quantity = getQuantity(selectedPrize)
  const complete = selectedWinners.length >= quantity
  const manualWinner = available.find(item => item.id === manualWinnerId)

  const changePrizeType = async (nextType: PrizeType) => {
    if (!selectedPrize || disabled || rolling || savingPrizeType || nextType === selectedPrizeType) return

    try {
      setSavingPrizeType(true)
      setError(null)
      await onUpdatePrize(selectedPrize.id, { prizeType: nextType })
      setReelItems([])
      setReelOffset(0)
      setRevealedWinner(null)
      setManualWinnerId('')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update prize type.')
    } finally {
      setSavingPrizeType(false)
    }
  }

  const addManualEntrant = async () => {
    const fullName = manualName.trim()
    if (!selectedPrize || !fullName || disabled || rolling || savingManualEntrant) return
    if (manualEntrants.some(item => item.fullName.toLowerCase() === fullName.toLowerCase())) {
      setError('That manual name is already in this prize pool.')
      return
    }

    const next: ManualEntrant = { id: createManualId(), fullName, createdAtUtc: new Date().toISOString() }
    try {
      setSavingManualEntrant(true)
      setError(null)
      await onUpdatePrize(selectedPrize.id, { manualEntrants: [...manualEntrants, next] })
      setManualName('')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add manual entrant.')
    } finally {
      setSavingManualEntrant(false)
    }
  }

  const removeManualEntrant = async (entrantId: string) => {
    if (!selectedPrize || disabled || rolling || savingManualEntrant) return
    if (allWinnerIds.has(entrantId)) {
      setError('This manual entrant already appears in winner history and cannot be removed.')
      return
    }

    try {
      setSavingManualEntrant(true)
      setError(null)
      await onUpdatePrize(selectedPrize.id, { manualEntrants: manualEntrants.filter(item => item.id !== entrantId) })
      if (manualWinnerId === entrantId) setManualWinnerId('')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to remove manual entrant.')
    } finally {
      setSavingManualEntrant(false)
    }
  }

  const winnerRecordFor = (candidate: DrawCandidate, selectionMode: DrawMode): DoorprizeWinner => ({
    registrationId: candidate.id,
    fullName: candidate.fullName,
    bookingCode: candidate.bookingCode,
    eventPackageName: candidate.eventPackageName,
    drawnAtUtc: new Date().toISOString(),
    source: candidate.source,
    selectionMode
  })

  const saveWinner = async (winnerRecord: DoorprizeWinner) => {
    if (!selectedPrize) return
    await onUpdatePrize(selectedPrize.id, { winners: [...selectedWinners, winnerRecord] })
    setRevealedWinner(winnerRecord)
    setManualWinnerId('')
  }

  const drawRandom = async () => {
    if (!selectedPrize || !available.length || complete || rolling) return

    const winner = available[Math.floor(Math.random() * available.length)]
    const winnerRecord = winnerRecordFor(winner, 'random')
    const reel = buildReel(available, winner)

    setRolling(true)
    setError(null)
    setRevealedWinner(null)
    setReelItems(reel.names)
    setReelOffset(0)

    await wait(80)
    setReelOffset(Math.max(0, reel.winnerIndex - CENTER_SLOT) * ITEM_HEIGHT)
    await wait(REEL_DURATION_MS + 120)

    try {
      await saveWinner(winnerRecord)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the winner.')
    } finally {
      setRolling(false)
    }
  }

  const confirmManualWinner = async () => {
    if (!selectedPrize || !manualWinner || complete || rolling) return

    try {
      setRolling(true)
      setError(null)
      setReelItems([])
      setReelOffset(0)
      await saveWinner(winnerRecordFor(manualWinner, 'manual'))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the manual winner.')
    } finally {
      setRolling(false)
    }
  }

  const enterPresentationFullscreen = async () => {
    if (!presentationRef.current) return
    try {
      await presentationRef.current.requestFullscreen()
    } catch {
      setError('Unable to enter fullscreen presentation mode in this browser.')
    }
  }

  const exitPresentationFullscreen = async () => {
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      // Browser may already be leaving fullscreen; no action required.
    }
  }

  const idleReel = [
    `${available.length} ELIGIBLE`,
    selectedPrizeType === 'doorprize' ? 'DOORPRIZE' : 'REGULAR PRIZE',
    selectedPrize ? 'READY TO DRAW' : 'SELECT A PRIZE',
    selectedPrize?.title ? String(selectedPrize.title).toUpperCase() : 'CHECKED-IN PARTICIPANTS',
    'GOOD LUCK'
  ]
  const visibleReel = reelItems.length ? reelItems : idleReel

  const reelStage = (
    <Box
      sx={{
        position: 'relative',
        height: presentationFullscreen ? 'min(52vh, 520px)' : ITEM_HEIGHT * VISIBLE_ITEMS,
        minHeight: presentationFullscreen ? 340 : undefined,
        overflow: 'hidden',
        borderRadius: presentationFullscreen ? 6 : 4,
        border: theme => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        boxShadow: rolling ? theme => `0 22px 70px ${theme.palette.action.hover}` : 'none',
        transition: 'box-shadow 280ms ease'
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, background: theme => `linear-gradient(to bottom, ${theme.palette.background.paper} 0%, transparent 24%, transparent 76%, ${theme.palette.background.paper} 100%)` }} />
      <Box
        sx={{
          position: 'absolute', left: presentationFullscreen ? 28 : 14, right: presentationFullscreen ? 28 : 14,
          top: presentationFullscreen ? '50%' : CENTER_SLOT * ITEM_HEIGHT,
          transform: presentationFullscreen ? 'translateY(-50%)' : undefined,
          height: presentationFullscreen ? 96 : ITEM_HEIGHT,
          borderRadius: 3,
          border: theme => `1px solid ${revealedWinner ? theme.palette.success.main : theme.palette.primary.main}`,
          background: theme => `linear-gradient(90deg, transparent, ${revealedWinner ? theme.palette.success.main : theme.palette.primary.main}14, transparent)`,
          boxShadow: revealedWinner ? theme => `0 0 0 1px ${theme.palette.success.main}20, 0 0 42px ${theme.palette.success.main}2c` : theme => `0 0 0 1px ${theme.palette.primary.main}14`,
          zIndex: 3, pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute', left: 0, right: 0, top: presentationFullscreen ? '50%' : 0,
          marginTop: presentationFullscreen ? -(CENTER_SLOT * ITEM_HEIGHT + ITEM_HEIGHT / 2) : 0,
          transform: `translateY(-${reelOffset}px)`,
          transition: rolling && reelOffset > 0 ? `transform ${REEL_DURATION_MS}ms cubic-bezier(0.08, 0.78, 0.12, 1)` : 'none',
          willChange: rolling ? 'transform' : 'auto'
        }}
      >
        {visibleReel.map((name, index) => (
          <Box key={`${name}-${index}`} sx={{ height: ITEM_HEIGHT, display: 'grid', placeItems: 'center', px: presentationFullscreen ? 6 : 3, borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
            <Typography variant={presentationFullscreen ? 'h4' : 'h6'} fontWeight={850} noWrap sx={{ width: '100%', textAlign: 'center', textOverflow: 'ellipsis' }}>{name}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ position: 'absolute', left: presentationFullscreen ? 24 : 12, top: '50%', transform: 'translateY(-50%)', zIndex: 5, color: revealedWinner ? 'success.main' : 'primary.main' }}><i className={`tabler-caret-right-filled ${presentationFullscreen ? 'text-4xl' : 'text-xl'}`} /></Box>
      <Box sx={{ position: 'absolute', right: presentationFullscreen ? 24 : 12, top: '50%', transform: 'translateY(-50%) rotate(180deg)', zIndex: 5, color: revealedWinner ? 'success.main' : 'primary.main' }}><i className={`tabler-caret-right-filled ${presentationFullscreen ? 'text-4xl' : 'text-xl'}`} /></Box>
    </Box>
  )

  return (
    <Card variant='outlined'>
      <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant='h5' fontWeight={750}>Live Prize Draw</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: .75, maxWidth: 780 }}>
              Use Random Draw for a fair reel draw, or Manual Selection when an admin intentionally chooses the winner. Manual selections are clearly recorded in winner history.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${eligibleRegistrations.length} checked in`} color='success' variant='tonal' />
            <Chip label={`${manualEntrants.length} manual`} color='info' variant='tonal' />
            <Chip label={`${available.length} available`} variant='outlined' />
          </Box>
        </Box>

        <Alert severity='info'>
          <strong>Regular Prize:</strong> one regular-prize win per participant, but the winner can still win a Doorprize.{' '}
          <strong>Doorprize:</strong> after winning, that person cannot win any other prize.
        </Alert>

        {error && <Alert severity='error'>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : prizes.length === 0 ? (
          <Alert severity='info'>Create at least one prize item above before starting the draw.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.3fr) minmax(220px, .7fr)' }, gap: 2, maxWidth: 820 }}>
              <TextField
                select
                label='Prize to draw'
                value={selectedPrizeId}
                onChange={event => setSelectedPrizeId(event.target.value)}
                disabled={disabled || rolling || savingPrizeType || savingManualEntrant}
              >
                {prizes.map(prize => {
                  const winners = parseWinners(prize.winners)
                  const type = getPrizeType(prize)
                  return <MenuItem key={prize.id} value={prize.id}>{prize.title} · {type === 'doorprize' ? 'Doorprize' : 'Regular'} ({winners.length}/{getQuantity(prize)})</MenuItem>
                })}
              </TextField>

              <TextField
                select
                label='Prize type'
                value={selectedPrizeType}
                onChange={event => void changePrizeType(event.target.value as PrizeType)}
                disabled={disabled || rolling || savingPrizeType || !selectedPrize}
                helperText={selectedPrizeType === 'doorprize' ? 'Winner is blocked from every later draw.' : 'Winner may still enter Doorprize.'}
              >
                <MenuItem value='regular'>Regular Prize</MenuItem>
                <MenuItem value='doorprize'>Doorprize</MenuItem>
              </TextField>
            </Box>

            <Card variant='outlined'>
              <CardContent sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant='subtitle1' fontWeight={750}>Manual entrants</Typography>
                  <Typography variant='body2' color='text.secondary'>Add names that are not in registration data. They can join either Random Draw or Manual Selection for this prize.</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <TextField
                    size='small'
                    label='Add name manually'
                    value={manualName}
                    onChange={event => setManualName(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void addManualEntrant()
                      }
                    }}
                    disabled={disabled || rolling || savingManualEntrant || !selectedPrize}
                    sx={{ minWidth: 280, flex: '1 1 320px' }}
                  />
                  <Button variant='outlined' onClick={() => void addManualEntrant()} disabled={disabled || rolling || savingManualEntrant || !manualName.trim()} startIcon={<i className='tabler-user-plus' />}>
                    Add name
                  </Button>
                </Box>
                {manualEntrants.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {manualEntrants.map(entrant => (
                      <Chip
                        key={entrant.id}
                        label={entrant.fullName}
                        color='info'
                        variant='tonal'
                        onDelete={disabled || rolling || savingManualEntrant ? undefined : () => void removeManualEntrant(entrant.id)}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, .55fr) minmax(0, 1.45fr)' }, gap: 2, alignItems: 'start' }}>
              <TextField
                select
                label='Draw mode'
                value={drawMode}
                onChange={event => setDrawMode(event.target.value as DrawMode)}
                disabled={disabled || rolling}
                helperText={drawMode === 'random' ? 'Winner is selected randomly.' : 'Admin explicitly selects the winner.'}
              >
                <MenuItem value='random'>Random Draw</MenuItem>
                <MenuItem value='manual'>Manual Selection</MenuItem>
              </TextField>

              {drawMode === 'manual' && (
                <TextField
                  select
                  label='Choose winner manually'
                  value={manualWinnerId}
                  onChange={event => setManualWinnerId(event.target.value)}
                  disabled={disabled || rolling || complete || available.length === 0}
                  helperText='This is an admin selection and remains marked Manual in winner history.'
                >
                  <MenuItem value=''><em>Select eligible person</em></MenuItem>
                  {available.map(candidate => (
                    <MenuItem key={candidate.id} value={candidate.id}>
                      {candidate.fullName} · {candidate.source === 'manual' ? 'Manual entrant' : candidate.bookingCode}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant='body2' color='text.secondary'>Presentation mode hides admin controls and audit metadata from the projected screen.</Typography>
              <Button variant='outlined' onClick={() => void enterPresentationFullscreen()} disabled={!selectedPrize || rolling} startIcon={<i className='tabler-maximize' />}>
                Presentation Fullscreen
              </Button>
            </Box>

            <Box
              ref={presentationRef}
              sx={{
                bgcolor: 'background.default',
                borderRadius: presentationFullscreen ? 0 : 4,
                p: presentationFullscreen ? { xs: 3, md: 6 } : 0,
                width: '100%',
                height: presentationFullscreen ? '100vh' : 'auto',
                overflow: presentationFullscreen ? 'auto' : 'visible',
                display: 'grid',
                alignContent: presentationFullscreen ? 'center' : 'stretch',
                gap: presentationFullscreen ? 4 : 2
              }}
            >
              {presentationFullscreen && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'center' }}>
                  <Box>
                    <Typography variant='overline' color='text.secondary'>LIVE PRIZE DRAW</Typography>
                    <Typography variant='h3' fontWeight={900}>{selectedPrize?.title ?? 'Prize Draw'}</Typography>
                  </Box>
                  <IconButton size='large' onClick={() => void exitPresentationFullscreen()} aria-label='Exit fullscreen'>
                    <i className='tabler-minimize text-3xl' />
                  </IconButton>
                </Box>
              )}

              {drawMode === 'random' ? (
                reelStage
              ) : (
                <Box sx={{ minHeight: presentationFullscreen ? '46vh' : 220, display: 'grid', placeItems: 'center', borderRadius: presentationFullscreen ? 6 : 4, border: theme => `1px solid ${theme.palette.divider}`, bgcolor: 'action.hover', p: presentationFullscreen ? 7 : 4, textAlign: 'center' }}>
                  <Box>
                    <i className={`tabler-trophy ${presentationFullscreen ? 'text-8xl' : 'text-5xl'}`} />
                    <Typography variant={presentationFullscreen ? 'h2' : 'h5'} fontWeight={900} sx={{ mt: 2 }}>
                      {presentationFullscreen ? (revealedWinner?.fullName ?? 'READY FOR WINNER REVEAL') : (manualWinner?.fullName ?? 'Select a winner')}
                    </Typography>
                    {!presentationFullscreen && (
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                        {manualWinner ? `${manualWinner.source === 'manual' ? 'Manual entrant' : manualWinner.bookingCode} · explicit admin selection` : 'Choose an eligible person above. Manual mode uses a reveal, not a fake random spin.'}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {revealedWinner && (
                <Box sx={{ p: presentationFullscreen ? 4 : 2.5, borderRadius: presentationFullscreen ? 5 : 3, border: theme => `1px solid ${theme.palette.success.main}`, bgcolor: 'success.lighter', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: presentationFullscreen ? 2.5 : 1.5 }}>
                    <Box sx={{ width: presentationFullscreen ? 72 : 42, height: presentationFullscreen ? 72 : 42, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'success.main', color: 'success.contrastText' }}><i className={`tabler-trophy ${presentationFullscreen ? 'text-4xl' : 'text-xl'}`} /></Box>
                    <Box>
                      <Typography variant={presentationFullscreen ? 'h6' : 'caption'} color='success.main' fontWeight={850}>
                        {presentationFullscreen ? 'WINNER' : `WINNER · ${revealedWinner.selectionMode === 'manual' ? 'MANUAL SELECTION' : 'RANDOM DRAW'}`}
                      </Typography>
                      <Typography variant={presentationFullscreen ? 'h2' : 'h6'} fontWeight={900}>{revealedWinner.fullName}</Typography>
                    </Box>
                  </Box>
                  {!presentationFullscreen && <Chip label={revealedWinner.source === 'manual' ? 'Manual entrant' : revealedWinner.bookingCode} color='success' variant='tonal' />}
                </Box>
              )}

              {presentationFullscreen && !revealedWinner && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  {drawMode === 'random' ? (
                    <Button size='large' variant='contained' disabled={disabled || rolling || complete || available.length === 0} onClick={() => void drawRandom()} startIcon={<i className={rolling ? 'tabler-loader-2 animate-spin' : 'tabler-confetti'} />} sx={{ minWidth: 260, py: 1.6, fontSize: '1rem' }}>
                      {rolling ? 'Drawing winner…' : complete ? 'Prize complete' : 'Start Draw'}
                    </Button>
                  ) : (
                    <Button size='large' variant='contained' disabled={disabled || rolling || !manualWinner || complete} onClick={() => void confirmManualWinner()} startIcon={<i className='tabler-trophy' />} sx={{ minWidth: 260, py: 1.6, fontSize: '1rem' }}>
                      {rolling ? 'Revealing…' : complete ? 'Prize complete' : 'Reveal Winner'}
                    </Button>
                  )}
                </Box>
              )}
            </Box>

            {!presentationFullscreen && (drawMode === 'random' ? (
              <Button size='large' variant='contained' disabled={disabled || rolling || savingPrizeType || savingManualEntrant || !selectedPrize || complete || available.length === 0} onClick={() => void drawRandom()} startIcon={<i className={rolling ? 'tabler-loader-2 animate-spin' : 'tabler-confetti'} />} sx={{ justifySelf: 'start', minWidth: 210 }}>
                {rolling ? 'Drawing winner…' : complete ? 'Prize complete' : 'Start random draw'}
              </Button>
            ) : (
              <Button size='large' variant='contained' color='warning' disabled={disabled || rolling || !selectedPrize || !manualWinner || complete} onClick={() => void confirmManualWinner()} startIcon={<i className='tabler-user-check' />} sx={{ justifySelf: 'start', minWidth: 230 }}>
                {rolling ? 'Saving winner…' : complete ? 'Prize complete' : 'Confirm manual winner'}
              </Button>
            ))}

            {selectedPrize && available.length === 0 && !complete && <Alert severity='warning'>No eligible person is currently available under this prize type&apos;s winner rules.</Alert>}

            {selectedPrize && selectedWinners.length > 0 && (
              <Box>
                <Typography variant='subtitle1' fontWeight={750}>Winner history — {selectedPrize.title}</Typography>
                <Box sx={{ mt: 1.5, display: 'grid', gap: 1 }}>
                  {selectedWinners.map((winner, index) => (
                    <Box key={`${winner.registrationId}-${index}`} sx={{ p: 2, borderRadius: 2, border: theme => `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Box>
                        <Typography fontWeight={700}>{index + 1}. {winner.fullName}</Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {winner.source === 'manual' ? 'Manual entrant' : winner.bookingCode}{winner.eventPackageName ? ` • ${winner.eventPackageName}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip size='small' label={winner.selectionMode === 'manual' ? 'Manual selection' : 'Random draw'} color={winner.selectionMode === 'manual' ? 'warning' : 'info'} variant='tonal' />
                        <Tooltip title={selectedPrizeType === 'doorprize' ? 'Doorprize winner: blocked from later prizes' : 'Regular prize winner'}>
                          <span><IconButton size='small' disabled><i className={selectedPrizeType === 'doorprize' ? 'tabler-lock' : 'tabler-gift'} /></IconButton></span>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
