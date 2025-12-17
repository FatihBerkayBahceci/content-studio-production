import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AllCollapse from './components/AllCollapse'

const page = () => {
  return (
    <>
      <PageTitle subName="Base UI" title="Collapse" />

      <Row>
        <AllCollapse />
      </Row>
    </>
  )
}

export default page
