import AnimationStar from '@/components/AnimationStar'
import Footer from '@/components/layout/Footer'
import { ChildrenType } from '@/types/component-props'
import { lazy, Suspense } from 'react'
import { Container } from 'react-bootstrap'

const TopNavigationBar = lazy(() => import('@/components/layout/TopNavigationBar/page'))
const VerticalNavigationBar = lazy(() => import('@/components/layout/VerticalNavigationBar/page'))

const AdminLayout = ({ children }: ChildrenType) => {
  return (
    <div className="wrapper">
      <Suspense>
        <TopNavigationBar />
      </Suspense>
      <VerticalNavigationBar />
      <AnimationStar />
      <div className="page-content">
        <Container fluid>{children}</Container>
        <Footer />
      </div>
    </div>
  )
}

export default AdminLayout
