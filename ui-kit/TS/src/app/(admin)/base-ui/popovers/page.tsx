import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AllPopovers from './components/AllPopovers'

const page = () => {
  return (
    <>
      <PageTitle title="Popovers" subName="Base UI" />

      <Row>
        <AllPopovers />
      </Row>
    </>
  )
}

export default page
