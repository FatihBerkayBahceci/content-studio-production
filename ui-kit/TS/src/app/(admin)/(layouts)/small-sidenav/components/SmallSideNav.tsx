import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SmallSideNav = () => {
  const navigation = useNavigate()
  const { changeMenu } = useLayoutContext()
  useEffect(() => {
    changeMenu.size('condensed')
    navigation('/dashboards')
  }, [navigation])
  return <></>
}

export default SmallSideNav
