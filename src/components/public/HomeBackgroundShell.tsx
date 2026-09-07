'use client'

import type { ReactNode } from 'react'

import Box from '@mui/material/Box'

type Props = {
  children: ReactNode
}

/**
 * Owns the single continuous artwork used by the whole public Home page.
 *
 * Individual Home sections stay responsible only for layout/content. Their
 * previous per-section backgrounds are neutralized here so the artwork never
 * restarts at section boundaries when viewport height, browser zoom, or card
 * wrapping changes.
 */
const HomeBackgroundShell = ({ children }: Props) => (
  <Box
    sx={theme => {
      const isDark = theme.palette.mode === 'dark'
      const artwork = isDark ? '/web2.png' : '/web.png'

      return {
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        bgcolor: isDark ? '#03133c' : '#dff3ff',
        backgroundImage: `url('${artwork}')`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',

        // One artwork follows the full rendered Home height. Because it is
        // owned by this wrapper rather than individual sections, zoom and
        // responsive layout changes cannot create seams between sections.
        backgroundSize: '100% 100%',

        transition: theme.transitions.create(['background-color'], {
          duration: theme.transitions.duration.shorter
        }),

        // HomeDashboard renders one root div containing the public sections.
        '& > div': {
          position: 'relative',
          zIndex: 1
        },

        // Disable every old per-section artwork. Content/cards remain intact.
        '& > div > section': {
          backgroundImage: 'none !important',
          backgroundColor: 'transparent !important'
        },

        // Repair the old invalid mobile value `9 dvh` without changing the
        // desktop sizing that the page already uses.
        '& > div > section:nth-of-type(2)': {
          minHeight: {
            xs: 'auto',
            md: '105dvh'
          }
        }
      }
    }}
  >
    {children}
  </Box>
)

export default HomeBackgroundShell
