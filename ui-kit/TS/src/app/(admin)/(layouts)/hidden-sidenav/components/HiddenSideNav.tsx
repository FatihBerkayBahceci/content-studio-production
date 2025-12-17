import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const HiddenSideNav = () => {
  const navigation = useNavigate()
  const { changeMenu } = useLayoutContext()
  useEffect(() => {
    changeMenu.size('hidden')
    navigation('/dashboards')
  }, [navigation])
  return <></>
}

export default HiddenSideNav
