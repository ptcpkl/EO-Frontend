'use client'

import type { CSSProperties } from 'react'

import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

const Logo = (_props: { color?: CSSProperties['color'] }) => {
  void _props

  const { isHovered, isBreakpointReached } = useVerticalNav()
  const { settings } = useSettings()

  const compact = settings.layout === 'collapsed' && !isHovered && !isBreakpointReached

  return (
    <div
      className='relative flex h-10 items-center justify-center overflow-hidden'
      style={{
        width: compact ? 40 : 132,
        transition: 'width 260ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      aria-label='Pertamina Event'
    >
      <img
        src='/EO Navbar.png'
        alt='Pertamina Event'
        className='absolute h-8 w-auto object-contain'
        style={{
          opacity: compact ? 0 : 1,
          transform: compact ? 'scale(0.82) translateX(-6px)' : 'scale(1) translateX(0)',
          transition: 'opacity 200ms ease, transform 260ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
      <img
        src='/EO apk.png'
        alt='Pertamina Event app icon'
        className='absolute h-9 w-9 object-contain'
        style={{
          opacity: compact ? 1 : 0,
          transform: compact ? 'scale(1)' : 'scale(0.72)',
          transition: 'opacity 200ms ease, transform 260ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
    </div>
  )
}

export default Logo
