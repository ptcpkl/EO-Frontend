import type { ChildrenType } from '@core/types'

import PublicSiteLayout from '@/components/public/PublicSiteLayout'

const EventsLayout = (props: ChildrenType) => {
  const { children } = props

  return <PublicSiteLayout>{children}</PublicSiteLayout>
}

export default EventsLayout
