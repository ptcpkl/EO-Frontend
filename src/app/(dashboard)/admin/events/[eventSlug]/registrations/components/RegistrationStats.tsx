'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import type { RegistrationStatsData } from '../types'

type Props = {
  stats: RegistrationStatsData
}

const RegistrationStats = ({ stats }: Props) => {
  const items = [
    {
      title: 'Total Participants',
      value: stats.total,
      icon: 'tabler-users',
      description: 'Active participants'
    },
    {
      title: 'Internal',
      value: stats.internal,
      icon: 'tabler-building',
      description: 'Imported by admin'
    },
    {
      title: 'External',
      value: stats.external,
      icon: 'tabler-world',
      description: 'Public registration'
    },
    {
      title: 'Registered',
      value: stats.registered,
      icon: 'tabler-circle-check',
      description: 'Successfully registered'
    }
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 4
      }}
    >
      {items.map(item => (
        <Card key={item.title} elevation={0}>
          <CardContent>
            <Box className='flex items-start justify-between gap-4'>
              <Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 1 }}
                >
                  {item.title}
                </Typography>

                <Typography variant='h4' fontWeight={700}>
                  {item.value.toLocaleString()}
                </Typography>

                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mt: 1 }}
                >
                  {item.description}
                </Typography>
              </Box>

              <Box
                className='flex items-center justify-center'
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'action.hover'
                }}
              >
                <i className={`${item.icon} text-2xl`} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

export default RegistrationStats
