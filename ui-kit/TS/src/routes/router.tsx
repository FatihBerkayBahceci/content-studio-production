import { Navigate, Route, Routes, type RouteProps } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'
import AuthLayout from '@/layouts/AuthLayout'
import { appRoutes, authRoutes } from '@/routes/index'
import { useAuthContext } from '@/context/useAuthContext'

const AppRouter = (props: RouteProps) => {
  const { isAuthenticated } = useAuthContext()
  return (
    <Routes>
      {(authRoutes || []).map((route, idx) => (
        <Route key={idx + route.name} path={route.path} element={<AuthLayout {...props}>{route.element}</AuthLayout>} />
      ))}

      {(appRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <AdminLayout {...props}>{route.element}</AdminLayout>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}
    </Routes>
  )
}

export default AppRouter
