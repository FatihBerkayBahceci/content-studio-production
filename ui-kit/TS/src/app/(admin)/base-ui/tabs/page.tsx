import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AllNavTabs from './components/AllNavTabs'

const Tabs = () => {
  return (
    <>
      <PageTitle subName="Base UI" title="Nav Tabs" />

      <Row>
        <AllNavTabs />
      </Row>
    </>
  )
}

export default Tabs
