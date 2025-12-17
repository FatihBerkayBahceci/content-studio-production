import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DarkTopNav = () => {
  const navigation = useNavigate()
  const { changeTopbarTheme } = useLayoutContext()
  useEffect(() => {
    changeTopbarTheme('dark')
    navigation('/dashboards')
  }, [navigation])
  return <></>
}

export default DarkTopNav
