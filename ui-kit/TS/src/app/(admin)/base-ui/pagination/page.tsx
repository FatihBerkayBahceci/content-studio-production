import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AllPagination from './components/AllPagination'

const Pagination = () => {
  return (
    <>
      <PageTitle title="Pagination" subName="Base UI" />

      <Row>
        <AllPagination />
      </Row>
    </>
  )
}

export default Pagination
