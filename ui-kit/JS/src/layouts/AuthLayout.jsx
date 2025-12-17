import FallbackLoading from '@/components/FallbackLoading';
import { Suspense } from 'react';
const AuthLayout = ({
  children
}) => {
  return <Suspense fallback={<FallbackLoading />}>{children}</Suspense>;
};
export default AuthLayout;