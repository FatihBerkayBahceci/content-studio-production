import logoDark from '@/assets/images/logo-dark.png'
import logoLight from '@/assets/images/logo-light.png'
import logoSm from '@/assets/images/logo-sm.png'
import { Link } from 'react-router-dom'

const LogoBox = () => {
  return (
    <div className="logo-box">
      <Link to="/dashboards" className="logo-dark">
        <img width={24} height={24} src={logoSm} className="logo-sm" alt="logo sm" />
        <img width={114} height={28} src={logoDark} className="logo-lg" alt="logo dark" />
      </Link>
      <Link to="/dashboards" className="logo-light">
        <img width={24} height={24} src={logoSm} className="logo-sm" alt="logo sm" />
        <img width={114} height={28} src={logoLight} className="logo-lg" alt="logo light" />
      </Link>
    </div>
  )
}

export default LogoBox
