import small1 from '@/assets/images/small/img-1.jpg'
import small2 from '@/assets/images/small/img-2.jpg'
import small4 from '@/assets/images/small/img-4.jpg'
import small5 from '@/assets/images/small/img-5.jpg'
import PageTitle from '@/components/PageTitle'
import { Card, CardBody, CardTitle, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const CardTitle1 = () => {
  return (
    <>
      <Col xl={3} md={6}>
        <Card className=" mb-3 mb-xl-0">
          <img className="card-img-top img-fluid" src={small1} alt="img-1" />
          <CardBody>
            <CardTitle as={'h5'} className=" mb-2">
              Card title
            </CardTitle>
            <p className="card-text text-muted">
              Some quick example text to build on the card title and make up the bulk of the card&apos;s content. With supporting text below as a
              natural lead-in to additional content.
            </p>
            <Link to="" className="btn btn-primary">
              Button
            </Link>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}
const CardTitle2 = () => {
  return (
    <>
      <Col xl={3} md={6}>
        <Card className=" mb-3">
          <img className="card-img-top img-fluid" src={small2} alt="img-2" />
          <CardBody>
            <CardTitle as={'h5'} className=" mb-2">
              Card title
            </CardTitle>
            <p className="card-text text-muted">Some quick example text to build on the card title.</p>
          </CardBody>
          <ul className="list-group list-group-flush text-muted">
            <li className="list-group-item text-muted">Dapibus ac facilisis in</li>
          </ul>
          <CardBody>
            <Link to="" className="card-link text-primary">
              Card link
            </Link>
            <Link to="" className="card-link text-primary">
              Another link
            </Link>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}
const CardTitle3 = () => {
  return (
    <>
      <Col xl={3} md={6}>
        <Card className=" mb-3 mb-xl-0">
          <img className="card-img-top img-fluid" src={small4} alt="img-4" />
          <CardBody>
            <p className="card-text text-muted">
              Some quick example text to build on the card title and make up the bulk of the card&apos;s content. With supporting text below as a
              natural lead-in to additional content.
            </p>
            <Link to="" className="btn btn-primary">
              Button
            </Link>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}
const CardTitle4 = () => {
  return (
    <>
      <Col xl={3} md={6}>
        <Card className="mb-3 mb-xl-0">
          <CardBody>
            <CardTitle className=" mb-0">Card title</CardTitle>
          </CardBody>
          <img className="img-fluid" src={small5} alt="img-5" />
          <CardBody>
            <p className="card-text text-muted">Some quick example text to build on the card title.</p>
            <Link to="" className="card-link text-primary">
              Card link
            </Link>
            <Link to="" className="card-link text-primary">
              Another link
            </Link>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}
const page = () => {
  return (
    <>
      <PageTitle subName="Base UI" title="Cards" />

      <Row>
        <CardTitle1 />
        <CardTitle2 />
        <CardTitle3 />
        <CardTitle4 />
      </Row>
    </>
  )
}

export default page
