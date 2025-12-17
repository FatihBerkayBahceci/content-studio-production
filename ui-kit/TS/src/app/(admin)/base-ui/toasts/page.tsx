import PageTitle from '@/components/PageTitle'
import { Row } from 'react-bootstrap'
import AllToasts from './components/AllToasts'

const Toasts = () => {
  return (
    <>
      <PageTitle subName="Base UI" title="Toasts" />

      <Row>
        <AllToasts />
      </Row>
    </>
  )
}

export default Toasts
