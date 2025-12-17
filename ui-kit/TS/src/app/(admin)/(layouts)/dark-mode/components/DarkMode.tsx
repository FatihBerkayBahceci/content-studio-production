import { useLayoutContext } from '@/context/useLayoutContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DarkMode = () => {
  const navigation = useNavigate()
  const { changeTheme } = useLayoutContext()
  console.log('bvdfbgd', changeTheme)

  useEffect(() => {
    changeTheme('dark')
    navigation('/dashboards')
  }, [navigation])
  return <></>
}

export default DarkMode
