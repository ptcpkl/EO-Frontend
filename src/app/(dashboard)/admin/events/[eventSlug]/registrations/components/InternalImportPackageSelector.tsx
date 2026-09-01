'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import type { EventPackage } from '../services/types/event-package'

type Props = {
  packages: EventPackage[]
  value: string
  loading?: boolean
  onChange: (value: string) => void
}

const InternalImportPackageSelector = ({ packages, value, loading = false, onChange }: Props) => {
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6
        }}
      >
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (packages.length === 0) {
    return <Alert severity='warning'>Belum ada package aktif untuk event ini.</Alert>
  }

  return (
    <RadioGroup value={value} onChange={event => onChange(event.target.value)}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)'
          },
          gap: 3
        }}
      >
        {packages
          .filter(item => item.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(item => (
            <Card
              key={item.id}
              variant='outlined'
              sx={{
                cursor: 'pointer',
                borderColor: value === item.id ? 'primary.main' : 'divider',
                backgroundColor: value === item.id ? 'action.selected' : 'background.paper'
              }}
              onClick={() => onChange(item.id)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2
                  }}
                >
                  <Box>
                    <Typography variant='h6' fontWeight={700}>
                      {item.name}
                    </Typography>

                    {item.benefits && (
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                        {item.benefits}
                      </Typography>
                    )}

                    <Typography variant='body2' sx={{ mt: 2 }} fontWeight={600}>
                      Rp {item.price.toLocaleString('id-ID')}
                    </Typography>
                  </Box>

                  <FormControlLabel value={item.id} control={<Radio />} label='' sx={{ m: 0 }} />
                </Box>
              </CardContent>
            </Card>
          ))}
      </Box>
    </RadioGroup>
  )
}

export default InternalImportPackageSelector
