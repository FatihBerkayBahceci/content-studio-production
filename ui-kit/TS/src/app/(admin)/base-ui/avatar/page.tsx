import avatar2 from '@/assets/images/users/avatar-2.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar5 from '@/assets/images/users/avatar-5.jpg'
import avatar6 from '@/assets/images/users/avatar-6.jpg'
import avatar7 from '@/assets/images/users/avatar-7.jpg'
import avatar8 from '@/assets/images/users/avatar-8.jpg'
import avatar9 from '@/assets/images/users/avatar-9.jpg'
import small2 from '@/assets/images/small/img-2.jpg'
import small3 from '@/assets/images/small/img-3.jpg'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'

import PageTitle from '@/components/PageTitle'

const BasicAvatar = () => {
  return (
    <>
      <Col lg={6}>
        <Card>
          <CardHeader>
            <CardTitle as={'h5'}>Basic Example</CardTitle>
            <p className="card-subtitle">
              Create and group avatars of different sizes and shapes with the css classes. Using Bootstrap&apos;s naming convention, you can control
              size of avatar including standard avatar, or scale it up to different sizes.
            </p>
          </CardHeader>
          <CardBody>
            <Row>
              <Col md={3}>
                <img src={avatar2} alt="image" className="img-fluid avatar-xs rounded" />
                <p>
                  <code>.avatar-xs</code>
                </p>
                <img src={avatar3} alt="image" className="img-fluid avatar-sm rounded mt-2" />
                <p className="mb-2 mb-sm-0">
                  <code>.avatar-sm</code>
                </p>
              </Col>
              <Col md={3}>
                <img src={avatar4} alt="image" className="img-fluid avatar-md rounded" />
                <p>
                  <code>.avatar-md</code>
                </p>
              </Col>
              <Col md={3}>
                <img src={avatar5} alt="image" className="img-fluid avatar-lg rounded" />
                <p>
                  <code>.avatar-lg</code>
                </p>
              </Col>
              <Col md={3}>
                <img src={avatar6} alt="image" className="img-fluid avatar-xl rounded" />
                <p className="mb-0">
                  <code>.avatar-xl</code>
                </p>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}

const RoundedCircleAvatars = () => {
  return (
    <>
      <Col lg={6}>
        <Card>
          <CardHeader>
            <CardTitle as={'h5'}>Rounded Circle</CardTitle>
            <p className="card-subtitle">
              Using an additional class <code>.rounded-circle</code> in
              <code>&lt;img&gt;</code> element creates the rounded avatar.
            </p>
          </CardHeader>
          <CardBody>
            <Row>
              <Col md={4}>
                <img src={avatar7} alt="image" className="img-fluid avatar-md rounded-circle" />
                <p className="mt-1">
                  <code>.avatar-md .rounded-circle</code>
                </p>
              </Col>
              <Col md={4}>
                <img src={avatar8} alt="image" className="img-fluid avatar-lg rounded-circle" />
                <p>
                  <code>.avatar-lg .rounded-circle</code>
                </p>
              </Col>
              <Col md={4}>
                <img src={avatar9} alt="image" className="img-fluid avatar-xl rounded-circle" />
                <p className="mb-0">
                  <code>.avatar-xl .rounded-circle</code>
                </p>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}

const ImagesShapes = () => {
  return (
    <>
      <Col lg={6}>
        <Card>
          <CardHeader>
            <CardTitle as={'h5'}>Images Shapes</CardTitle>
            <p className="card-subtitle">Avatars with different sizes and shapes.</p>
          </CardHeader>
          <CardBody>
            <div className="d-flex flex-wrap gap-3 align-items-end">
              <div>
                <img src={small2} alt="image" className="img-fluid rounded" width={200} />
                <p className="mb-0">
                  <code>.rounded</code>
                </p>
              </div>
              <div>
                <img src={avatar5} alt="image" className="img-fluid rounded" width={120} />
                <p className="mb-0">
                  <code>.rounded</code>
                </p>
              </div>
              <div>
                <img src={avatar7} alt="image" className="img-fluid rounded-circle" width={120} />
                <p className="mb-0">
                  <code>.rounded-circle</code>
                </p>
              </div>
              <div>
                <img src={small3} alt="image" className="img-fluid img-thumbnail" width={200} />
                <p className="mb-0">
                  <code>.img-thumbnail</code>
                </p>
              </div>
              <div>
                <img src={avatar8} alt="image" className="img-fluid rounded-circle img-thumbnail" width={120} />
                <p className="mb-0">
                  <code>.rounded-circle .img-thumbnail</code>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}

const page = () => {
  return (
    <>
      <PageTitle subName="Base UI" title="Avatars" />

      <Row>
        <BasicAvatar />
        <RoundedCircleAvatars />
        <ImagesShapes />
      </Row>
    </>
  )
}

export default page
