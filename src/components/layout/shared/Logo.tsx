'use client'

// React Imports
import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

const Logo = (_props: { color?: CSSProperties['color'] }) => {
  void _props

  // Refs
  const logoTextRef = useRef<HTMLSpanElement>(null)

  // Hooks
  const { isHovered, isBreakpointReached } = useVerticalNav()
  const { settings } = useSettings()

  // Vars
  const { layout } = settings

  useEffect(() => {
    if (layout !== 'collapsed') {
      return
    }

    if (logoTextRef && logoTextRef.current) {
      if (!isBreakpointReached && layout === 'collapsed' && !isHovered) {
        logoTextRef.current?.classList.add('hidden')
      } else {
        logoTextRef.current.classList.remove('hidden')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, layout, isBreakpointReached])

  return (
    <div className='flex items-center'>
      <img src='/EO Navbar.png' alt='Pertamina' className='h-8 w-auto object-contain' />
    </div>
  )
}

export default Logo
