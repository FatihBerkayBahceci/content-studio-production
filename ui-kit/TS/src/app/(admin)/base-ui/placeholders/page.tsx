import AllPlaceholders from './components/AllPlaceholders'

import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'

const PLaceholders = () => {
  return (
    <>
      <PageTitle title="Placeholder" subName="Base UI" />

      <Row>
        <AllPlaceholders />
      </Row>
    </>
  )
}

export default PLaceholders
