'use client'

import { useEffect, useMemo, useState } from 'react'

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

import type { Registration } from '../types'

type Props = {
  registrations: Registration[]
  loading?: boolean
  onCancel?: (registrationId: string) => Promise<void>
}

const RegistrationTable = ({ registrations, loading = false, onCancel }: Props) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  
  useEffect(() => {
    setPage(0)
  }, [registrations])

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

  const getParticipantColor = (type: Registration['participantType']) => {
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
            {/* =========================
                TABLE HEADER
               ========================= */}
            <TableHead>
              <TableRow>
                <TableCell>Participant</TableCell>

                <TableCell>Organization</TableCell>

                <TableCell>Package</TableCell>

                <TableCell>NIP</TableCell>

                <TableCell>Type</TableCell>

                <TableCell>Status</TableCell>

                <TableCell>Booking Code</TableCell>

                <TableCell>Registered At</TableCell>

                <TableCell align='right'>Action</TableCell>
              </TableRow>
            </TableHead>

            {/* =========================
                TABLE BODY
               ========================= */}
            <TableBody>
              {/* LOADING STATE */}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Box
                      sx={{
                        py: 12,
                        textAlign: 'center'
                      }}
                    >
                      <i className='tabler-loader-2 text-4xl animate-spin' />

                      <Typography variant='h6' sx={{ mt: 2 }}>
                        Loading participants...
                      </Typography>

                      <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                        Please wait while registration data is loaded.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : paginatedRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Box
                      sx={{
                        py: 12,
                        textAlign: 'center'
                      }}
                    >
                      <i className='tabler-users-off text-4xl' />

                      <Typography variant='h6' sx={{ mt: 2 }}>
                        No participants found
                      </Typography>

                      <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                        Try changing your search or filters.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRegistrations.map(registration => (
                  <TableRow hover key={registration.id}>
                    {/* PARTICIPANT */}
                    <TableCell>
                      <Box>
                        <Typography variant='body2' fontWeight={600}>
                          {registration.fullName}
                        </Typography>

                        <Typography variant='caption' color='text.secondary'>
                          {registration.email}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* ORGANIZATION */}
                    <TableCell>
                      <Typography variant='body2'>{registration.organization || '-'}</Typography>
                    </TableCell>

                    {/* EVENT PACKAGE */}
                    <TableCell>
                      <Typography variant='body2'>{registration.eventPackageName || '-'}</Typography>
                    </TableCell>

                    {/* NIP */}
                    <TableCell>
                      <Typography variant='body2'>{registration.nip || registration.employeeNumber || '-'}</Typography>
                    </TableCell>

                    {/* PARTICIPANT TYPE */}
                    <TableCell>
                      <Chip
                        size='small'
                        variant='tonal'
                        color={getParticipantColor(registration.participantType)}
                        label={registration.participantType}
                      />
                    </TableCell>

                    {/* STATUS */}
                    <TableCell>
                      <Chip
                        size='small'
                        variant='tonal'
                        color={getStatusColor(registration.status)}
                        label={registration.status.replace('_', ' ')}
                      />
                    </TableCell>

                    {/* BOOKING CODE */}
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>
                        {registration.bookingCode}
                      </Typography>
                    </TableCell>

                    {/* REGISTERED AT */}
                    <TableCell>
                      <Typography variant='body2'>
                        {new Date(registration.registeredAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>

                    {/* ACTION */}
                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        aria-label='Cancel registration'
                        disabled={actionLoadingId === registration.id || registration.status === 'CANCELLED'}
                        onClick={async () => {
                          if (!onCancel || registration.status === 'CANCELLED') return
                          if (!window.confirm(`Cancel registration for ${registration.fullName}?`)) return

                          try {
                            setActionLoadingId(registration.id)
                            await onCancel(registration.id)
                          } finally {
                            setActionLoadingId(null)
                          }
                        }}
                      >
                        <i className='tabler-x' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINATION */}
        {!loading && (
          <TablePagination
            component='div'
            count={registrations.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, newPage) => {
              setPage(newPage)
            }}
            onRowsPerPageChange={event => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default RegistrationTable
