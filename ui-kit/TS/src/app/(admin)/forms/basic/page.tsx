import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import BasicExamples from './components/BasicExamples'

const page = () => {
  return (
    <>
      <PageTitle subName="From " title="From Basics" />

      <Row className=" row-cols-lg-2 gx-3">
        <BasicExamples />
      </Row>
    </>
  )
}

export default page
