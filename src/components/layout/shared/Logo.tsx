'use client'

import type { CSSProperties } from 'react'

import Box from '@mui/material/Box'

import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

const Logo = (_props: { color?: CSSProperties['color'] }) => {
  void _props

  const { isHovered, isBreakpointReached } = useVerticalNav()
  const { settings } = useSettings()
  const compact = settings.layout === 'collapsed' && !isHovered && !isBreakpointReached

  return (
    <Box
      sx={{
        position: 'relative',
        width: compact ? 40 : 132,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'flex-start',
        overflow: 'visible',
        transition: theme => theme.transitions.create(['width'], { duration: theme.transitions.duration.standard })
      }}
    >
      <Box
        component='img'
        src='/EO%20Navbar.png'
        alt='Pertamina Event'
        sx={{
          position: 'absolute',
          left: 0,
          height: 32,
          width: 'auto',
          objectFit: 'contain',
          opacity: compact ? 0 : 1,
          transform: compact ? 'scale(.82)' : 'scale(1)',
          transition: theme => theme.transitions.create(['opacity', 'transform'], { duration: theme.transitions.duration.standard })
        }}
      />

      <Box
        component='img'
        src='/EO%20apk.png'
        alt='Pertamina Event app icon'
        sx={{
          position: 'absolute',
          left: compact ? '50%' : 0,
          height: 34,
          width: 34,
          objectFit: 'contain',
          opacity: compact ? 1 : 0,
          transform: compact ? 'translateX(-50%) scale(1)' : 'scale(.75)',
          transition: theme => theme.transitions.create(['opacity', 'transform', 'left'], { duration: theme.transitions.duration.standard })
        }}
      />
    </Box>
  )
}

export default Logo
