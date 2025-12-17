import PageTitle from '@/components/PageTitle'
import AllFormValidation from './components/AllFormValidation'
// import type { Metadata } from "next";

// export const metadata: Metadata = { title: "Validation" };

const Validation = () => {
  return (
    <>
      <PageTitle subName="Forms" title="Validation" />

      <AllFormValidation />
    </>
  )
}

export default Validation
