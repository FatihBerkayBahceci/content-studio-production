import { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'

const SaleChart = () => {
  const SaleChartOptions: ApexOptions = {
    chart: {
      height: 180,
      type: 'donut',
    },
    series: [44.25, 52.68, 45.98],
    legend: {
      show: false,
    },
    stroke: {
      width: 0,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: false,
            total: {
              showAlways: true,
              show: true,
            },
          },
        },
      },
    },
    labels: ['Direct', 'Affilliate', 'Sponsored'],
    colors: ['#7e67fe', '#17c553', '#7942ed'],
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
    fill: {
      type: 'gradient',
    },
  }

  return (
    <>
      <Col lg={4}>
        <Card>
          <CardHeader className=" d-flex align-items-center justify-content-between gap-2">
            <h4 className="card-title flex-grow-1 mb-0">Sales By Category</h4>
            <div>
              <button type="button" className="btn btn-sm btn-outline-light">
                ALL
              </button>
              <button type="button" className="btn btn-sm btn-outline-light">
                1M
              </button>
              <button type="button" className="btn btn-sm btn-outline-light">
                6M
              </button>
              <button type="button" className="btn btn-sm btn-outline-light active">
                1Y
              </button>
            </div>
          </CardHeader>
          <CardBody>
            <div dir="ltr">
              <div id="conversions" className="apex-charts">
                <ReactApexChart height={180} options={SaleChartOptions} series={SaleChartOptions.series} type="donut" />
              </div>
            </div>
            <div className="table-responsive mb-n1 mt-2">
              <table className="table table-nowrap table-borderless table-sm table-centered mb-0">
                <thead className="bg-light bg-opacity-50 thead-sm">
                  <tr>
                    <th className="py-1">Category</th>
                    <th className="py-1">Orders</th>
                    <th className="py-1">Perc.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Grocery</td>
                    <td>187,232</td>
                    <td>
                      48.63%
                      <span className="badge badge-soft-success float-end">2.5% Up</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Electonics</td>
                    <td>126,874</td>
                    <td>
                      36.08%
                      <span className="badge badge-soft-success float-end">8.5% Up</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Other</td>
                    <td>90,127</td>
                    <td>
                      23.41%
                      <span className="badge badge-soft-danger float-end">10.98% Down</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* end table-responsive*/}
          </CardBody>
        </Card>{' '}
        {/* end card*/}
      </Col>
    </>
  )
}

export default SaleChart
