/* eslint-disable react/prop-types */
import StartupScreen from '../components/common/StartupScreen';
import LockScreen from '../components/security/LockScreen';
import { useAppLock } from '../hooks/useAppLock';

function ProtectedRoute({ children }) {
  const { isLoading, isLocked, settings } = useAppLock();

  if (isLoading) return <StartupScreen />;
  if (settings?.enabled && isLocked) return <LockScreen />;
  return children;
}

export default ProtectedRoute;
