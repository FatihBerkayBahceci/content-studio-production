import Footer from '@/components/layout/Footer'
import Cards from './components/Cards'
import Chart from './components/Chart'
import User from './components/User'

import PageTitle from '@/components/PageTitle'

const page = () => {
  return (
    <>
      <PageTitle subName="Darkone" title="Dashboard" />
      <Cards />
      <Chart />
      <User />
      <Footer />
    </>
  )
}

export default page
