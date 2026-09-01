'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'

import type { EventPackage, CreateEventPackageRequest } from '../registrations/services/types/event-package'

type Props = {
  open: boolean
  packageItem?: EventPackage | null
  onClose: () => void
  onSubmit: (data: CreateEventPackageRequest) => Promise<void>
}

const EventPackageDialog = ({ open, packageItem, onClose, onSubmit }: Props) => {
  const isEdit = Boolean(packageItem)

  const [name, setName] = useState('')
  const [benefits, setBenefits] = useState('')
  const [capacity, setCapacity] = useState('')
  const [price, setPrice] = useState('')
  const [sortOrder, setSortOrder] = useState('0')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setName(packageItem?.name ?? '')
    setBenefits(packageItem?.benefits ?? '')
    setCapacity(packageItem ? String(packageItem.capacity) : '')
    setPrice(packageItem ? String(packageItem.price) : '')
    setSortOrder(packageItem ? String(packageItem.sortOrder) : '0')
    setError('')
  }, [open, packageItem])

  const handleSubmit = async () => {
    setError('')

    if (!name.trim()) {
      setError('Package name is required.')

      return
    }

    const parsedCapacity = Number(capacity)

    const parsedPrice = Number(price)

    const parsedSortOrder = Number(sortOrder)

    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      setError('Capacity must be at least 1.')

      return
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('Price cannot be negative.')

      return
    }

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      setError('Sort order cannot be negative.')

      return
    }

    try {
      setLoading(true)

      await onSubmit({
        name: name.trim(),
        benefits: benefits.trim() || null,
        capacity: parsedCapacity,
        price: parsedPrice,
        sortOrder: parsedSortOrder
      })

      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{isEdit ? 'Edit Event Package' : 'Create Event Package'}</DialogTitle>

      <DialogContent>
        <Stack spacing={4} sx={{ mt: 2 }}>
          {error && <Alert severity='error'>{error}</Alert>}

          <TextField
            fullWidth
            required
            label='Package Name'
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder='e.g. Silver'
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label='Benefits'
            value={benefits}
            onChange={event => setBenefits(event.target.value)}
            placeholder={'VIP seat\nFree parking\nCertificate'}
            helperText='Optional. You can separate benefits by line.'
          />

          <TextField
            fullWidth
            required
            type='number'
            label='Capacity'
            value={capacity}
            onChange={event => setCapacity(event.target.value)}
            inputProps={{
              min: 1
            }}
            helperText='Package capacity allocated from the event capacity.'
          />

          <TextField
            fullWidth
            required
            type='number'
            label='Price'
            value={price}
            onChange={event => setPrice(event.target.value)}
            inputProps={{
              min: 0
            }}
            helperText='Use 0 for free packages.'
          />

          <TextField
            fullWidth
            type='number'
            label='Sort Order'
            value={sortOrder}
            onChange={event => setSortOrder(event.target.value)}
            inputProps={{
              min: 0
            }}
            helperText='Lower numbers appear first.'
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        <Button variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Package'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EventPackageDialog
