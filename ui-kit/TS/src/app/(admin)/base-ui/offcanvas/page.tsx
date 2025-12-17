import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AllOffcanvas from './components/AllOffcanvas'

const Offcanvas = () => {
  return (
    <>
      <PageTitle title="Offcanvas" subName="Base UI" />

      <Row>
        <AllOffcanvas />
      </Row>
    </>
  )
}

export default Offcanvas
