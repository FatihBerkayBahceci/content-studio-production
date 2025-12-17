import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DarkSideNav = () => {
  const navigation = useNavigate()
  const { changeMenu } = useLayoutContext()
  useEffect(() => {
    changeMenu.theme('dark')
    navigation('/dashboards')
  }, [navigation])
  return <></>
}

export default DarkSideNav
