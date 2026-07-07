/* eslint-disable react/prop-types */
import FullScreenLoader from '../components/common/FullScreenLoader';
import LockScreen from '../components/security/LockScreen';
import { useAppLock } from '../hooks/useAppLock';

function ProtectedRoute({ children }) {
  const { isLoading, isLocked, settings } = useAppLock();

  if (isLoading) return <FullScreenLoader />;
  if (settings?.enabled && isLocked) return <LockScreen />;
  return children;
}

export default ProtectedRoute;
