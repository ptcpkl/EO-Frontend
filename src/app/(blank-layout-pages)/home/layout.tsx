// Type Imports
import type { ChildrenType } from '@core/types'

// Layout Imports
import VerticalLayout from '@layouts/VerticalLayout'

// Component Imports
import Navigation from '@components/layout/vertical/Navigation'

// Util Imports
import { getMode } from '@core/utils/serverHelpers'

const HomeLayout = async (props: ChildrenType) => {
  const { children } = props
  const mode = await getMode()

  return <VerticalLayout navigation={<Navigation mode={mode} showEventCategories />}>{children}</VerticalLayout>
}

export default HomeLayout
