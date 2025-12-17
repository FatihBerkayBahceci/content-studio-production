import DarkLogo from '@/assets/images/logo-dark.png'
import LightLogo from '@/assets/images/logo-light.png'
import TextFormInput from '@/components/from/TextFormInput'
import { useEffect } from 'react'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import useSignIn from '../useSignIn'

const SignIn = () => {
  useEffect(() => {
    document.body.classList.add('authentication-bg')
    return () => {
      document.body.classList.remove('authentication-bg')
    }
  }, [])

  const { loading, login, control } = useSignIn()

  return (
    <div className="">
      <div className="account-pages py-5">
        <div className="container">
          <Row className="justify-content-center">
            <Col md={6} lg={5}>
              <Card className="border-0 shadow-lg">
                <CardBody className="p-5">
                  <div className="text-center">
                    <div className="mx-auto mb-4 text-center auth-logo">
                      <Link to="/dashboards" className="logo-dark">
                        <img src={DarkLogo} height={32} alt="logo dark" />
                      </Link>
                      <Link to="/dashboards" className="logo-light">
                        <img src={LightLogo} height={28} alt="logo light" />
                      </Link>
                    </div>
                    <h4 className="fw-bold text-dark mb-2">Welcome Back!</h4>
                    <p className="text-muted">Sign in to your account to continue</p>
                  </div>
                  <form onSubmit={login} className="mt-4">
                    <div className="mb-3">
                      <TextFormInput control={control} name="email" placeholder="Enter your email" className="form-control" label="Email Address" />
                    </div>
                    <div className="mb-3">
                      <Link to="/auth/reset-password" className="float-end text-muted  ms-1">
                        Forgot password?
                      </Link>
                      <TextFormInput control={control} name="password" placeholder="Enter your password" className="form-control" label="Password" />
                    </div>

                    <div className="form-check mb-3">
                      <input type="checkbox" className="form-check-input" id="remember-me" />
                      <label className="form-check-label" htmlFor="remember-me">
                        Remember me
                      </label>
                    </div>
                    <div className="d-grid">
                      <button disabled={loading} className="btn btn-dark btn-lg fw-medium" type="submit">
                        Sign In
                      </button>
                    </div>
                  </form>
                </CardBody>
              </Card>
              <p className="text-center mt-4 text-white text-opacity-50">
                Don&apos;t have an account?
                <Link to="/auth/sign-up" className="text-decoration-none text-white fw-bold">
                  Sign Up
                </Link>
              </p>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  )
}

export default SignIn
