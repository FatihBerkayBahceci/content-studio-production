import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AllVectorMaps from './component/AllVectorMaps'

const page = () => {
  return (
    <>
      <PageTitle subName="Maps " title="Vector Maps" />

      <Row className="row-cols-lg-2 gx-3">
        <AllVectorMaps />
      </Row>
    </>
  )
}

export default page
