'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import EventPackageDialog from './EventPackageDialog'
import type { EventPackage, CreateEventPackageRequest } from '../registrations/services/types/event-package'
import {
  getEventPackages,
  createEventPackage,
  updateEventPackage,
  deactivateEventPackage
} from '../registrations/services/event-package.service'

type Props = {
  eventId: string
  readOnly?: boolean
}

const EventPackages = ({ eventId, readOnly = false }: Props) => {
  const [packages, setPackages] = useState<EventPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<EventPackage | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadPackages = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getEventPackages(eventId)
      setPackages([...result].sort((a, b) => a.sortOrder - b.sortOrder))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load packages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPackages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const handleCreate = async (data: CreateEventPackageRequest) => {
    await createEventPackage(eventId, data)
    await loadPackages()
  }

  const handleUpdate = async (data: CreateEventPackageRequest) => {
    if (!selectedPackage) return
    await updateEventPackage(eventId, selectedPackage.id, data)
    await loadPackages()
  }

  const handleDeactivate = async (packageItem: EventPackage) => {
    if (!window.confirm(`Deactivate package "${packageItem.name}"? Existing registration history will be kept.`)) return

    try {
      setActionLoading(true)
      setError('')
      await deactivateEventPackage(eventId, packageItem.id)
      await loadPackages()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to deactivate package.')
    } finally {
      setActionLoading(false)
    }
  }

  const formatPrice = (value: number) =>
    value === 0
      ? 'Free'
      : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

  return (
    <>
      <Card elevation={0}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 3 }}>
            <Box>
              <Typography variant='h5' fontWeight={600}>Event Packages</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {readOnly
                  ? 'Archived package history is read-only.'
                  : 'Configure package pricing, benefits and package-level allocation before or after publishing.'}
              </Typography>
            </Box>

            {!readOnly && (
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => {
                  setSelectedPackage(null)
                  setDialogOpen(true)
                }}
              >
                Add Package
              </Button>
            )}
          </Box>

          {error && <Alert severity='error' sx={{ mt: 4 }}>{error}</Alert>}
          <Divider sx={{ my: 5 }} />

          {loading ? (
            <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
          ) : packages.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <i className='tabler-ticket text-5xl' />
              <Typography variant='h6' sx={{ mt: 2 }}>No packages yet</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {readOnly ? 'This event was archived without packages.' : 'Add at least one package to set event pricing.'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 4 }}>
              {packages.map(packageItem => (
                <Card key={packageItem.id} variant='outlined'>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                      <Box>
                        <Typography variant='h6' fontWeight={700}>{packageItem.name}</Typography>
                        <Typography variant='h6' color='primary' sx={{ mt: 1 }}>{formatPrice(packageItem.price)}</Typography>
                      </Box>
                      <Chip size='small' label={packageItem.isActive ? 'Active' : 'Inactive'} color={packageItem.isActive ? 'success' : 'default'} />
                    </Box>

                    <Box sx={{ display: 'grid', gap: 1, mt: 3 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Capacity: {packageItem.isUnlimited ? 'Unlimited' : packageItem.capacity?.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>Registered: {packageItem.registeredCount.toLocaleString()}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Remaining: {packageItem.isUnlimited ? 'Unlimited' : packageItem.remainingQuota?.toLocaleString() ?? '0'}
                      </Typography>
                    </Box>

                    {packageItem.benefits && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant='body2' fontWeight={600}>Benefits</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1, whiteSpace: 'pre-line' }}>{packageItem.benefits}</Typography>
                      </Box>
                    )}

                    {!readOnly && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
                        <Tooltip title='Edit package'>
                          <span>
                            <IconButton
                              size='small'
                              disabled={!packageItem.isActive || actionLoading}
                              onClick={() => {
                                setSelectedPackage(packageItem)
                                setDialogOpen(true)
                              }}
                            >
                              <i className='tabler-edit' />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {packageItem.isActive && (
                          <Tooltip title='Deactivate package'>
                            <span>
                              <IconButton size='small' color='error' disabled={actionLoading} onClick={() => handleDeactivate(packageItem)}>
                                <i className='tabler-ban' />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <EventPackageDialog
          open={dialogOpen}
          packageItem={selectedPackage}
          onClose={() => {
            if (!actionLoading) {
              setDialogOpen(false)
              setSelectedPackage(null)
            }
          }}
          onSubmit={selectedPackage ? handleUpdate : handleCreate}
        />
      )}
    </>
  )
}

export default EventPackages
