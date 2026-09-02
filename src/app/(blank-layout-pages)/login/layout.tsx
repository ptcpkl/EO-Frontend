import Box from '@mui/material/Box'

import type { ChildrenType } from '@core/types'
import PublicFooter from '@/components/public/PublicFooter'

const LoginLayout = ({ children }: ChildrenType) => (
  <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
    <Box sx={{ flex: 1 }}>{children}</Box>
    <PublicFooter />
  </Box>
)

export default LoginLayout
