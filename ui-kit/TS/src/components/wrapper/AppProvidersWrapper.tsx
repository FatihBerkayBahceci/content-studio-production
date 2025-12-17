import { AuthProvider } from '@/context/useAuthContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import { ChildrenType } from '@/types/component-props'
import { HelmetProvider } from 'react-helmet-async'

import { ToastContainer } from 'react-toastify'

const AppProvidersWrapper = ({ children }: ChildrenType) => {
  return (
    <>
      <HelmetProvider>
        <AuthProvider>
          <LayoutProvider>
            <NotificationProvider>
              {children}
              <ToastContainer theme="colored" />
            </NotificationProvider>
          </LayoutProvider>
        </AuthProvider>
      </HelmetProvider>
    </>
  )
}
export default AppProvidersWrapper
