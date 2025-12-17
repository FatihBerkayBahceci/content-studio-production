import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import IconifyIcon from '../../../../components/wrapper/IconifyIcon'
import PageTitle from '@/components/PageTitle'

const DefaultBreadcrumb = () => {
  return (
    <>
      <Col lg={6}>
        <Card>
          <CardHeader>
            <CardTitle as={'h5'}>Default Example</CardTitle>
            <p className="card-subtitle">
              Use an ordered or unordered list with linked list items to create a minimally styled breadcrumb. Use our utilities to add additional
              styles as desired.
            </p>
          </CardHeader>
          <CardBody>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb py-0">
                <li className="breadcrumb-item active" aria-current="page">
                  Home
                </li>
              </ol>
            </nav>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb py-0">
                <li className="breadcrumb-item">
                  <Link to="">Home</Link>
                </li>
                <div className="mx-1" style={{ height: 24 }}>
                  <IconifyIcon icon="bx:chevron-right" height={16} width={16} />
                </div>
                <li className="breadcrumb-item active" aria-current="page">
                  Library
                </li>
              </ol>
            </nav>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0 py-0">
                <li className="breadcrumb-item">
                  <Link to="">Home</Link>
                </li>
                <div className="mx-1" style={{ height: 24 }}>
                  <IconifyIcon icon="bx:chevron-right" height={16} width={16} />
                </div>
                <li className="breadcrumb-item">
                  <Link to="">Library</Link>
                </li>
                <div className="mx-1" style={{ height: 24 }}>
                  <IconifyIcon icon="bx:chevron-right" height={16} width={16} />
                </div>
                <li className="breadcrumb-item active" aria-current="page">
                  Data
                </li>
              </ol>
            </nav>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}

const DividersBreadcrumb = () => {
  return (
    <>
      <Col lg={6}>
        <Card>
          <CardHeader>
            <CardTitle as={'h5'}>Dividers Breadcrumb</CardTitle>
            <p className="card-subtitle">Optionally, you can also specify the icon with your breadcrumb item.</p>
          </CardHeader>
          <CardBody>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb py-0">
                <li className="breadcrumb-item active" aria-current="page">
                  Home
                </li>
              </ol>
            </nav>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb py-0">
                <li className="breadcrumb-item">
                  <Link to="">Home</Link>
                </li>
                <div className="mx-1" style={{ height: 24 }}>
                  <IconifyIcon icon="bx:chevron-right" height={16} width={16} />
                </div>

                <li className="breadcrumb-item active" aria-current="page">
                  Library
                </li>
              </ol>
            </nav>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0 py-0">
                <li className="breadcrumb-item">
                  <Link to="">Home</Link>
                </li>
                <div className="mx-1" style={{ height: 24 }}>
                  <IconifyIcon icon="bx:chevron-right" height={16} width={16} />
                </div>
                <li className="breadcrumb-item">
                  <Link to="">Library</Link>
                </li>
                <div className="mx-1" style={{ height: 24 }}>
                  <IconifyIcon icon="bx:chevron-right" height={16} width={16} />
                </div>
                <li className="breadcrumb-item active" aria-current="page">
                  Data
                </li>
              </ol>
            </nav>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}

const Page = () => {
  return (
    <>
      <PageTitle subName="Base UI" title="Breadcrumb" />

      <Row>
        <DefaultBreadcrumb />
        <DividersBreadcrumb />
      </Row>
    </>
  )
}

export default Page
