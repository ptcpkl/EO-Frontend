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

type Props = {
  eventId: string
  prizes: EventWorkspaceItem[]
  disabled?: boolean
  onUpdatePrize: (id: string, patch: Record<string, unknown>) => Promise<void>
}

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

const shufflePreview = (pool: Registration[], size = 5) => {
  if (!pool.length) return []
  return Array.from({ length: size }, () => pool[Math.floor(Math.random() * pool.length)].fullName)
}

export default function DoorprizeDraw({ eventId, prizes, disabled = false, onUpdatePrize }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedPrizeId, setSelectedPrizeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [rollingNames, setRollingNames] = useState<string[]>([])
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

  const eligible = useMemo(
    () => registrations.filter(item => Boolean(item.checkedInAt) || item.status === 'CHECKED_IN'),
    [registrations]
  )
  const selectedPrize = prizes.find(prize => prize.id === selectedPrizeId)
  const selectedWinners = parseWinners(selectedPrize?.winners)
  const allWinnerIds = new Set(prizes.flatMap(prize => parseWinners(prize.winners).map(winner => winner.registrationId)))
  const available = eligible.filter(item => !allWinnerIds.has(item.id))
  const quantity = getQuantity(selectedPrize)
  const complete = selectedWinners.length >= quantity

  const draw = async () => {
    if (!selectedPrize || !available.length || complete || rolling) return

    setRolling(true)
    setError(null)
    setRollingNames(shufflePreview(available))

    const timer = window.setInterval(() => setRollingNames(shufflePreview(available)), 75)
    await new Promise(resolve => window.setTimeout(resolve, 1800))
    window.clearInterval(timer)

    const winner = available[Math.floor(Math.random() * available.length)]
    const winnerRecord: DoorprizeWinner = {
      registrationId: winner.id,
      fullName: winner.fullName,
      bookingCode: winner.bookingCode,
      eventPackageName: winner.eventPackageName ?? null,
      drawnAtUtc: new Date().toISOString()
    }

    setRollingNames([winner.fullName])

    try {
      await onUpdatePrize(selectedPrize.id, { winners: [...selectedWinners, winnerRecord] })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the winner.')
    } finally {
      setRolling(false)
    }
  }

  return (
    <Card variant='outlined'>
      <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant='h5' fontWeight={750}>Live Doorprize Draw</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: .75, maxWidth: 720 }}>
              Only participants who have checked in are eligible. A participant who already won a prize is removed from the next draw.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${eligible.length} checked in`} color='success' variant='tonal' />
            <Chip label={`${available.length} available`} variant='outlined' />
          </Box>
        </Box>

        {error && <Alert severity='error'>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : prizes.length === 0 ? (
          <Alert severity='info'>Create at least one Doorprize item above before starting the draw.</Alert>
        ) : (
          <>
            <TextField
              select
              label='Prize to draw'
              value={selectedPrizeId}
              onChange={event => setSelectedPrizeId(event.target.value)}
              disabled={disabled || rolling}
              sx={{ maxWidth: 460 }}
            >
              {prizes.map(prize => {
                const winners = parseWinners(prize.winners)
                return (
                  <MenuItem key={prize.id} value={prize.id}>
                    {prize.title} ({winners.length}/{getQuantity(prize)} winner{getQuantity(prize) === 1 ? '' : 's'})
                  </MenuItem>
                )
              })}
            </TextField>

            <Box
              sx={{
                height: 250,
                overflow: 'hidden',
                borderRadius: 3,
                border: theme => `1px solid ${theme.palette.divider}`,
                bgcolor: 'action.hover',
                display: 'grid',
                placeItems: 'center',
                position: 'relative'
              }}
            >
              <Box sx={{ width: '100%', display: 'grid', gap: .75, px: 3 }}>
                {(rollingNames.length ? rollingNames : ['READY', 'CHECKED-IN PARTICIPANTS', 'READY']).map((name, index) => (
                  <Box
                    key={`${name}-${index}`}
                    sx={{
                      py: index === Math.floor((rollingNames.length || 3) / 2) ? 2 : 1.25,
                      textAlign: 'center',
                      borderRadius: 2,
                      bgcolor: index === Math.floor((rollingNames.length || 3) / 2) ? 'background.paper' : 'transparent',
                      border: index === Math.floor((rollingNames.length || 3) / 2) ? theme => `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
                      opacity: index === Math.floor((rollingNames.length || 3) / 2) ? 1 : .45,
                      transform: rolling ? 'translateY(6px)' : 'none',
                      transition: 'transform 75ms linear'
                    }}
                  >
                    <Typography variant={index === Math.floor((rollingNames.length || 3) / 2) ? 'h5' : 'body1'} fontWeight={750}>
                      {name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Button
              size='large'
              variant='contained'
              disabled={disabled || rolling || !selectedPrize || complete || available.length === 0}
              onClick={() => void draw()}
              startIcon={<i className={rolling ? 'tabler-loader-2 animate-spin' : 'tabler-confetti'} />}
              sx={{ justifySelf: 'start', minWidth: 210 }}
            >
              {rolling ? 'Rolling…' : complete ? 'Prize complete' : 'Start vertical draw'}
            </Button>

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
                      <Chip size='small' label='Checked-in winner' color='success' variant='tonal' />
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
