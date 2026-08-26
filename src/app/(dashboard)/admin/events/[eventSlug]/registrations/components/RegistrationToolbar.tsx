'use client'

import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'

import type { RegistrationFilters } from '../types'

type Props = {
  filters: RegistrationFilters
  onFiltersChange: (filters: RegistrationFilters) => void
  onImport: () => void
}

const RegistrationToolbar = ({
  filters,
  onFiltersChange,
  onImport
}: Props) => {
  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
      <div className='flex flex-1 flex-col gap-4 sm:flex-row'>
        <TextField
          size='small'
          fullWidth
          value={filters.search}
          onChange={event =>
            onFiltersChange({
              ...filters,
              search: event.target.value
            })
          }
          placeholder='Search participant, email, NIP, booking code...'
        />

        <TextField
          select
          size='small'
          value={filters.participantType}
          onChange={event =>
            onFiltersChange({
              ...filters,
              participantType: event.target.value as RegistrationFilters['participantType']
            })
          }
          sx={{
            minWidth: 160
          }}
        >
          <MenuItem value='ALL'>All Types</MenuItem>
          <MenuItem value='INTERNAL'>Internal</MenuItem>
          <MenuItem value='EXTERNAL'>External</MenuItem>
        </TextField>

        <TextField
          select
          size='small'
          value={filters.status}
          onChange={event =>
            onFiltersChange({
              ...filters,
              status: event.target.value as RegistrationFilters['status']
            })
          }
          sx={{
            minWidth: 160
          }}
        >
          <MenuItem value='ALL'>All Status</MenuItem>
          <MenuItem value='PENDING'>Pending</MenuItem>
          <MenuItem value='REGISTERED'>Registered</MenuItem>
          <MenuItem value='CHECKED_IN'>Checked In</MenuItem>
          <MenuItem value='CANCELLED'>Cancelled</MenuItem>
        </TextField>
      </div>

      <Button
        variant='contained'
        startIcon={<i className='tabler-file-import' />}
        onClick={onImport}
        sx={{
          borderRadius: 0,
          minHeight: 40,
          whiteSpace: 'nowrap'
        }}
      >
        Import Excel
      </Button>
    </div>
  )
}

export default RegistrationToolbar
