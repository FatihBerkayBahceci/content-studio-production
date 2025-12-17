import { Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import IconifyIcon from './wrapper/IconifyIcon'
import { DEFAULT_PAGE_TITLE } from '@/context/constants'
import { Helmet } from 'react-helmet-async'

const PageTitle = ({ title, subName }: { title: string; subName: string }) => {
  const defaultTitle = DEFAULT_PAGE_TITLE

  return (
    <>
      <Helmet>
        <title>{title ? title + ' | ' + defaultTitle : defaultTitle}</title>
      </Helmet>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0 ">{title}</h4>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="">{subName}</Link>
              </li>{' '}
              &nbsp;
              <div className="mx-1">
                <IconifyIcon icon="bx:chevron-right" />
              </div>
              &nbsp;
              <li className="breadcrumb-item active">{title}</li>
            </ol>
          </div>
        </Col>
      </Row>
    </>
  )
}

export default PageTitle
