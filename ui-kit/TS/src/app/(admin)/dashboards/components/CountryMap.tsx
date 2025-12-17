import WorldVectorMap from '@/components/VectorMap/WorldMap'
import IconifyIcon from '@/components/wrapper/IconifyIcon'
import { Card, CardBody, CardHeader, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const CountryMap = () => {
  const salesLocationOptions = {
    map: 'world',
    zoomOnScroll: true,
    zoomButtons: false,
    markersSelectable: true,
    markers: [
      { name: 'Canada', coords: [56.1304, -106.3468] },
      { name: 'Brazil', coords: [-14.235, -51.9253] },
      { name: 'Russia', coords: [61, 105] },
      { name: 'China', coords: [35.8617, 104.1954] },
      { name: 'United States', coords: [37.0902, -95.7129] },
    ],
    markerStyle: {
      initial: { fill: '#7f56da' },
      selected: { fill: '#1bb394' },
    },
    labels: {
      markers: {},
    },
    regionStyle: {
      initial: {
        fill: 'rgba(169,183,197, 0.3)',
        fillOpacity: 1,
      },
    },
  }

  return (
    <>
      <Col lg={4}>
        <Card className=" card-height-100">
          <CardHeader className="d-flex  justify-content-between align-items-center border-bottom border-dashed">
            <h4 className="card-title mb-0">Sessions by Country</h4>
            <Dropdown>
              <DropdownToggle variant="secondary" className=" btn btn-sm btn-outline-light content-none">
                View Data <IconifyIcon icon="bx:bx-chevron-down" style={{ marginLeft: '5px', fontSize: '16px' }} />
              </DropdownToggle>
              <DropdownMenu className=" dropdown-menu-end">
                <DropdownItem href="">Download</DropdownItem>
                <DropdownItem href="">Export</DropdownItem>
                <DropdownItem href="">Import</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </CardHeader>
          <CardBody className="pt-0">
            <div id="world-map-markers" className="mt-3" style={{ height: '309px' }}>
              <WorldVectorMap height="300px" width="100%" options={salesLocationOptions} />
            </div>
          </CardBody>
        </Card>
      </Col>
    </>
  )
}

export default CountryMap
