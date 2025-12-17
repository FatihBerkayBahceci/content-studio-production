import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AllModals from './components/AllModals'

const Modals = () => {
  return (
    <>
      <PageTitle subName="Base UI" title="Modal" />

      <Row>
        <AllModals />
      </Row>
    </>
  )
}

export default Modals
