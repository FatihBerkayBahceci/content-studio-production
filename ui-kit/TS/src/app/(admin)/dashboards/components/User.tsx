import avatar2 from '@/assets/images/users/avatar-2.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar5 from '@/assets/images/users/avatar-5.jpg'
import avatar6 from '@/assets/images/users/avatar-6.jpg'
import { Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { currentYear } from '@/context/constants'
import { Link } from 'react-router-dom'

const User = () => {
  return (
    <>
      <Row>
        <Col xl={6}>
          <Card>
            <CardHeader className=" d-flex justify-content-between align-items-center">
              <h4 className="card-title mb-0">New Accounts</h4>
              <Link to="" className="btn btn-sm btn-light">
                View All
              </Link>
            </CardHeader>

            <CardBody className="pb-1">
              <div className="table-responsive">
                <table className="table table-hover mb-0 table-centered">
                  <thead>
                    <tr>
                      <th className="py-1">ID</th>
                      <th className="py-1">Date</th>
                      <th className="py-1">User</th>
                      <th className="py-1">Account</th>
                      <th className="py-1">Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#US523</td>
                      <td>24 April, {currentYear}</td>
                      <td>
                        <img src={avatar2} alt="avatar-2" className="img-fluid avatar-xs rounded-circle" />
                        <span className="align-middle ms-1">Dan Adrick</span>
                      </td>
                      <td>
                        <span className="badge badge-soft-success">Verified</span>
                      </td>
                      <td>@omions</td>
                    </tr>
                    <tr>
                      <td>#US652</td>
                      <td>24 April, {currentYear}</td>
                      <td>
                        <img src={avatar3} alt="avatar-2" className="img-fluid avatar-xs rounded-circle" />
                        <span className="align-middle ms-1">Daniel Olsen</span>
                      </td>
                      <td>
                        <span className="badge badge-soft-success">Verified</span>
                      </td>
                      <td>@alliates</td>
                    </tr>
                    <tr>
                      <td>#US862</td>
                      <td>20 April, {currentYear}</td>
                      <td>
                        <img src={avatar4} alt="avatar-2" className="img-fluid avatar-xs rounded-circle" />
                        <span className="align-middle ms-1">Jack Roldan</span>
                      </td>
                      <td>
                        <span className="badge badge-soft-warning">Pending</span>
                      </td>
                      <td>@griys</td>
                    </tr>
                    <tr>
                      <td>#US756</td>
                      <td>18 April, {currentYear}</td>
                      <td>
                        <img src={avatar5} alt="avatar-2" className="img-fluid avatar-xs rounded-circle" />
                        <span className="align-middle ms-1">Betty Cox</span>
                      </td>
                      <td>
                        <span className="badge badge-soft-success">Verified</span>
                      </td>
                      <td>@reffon</td>
                    </tr>
                    <tr>
                      <td>#US420</td>
                      <td>18 April, {currentYear}</td>
                      <td>
                        <img src={avatar6} alt="avatar-2" className="img-fluid avatar-xs rounded-circle" />
                        <span className="align-middle ms-1">Carlos Johnson</span>
                      </td>
                      <td>
                        <span className="badge badge-soft-danger">Blocked</span>
                      </td>
                      <td>@bebo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h4 className="card-title mb-0">Recent Transactions</h4>
              <Link to="" className="btn btn-sm btn-light">
                View All
              </Link>
            </CardHeader>
            <CardBody>
              <div className="table-responsive">
                <table className="table table-hover mb-0 table-centered">
                  <thead>
                    <tr>
                      <th className="py-1">ID</th>
                      <th className="py-1">Date</th>
                      <th className="py-1">Amount</th>
                      <th className="py-1">Status</th>
                      <th className="py-1">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#98521</td>
                      <td>24 April, {currentYear}</td>
                      <td>$120.55</td>
                      <td>
                        <span className="badge bg-success">Cr</span>
                      </td>
                      <td>Commisions</td>
                    </tr>
                    <tr>
                      <td>#20158</td>
                      <td>24 April, {currentYear}</td>
                      <td>$9.68</td>
                      <td>
                        <span className="badge bg-success">Cr</span>
                      </td>
                      <td>Affiliates</td>
                    </tr>
                    <tr>
                      <td>#36589</td>
                      <td>20 April, {currentYear}</td>
                      <td>$105.22</td>
                      <td>
                        <span className="badge bg-danger">Dr</span>
                      </td>
                      <td>Grocery</td>
                    </tr>
                    <tr>
                      <td>#95362</td>
                      <td>18 April, {currentYear}</td>
                      <td>$80.59</td>
                      <td>
                        <span className="badge bg-success">Cr</span>
                      </td>
                      <td>Refunds</td>
                    </tr>
                    <tr>
                      <td>#75214</td>
                      <td>18 April, {currentYear}</td>
                      <td>$750.95</td>
                      <td>
                        <span className="badge bg-danger">Dr</span>
                      </td>
                      <td>Bill Payments</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default User
