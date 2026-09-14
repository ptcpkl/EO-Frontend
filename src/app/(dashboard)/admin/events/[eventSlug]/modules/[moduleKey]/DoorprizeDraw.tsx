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

type DoorprizeWinner = {
  registrationId: string
  fullName: string
  bookingCode: string
  eventPackageName: string | null
  drawnAtUtc: string
}

type PrizeType = 'regular' | 'doorprize'

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

const getQuantity = (prize: EventWorkspaceItem | undefined) => {
  const parsed = Number(prize?.quantity ?? 1)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

const getPrizeType = (prize: EventWorkspaceItem | undefined): PrizeType => {
  const value = String(prize?.prizeType ?? '').toLowerCase()
  if (value === 'regular') return 'regular'

  // Existing records were created by the old Doorprize flow, so keep them
  // as doorprize by default for backward-compatible winner eligibility.
  return 'doorprize'
}

const randomName = (pool: Registration[]) => {
  if (!pool.length) return '—'
  return pool[Math.floor(Math.random() * pool.length)].fullName
}

const buildReel = (pool: Registration[], winner: Registration) => {
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

  // Keep a couple of rows below the final winner so the reel still looks
  // continuous when it settles with the winner exactly on the center line.
  names.push(randomName(pool), randomName(pool))

  return { names, winnerIndex }
}

const wait = (milliseconds: number) => new Promise(resolve => window.setTimeout(resolve, milliseconds))

export default function DoorprizeDraw({ eventId, prizes, disabled = false, onUpdatePrize }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedPrizeId, setSelectedPrizeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [savingPrizeType, setSavingPrizeType] = useState(false)
  const [reelItems, setReelItems] = useState<string[]>([])
  const [reelOffset, setReelOffset] = useState(0)
  const [revealedWinner, setRevealedWinner] = useState<DoorprizeWinner | null>(null)
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
    if (!selectedPrizeId && prizes.length) setSelectedPrizeId(prizes[0].id)
    if (selectedPrizeId && !prizes.some(prize => prize.id === selectedPrizeId)) {
      setSelectedPrizeId(prizes[0]?.id ?? '')
    }
  }, [prizes, selectedPrizeId])

  useEffect(() => {
    setReelItems([])
    setReelOffset(0)
    setRevealedWinner(null)
  }, [selectedPrizeId])

  const eligible = useMemo(
    () => registrations.filter(item => Boolean(item.checkedInAt) || item.status === 'CHECKED_IN'),
    [registrations]
  )

  const selectedPrize = prizes.find(prize => prize.id === selectedPrizeId)
  const selectedPrizeType = getPrizeType(selectedPrize)
  const selectedWinners = parseWinners(selectedPrize?.winners)

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

  const available = useMemo(() => {
    if (selectedPrizeType === 'doorprize') {
      // Regular-prize winners are still eligible for the Doorprize.
      // Anyone who has already won a Doorprize is globally blocked.
      return eligible.filter(item => !doorprizeWinnerIds.has(item.id) && !selectedWinnerIds.has(item.id))
    }

    // A regular-prize draw only accepts participants who have not won any prize yet.
    // This prevents duplicate regular prizes and also guarantees a Doorprize winner
    // can never receive any later prize.
    return eligible.filter(item => !allWinnerIds.has(item.id) && !selectedWinnerIds.has(item.id))
  }, [eligible, selectedPrizeType, doorprizeWinnerIds, allWinnerIds, selectedWinnerIds])

  const quantity = getQuantity(selectedPrize)
  const complete = selectedWinners.length >= quantity

  const changePrizeType = async (nextType: PrizeType) => {
    if (!selectedPrize || disabled || rolling || savingPrizeType || nextType === selectedPrizeType) return

    try {
      setSavingPrizeType(true)
      setError(null)
      await onUpdatePrize(selectedPrize.id, { prizeType: nextType })
      setReelItems([])
      setReelOffset(0)
      setRevealedWinner(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update prize type.')
    } finally {
      setSavingPrizeType(false)
    }
  }

  const draw = async () => {
    if (!selectedPrize || !available.length || complete || rolling) return

    const winner = available[Math.floor(Math.random() * available.length)]
    const winnerRecord: DoorprizeWinner = {
      registrationId: winner.id,
      fullName: winner.fullName,
      bookingCode: winner.bookingCode,
      eventPackageName: winner.eventPackageName ?? null,
      drawnAtUtc: new Date().toISOString()
    }
    const reel = buildReel(available, winner)

    setRolling(true)
    setError(null)
    setRevealedWinner(null)
    setReelItems(reel.names)
    setReelOffset(0)

    // Give the browser one paint with the reel at its starting position, then
    // animate the whole strip. The easing creates a fast scroll that naturally
    // slows down and locks the selected winner onto the center selector.
    await wait(80)
    setReelOffset(Math.max(0, reel.winnerIndex - CENTER_SLOT) * ITEM_HEIGHT)
    await wait(REEL_DURATION_MS + 120)

    try {
      await onUpdatePrize(selectedPrize.id, { winners: [...selectedWinners, winnerRecord] })
      setRevealedWinner(winnerRecord)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the winner.')
    } finally {
      setRolling(false)
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

  return (
    <Card variant='outlined'>
      <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant='h5' fontWeight={750}>Live Prize Draw</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: .75, maxWidth: 780 }}>
              Only checked-in participants are eligible. Regular-prize winners may still enter the Doorprize. Once someone wins a Doorprize, they are blocked from every later prize draw.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${eligible.length} checked in`} color='success' variant='tonal' />
            <Chip label={`${doorprizeWinnerIds.size} doorprize winner${doorprizeWinnerIds.size === 1 ? '' : 's'}`} color='warning' variant='tonal' />
            <Chip label={`${available.length} available`} variant='outlined' />
          </Box>
        </Box>

        <Alert severity='info'>
          <strong>Regular Prize:</strong> one regular-prize win per participant, but the winner can still win a Doorprize.{' '}
          <strong>Doorprize:</strong> after winning, that participant cannot win any other prize.
        </Alert>

        {error && <Alert severity='error'>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : prizes.length === 0 ? (
          <Alert severity='info'>Create at least one prize item above before starting the draw.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.3fr) minmax(220px, .7fr)' }, gap: 2, maxWidth: 760 }}>
              <TextField
                select
                label='Prize to draw'
                value={selectedPrizeId}
                onChange={event => setSelectedPrizeId(event.target.value)}
                disabled={disabled || rolling || savingPrizeType}
              >
                {prizes.map(prize => {
                  const winners = parseWinners(prize.winners)
                  const type = getPrizeType(prize)
                  return (
                    <MenuItem key={prize.id} value={prize.id}>
                      {prize.title} · {type === 'doorprize' ? 'Doorprize' : 'Regular'} ({winners.length}/{getQuantity(prize)})
                    </MenuItem>
                  )
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

            {selectedPrize && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={selectedPrizeType === 'doorprize' ? 'Doorprize rules' : 'Regular prize rules'}
                  color={selectedPrizeType === 'doorprize' ? 'warning' : 'primary'}
                  variant='tonal'
                />
                <Chip label={`${selectedWinners.length}/${quantity} winner${quantity === 1 ? '' : 's'}`} variant='outlined' />
              </Box>
            )}

            <Box
              sx={{
                position: 'relative',
                height: ITEM_HEIGHT * VISIBLE_ITEMS,
                overflow: 'hidden',
                borderRadius: 4,
                border: theme => `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                boxShadow: rolling ? theme => `0 18px 48px ${theme.palette.action.hover}` : 'none',
                transition: 'box-shadow 280ms ease'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  zIndex: 4,
                  background: theme => `linear-gradient(to bottom, ${theme.palette.background.paper} 0%, transparent 24%, transparent 76%, ${theme.palette.background.paper} 100%)`
                }}
              />

              <Box
                sx={{
                  position: 'absolute',
                  left: 14,
                  right: 14,
                  top: CENTER_SLOT * ITEM_HEIGHT,
                  height: ITEM_HEIGHT,
                  borderRadius: 3,
                  border: theme => `1px solid ${revealedWinner ? theme.palette.success.main : theme.palette.primary.main}`,
                  background: theme => `linear-gradient(90deg, transparent, ${revealedWinner ? theme.palette.success.main : theme.palette.primary.main}14, transparent)`,
                  boxShadow: revealedWinner
                    ? theme => `0 0 0 1px ${theme.palette.success.main}20, 0 0 34px ${theme.palette.success.main}24`
                    : theme => `0 0 0 1px ${theme.palette.primary.main}14`,
                  zIndex: 3,
                  pointerEvents: 'none',
                  transition: 'border-color 280ms ease, box-shadow 280ms ease'
                }}
              />

              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  transform: `translateY(-${reelOffset}px)`,
                  transition: rolling && reelOffset > 0
                    ? `transform ${REEL_DURATION_MS}ms cubic-bezier(0.08, 0.78, 0.12, 1)`
                    : 'none',
                  willChange: rolling ? 'transform' : 'auto'
                }}
              >
                {visibleReel.map((name, index) => (
                  <Box
                    key={`${name}-${index}`}
                    sx={{
                      height: ITEM_HEIGHT,
                      display: 'grid',
                      placeItems: 'center',
                      px: 3,
                      borderBottom: theme => `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography
                      variant='h6'
                      fontWeight={800}
                      noWrap
                      sx={{
                        width: '100%',
                        textAlign: 'center',
                        letterSpacing: '.01em',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {name}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 5, color: revealedWinner ? 'success.main' : 'primary.main' }}>
                <i className='tabler-caret-right-filled text-xl' />
              </Box>
              <Box sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(180deg)', zIndex: 5, color: revealedWinner ? 'success.main' : 'primary.main' }}>
                <i className='tabler-caret-right-filled text-xl' />
              </Box>
            </Box>

            {revealedWinner && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: theme => `1px solid ${theme.palette.success.main}`,
                  bgcolor: 'success.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'success.main', color: 'success.contrastText' }}>
                    <i className='tabler-trophy text-xl' />
                  </Box>
                  <Box>
                    <Typography variant='caption' color='success.main' fontWeight={800}>WINNER</Typography>
                    <Typography variant='h6' fontWeight={850}>{revealedWinner.fullName}</Typography>
                  </Box>
                </Box>
                <Chip label={revealedWinner.bookingCode} color='success' variant='tonal' />
              </Box>
            )}

            <Button
              size='large'
              variant='contained'
              disabled={disabled || rolling || savingPrizeType || !selectedPrize || complete || available.length === 0}
              onClick={() => void draw()}
              startIcon={<i className={rolling ? 'tabler-arrows-down-up' : 'tabler-confetti'} />}
              sx={{ justifySelf: 'start', minWidth: 230 }}
            >
              {rolling ? 'Drawing winner…' : complete ? 'Prize complete' : 'Start prize draw'}
            </Button>

            {selectedPrize && available.length === 0 && !complete && (
              <Alert severity='warning'>No checked-in participant is currently eligible under this prize type&apos;s winner rules.</Alert>
            )}

            {selectedPrize && selectedWinners.length > 0 && (
              <Box>
                <Typography variant='subtitle1' fontWeight={750}>Winner history — {selectedPrize.title}</Typography>
                <Box sx={{ mt: 1.5, display: 'grid', gap: 1 }}>
                  {selectedWinners.map((winner, index) => (
                    <Box key={`${winner.registrationId}-${index}`} sx={{ p: 2, borderRadius: 2, border: theme => `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography fontWeight={700}>{index + 1}. {winner.fullName}</Typography>
                        <Typography variant='body2' color='text.secondary'>{winner.bookingCode}{winner.eventPackageName ? ` • ${winner.eventPackageName}` : ''}</Typography>
                      </Box>
                      <Chip
                        size='small'
                        label={selectedPrizeType === 'doorprize' ? 'Doorprize winner' : 'Regular-prize winner'}
                        color={selectedPrizeType === 'doorprize' ? 'warning' : 'success'}
                        variant='tonal'
                      />
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
