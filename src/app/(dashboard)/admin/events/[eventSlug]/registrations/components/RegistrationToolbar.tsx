'use client'

import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'

import type { RegistrationFilters } from '../types'
import type { EventPackage } from '../services/types/event-package'

type Props = {
  filters: RegistrationFilters
  onFiltersChange: (filters: RegistrationFilters) => void
  onImport: () => void
  packages: EventPackage[]
  allowImport?: boolean
}

const RegistrationToolbar = ({ filters, onFiltersChange, onImport, packages, allowImport = true }: Props) => {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-1 flex-col gap-4 sm:flex-row'>
        <TextField
          size='small'
          value={filters.search ?? ''}
          onChange={event => onFiltersChange({ ...filters, search: event.target.value })}
          placeholder='Search participant...'
          sx={{ minWidth: { sm: 260 } }}
        />

        <TextField
          select
          size='small'
          value={filters.participantType ?? 'ALL'}
          onChange={event =>
            onFiltersChange({
              ...filters,
              participantType: event.target.value as RegistrationFilters['participantType']
            })
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value='ALL'>All Types</MenuItem>
          <MenuItem value='INTERNAL'>Internal</MenuItem>
          <MenuItem value='EXTERNAL'>External</MenuItem>
        </TextField>

        <TextField
          select
          size='small'
          value={filters.eventPackageId}
          onChange={event => onFiltersChange({ ...filters, eventPackageId: event.target.value })}
          SelectProps={{
            displayEmpty: true,
            renderValue: selected => {
              if (!selected) return 'All Packages'
              return packages.find(item => item.id === selected)?.name ?? 'All Packages'
            }
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value=''>All Packages</MenuItem>
          {packages.map(item => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size='small'
          value={filters.status ?? 'ALL'}
          onChange={event =>
            onFiltersChange({
              ...filters,
              status: event.target.value as RegistrationFilters['status']
            })
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value='ALL'>All Status</MenuItem>
          <MenuItem value='PENDING'>Pending</MenuItem>
          <MenuItem value='REGISTERED'>Registered</MenuItem>
          <MenuItem value='CHECKED_IN'>Checked In</MenuItem>
          <MenuItem value='CANCELLED'>Cancelled</MenuItem>
        </TextField>
      </div>

      {allowImport && (
        <Button variant='contained' startIcon={<i className='tabler-file-import' />} onClick={onImport}>
          Registrasi Internal
        </Button>
      )}
    </div>
  )
}

export default RegistrationToolbar
