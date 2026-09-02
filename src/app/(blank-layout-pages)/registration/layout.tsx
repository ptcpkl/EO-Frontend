import Box from '@mui/material/Box'

import type { ChildrenType } from '@core/types'
import EventAwarePublicFooter from '@/components/public/EventAwarePublicFooter'

const RegistrationLayout = ({ children }: ChildrenType) => (
  <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
    <Box sx={{ flex: 1 }}>{children}</Box>
    <EventAwarePublicFooter />
  </Box>
)

export default RegistrationLayout
