import type { ChildrenType } from '@core/types'

import PublicSiteLayout from '@/components/public/PublicSiteLayout'

const HomeLayout = (props: ChildrenType) => {
  const { children } = props

  return <PublicSiteLayout>{children}</PublicSiteLayout>
}

export default HomeLayout
