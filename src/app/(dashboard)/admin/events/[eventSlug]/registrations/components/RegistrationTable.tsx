'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Box from '@mui/material/Box'

import { useMemo, useState } from 'react'

import type { Registration } from '../types'

type Props = {
  registrations: Registration[]
}

const RegistrationTable = ({ registrations }: Props) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const paginatedRegistrations = useMemo(() => {
    const start = page * rowsPerPage

    return registrations.slice(start, start + rowsPerPage)
  }, [page, rowsPerPage, registrations])

  const getStatusColor = (status: Registration['status']) => {
    switch (status) {
      case 'REGISTERED':
        return 'success'

      case 'CHECKED_IN':
        return 'info'

      case 'PENDING':
        return 'warning'

      case 'CANCELLED':
        return 'error'

      default:
        return 'default'
    }
  }

  const getParticipantColor = (
    type: Registration['participantType']
  ) => {
    return type === 'INTERNAL' ? 'primary' : 'secondary'
  }

  return (
    <Card elevation={0}>
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table
            sx={{
              minWidth: 1100
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Participant</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>NIP</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Booking Code</TableCell>
                <TableCell>Registered At</TableCell>
                <TableCell align='right'>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box
                      sx={{
                        py: 12,
                        textAlign: 'center'
                      }}
                    >
                      <i className='tabler-users-off text-4xl' />

                      <Typography
                        variant='h6'
                        sx={{ mt: 2 }}
                      >
                        No participants found
                      </Typography>

                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mt: 1 }}
                      >
                        Try changing your search or filters.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRegistrations.map(registration => (
                  <TableRow
                    hover
                    key={registration.id}
                  >
                    <TableCell>
                      <Box>
                        <Typography
                          variant='body2'
                          fontWeight={600}
                        >
                          {registration.fullName}
                        </Typography>

                        <Typography
                          variant='caption'
                          color='text.secondary'
                        >
                          {registration.email}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant='body2'>
                        {registration.organization || '-'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant='body2'>
                        {registration.nip || '-'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size='small'
                        variant='tonal'
                        color={getParticipantColor(
                          registration.participantType
                        )}
                        label={registration.participantType}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size='small'
                        variant='tonal'
                        color={getStatusColor(
                          registration.status
                        )}
                        label={registration.status.replace(
                          '_',
                          ' '
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant='body2'
                        fontWeight={500}
                      >
                        {registration.bookingCode}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant='body2'>
                        {new Date(
                          registration.registeredAt
                        ).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>

                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        aria-label='Participant actions'
                      >
                        <i className='tabler-dots-vertical' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component='div'
          count={registrations.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={event => {
            setRowsPerPage(Number(event.target.value))
            setPage(0)
          }}
        />
      </CardContent>
    </Card>
  )
}

export default RegistrationTable
